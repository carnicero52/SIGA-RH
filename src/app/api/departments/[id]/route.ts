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
    const department = await db.department.findFirst({
      where: { id, companyId },
      include: {
        _count: {
          select: { employees: true, positions: true },
        },
      },
    })

    if (!department) {
      return NextResponse.json({ error: 'Departamento no encontrado' }, { status: 404 })
    }

    return NextResponse.json(department)
  } catch (error: any) {
    console.error('Get department error:', error)
    return NextResponse.json({ error: 'Error al obtener departamento' }, { status: 500 })
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
    const { name, description, managerName } = body

    const existing = await db.department.findFirst({ where: { id, companyId } })
    if (!existing) {
      return NextResponse.json({ error: 'Departamento no encontrado' }, { status: 404 })
    }

    const department = await db.department.update({
      where: { id: existing.id },
      data: {
        ...(name !== undefined && { name }),
        ...(description !== undefined && { description: description || null }),
        ...(managerName !== undefined && { managerName: managerName || null }),
      },
    })

    return NextResponse.json(department)
  } catch (error: any) {
    console.error('Update department error:', error)
    return NextResponse.json({ error: 'Error al actualizar departamento' }, { status: 500 })
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { companyId } = getAuthPayload(_request)
    const { id } = await params
    const existing = await db.department.findFirst({ where: { id, companyId } })
    if (!existing) {
      return NextResponse.json({ error: 'Departamento no encontrado' }, { status: 404 })
    }

    const department = await db.department.update({
      where: { id: existing.id },
      data: { active: false },
    })
    return NextResponse.json(department)
  } catch (error: any) {
    console.error('Delete department error:', error)
    return NextResponse.json({ error: 'Error al desactivar departamento' }, { status: 500 })
  }
}
