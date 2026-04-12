import { useState, useEffect } from 'react'
import { getCountryConfig, type CountryConfig } from '@/lib/country-fields'

let cachedCountry: string | null = null

export function useCompanyCountry(): { country: string; config: CountryConfig } {
  const [country, setCountry] = useState<string>(cachedCountry || 'Venezuela')

  useEffect(() => {
    if (cachedCountry) return
    const token = typeof window !== 'undefined' ? localStorage.getItem('siga_token') : null
    fetch('/api/company', {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
      .then((r) => r.json())
      .then((data) => {
        const c = data?.country || 'Venezuela'
        cachedCountry = c
        setCountry(c)
      })
      .catch(() => {})
  }, [])

  return { country, config: getCountryConfig(country) }
}
