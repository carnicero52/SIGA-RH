import { useState, useEffect } from 'react'
import { getCountryConfig, type CountryConfig } from '@/lib/country-fields'

interface CompanyInfo {
  country: string
  timezone: string
}

let cachedInfo: CompanyInfo | null = null

export function clearCountryCache() {
  cachedInfo = null
}

export function useCompanyCountry(): { country: string; timezone: string; config: CountryConfig } {
  const [info, setInfo] = useState<CompanyInfo>(cachedInfo || { country: 'Venezuela', timezone: 'America/Caracas' })

  useEffect(() => {
    if (cachedInfo) return
    const token = typeof window !== 'undefined' ? localStorage.getItem('siga_token') : null
    fetch('/api/company', {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
      .then((r) => r.json())
      .then((data) => {
        const country = data?.country || 'Venezuela'
        const config = getCountryConfig(country)
        const timezone = data?.timezone || config.timezone
        cachedInfo = { country, timezone }
        setInfo({ country, timezone })
      })
      .catch(() => {})
  }, [])

  return { country: info.country, timezone: info.timezone, config: getCountryConfig(info.country) }
}
