import { useEffect, useRef } from 'react'

/**
 * Hook para auto-refresh de datos cada X segundos
 * Solo actualiza datos en背景, sin afectar UI loading state
 */
export function useAutoRefresh(
  fetchFn: () => Promise<void>,
  intervalMs: number = 30000,
  enabled: boolean = true
) {
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    if (!enabled) return

    // Limpiar intervalo anterior
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
    }

    // Configurar nuevo intervalo - NO llama fetchFn al inicio
    intervalRef.current = setInterval(fetchFn, intervalMs)

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [fetchFn, intervalMs, enabled])
}