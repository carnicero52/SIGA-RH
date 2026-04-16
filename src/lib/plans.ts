// Plan configuration for SIGA-RH

export type PlanType = 'free' | 'professional' | 'enterprise'

export interface PlanConfig {
  name: string
  price: number // USD per month
  maxEmployees: number
  maxBranches: number
  maxDepartments: number
  allowGps: boolean
  allowSelfie: boolean
  allowPayroll: boolean
  allowVacancies: boolean
  allowApi: boolean
  allowMultipleBranches: boolean
  allowReports: boolean
  allowTelegram: boolean
  prioritySupport: boolean
  slaGuaranteed: boolean
  branding: boolean
}

export const PLANS: Record<PlanType, PlanConfig> = {
  free: {
    name: 'Gratuito',
    price: 0,
    maxEmployees: 10,
    maxBranches: 1,
    maxDepartments: 1,
    allowGps: false,
    allowSelfie: false,
    allowPayroll: true,
    allowVacancies: false,
    allowApi: false,
    allowMultipleBranches: false,
    allowReports: true,
    allowTelegram: true,
    prioritySupport: false,
    slaGuaranteed: false,
    branding: false,
  },
  professional: {
    name: 'Profesional',
    price: 29,
    maxEmployees: 100,
    maxBranches: Infinity,
    maxDepartments: 10,
    allowGps: true,
    allowSelfie: true,
    allowPayroll: true,
    allowVacancies: true,
    allowApi: false,
    allowMultipleBranches: true,
    allowReports: true,
    allowTelegram: true,
    prioritySupport: true,
    slaGuaranteed: false,
    branding: false,
  },
  enterprise: {
    name: 'Empresarial',
    price: 79,
    maxEmployees: Infinity,
    maxBranches: Infinity,
    maxDepartments: Infinity,
    allowGps: true,
    allowSelfie: true,
    allowPayroll: true,
    allowVacancies: true,
    allowApi: true,
    allowMultipleBranches: true,
    allowReports: true,
    allowTelegram: true,
    prioritySupport: true,
    slaGuaranteed: true,
    branding: true,
  },
}

export function getPlanConfig(plan: PlanType): PlanConfig {
  return PLANS[plan] || PLANS.free
}

export function canUseFeature(plan: PlanType, feature: keyof PlanConfig): boolean {
  const config = getPlanConfig(plan)
  return Boolean(config[feature])
}
