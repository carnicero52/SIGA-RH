import { db } from '@/lib/db'
import { getAuthPayload } from '@/lib/server-auth'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { companyId } = getAuthPayload(request)
    const body = await request.json()
    const { employeeId, shiftId, effectiveDate, endDate, daysOfWeek } = body

    if (!employeeId || !shiftId || !effectiveDate) {
      return NextResponse.json(
        { error: 'Empleado, turno y fecha de vigencia son requeridos' },
        { status: 400 }
      )
    }

    // Check if employee and shift exist
    const employee = await db.employee.findFirst({ where: { id: employeeId, companyId } })
    if (!employee) {
      return NextResponse.json({ error: 'Empleado no encontrado' }, { status: 404 })
    }

    const shift = await db.shift.findFirst({ where: { id: shiftId, companyId } })
    if (!shift) {
      return NextResponse.json({ error: 'Turno no encontrado' }, { status: 404 })
    }

    // Deactivate any existing active assignments for this employee
    await db.employeeShift.updateMany({
      where: { employeeId, active: true },
      data: { active: false },
    })

    const assignment = await db.employeeShift.create({
      data: {
        employeeId,
        shiftId,
        effectiveDate,
        endDate: endDate || null,
        daysOfWeek: daysOfWeek || '[1,2,3,4,5]',
      },
      include: {
        employee: { select: { id: true, firstName: true, lastName: true, employeeNumber: true } },
        shift: { select: { id: true, name: true, startTime: true, endTime: true, color: true } },
      },
    })

    return NextResponse.json(assignment, { status: 201 })
  } catch (error: any) {
    console.error('Error assigning shift:', error)
    return NextResponse.json({ error: 'Error al asignar el turno' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { companyId } = getAuthPayload(request)

    const { searchParams } = new URL(request.url)
    const employeeId = searchParams.get('employeeId')
    const shiftId = searchParams.get('shiftId')

    if (!employeeId || !shiftId) {
      return NextResponse.json(
        { error: 'employeeId y shiftId son requeridos' },
        { status: 400 }
      )
    }

    await db.employeeShift.updateMany({
      where: {
        employeeId,
        shiftId,
        active: true,
        employee: { companyId },
        shift: { companyId },
      },
      data: { active: false },
    })

    return NextResponse.json({ message: 'Asignación eliminada correctamente' })
  } catch (error: any) {
    console.error('Error removing shift assignment:', error)
    return NextResponse.json({ error: 'Error al eliminar la asignación' }, { status: 500 })
  }
}
