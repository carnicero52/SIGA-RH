import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const period = await db.payrollPeriod.findUnique({
      where: { id },
      include: {
        items: {
          include: {
            employee: {
              select: {
                id: true, firstName: true, lastName: true, employeeNumber: true,
                position: { select: { name: true, salary: true, currency: true, payrollFrequency: true, overtimeRate: true } },
                branch: { select: { name: true } },
                department: { select: { name: true } },
              },
            },
          },
          orderBy: { employee: { lastName: 'asc' } },
        },
      },
    })
    if (!period) return NextResponse.json({ error: 'Período no encontrado' }, { status: 404 })
    return NextResponse.json(period)
  } catch (error) {
    return NextResponse.json({ error: 'Error al obtener período' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await request.json()

    const period = await db.payrollPeriod.update({
      where: { id },
      data: {
        ...(body.status !== undefined && { status: body.status }),
        ...(body.notes !== undefined && { notes: body.notes }),
        ...(body.totalAmount !== undefined && { totalAmount: body.totalAmount }),
      },
    })

    return NextResponse.json(period)
  } catch (error) {
    return NextResponse.json({ error: 'Error al actualizar período' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    await db.payrollPeriod.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Error al eliminar período' }, { status: 500 })
  }
}
