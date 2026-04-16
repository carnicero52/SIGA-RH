import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

const SECRET = process.env.SUPERADMIN_SECRET || 'siga-superadmin-2025'

export async function GET(request: NextRequest) {
  const secret = request.nextUrl.searchParams.get('secret')
  if (secret !== SECRET) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  try {
    const companies = await db.company.findMany({
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json(companies)
  } catch (error: any) {
    console.error('Admin companies error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
