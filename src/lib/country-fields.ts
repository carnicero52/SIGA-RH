/**
 * Country-specific legal identification fields for employee forms.
 * Each country defines up to 3 ID fields and a social security field.
 */

export interface CountryField {
  key: string          // maps to Employee model field (id1, id2, id3, ss)
  label: string        // display name
  placeholder: string  // example value
  maxLength?: number
  hint?: string        // short description
}

export interface CountryConfig {
  name: string
  flag: string
  fields: {
    id1?: CountryField   // Primary national ID (maps to curp)
    id2?: CountryField   // Secondary tax ID (maps to rfc)
    ss?: CountryField    // Social security / labor registry (maps to nss)
  }
}

export const COUNTRY_CONFIGS: Record<string, CountryConfig> = {
  // ── LATAM ──────────────────────────────────────────────────────────────────
  México: {
    name: 'México',
    flag: '🇲🇽',
    fields: {
      id1: { key: 'curp', label: 'CURP', placeholder: 'ABCD123456HDFXXX00', maxLength: 18, hint: 'Clave Única de Registro de Población' },
      id2: { key: 'rfc',  label: 'RFC',  placeholder: 'ABCD123456XXX',       maxLength: 13, hint: 'Registro Federal de Contribuyentes' },
      ss:  { key: 'nss',  label: 'NSS',  placeholder: '12345678901',          maxLength: 11, hint: 'Número de Seguridad Social (IMSS)' },
    },
  },
  Venezuela: {
    name: 'Venezuela',
    flag: '🇻🇪',
    fields: {
      id1: { key: 'curp', label: 'Cédula de Identidad', placeholder: 'V-12345678',  maxLength: 12, hint: 'Cédula de identidad venezolana (V- o E-)' },
      id2: { key: 'rfc',  label: 'RIF',                 placeholder: 'V-12345678-9', maxLength: 14, hint: 'Registro de Información Fiscal' },
      ss:  { key: 'nss',  label: 'Número IVSS',         placeholder: '123456789',    maxLength: 10, hint: 'Instituto Venezolano de los Seguros Sociales' },
    },
  },
  Colombia: {
    name: 'Colombia',
    flag: '🇨🇴',
    fields: {
      id1: { key: 'curp', label: 'Cédula de Ciudadanía', placeholder: '1234567890',    maxLength: 11, hint: 'Cédula de Ciudadanía o Extranjería' },
      id2: { key: 'rfc',  label: 'NIT',                  placeholder: '900.123.456-7', maxLength: 15, hint: 'Número de Identificación Tributaria' },
      ss:  { key: 'nss',  label: 'No. Afiliación EPS',   placeholder: '12345678',      maxLength: 12, hint: 'Número de afiliación a la seguridad social' },
    },
  },
  Perú: {
    name: 'Perú',
    flag: '🇵🇪',
    fields: {
      id1: { key: 'curp', label: 'DNI',                  placeholder: '12345678',      maxLength: 9,  hint: 'Documento Nacional de Identidad' },
      id2: { key: 'rfc',  label: 'RUC',                  placeholder: '10123456789',   maxLength: 11, hint: 'Registro Único de Contribuyentes' },
      ss:  { key: 'nss',  label: 'No. ESSALUD',          placeholder: '0123456789',    maxLength: 10, hint: 'Número de asegurado ESSALUD' },
    },
  },
  Ecuador: {
    name: 'Ecuador',
    flag: '🇪🇨',
    fields: {
      id1: { key: 'curp', label: 'Cédula de Identidad', placeholder: '0123456789',   maxLength: 10, hint: 'Cédula de identidad ecuatoriana' },
      id2: { key: 'rfc',  label: 'RUC',                 placeholder: '0123456789001', maxLength: 13, hint: 'Registro Único de Contribuyentes' },
      ss:  { key: 'nss',  label: 'No. IESS',            placeholder: '1234567890',    maxLength: 10, hint: 'Instituto Ecuatoriano de Seguridad Social' },
    },
  },
  Argentina: {
    name: 'Argentina',
    flag: '🇦🇷',
    fields: {
      id1: { key: 'curp', label: 'DNI',   placeholder: '12.345.678',      maxLength: 11, hint: 'Documento Nacional de Identidad' },
      id2: { key: 'rfc',  label: 'CUIT',  placeholder: '20-12345678-9',   maxLength: 14, hint: 'Clave Única de Identificación Tributaria' },
      ss:  { key: 'nss',  label: 'CUIL',  placeholder: '20-12345678-9',   maxLength: 14, hint: 'Código Único de Identificación Laboral' },
    },
  },
  Chile: {
    name: 'Chile',
    flag: '🇨🇱',
    fields: {
      id1: { key: 'curp', label: 'RUT',   placeholder: '12.345.678-9',    maxLength: 12, hint: 'Rol Único Tributario / Cédula de Identidad' },
      ss:  { key: 'nss',  label: 'AFP',   placeholder: '12345678',         maxLength: 10, hint: 'Número de afiliación AFP' },
    },
  },
  Bolivia: {
    name: 'Bolivia',
    flag: '🇧🇴',
    fields: {
      id1: { key: 'curp', label: 'Cédula de Identidad', placeholder: '1234567 LP',  maxLength: 12, hint: 'CI con extensión departamental' },
      id2: { key: 'rfc',  label: 'NIT',                 placeholder: '1234567890',  maxLength: 10, hint: 'Número de Identificación Tributaria' },
      ss:  { key: 'nss',  label: 'No. CNS/AFP',         placeholder: '12345678',    maxLength: 10, hint: 'Caja Nacional de Salud / AFP' },
    },
  },
  'República Dominicana': {
    name: 'República Dominicana',
    flag: '🇩🇴',
    fields: {
      id1: { key: 'curp', label: 'Cédula',  placeholder: '001-1234567-8',  maxLength: 13, hint: 'Cédula de Identidad y Electoral' },
      id2: { key: 'rfc',  label: 'RNC',     placeholder: '1-01-12345-6',   maxLength: 12, hint: 'Registro Nacional del Contribuyente' },
      ss:  { key: 'nss',  label: 'No. NSS', placeholder: '123456789',      maxLength: 11, hint: 'Número de Seguridad Social (TSS)' },
    },
  },
  Panamá: {
    name: 'Panamá',
    flag: '🇵🇦',
    fields: {
      id1: { key: 'curp', label: 'Cédula',     placeholder: '8-123-45678',  maxLength: 12, hint: 'Cédula de Identidad Personal' },
      id2: { key: 'rfc',  label: 'RUC',         placeholder: '8-123-45678', maxLength: 12, hint: 'Registro Único de Contribuyentes' },
      ss:  { key: 'nss',  label: 'No. CSS',     placeholder: '12345678',    maxLength: 10, hint: 'Caja de Seguro Social' },
    },
  },
  Guatemala: {
    name: 'Guatemala',
    flag: '🇬🇹',
    fields: {
      id1: { key: 'curp', label: 'DPI',   placeholder: '1234 12345 0101', maxLength: 14, hint: 'Documento Personal de Identificación' },
      id2: { key: 'rfc',  label: 'NIT',   placeholder: '12345678-9',      maxLength: 11, hint: 'Número de Identificación Tributaria' },
      ss:  { key: 'nss',  label: 'No. IGSS', placeholder: '12345678',     maxLength: 10, hint: 'Instituto Guatemalteco de Seguridad Social' },
    },
  },
  'Costa Rica': {
    name: 'Costa Rica',
    flag: '🇨🇷',
    fields: {
      id1: { key: 'curp', label: 'Cédula',  placeholder: '1-1234-5678',   maxLength: 12, hint: 'Cédula de Identidad' },
      id2: { key: 'rfc',  label: 'No. Patronal', placeholder: '0-000-123456', maxLength: 13, hint: 'Número patronal CCSS' },
      ss:  { key: 'nss',  label: 'No. CCSS', placeholder: '0-000-123456', maxLength: 13, hint: 'Caja Costarricense de Seguro Social' },
    },
  },
  // ── OTHER ─────────────────────────────────────────────────────────────────
  España: {
    name: 'España',
    flag: '🇪🇸',
    fields: {
      id1: { key: 'curp', label: 'DNI / NIE', placeholder: '12345678A',    maxLength: 10, hint: 'Documento Nacional de Identidad o NIE' },
      id2: { key: 'rfc',  label: 'NIF',       placeholder: '12345678A',    maxLength: 10, hint: 'Número de Identificación Fiscal' },
      ss:  { key: 'nss',  label: 'No. SS',    placeholder: '12/1234567890', maxLength: 13, hint: 'Número de Seguridad Social' },
    },
  },
  'Estados Unidos': {
    name: 'Estados Unidos',
    flag: '🇺🇸',
    fields: {
      id2: { key: 'rfc',  label: 'EIN / Tax ID', placeholder: '12-3456789', maxLength: 12, hint: 'Employer Identification Number' },
      ss:  { key: 'nss',  label: 'SSN',          placeholder: '123-45-6789', maxLength: 11, hint: 'Social Security Number (last 4 recommended)' },
    },
  },
  Otro: {
    name: 'Otro',
    flag: '🌎',
    fields: {
      id1: { key: 'curp', label: 'Documento de Identidad', placeholder: 'ID Nacional', maxLength: 20 },
      id2: { key: 'rfc',  label: 'ID Tributario',          placeholder: 'Tax ID',      maxLength: 20 },
      ss:  { key: 'nss',  label: 'No. Seguridad Social',   placeholder: 'SS Number',   maxLength: 20 },
    },
  },
}

export const COUNTRY_LIST = Object.keys(COUNTRY_CONFIGS)

export function getCountryConfig(country: string): CountryConfig {
  return COUNTRY_CONFIGS[country] || COUNTRY_CONFIGS['Otro']
}
