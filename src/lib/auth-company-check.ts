import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function checkCompanyActive(companyId: string): Promise<{ valid: boolean; error?: NextResponse }> {
  const company = await db.company.findUnique({
    where: { id: companyId },
    select: { active: true, planStatus: true, plan: true, maxEmployees: true },
  })

  if (!company) {
    return { valid: false, error: NextResponse.json({ error: 'Empresa no encontrada' }, { status: 404 }) }
  }

  if (company.active === false) {
    return { valid: false, error: NextResponse.json({ error: 'Tu cuenta ha sido suspendida. Contacta al administrador.' }, { status: 403 }) }
  }

  if (company.planStatus === 'suspended') {
    return { valid: false, error: NextResponse.json({ error: 'Tu plan ha sido suspendido. Contacta al administrador.' }, { status: 403 }) }
  }

  return { valid: true }
}
