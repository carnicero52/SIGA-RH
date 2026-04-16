import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

const SECRET = process.env.SUPERADMIN_SECRET || 'siga-superadmin-2025'

// Plan limits configuration
const PLAN_LIMITS = {
  free: { maxBranches: 1, maxEmployees: 5, maxDepartments: 1 },
  professional: { maxBranches: Infinity, maxEmployees: 20, maxDepartments: 10 },
  enterprise: { maxBranches: Infinity, maxEmployees: Infinity, maxDepartments: Infinity },
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const secret = request.nextUrl.searchParams.get('secret')
  if (secret !== SECRET) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  try {
    const { id } = await params
    const body = await request.json()
    const newPlan = body.plan || 'free'
    
    // Get current company with counts
    const company = await db.company.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            employees: { where: { active: true } },
            branches: { where: { active: true } },
            departments: { where: { active: true } },
          },
        },
      },
    })
    
    if (!company) {
      return NextResponse.json({ error: 'Empresa no encontrada' }, { status: 404 })
    }
    
    // Check plan limits
    const limits = PLAN_LIMITS[newPlan as keyof typeof PLAN_LIMITS] || PLAN_LIMITS.free
    
    if (company._count.branches > limits.maxBranches) {
      return NextResponse.json({ 
        error: `⚠️ La empresa tiene ${company._count.branches} sucursales pero el plan Gratuito solo permite ${limits.maxBranches}. Cambia a Profesional o Empresarial primero.` 
      }, { status: 400 })
    }
    
    if (company._count.employees > limits.maxEmployees) {
      return NextResponse.json({ 
        error: `⚠️ La empresa tiene ${company._count.employees} empleados pero el plan Gratuito solo permite ${limits.maxEmployees}. Cambia a Profesional o Empresarial primero.` 
      }, { status: 400 })
    }
    
    if (company._count.departments > limits.maxDepartments) {
      return NextResponse.json({ 
        error: `⚠️ La empresa tiene ${company._count.departments} departamentos pero el plan Gratuito solo permite ${limits.maxDepartments}. Cambia a Profesional o Empresarial primero.` 
      }, { status: 400 })
    }
    
    const updated = await db.company.update({
      where: { id },
      data: {
        plan: body.plan,
        planStatus: body.planStatus,
        maxEmployees: body.maxEmployees,
        adminNotes: body.adminNotes,
        planExpiresAt: body.planExpiresAt,
        trialEndsAt: body.trialEndsAt,
        active: body.active !== undefined ? body.active : undefined,
      },
    })
    
    return NextResponse.json(updated)
  } catch (error: any) {
    console.error('Update company error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
