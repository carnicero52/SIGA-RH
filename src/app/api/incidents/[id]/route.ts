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

    const incident = await db.incident.findFirst({
      where: { id, companyId },
      include: {
        employee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            employeeNumber: true,
          },
        },
      },
    })

    if (!incident) {
      return NextResponse.json({ error: 'Incidencia no encontrada' }, { status: 404 })
    }

    return NextResponse.json(incident)
  } catch (error: any) {
    console.error('Get incident error:', error)
    return NextResponse.json({ error: 'Error al obtener incidencia' }, { status: 500 })
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

    const incident = await db.incident.findFirst({ where: { id, companyId } })
    if (!incident) {
      return NextResponse.json({ error: 'Incidencia no encontrada' }, { status: 404 })
    }

    const updateData: Record<string, unknown> = {}
    if (body.type !== undefined) updateData.type = body.type
    if (body.title !== undefined) updateData.title = body.title
    if (body.description !== undefined) updateData.description = body.description
    if (body.severity !== undefined) updateData.severity = body.severity
    if (body.date !== undefined) updateData.date = body.date
    if (body.witnesses !== undefined) updateData.witnesses = body.witnesses
    if (body.sanctions !== undefined) updateData.sanctions = body.sanctions
    if (body.status !== undefined) updateData.status = body.status

    if (body.resolution !== undefined) {
      updateData.resolution = body.resolution
      updateData.resolvedAt = new Date()
      updateData.resolvedBy = body.resolvedBy || null
    }

    const updated = await db.incident.update({
      where: { id: incident.id },
      data: updateData,
      include: {
        employee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            employeeNumber: true,
          },
        },
      },
    })

    return NextResponse.json(updated)
  } catch (error: any) {
    console.error('Update incident error:', error)
    return NextResponse.json({ error: 'Error al actualizar incidencia' }, { status: 500 })
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { companyId } = getAuthPayload(_request)
    const { id } = await params

    const incident = await db.incident.findFirst({ where: { id, companyId } })
    if (!incident) {
      return NextResponse.json({ error: 'Incidencia no encontrada' }, { status: 404 })
    }

    await db.incident.delete({ where: { id: incident.id } })

    return NextResponse.json({ message: 'Incidencia eliminada' })
  } catch (error: any) {
    console.error('Delete incident error:', error)
    return NextResponse.json({ error: 'Error al eliminar incidencia' }, { status: 500 })
  }
}
