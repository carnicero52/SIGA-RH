import { db } from '@/lib/db'
import { getAuthPayload } from '@/lib/server-auth'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const { companyId } = getAuthPayload(request)

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const vacantId = searchParams.get('vacantId')

    const where: any = { companyId }
    if (status) {
      // Support comma-separated statuses: ?status=pending_hire,hired,offered
      if (status.includes(',')) {
        where.status = { in: status.split(',').map(s => s.trim()) }
      } else {
        where.status = status
      }
    }
    if (vacantId) {
      where.vacantId = vacantId
    }

    const candidates = await db.candidate.findMany({
      where,
      include: {
        vacant: { select: { id: true, title: true } },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(candidates)
  } catch (error: any) {
    console.error('Candidates GET error:', error)
    return NextResponse.json({ error: 'Error al obtener candidatos' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { companyId } = getAuthPayload(request)

    const body = await request.json()
    const {
      vacantId,
      firstName,
      lastName,
      email,
      phone,
      coverLetter,
      notes,
    } = body

    if (!vacantId || !firstName || !lastName || !email) {
      return NextResponse.json(
        { error: 'Vacante, nombre, apellido y email son requeridos' },
        { status: 400 }
      )
    }

    const candidate = await db.candidate.create({
      data: {
        vacantId,
        companyId,
        firstName,
        lastName,
        email,
        phone: phone || null,
        coverLetter: coverLetter || null,
        notes: notes || null,
      },
      include: {
        vacant: { select: { id: true, title: true } },
      },
    })

    return NextResponse.json(candidate, { status: 201 })
  } catch (error: any) {
    console.error('Candidates POST error:', error)
    return NextResponse.json({ error: 'Error al crear candidato' }, { status: 500 })
  }
}
