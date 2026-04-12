import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

/**
 * GET /api/public/vacancies?companyId=xxx
 * Returns open vacancies for public job board (no auth required)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const companyId = searchParams.get('companyId')

    const where: any = { status: 'open' }
    if (companyId) where.companyId = companyId

    const vacancies = await db.vacant.findMany({
      where,
      include: {
        department: { select: { name: true } },
        position: { select: { name: true } },
        company: { select: { id: true, name: true, slogan: true, logo: true, brandColor: true } },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(vacancies)
  } catch (error) {
    console.error('Public vacancies error:', error)
    return NextResponse.json({ error: 'Error al obtener vacantes' }, { status: 500 })
  }
}
