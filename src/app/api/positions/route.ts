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

    const { searchParams } = new URL(request.url)
    const departmentId = searchParams.get('departmentId')

    const positions = await db.position.findMany({
      where: {
        active: true,
        companyId,
        ...(departmentId && { departmentId }),
      },
      include: {
        department: {
          select: { id: true, name: true },
        },
        _count: {
          select: { employees: true },
        },
      },
      orderBy: { name: 'asc' },
    })
    return NextResponse.json(positions)
  } catch (error: any) {
    console.error('List positions error:', error)
    return NextResponse.json({ error: 'Error al obtener puestos' }, { status: 500 })
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
    const { departmentId, name, description, salary } = body

    if (!departmentId || !name) {
      return NextResponse.json({ error: 'El nombre, departamento y empresa son requeridos' }, { status: 400 })
    }

    const position = await db.position.create({
      data: {
        companyId,
        departmentId,
        name,
        description: description || null,
        salary: salary != null ? Number(salary) : null,
        currency: body.currency || 'USD',
        level: body.level || null,
      },
      include: {
        department: {
          select: { id: true, name: true },
        },
        _count: {
          select: { employees: true },
        },
      },
    })

    return NextResponse.json(position, { status: 201 })
  } catch (error: any) {
    console.error('Create position error:', error)
    return NextResponse.json({ error: 'Error al crear puesto' }, { status: 500 })
  }
}
