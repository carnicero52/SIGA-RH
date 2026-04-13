import { db } from '@/lib/db'
import { getAuthPayload } from '@/lib/server-auth'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { companyId } = getAuthPayload(_request)
    const { id } = await params
    const shift = await db.shift.findFirst({
      where: { id, companyId },
      include: {
        _count: { select: { employeeShifts: true } },
      },
    })

    if (!shift) {
      return NextResponse.json({ error: 'Turno no encontrado' }, { status: 404 })
    }

    return NextResponse.json(shift)
  } catch (error: any) {
    console.error('Error fetching shift:', error)
    return NextResponse.json({ error: 'Error al obtener el turno' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { companyId } = getAuthPayload(request)
    const { id } = await params
    const body = await request.json()
    const { name, startTime, endTime, breakMinutes, toleranceMinutes, type, color } = body

    const existing = await db.shift.findFirst({ where: { id, companyId } })
    if (!existing) {
      return NextResponse.json({ error: 'Turno no encontrado' }, { status: 404 })
    }

    const shift = await db.shift.update({
      where: { id: existing.id },
      data: {
        ...(name !== undefined && { name }),
        ...(startTime !== undefined && { startTime }),
        ...(endTime !== undefined && { endTime }),
        ...(breakMinutes !== undefined && { breakMinutes }),
        ...(toleranceMinutes !== undefined && { toleranceMinutes }),
        ...(type !== undefined && { type }),
        ...(color !== undefined && { color }),
      },
      include: {
        _count: { select: { employeeShifts: true } },
      },
    })

    return NextResponse.json(shift)
  } catch (error: any) {
    console.error('Error updating shift:', error)
    return NextResponse.json({ error: 'Error al actualizar el turno' }, { status: 500 })
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { companyId } = getAuthPayload(_request)
    const { id } = await params

    const existing = await db.shift.findFirst({ where: { id, companyId } })
    if (!existing) {
      return NextResponse.json({ error: 'Turno no encontrado' }, { status: 404 })
    }

    // Check if employees are assigned
    const assignedCount = await db.employeeShift.count({
      where: { shiftId: existing.id, active: true },
    })

    if (assignedCount > 0) {
      return NextResponse.json(
        { error: `No se puede eliminar el turno. Tiene ${assignedCount} empleado(s) asignado(s).` },
        { status: 400 }
      )
    }

    await db.shift.update({
      where: { id: existing.id },
      data: { active: false },
    })

    return NextResponse.json({ message: 'Turno eliminado correctamente' })
  } catch (error: any) {
    console.error('Error deleting shift:', error)
    return NextResponse.json({ error: 'Error al eliminar el turno' }, { status: 500 })
  }
}
