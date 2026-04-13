import { db } from '@/lib/db'
import { getAuthPayload } from '@/lib/server-auth'
import { NextRequest, NextResponse } from 'next/server'

const STATUS_LABELS: Record<string, string> = {
  applied: 'Postulado',
  screening: 'En Cribado',
  interview: 'Entrevista Programada',
  assessment: 'En Evaluación',
  offered: 'Oferta Enviada',
  hired: '✅ Contratado',
  rejected: '❌ Rechazado',
  pending_hire: '⏳ Pre-aprobado (en espera)',
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { companyId } = getAuthPayload(request)
    const { id } = await params
    const candidate = await db.candidate.findFirst({
      where: { id, companyId },
      include: { vacant: { select: { id: true, title: true } } },
    })
    if (!candidate) return NextResponse.json({ error: 'Candidato no encontrado' }, { status: 404 })
    return NextResponse.json(candidate)
  } catch (error: any) {
    return NextResponse.json({ error: 'Error al obtener candidato' }, { status: 500 })
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

    const existing = await db.candidate.findFirst({
      where: { id, companyId },
      include: { vacant: { select: { id: true, title: true } } },
    })
    if (!existing) return NextResponse.json({ error: 'Candidato no encontrado' }, { status: 404 })

    const candidate = await db.candidate.update({
      where: { id: existing.id },
      data: {
        ...(body.firstName !== undefined && { firstName: body.firstName }),
        ...(body.lastName !== undefined && { lastName: body.lastName }),
        ...(body.email !== undefined && { email: body.email }),
        ...(body.phone !== undefined && { phone: body.phone || null }),
        ...(body.coverLetter !== undefined && { coverLetter: body.coverLetter || null }),
        ...(body.notes !== undefined && { notes: body.notes || null }),
        ...(body.status !== undefined && { status: body.status }),
        ...(body.interviewDate !== undefined && { interviewDate: body.interviewDate || null }),
        ...(body.cvUrl !== undefined && { cvUrl: body.cvUrl || null }),
      },
      include: { vacant: { select: { id: true, title: true } } },
    })

    // Send notification when status changes
    if (body.status && body.status !== existing.status) {
      const fullName = `${existing.firstName} ${existing.lastName}`
      const vacantTitle = existing.vacant?.title || 'vacante'
      const newLabel = STATUS_LABELS[body.status] || body.status

      await db.appNotification.create({
        data: {
          companyId: existing.companyId,
          type: 'system',
          title: 'Actualización de Candidato',
          message: `${fullName} (${vacantTitle}) → ${newLabel}`,
        },
      })
    }

    return NextResponse.json(candidate)
  } catch (error: any) {
    console.error('Candidate PUT error:', error)
    return NextResponse.json({ error: 'Error al actualizar candidato' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { companyId } = getAuthPayload(request)
    const { id } = await params
    const existing = await db.candidate.findFirst({ where: { id, companyId } })
    if (!existing) return NextResponse.json({ error: 'Candidato no encontrado' }, { status: 404 })
    await db.candidate.delete({ where: { id: existing.id } })
    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: 'Error al eliminar candidato' }, { status: 500 })
  }
}
