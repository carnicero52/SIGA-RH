import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

/**
 * POST /api/public/apply
 * Public endpoint — submits a job application (CV + personal data)
 * No auth required.
 *
 * Body: {
 *   vacantId: string
 *   firstName: string
 *   lastName: string
 *   email: string
 *   phone?: string
 *   coverLetter?: string
 *   cvUrl?: string         // external URL (Google Drive, LinkedIn, etc.)
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { vacantId, firstName, lastName, email, phone, coverLetter, cvUrl } = body

    if (!vacantId || !firstName?.trim() || !lastName?.trim() || !email?.trim()) {
      return NextResponse.json(
        { error: 'vacantId, nombre, apellido y email son requeridos' },
        { status: 400 }
      )
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email.trim())) {
      return NextResponse.json({ error: 'El email no es válido' }, { status: 400 })
    }

    // Validate vacancy exists and is open
    const vacancy = await db.vacant.findUnique({
      where: { id: vacantId },
      include: { company: { select: { id: true, name: true } } },
    })

    if (!vacancy) {
      return NextResponse.json({ error: 'Vacante no encontrada' }, { status: 404 })
    }

    if (vacancy.status !== 'open') {
      return NextResponse.json({ error: 'Esta vacante ya no está disponible' }, { status: 400 })
    }

    // Check for duplicate application (same email + vacancy)
    const existing = await db.candidate.findFirst({
      where: { vacantId, email: email.trim() },
    })

    if (existing) {
      return NextResponse.json(
        { error: 'Ya tienes una postulación registrada para esta vacante' },
        { status: 409 }
      )
    }

    const candidate = await db.candidate.create({
      data: {
        vacantId,
        companyId: vacancy.company.id,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim(),
        phone: phone?.trim() || null,
        coverLetter: coverLetter?.trim() || null,
        cvUrl: cvUrl?.trim() || null,
        status: 'applied',
      },
    })

    // Create notification for admin
    await db.appNotification.create({
      data: {
        companyId: vacancy.company.id,
        type: 'system',
        title: 'Nueva Postulación',
        message: `${firstName} ${lastName} se postuló para "${vacancy.title}"`,
      },
    })

    return NextResponse.json({
      success: true,
      candidateId: candidate.id,
      message: '¡Tu postulación fue enviada con éxito! Nos pondremos en contacto contigo.',
    }, { status: 201 })
  } catch (error) {
    console.error('Apply error:', error)
    return NextResponse.json({ error: 'Error al procesar la postulación' }, { status: 500 })
  }
}
