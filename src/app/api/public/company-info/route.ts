import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

/**
 * GET /api/public/company-info
 * Returns basic company info for the public job board
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const companyId = searchParams.get('companyId')

    if (!companyId) {
      return NextResponse.json({ error: 'El parámetro companyId es requerido' }, { status: 400 })
    }

    const company = await db.company.findFirst({
      where: { id: companyId, active: true },
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
