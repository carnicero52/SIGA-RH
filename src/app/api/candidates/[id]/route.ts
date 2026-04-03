import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

const CANDIDATE_PIPELINE = ['applied', 'screening', 'interview', 'assessment', 'offered', 'hired', 'rejected']

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const candidate = await db.candidate.findUnique({
      where: { id },
      include: {
        vacant: { select: { id: true, title: true } },
      },
    })

    if (!candidate) {
      return NextResponse.json({ error: 'Candidato no encontrado' }, { status: 404 })
    }

    return NextResponse.json(candidate)
  } catch (error: any) {
    console.error('Candidate GET error:', error)
    return NextResponse.json({ error: 'Error al obtener candidato' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()

    const existing = await db.candidate.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Candidato no encontrado' }, { status: 404 })
    }

    const candidate = await db.candidate.update({
      where: { id },
      data: {
        ...(body.firstName !== undefined && { firstName: body.firstName }),
        ...(body.lastName !== undefined && { lastName: body.lastName }),
        ...(body.email !== undefined && { email: body.email }),
        ...(body.phone !== undefined && { phone: body.phone || null }),
        ...(body.coverLetter !== undefined && { coverLetter: body.coverLetter || null }),
        ...(body.notes !== undefined && { notes: body.notes || null }),
        ...(body.status !== undefined && { status: body.status }),
        ...(body.interviewDate !== undefined && { interviewDate: body.interviewDate || null }),
      },
      include: {
        vacant: { select: { id: true, title: true } },
      },
    })

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
    const { id } = await params

    const existing = await db.candidate.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Candidato no encontrado' }, { status: 404 })
    }

    await db.candidate.delete({ where: { id } })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Candidate DELETE error:', error)
    return NextResponse.json({ error: 'Error al eliminar candidato' }, { status: 500 })
  }
}
