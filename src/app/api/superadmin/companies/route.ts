import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

const SUPERADMIN_SECRET = process.env.SUPERADMIN_SECRET || 'siga-superadmin-2025'

function verifySuperAdmin(request: NextRequest) {
  const secret =
    request.headers.get('x-superadmin-secret') ||
    request.nextUrl.searchParams.get('secret')
  if (secret !== SUPERADMIN_SECRET) throw new Error('No autorizado')
}

export async function GET(request: NextRequest) {
  try {
    verifySuperAdmin(request)

    const companies = await db.company.findMany({
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(companies)
  } catch (error: any) {
    console.error('SuperAdmin error:', error)
    return NextResponse.json({ error: 'Error: ' + error.message }, { status: 500 })
  }
}
