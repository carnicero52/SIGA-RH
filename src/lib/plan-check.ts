import { db } from '@/lib/db'
import { PLANS, type PlanType } from './plans'
import { NextResponse } from 'next/server'

export interface PlanCheckResult {
  allowed: boolean
  error?: NextResponse
  currentCount: number
  limit: number
}

export async function checkPlanLimit(
  companyId: string,
  resource: 'employees' | 'branches' | 'departments'
): Promise<PlanCheckResult> {
  const company = await db.company.findUnique({
    where: { id: companyId },
    select: { plan: true, maxEmployees: true, active: true, planStatus: true },
  })

  if (!company) {
    return {
      allowed: false,
      error: NextResponse.json({ error: 'Empresa no encontrada' }, { status: 404 }),
      currentCount: 0,
      limit: 0,
    }
  }

  // Check if company is active
  if (company.active === false) {
    return {
      allowed: false,
      error: NextResponse.json({ error: 'Tu cuenta ha sido suspendida' }, { status: 403 }),
      currentCount: 0,
      limit: company.maxEmployees,
    }
  }

  if (company.planStatus === 'suspended') {
    return {
      allowed: false,
      error: NextResponse.json({ error: 'Tu plan ha sido suspendido' }, { status: 403 }),
      currentCount: 0,
      limit: company.maxEmployees,
    }
  }

  const planConfig = PLANS[company.plan as PlanType] || PLANS.free
  const limit = company.maxEmployees || planConfig.maxEmployees

  let currentCount = 0
  
  if (resource === 'employees') {
    currentCount = await db.employee.count({ where: { companyId, active: true } })
  } else if (resource === 'branches') {
    currentCount = await db.branch.count({ where: { companyId, active: true } })
  } else if (resource === 'departments') {
    currentCount = await db.department.count({ where: { companyId, active: true } })
  }

  if (currentCount >= limit) {
    return {
      allowed: false,
      error: NextResponse.json({
        error: `Límite de ${resource} alcanzado (${currentCount}/${limit}). Upgrade tu plan para más.`,
        limit,
        currentCount,
        upgradeTo: company.plan === 'free' ? 'professional' : 'enterprise',
      }, { status: 403 }),
      currentCount,
      limit,
    }
  }

  return { allowed: true, currentCount, limit }
}
