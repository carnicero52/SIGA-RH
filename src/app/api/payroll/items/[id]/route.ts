import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await request.json()

    const existing = await db.payrollItem.findUnique({ where: { id } })
    if (!existing) return NextResponse.json({ error: 'Ítem no encontrado' }, { status: 404 })

    // Recalculate net if adjustments change
    const otherDeductions = body.otherDeductions ?? existing.otherDeductions
    const otherBonuses = body.otherBonuses ?? existing.otherBonuses
    const grossAmount = existing.grossAmount + (otherBonuses - existing.otherBonuses)
    const netAmount = Math.max(0, grossAmount - existing.absenceDeduction - existing.lateDeduction - otherDeductions)

    const item = await db.payrollItem.update({
      where: { id },
      data: {
        ...(body.otherDeductions !== undefined && { otherDeductions: Number(body.otherDeductions) }),
        ...(body.otherBonuses !== undefined && { otherBonuses: Number(body.otherBonuses) }),
        ...(body.notes !== undefined && { notes: body.notes }),
        grossAmount: Math.round(grossAmount * 100) / 100,
        netAmount: Math.round(netAmount * 100) / 100,
      },
      include: {
        employee: { select: { id: true, firstName: true, lastName: true } },
      },
    })

    return NextResponse.json(item)
  } catch (error) {
    return NextResponse.json({ error: 'Error al actualizar ítem' }, { status: 500 })
  }
}
