import { db } from '@/lib/db'
import { getAuthPayload } from '@/lib/server-auth'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const { companyId } = getAuthPayload(request)

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
