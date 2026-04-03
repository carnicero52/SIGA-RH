import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const position = await db.position.findUnique({
      where: { id },
      include: {
        department: {
          select: { id: true, name: true },
        },
        _count: {
          select: { employees: true },
        },
      },
    })

    if (!position) {
      return NextResponse.json({ error: 'Puesto no encontrado' }, { status: 404 })
    }

    return NextResponse.json(position)
  } catch (error: any) {
    console.error('Get position error:', error)
    return NextResponse.json({ error: 'Error al obtener puesto' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { departmentId, name, description, salary } = body

    const position = await db.position.update({
      where: { id },
      data: {
        ...(departmentId !== undefined && { departmentId }),
        ...(name !== undefined && { name }),
        ...(description !== undefined && { description: description || null }),
        ...(salary !== undefined && { salary: salary != null ? Number(salary) : null }),
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

    return NextResponse.json(position)
  } catch (error: any) {
    console.error('Update position error:', error)
    return NextResponse.json({ error: 'Error al actualizar puesto' }, { status: 500 })
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const position = await db.position.update({
      where: { id },
      data: { active: false },
    })
    return NextResponse.json(position)
  } catch (error: any) {
    console.error('Delete position error:', error)
    return NextResponse.json({ error: 'Error al desactivar puesto' }, { status: 500 })
  }
}
