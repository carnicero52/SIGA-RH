import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const now = new Date()
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const todayEnd = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000)
    const isWeekday = now.getDay() !== 0 && now.getDay() !== 6

    // --- Employee counts ---
    const totalEmployees = await db.employee.count({ where: { active: true } })
    const activeEmployees = totalEmployees

    // Present today = employees with check_in today
    const presentTodayRecords = await db.attendanceRecord.findMany({
      where: {
        recordType: 'check_in',
        recordTime: { gte: todayStart, lt: todayEnd },
      },
      select: { employeeId: true, status: true },
    })

    const uniquePresentEmployees = new Set(presentTodayRecords.map(r => r.employeeId))
    const presentToday = uniquePresentEmployees.size

    // Late today = check_in records today with status 'late'
    const lateRecords = presentTodayRecords.filter(r => r.status === 'late')
    const lateEmployeeIds = new Set(lateRecords.map(r => r.employeeId))
    const lateToday = lateEmployeeIds.size

    // Absent today = active employees without check_in today (weekday only)
    let absentToday = 0
    if (isWeekday) {
      const allActiveEmployeeIds = await db.employee.findMany({
        where: { active: true, status: 'active' },
        select: { id: true },
      })
      absentToday = allActiveEmployeeIds.filter(
        e => !uniquePresentEmployees.has(e.id)
      ).length
    }

    // --- Organization counts ---
    const totalBranches = await db.branch.count({ where: { active: true } })
    const totalDepartments = await db.department.count({ where: { active: true } })

    // --- Incidents, vacancies, contracts ---
    const openIncidents = await db.incident.count({
      where: { status: { in: ['open', 'under_review'] } },
    })
    const openVacancies = await db.vacant.count({ where: { status: 'open' } })
    const pendingContracts = await db.contract.count({ where: { status: 'active' } })

    // --- Attendance by day (last 7 days) ---
    const attendanceByDay: { date: string; present: number; late: number; absent: number }[] = []
    for (let i = 6; i >= 0; i--) {
      const day = new Date(now)
      day.setDate(day.getDate() - i)
      const dayStart = new Date(day.getFullYear(), day.getMonth(), day.getDate())
      const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000)
      const dayOfWeek = day.getDay()
      const isWorkday = dayOfWeek !== 0 && dayOfWeek !== 6

      const dayLabel = day.toLocaleDateString('es-MX', { weekday: 'short', day: 'numeric' })

      if (!isWorkday) {
        attendanceByDay.push({ date: dayLabel, present: 0, late: 0, absent: 0 })
        continue
      }

      const dayRecords = await db.attendanceRecord.findMany({
        where: {
          recordType: 'check_in',
          recordTime: { gte: dayStart, lt: dayEnd },
        },
        select: { employeeId: true, status: true },
      })

      const dayPresent = new Set(dayRecords.map(r => r.employeeId))
      const dayLate = new Set(dayRecords.filter(r => r.status === 'late').map(r => r.employeeId))

      const dayAbsent = await db.employee.count({
        where: {
          active: true,
          status: 'active',
          id: { notIn: Array.from(dayPresent) },
        },
      })

      attendanceByDay.push({
        date: dayLabel,
        present: dayPresent.size - dayLate.size,
        late: dayLate.size,
        absent: dayAbsent,
      })
    }

    // --- Attendance by branch (today) ---
    const todayRecordsByBranch = await db.attendanceRecord.groupBy({
      by: ['branchId'],
      where: {
        recordType: 'check_in',
        recordTime: { gte: todayStart, lt: todayEnd },
      },
      _count: { id: true },
    })

    const branchNames = await db.branch.findMany({
      where: { active: true },
      select: { id: true, name: true },
    })

    const attendanceByBranch = branchNames.map(b => ({
      branch: b.name.replace('Sucursal ', ''),
      count: todayRecordsByBranch.find(r => r.branchId === b.id)?._count.id || 0,
    })).filter(b => b.count > 0)

    // --- Employees by department ---
    const employeesByDepartmentRaw = await db.employee.groupBy({
      by: ['departmentId'],
      where: { active: true, departmentId: { not: null } },
      _count: { id: true },
    })

    const deptNames = await db.department.findMany({
      where: { active: true },
      select: { id: true, name: true },
    })

    const employeesByDepartment = deptNames.map(d => ({
      department: d.name,
      count: employeesByDepartmentRaw.find(e => e.departmentId === d.id)?._count.id || 0,
    })).filter(d => d.count > 0).sort((a, b) => b.count - a.count)

    // --- Employees by status ---
    const employeesByStatusRaw = await db.employee.groupBy({
      by: ['status'],
      where: { active: true },
      _count: { id: true },
    })

    const employeesByStatus = employeesByStatusRaw.map(s => ({
      status: s.status,
      count: s._count.id,
    }))

    // --- Recent attendance (last 10) ---
    const recentAttendance = await db.attendanceRecord.findMany({
      where: { recordType: 'check_in' },
      orderBy: { recordTime: 'desc' },
      take: 10,
      include: {
        employee: { select: { firstName: true, lastName: true } },
        branch: { select: { name: true } },
      },
    })

    // --- Upcoming birthdays (next 30 days) ---
    const allEmployees = await db.employee.findMany({
      where: { active: true, birthDate: { not: null } },
      select: { firstName: true, lastName: true, birthDate: true },
    })

    const upcomingBirthdays: { name: string; date: string }[] = []
    for (const emp of allEmployees) {
      if (!emp.birthDate) continue
      const [bMonth, bDay] = emp.birthDate.split('-').slice(1).map(Number)
      const birthdayThisYear = new Date(now.getFullYear(), bMonth - 1, bDay)

      // If birthday already passed this year, check next year
      if (birthdayThisYear < now) {
        birthdayThisYear.setFullYear(now.getFullYear() + 1)
      }

      const diffDays = Math.ceil((birthdayThisYear.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
      if (diffDays <= 30) {
        upcomingBirthdays.push({
          name: `${emp.firstName} ${emp.lastName}`,
          date: birthdayThisYear.toLocaleDateString('es-MX', { day: 'numeric', month: 'short' }),
        })
      }
    }
    upcomingBirthdays.sort((a, b) => {
      const dateA = a.date.split(' ').map(Number)
      const dateB = b.date.split(' ').map(Number)
      return (dateA[0]) - (dateB[0])
    })

    return NextResponse.json({
      totalEmployees,
      activeEmployees,
      presentToday,
      lateToday,
      absentToday,
      totalBranches,
      totalDepartments,
      openIncidents,
      openVacancies,
      pendingContracts,
      attendanceByDay,
      attendanceByBranch,
      employeesByDepartment,
      employeesByStatus,
      recentAttendance,
      upcomingBirthdays,
    })
  } catch (error: any) {
    console.error('Dashboard stats error:', error)
    return NextResponse.json({ error: 'Error al obtener estadísticas' }, { status: 500 })
  }
}
