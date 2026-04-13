import { useEffect } from 'react'

/**
 * Hook para auto-refresh de datos cada X segundos
 * @param fetchFn - función que obtiene los datos
 * @param intervalMs - intervalo en ms (default 10 segundos)
 * @param enabled - si está habilitado (default true)
 */
export function useAutoRefresh(
  fetchFn: () => Promise<void>,
  intervalMs: number = 10000,
  enabled: boolean = true
) {
  useEffect(() => {
    if (!enabled) return

    // Ejecutar inmediatamente
    fetchFn()

    // Luego ejecutar cada intervalMs
    const interval = setInterval(fetchFn, intervalMs)

    return () => clearInterval(interval)
  }, [fetchFn, intervalMs, enabled])
}