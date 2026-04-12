/**
 * Currencies and hierarchy levels for positions.
 */

export interface Currency {
  code: string
  name: string
  symbol: string
  locale: string
}

export const CURRENCIES: Currency[] = [
  { code: 'USD', name: 'Dólar Estadounidense', symbol: '$',  locale: 'en-US' },
  { code: 'VES', name: 'Bolívar Venezolano',   symbol: 'Bs.', locale: 'es-VE' },
  { code: 'MXN', name: 'Peso Mexicano',         symbol: '$',  locale: 'es-MX' },
  { code: 'COP', name: 'Peso Colombiano',       symbol: '$',  locale: 'es-CO' },
  { code: 'PEN', name: 'Sol Peruano',           symbol: 'S/', locale: 'es-PE' },
  { code: 'CLP', name: 'Peso Chileno',          symbol: '$',  locale: 'es-CL' },
  { code: 'ARS', name: 'Peso Argentino',        symbol: '$',  locale: 'es-AR' },
  { code: 'BOB', name: 'Boliviano',             symbol: 'Bs.', locale: 'es-BO' },
  { code: 'DOP', name: 'Peso Dominicano',       symbol: 'RD$', locale: 'es-DO' },
  { code: 'PYG', name: 'Guaraní Paraguayo',     symbol: '₲',  locale: 'es-PY' },
  { code: 'UYU', name: 'Peso Uruguayo',         symbol: '$U', locale: 'es-UY' },
  { code: 'GTQ', name: 'Quetzal Guatemalteco',  symbol: 'Q',  locale: 'es-GT' },
  { code: 'PAB', name: 'Balboa Panameño',       symbol: 'B/', locale: 'es-PA' },
  { code: 'CRC', name: 'Colón Costarricense',   symbol: '₡',  locale: 'es-CR' },
  { code: 'EUR', name: 'Euro',                  symbol: '€',  locale: 'es-ES' },
  { code: 'GBP', name: 'Libra Esterlina',       symbol: '£',  locale: 'en-GB' },
]

export function formatCurrency(amount: number | null | undefined, currency = 'USD'): string {
  if (amount == null) return '-'
  const c = CURRENCIES.find((x) => x.code === currency)
  try {
    return new Intl.NumberFormat(c?.locale || 'en-US', {
      style: 'currency',
      currency,
      maximumFractionDigits: 2,
    }).format(amount)
  } catch {
    return `${c?.symbol || currency} ${amount.toLocaleString()}`
  }
}

export const POSITION_LEVELS = [
  { value: 'intern',     label: 'Pasante / Interno' },
  { value: 'junior',     label: 'Junior' },
  { value: 'mid',        label: 'Medio / Semi-Senior' },
  { value: 'senior',     label: 'Senior' },
  { value: 'lead',       label: 'Lead / Líder Técnico' },
  { value: 'supervisor', label: 'Supervisor' },
  { value: 'coordinator',label: 'Coordinador' },
  { value: 'manager',    label: 'Gerente / Manager' },
  { value: 'director',   label: 'Director' },
  { value: 'vp',         label: 'Vicepresidente' },
  { value: 'executive',  label: 'Ejecutivo / C-Level' },
]
