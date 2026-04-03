import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const contract = await db.contract.findUnique({
      where: { id },
      include: {
        template: {
          select: { id: true, name: true, type: true, content: true },
        },
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

    if (!contract) {
      return NextResponse.json({ error: 'Contrato no encontrado' }, { status: 404 })
    }

    return NextResponse.json(contract)
  } catch (error: any) {
    console.error('Get contract error:', error)
    return NextResponse.json({ error: 'Error al obtener contrato' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()

    const contract = await db.contract.findUnique({ where: { id } })
    if (!contract) {
      return NextResponse.json({ error: 'Contrato no encontrado' }, { status: 404 })
    }

    const updateData: Record<string, unknown> = {}
    if (body.status !== undefined) updateData.status = body.status
    if (body.notes !== undefined) updateData.notes = body.notes
    if (body.signedDocumentUrl !== undefined) updateData.signedDocumentUrl = body.signedDocumentUrl
    if (body.startDate !== undefined) updateData.startDate = body.startDate
    if (body.endDate !== undefined) updateData.endDate = body.endDate

    // Mark as signed
    if (body.signedAt === true || body.signedAt === 'now') {
      updateData.signedAt = new Date()
    } else if (body.signedAt !== undefined && body.signedAt !== true && body.signedAt !== 'now') {
      updateData.signedAt = new Date(body.signedAt)
    }

    const updated = await db.contract.update({
      where: { id },
      data: updateData,
      include: {
        template: {
          select: { id: true, name: true, type: true },
        },
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
    console.error('Update contract error:', error)
    return NextResponse.json({ error: 'Error al actualizar contrato' }, { status: 500 })
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const contract = await db.contract.findUnique({ where: { id } })
    if (!contract) {
      return NextResponse.json({ error: 'Contrato no encontrado' }, { status: 404 })
    }

    await db.contract.delete({ where: { id } })

    return NextResponse.json({ message: 'Contrato eliminado' })
  } catch (error: any) {
    console.error('Delete contract error:', error)
    return NextResponse.json({ error: 'Error al eliminar contrato' }, { status: 500 })
  }
}
