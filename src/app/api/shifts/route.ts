import { db } from '@/lib/db'
import { getAuthPayload } from '@/lib/server-auth'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const { companyId } = getAuthPayload(request)

    const company = await db.company.findUnique({
      where: { id: companyId },
      select: { active: true, planStatus: true }
    })
    if (!company || company.active === false) {
      return NextResponse.json({ error: 'Cuenta suspendida' }, { status: 403 })
    }
    if (company.planStatus === 'suspended') {
      return NextResponse.json({ error: 'Plan suspendido' }, { status: 403 })
    }

    const shifts = await db.shift.findMany({
      where: { active: true, companyId },
      include: {
        _count: { select: { employeeShifts: true } },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(shifts)
  } catch (error: any) {
    console.error('Error fetching shifts:', error)
    return NextResponse.json({ error: 'Error al obtener los turnos' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { companyId } = getAuthPayload(request)

    const company = await db.company.findUnique({
      where: { id: companyId },
      select: { active: true, planStatus: true }
    })
    if (!company || company.active === false) {
      return NextResponse.json({ error: 'Cuenta suspendida' }, { status: 403 })
    }
    if (company.planStatus === 'suspended') {
      return NextResponse.json({ error: 'Plan suspendido' }, { status: 403 })
    }
    const body = await request.json()
    const { name, startTime, endTime, breakMinutes, toleranceMinutes, type, color } = body

    if (!name || !startTime || !endTime) {
      return NextResponse.json(
        { error: 'Nombre, hora de inicio y hora de fin son requeridos' },
        { status: 400 }
      )
    }

    const shift = await db.shift.create({
      data: {
        name,
        startTime,
        endTime,
        breakMinutes: breakMinutes ?? 0,
        toleranceMinutes: toleranceMinutes ?? 15,
        type: type ?? 'fixed',
        color: color ?? '#10b981',
        companyId,
      },
      include: {
        _count: { select: { employeeShifts: true } },
      },
    })

    return NextResponse.json(shift, { status: 201 })
  } catch (error: any) {
    console.error('Error creating shift:', error)
    return NextResponse.json({ error: 'Error al crear el turno' }, { status: 500 })
  }
}
