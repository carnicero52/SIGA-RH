import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

const LATE_TOLERANCE_MINUTES = 15
const WORK_HOURS_PER_DAY = 8

function periodDays(startDate: string, endDate: string): number {
  const start = new Date(startDate)
  const end = new Date(endDate)
  let count = 0
  const cur = new Date(start)
  while (cur <= end) {
    const day = cur.getDay()
    if (day !== 0 && day !== 6) count++ // skip weekends
    cur.setDate(cur.getDate() + 1)
  }
  return count
}

/**
 * POST /api/payroll/:id/calculate
 * Calculates payroll items for all active employees in the period.
 * Uses attendance records to compute:
 * - Days absent (workday with no check_in)
 * - Late arrivals (check_in after shift start + tolerance)
 * - Overtime hours (check_out after shift end)
 * Then calculates gross and net amounts.
 */
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params

    const period = await db.payrollPeriod.findUnique({ where: { id } })
    if (!period) return NextResponse.json({ error: 'Período no encontrado' }, { status: 404 })
    if (period.status === 'paid') return NextResponse.json({ error: 'Este período ya fue pagado' }, { status: 400 })

    const company = await db.company.findUnique({ where: { id: period.companyId } })
    if (!company) return NextResponse.json({ error: 'Empresa no encontrada' }, { status: 404 })

    // Get active employees with position info
    const employees = await db.employee.findMany({
      where: { companyId: period.companyId, active: true, status: 'active' },
      include: {
        position: true,
        employeeShifts: {
          where: { active: true },
          include: { shift: true },
          orderBy: { effectiveDate: 'desc' },
          take: 1,
        },
      },
    })

    const start = new Date(period.startDate)
    const end = new Date(period.endDate)
    end.setHours(23, 59, 59, 999)

    // Get all attendance records for the period
    const attendance = await db.attendanceRecord.findMany({
      where: {
        companyId: period.companyId,
        recordTime: { gte: start, lte: end },
      },
    })

    const workingDays = periodDays(period.startDate, period.endDate)

    // Delete existing items for this period
    await db.payrollItem.deleteMany({ where: { payrollPeriodId: id } })

    const items = []
    let totalAmount = 0

    for (const emp of employees) {
      const pos = emp.position
      if (!pos?.salary) continue // skip employees without salary defined

      const shift = emp.employeeShifts[0]?.shift
      const empAttendance = attendance.filter((a) => a.employeeId === emp.id)

      // Days with check_in
      const checkInDays = new Set(
        empAttendance
          .filter((a) => a.recordType === 'check_in')
          .map((a) => new Date(a.recordTime).toISOString().split('T')[0])
      )

      const daysWorked = checkInDays.size
      const daysAbsent = Math.max(0, workingDays - daysWorked)

      // Late minutes (status === 'late')
      const lateRecords = empAttendance.filter(
        (a) => a.recordType === 'check_in' && a.status === 'late' && (a.minutesDiff || 0) > LATE_TOLERANCE_MINUTES
      )
      const lateMinutes = lateRecords.reduce((sum, r) => sum + Math.max(0, (r.minutesDiff || 0) - LATE_TOLERANCE_MINUTES), 0)

      // Overtime hours (early_departure = 0, check_out after shift end)
      const overtimeRecords = empAttendance.filter((a) => a.recordType === 'check_out' && (a.minutesDiff || 0) > 0)
      const overtimeHours = overtimeRecords.reduce((sum, r) => sum + (r.minutesDiff || 0) / 60, 0)

      // Calculate base salary for the period
      const monthlySalary = pos.salary
      let periodSalary: number
      if (period.frequency === 'weekly') {
        periodSalary = (monthlySalary / 4.33)
      } else if (period.frequency === 'biweekly') {
        periodSalary = monthlySalary / 2
      } else {
        periodSalary = monthlySalary
      }

      // Daily rate
      const dailyRate = monthlySalary / 30
      const hourlyRate = dailyRate / WORK_HOURS_PER_DAY
      const minuteRate = hourlyRate / 60

      // Deductions
      const absenceDeduction = daysAbsent * dailyRate
      const lateDeduction = lateMinutes * minuteRate
      const overtimeRate = pos.overtimeRate || 1.5
      const overtimeBonus = overtimeHours * hourlyRate * overtimeRate

      const grossAmount = periodSalary + overtimeBonus
      const netAmount = Math.max(0, grossAmount - absenceDeduction - lateDeduction)

      totalAmount += netAmount

      const item = await db.payrollItem.create({
        data: {
          payrollPeriodId: id,
          employeeId: emp.id,
          companyId: period.companyId,
          baseSalary: periodSalary,
          currency: pos.currency || period.currency || 'USD',
          daysWorked,
          daysAbsent,
          lateMinutes,
          overtimeHours: Math.round(overtimeHours * 100) / 100,
          absenceDeduction: Math.round(absenceDeduction * 100) / 100,
          lateDeduction: Math.round(lateDeduction * 100) / 100,
          overtimeBonus: Math.round(overtimeBonus * 100) / 100,
          otherDeductions: 0,
          otherBonuses: 0,
          grossAmount: Math.round(grossAmount * 100) / 100,
          netAmount: Math.round(netAmount * 100) / 100,
        },
        include: {
          employee: {
            select: {
              id: true, firstName: true, lastName: true, employeeNumber: true,
              position: { select: { name: true } },
              branch: { select: { name: true } },
            },
          },
        },
      })

      items.push(item)
    }

    // Update period total
    await db.payrollPeriod.update({
      where: { id },
      data: { totalAmount: Math.round(totalAmount * 100) / 100 },
    })

    return NextResponse.json({
      success: true,
      workingDays,
      employeesProcessed: items.length,
      totalAmount: Math.round(totalAmount * 100) / 100,
      items,
    })
  } catch (error) {
    console.error('Payroll calculate error:', error)
    return NextResponse.json({ error: 'Error al calcular nómina', details: String(error) }, { status: 500 })
  }
}
