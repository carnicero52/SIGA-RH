import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

/**
 * GET /api/public/company-info
 * Returns basic company info for the public job board
 */
export async function GET() {
  try {
    const company = await db.company.findFirst({
      where: { active: true },
      orderBy: { createdAt: 'asc' },
      select: { id: true, name: true, slogan: true, logo: true, brandColor: true },
    })

    if (!company) {
      return NextResponse.json({ error: 'Empresa no encontrada' }, { status: 404 })
    }

    return NextResponse.json(company)
  } catch (error) {
    return NextResponse.json({ error: 'Error al obtener información' }, { status: 500 })
  }
}
