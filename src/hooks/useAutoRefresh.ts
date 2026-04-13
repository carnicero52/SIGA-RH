import { useEffect, useRef } from 'react'

/**
 * Hook para auto-refresh de datos cada X segundos
 * No muestra indicador de carga para evitar parpadeo
 * @param fetchFn - función que obtiene los datos
 * @param intervalMs - intervalo en ms (default 15 segundos)
 * @param enabled - si está habilitado (default true)
 */
export function useAutoRefresh(
  fetchFn: () => Promise<void>,
  intervalMs: number = 15000,
  enabled: boolean = true
) {
  const isFirstRun = useRef(true)

  useEffect(() => {
    if (!enabled) return

    // Skip on first run - let the initial useEffect handle that
    if (isFirstRun.current) {
      isFirstRun.current = false
      return
    }

    // Auto-refresh without loading indicator
    fetchFn()

    const interval = setInterval(fetchFn, intervalMs)

    return () => clearInterval(interval)
  }, [fetchFn, intervalMs, enabled])
}