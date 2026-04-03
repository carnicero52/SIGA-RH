import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const template = await db.contractTemplate.findUnique({
      where: { id },
      include: {
        _count: {
          select: { contracts: true },
        },
      },
    })

    if (!template) {
      return NextResponse.json({ error: 'Plantilla no encontrada' }, { status: 404 })
    }

    return NextResponse.json(template)
  } catch (error: any) {
    console.error('Get contract template error:', error)
    return NextResponse.json({ error: 'Error al obtener plantilla' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()

    const template = await db.contractTemplate.findUnique({ where: { id } })
    if (!template) {
      return NextResponse.json({ error: 'Plantilla no encontrada' }, { status: 404 })
    }

    const updateData: Record<string, unknown> = {}
    if (body.name !== undefined) updateData.name = body.name
    if (body.type !== undefined) updateData.type = body.type
    if (body.content !== undefined) updateData.content = body.content
    if (body.defaultDurationDays !== undefined) {
      updateData.defaultDurationDays = body.defaultDurationDays ? parseInt(body.defaultDurationDays, 10) : null
    }
    if (body.active !== undefined) updateData.active = body.active

    const updated = await db.contractTemplate.update({
      where: { id },
      data: updateData,
      include: {
        _count: {
          select: { contracts: true },
        },
      },
    })

    return NextResponse.json(updated)
  } catch (error: any) {
    console.error('Update contract template error:', error)
    return NextResponse.json({ error: 'Error al actualizar plantilla' }, { status: 500 })
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const template = await db.contractTemplate.findUnique({
      where: { id },
      include: {
        _count: {
          select: { contracts: true },
        },
      },
    })

    if (!template) {
      return NextResponse.json({ error: 'Plantilla no encontrada' }, { status: 404 })
    }

    if (template._count.contracts > 0) {
      return NextResponse.json(
        { error: `No se puede eliminar la plantilla porque tiene ${template._count.contracts} contrato(s) asociado(s)` },
        { status: 400 }
      )
    }

    await db.contractTemplate.delete({ where: { id } })

    return NextResponse.json({ message: 'Plantilla eliminada' })
  } catch (error: any) {
    console.error('Delete contract template error:', error)
    return NextResponse.json({ error: 'Error al eliminar plantilla' }, { status: 500 })
  }
}
