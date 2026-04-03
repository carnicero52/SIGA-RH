import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const vacant = await db.vacant.findUnique({
      where: { id },
      include: {
        department: { select: { id: true, name: true } },
        position: { select: { id: true, name: true } },
        candidates: {
          orderBy: { createdAt: 'desc' },
        },
      },
    })

    if (!vacant) {
      return NextResponse.json({ error: 'Vacante no encontrada' }, { status: 404 })
    }

    return NextResponse.json(vacant)
  } catch (error: any) {
    console.error('Vacancy GET error:', error)
    return NextResponse.json({ error: 'Error al obtener vacante' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()

    const existing = await db.vacant.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Vacante no encontrada' }, { status: 404 })
    }

    const vacant = await db.vacant.update({
      where: { id },
      data: {
        ...(body.title !== undefined && { title: body.title }),
        ...(body.departmentId !== undefined && { departmentId: body.departmentId || null }),
        ...(body.positionId !== undefined && { positionId: body.positionId || null }),
        ...(body.description !== undefined && { description: body.description || null }),
        ...(body.requirements !== undefined && { requirements: body.requirements || null }),
        ...(body.salaryMin !== undefined && { salaryMin: body.salaryMin ? parseFloat(body.salaryMin) : null }),
        ...(body.salaryMax !== undefined && { salaryMax: body.salaryMax ? parseFloat(body.salaryMax) : null }),
        ...(body.employmentType !== undefined && { employmentType: body.employmentType }),
        ...(body.location !== undefined && { location: body.location || null }),
        ...(body.status !== undefined && { status: body.status }),
        ...(body.vacanciesCount !== undefined && { vacanciesCount: parseInt(body.vacanciesCount) }),
      },
      include: {
        department: { select: { id: true, name: true } },
        position: { select: { id: true, name: true } },
        _count: { select: { candidates: true } },
      },
    })

    return NextResponse.json(vacant)
  } catch (error: any) {
    console.error('Vacancy PUT error:', error)
    return NextResponse.json({ error: 'Error al actualizar vacante' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const existing = await db.vacant.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Vacante no encontrada' }, { status: 404 })
    }

    await db.vacant.delete({ where: { id } })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Vacancy DELETE error:', error)
    return NextResponse.json({ error: 'Error al eliminar vacante' }, { status: 500 })
  }
}
