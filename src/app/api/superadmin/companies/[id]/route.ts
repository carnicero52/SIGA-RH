import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

const SUPERADMIN_SECRET = process.env.SUPERADMIN_SECRET || 'siga-superadmin-2025'

function verifySuperAdmin(request: NextRequest) {
  const secret =
    request.headers.get('x-superadmin-secret') ||
    request.nextUrl.searchParams.get('secret')
  if (secret !== SUPERADMIN_SECRET) throw new Error('No autorizado')
}

const PLAN_LIMITS: Record<string, { maxEmployees: number }> = {
  free:         { maxEmployees: 10 },
  professional: { maxEmployees: 100 },
  enterprise:   { maxEmployees: 99999 },
}

/**
 * PUT /api/superadmin/companies/:id
 * Update plan, status, notes, limits for a company.
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    verifySuperAdmin(request)
    const { id } = await params
    const body = await request.json()

    const existing = await db.company.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Empresa no encontrada' }, { status: 404 })
    }

    // Auto-set maxEmployees when plan changes
    let maxEmployees = existing.maxEmployees
    if (body.plan && PLAN_LIMITS[body.plan]) {
      maxEmployees = PLAN_LIMITS[body.plan].maxEmployees
    }
    if (body.maxEmployees !== undefined) {
      maxEmployees = Number(body.maxEmployees)
    }

    const company = await db.company.update({
      where: { id },
      data: {
        ...(body.plan !== undefined && { plan: body.plan }),
        ...(body.planStatus !== undefined && { planStatus: body.planStatus }),
        ...(body.adminNotes !== undefined && { adminNotes: body.adminNotes }),
        ...(body.planActivatedAt !== undefined && { planActivatedAt: body.planActivatedAt ? new Date(body.planActivatedAt) : null }),
        ...(body.planExpiresAt !== undefined && { planExpiresAt: body.planExpiresAt ? new Date(body.planExpiresAt) : null }),
        ...(body.trialEndsAt !== undefined && { trialEndsAt: body.trialEndsAt ? new Date(body.trialEndsAt) : null }),
        ...(body.active !== undefined && { active: Boolean(body.active) }),
        maxEmployees,
      },
      include: {
        _count: { select: { employees: true, branches: true } },
      },
    })

    // If suspending, create a notification for the company
    if (body.planStatus === 'suspended' && existing.planStatus !== 'suspended') {
      await db.appNotification.create({
        data: {
          companyId: id,
          type: 'alert',
          title: '⚠️ Cuenta Suspendida',
          message: 'Tu cuenta ha sido suspendida. Contacta a soporte para reactivarla.',
        },
      })
    }

    return NextResponse.json(company)
  } catch (error: any) {
    if (error.message === 'No autorizado') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }
    console.error('SuperAdmin PUT error:', error)
    return NextResponse.json({ error: 'Error al actualizar empresa' }, { status: 500 })
  }
}
