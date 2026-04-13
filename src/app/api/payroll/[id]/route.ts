import { db } from '@/lib/db'
import { getAuthPayload } from '@/lib/server-auth'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { companyId } = getAuthPayload(request)
    const { id } = await params
    const period = await db.payrollPeriod.findFirst({
      where: { id, companyId },
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
    const { companyId } = getAuthPayload(request)
    const { id } = await params
    const body = await request.json()

    const existing = await db.payrollPeriod.findFirst({ where: { id, companyId } })
    if (!existing) return NextResponse.json({ error: 'Período no encontrado' }, { status: 404 })

    const period = await db.payrollPeriod.update({
      where: { id: existing.id },
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
    const { companyId } = getAuthPayload(request)
    const { id } = await params

    const existing = await db.payrollPeriod.findFirst({ where: { id, companyId } })
    if (!existing) return NextResponse.json({ error: 'Período no encontrado' }, { status: 404 })

    await db.payrollPeriod.delete({ where: { id: existing.id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Error al eliminar período' }, { status: 500 })
  }
}
