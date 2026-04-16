import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

const SECRET = process.env.SUPERADMIN_SECRET || 'siga-superadmin-2025'

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const secret = request.nextUrl.searchParams.get('secret')
  if (secret !== SECRET) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  try {
    const { id } = await params
    const body = await request.json()
    
    const company = await db.company.update({
      where: { id },
      data: {
        plan: body.plan,
        planStatus: body.planStatus,
        maxEmployees: body.maxEmployees,
        adminNotes: body.adminNotes,
        planExpiresAt: body.planExpiresAt,
        trialEndsAt: body.trialEndsAt,
      },
    })
    
    return NextResponse.json(company)
  } catch (error: any) {
    console.error('Update company error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
