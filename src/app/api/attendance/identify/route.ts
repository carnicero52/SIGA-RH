import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

/**
 * POST /api/attendance/identify
 * Public endpoint — identifies an employee by PIN, email or phone
 * for the public check-in page WITHOUT exposing other employee names.
 *
 * Body: { branchId: string, identifier: string, type: 'pin' | 'email' | 'phone' }
 * Returns: { id, firstName, lastName, employeeNumber, hasPendingCheckIn }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { branchId, identifier, type } = body

    if (!branchId || !identifier || !type) {
      return NextResponse.json(
        { error: 'branchId, identifier y type son requeridos' },
        { status: 400 }
      )
    }

    if (!['pin', 'email', 'phone'].includes(type)) {
      return NextResponse.json(
        { error: 'type debe ser pin, email o phone' },
        { status: 400 }
      )
    }

    // Build the where clause based on identifier type
    const where: any = {
      active: true,
      branchId,
    }

    if (type === 'pin') {
      where.pin = identifier.trim()
    } else if (type === 'email') {
      where.email = { equals: identifier.trim(), mode: 'insensitive' }
    } else if (type === 'phone') {
      where.phone = identifier.trim()
    }

    const employee = await db.employee.findFirst({ where })

    if (!employee) {
      // Generic message — don't reveal which field didn't match
      return NextResponse.json(
        { error: 'No se encontró un empleado con esos datos en esta sucursal' },
        { status: 404 }
      )
    }

    // Check if employee has pending check-in today
    const todayStart = new Date()
    todayStart.setHours(0, 0, 0, 0)
    const todayEnd = new Date()
    todayEnd.setHours(23, 59, 59, 999)

    const lastCheckIn = await db.attendanceRecord.findFirst({
      where: {
        employeeId: employee.id,
        branchId,
        recordType: 'check_in',
        recordTime: { gte: todayStart, lte: todayEnd },
      },
      orderBy: { recordTime: 'desc' },
    })

    let hasPendingCheckIn = false
    if (lastCheckIn) {
      const matchingCheckOut = await db.attendanceRecord.findFirst({
        where: {
          employeeId: employee.id,
          branchId,
          recordType: 'check_out',
          recordTime: { gte: lastCheckIn.recordTime, lte: todayEnd },
        },
      })
      hasPendingCheckIn = !matchingCheckOut
    }

    // Return only minimal info — no sensitive data
    return NextResponse.json({
      id: employee.id,
      firstName: employee.firstName,
      lastName: employee.lastName,
      employeeNumber: employee.employeeNumber,
      hasPendingCheckIn,
    })
  } catch (error) {
    console.error('Error en identify:', error)
    return NextResponse.json(
      { error: 'Error al identificar empleado' },
      { status: 500 }
    )
  }
}
