import { db } from '@/lib/db'
import { getAuthPayload } from '@/lib/server-auth'
import { NextRequest, NextResponse } from 'next/server'
import { checkPlanLimit } from '@/lib/plan-check'

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

    const departments = await db.department.findMany({
      where: { active: true, companyId },
      include: {
        _count: {
          select: { employees: true, positions: true },
        },
      },
      orderBy: { name: 'asc' },
    })
    return NextResponse.json(departments)
  } catch (error: any) {
    console.error('List departments error:', error)
    return NextResponse.json({ error: 'Error al obtener departamentos' }, { status: 500 })
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

    // Check plan limits for departments
    const deptCheck = await checkPlanLimit(companyId, 'departments')
    if (!deptCheck.allowed) {
      return deptCheck.error
    }
    }
    const body = await request.json()
    const { name, description, managerName } = body

    if (!name) {
      return NextResponse.json({ error: 'El nombre y la empresa son requeridos' }, { status: 400 })
    }

    const department = await db.department.create({
      data: {
        companyId,
        name,
        description: description || null,
        managerName: managerName || null,
      },
    })

    return NextResponse.json(department, { status: 201 })
  } catch (error: any) {
    console.error('Create department error:', error)
    return NextResponse.json({ error: 'Error al crear departamento' }, { status: 500 })
  }
}
