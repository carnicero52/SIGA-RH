'use client'

import { useEffect, useState, useCallback, useMemo } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { QrCode, Monitor, Clock, RefreshCw, Maximize, Minimize, MapPin } from 'lucide-react'
import { QRCodeSVG } from 'qrcode.react'
import { toast } from 'sonner'
import { useAppStore } from '@/store/app-store'
import type { Branch } from '@/lib/types'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function authHeaders() {
  return { Authorization: `Bearer ${localStorage.getItem('siga_token')}` }
}

const SPANISH_DAYS = [
  'Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado',
]
const SPANISH_MONTHS = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
]

/** Format a Date as "Sábado, 5 de abril de 2026" */
function formatSpanishDate(date: Date): string {
  const dayName = SPANISH_DAYS[date.getDay()]
  const day = date.getDate()
  const month = SPANISH_MONTHS[date.getMonth()]
  const year = date.getFullYear()
  return `${dayName}, ${day} de ${month} de ${year}`
}

/** Format a Date as HH:mm:ss in America/Caracas */
function formatTimeCaracas(date: Date): string {
  return date.toLocaleTimeString('es-VE', {
    timeZone: 'America/Caracas',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  })
}

/** Calculate ms remaining until `expiresAt`. Returns 0 if already expired. */
function timeRemainingMs(expiresAt: string): number {
  const remaining = new Date(expiresAt).getTime() - Date.now()
  return Math.max(0, remaining)
}

/** Format milliseconds to "HH:mm:ss" countdown */
function formatCountdown(ms: number): string {
  if (ms <= 0) return '00:00:00'
  const totalSeconds = Math.floor(ms / 1000)
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60
  return [
    hours.toString().padStart(2, '0'),
    minutes.toString().padStart(2, '0'),
    seconds.toString().padStart(2, '0'),
  ].join(':')
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function QRDisplayView() {
  const companyName = useAppStore((s) => s.companyName) || 'SIGA-RH'

  // State
  const [branches, setBranches] = useState<Branch[]>([])
  const [selectedBranch, setSelectedBranch] = useState('')
  const [currentQR, setCurrentQR] = useState<{
    id: string
    code: string
    expiresAt: string
    branch?: { name: string }
  } | null>(null)
  const [loading, setLoading] = useState(false)
  const [currentTime, setCurrentTime] = useState(new Date())
  const [isFullscreen, setIsFullscreen] = useState(false)

  // -------------------------------------------------------------------------
  // Clock – update every second
  // -------------------------------------------------------------------------
  useEffect(() => {
    const interval = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(interval)
  }, [])

  // -------------------------------------------------------------------------
  // Fullscreen listener
  // -------------------------------------------------------------------------
  useEffect(() => {
    const handleChange = () => {
      setIsFullscreen(!!document.fullscreenElement)
    }
    document.addEventListener('fullscreenchange', handleChange)
    return () => document.removeEventListener('fullscreenchange', handleChange)
  }, [])

  const toggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen()
      } else {
        await document.exitFullscreen()
      }
    } catch {
      toast.error('No se pudo cambiar el modo de pantalla completa')
    }
  }

  // -------------------------------------------------------------------------
  // Fetch branches
  // -------------------------------------------------------------------------
  const fetchBranches = useCallback(async () => {
    try {
      const res = await fetch('/api/branches', { headers: authHeaders() })
      if (!res.ok) throw new Error('Error al cargar sucursales')
      const data = await res.json()
      setBranches(Array.isArray(data) ? data : [])
      // Auto-select first branch if only one
      if (Array.isArray(data) && data.length === 1) {
        setSelectedBranch(data[0].id)
      }
    } catch (error: any) {
      toast.error(error.message || 'Error al cargar sucursales')
    }
  }, [])

  useEffect(() => {
    fetchBranches()
  }, [fetchBranches])

  // -------------------------------------------------------------------------
  // Fetch active QR for selected branch
  // -------------------------------------------------------------------------
  const fetchActiveQR = useCallback(async (branchId: string) => {
    try {
      const res = await fetch(
        `/api/attendance/qrcodes?branchId=${branchId}`,
        { headers: authHeaders() },
      )
      if (!res.ok) return
      const data = await res.json()
      if (Array.isArray(data) && data.length > 0) {
        setCurrentQR(data[0])
      } else {
        setCurrentQR(null)
      }
    } catch {
      // Silently fail
    }
  }, [])

  useEffect(() => {
    if (selectedBranch) {
      fetchActiveQR(selectedBranch)
    } else {
      setCurrentQR(null)
    }
  }, [selectedBranch, fetchActiveQR])

  // -------------------------------------------------------------------------
  // Auto-generate new QR when current one expires
  // -------------------------------------------------------------------------
  useEffect(() => {
    if (!currentQR || !selectedBranch) return

    const ms = timeRemainingMs(currentQR.expiresAt)
    if (ms <= 0) {
      generateQR()
      return
    }

    const timeout = setTimeout(() => {
      generateQR()
    }, ms + 1000) // +1s buffer

    return () => clearTimeout(timeout)
  }, [currentQR?.expiresAt, selectedBranch])

  // -------------------------------------------------------------------------
  // Generate new QR
  // -------------------------------------------------------------------------
  const generateQR = useCallback(async () => {
    if (!selectedBranch) {
      toast.error('Selecciona una sucursal primero')
      return
    }
    try {
      setLoading(true)
      const res = await fetch('/api/attendance/qrcodes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify({ branchId: selectedBranch }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Error al generar QR')
      }
      const data = await res.json()
      setCurrentQR(data)
      toast.success('Código QR generado exitosamente')
    } catch (error: any) {
      toast.error(error.message || 'Error al generar el código QR')
    } finally {
      setLoading(false)
    }
  }, [selectedBranch])

  // -------------------------------------------------------------------------
  // Derived values
  // -------------------------------------------------------------------------
  const selectedBranchName = useMemo(
    () => branches.find((b) => b.id === selectedBranch)?.name || '',
    [branches, selectedBranch],
  )

  const qrExpired = useMemo(
    () => (currentQR ? timeRemainingMs(currentQR.expiresAt) <= 0 : true),
    [currentQR, currentTime],
  )

  const countdown = useMemo(
    () => (currentQR && !qrExpired ? formatCountdown(timeRemainingMs(currentQR.expiresAt)) : '00:00:00'),
    [currentQR, currentTime, qrExpired],
  )

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------
  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-emerald-50 to-white dark:from-gray-950 dark:to-gray-900">
      {/* ── Header Bar ─────────────────────────────────────────────────── */}
      <header className="flex items-center justify-between border-b border-emerald-200 dark:border-emerald-900 bg-white/80 dark:bg-gray-950/80 backdrop-blur-sm px-4 py-2.5 sm:px-6">
        <div className="flex items-center gap-2">
          <Monitor className="h-5 w-5 text-emerald-600" />
          <span className="text-lg font-bold tracking-tight text-emerald-700 dark:text-emerald-400">
            {companyName}
          </span>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-1.5 text-sm text-muted-foreground">
            <Clock className="h-4 w-4" />
            <span className="tabular-nums font-mono text-base font-semibold">
              {formatTimeCaracas(currentTime)}
            </span>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={toggleFullscreen}
            className="h-8 gap-1.5 text-xs border-emerald-300 hover:bg-emerald-50 dark:border-emerald-800 dark:hover:bg-emerald-950"
          >
            <span className="hidden sm:inline">Pantalla Completa</span>
            {isFullscreen ? (
              <Minimize className="h-3.5 w-3.5" />
            ) : (
              <Maximize className="h-3.5 w-3.5" />
            )}
          </Button>
        </div>
      </header>

      {/* ── Branch Selector Toolbar ────────────────────────────────────── */}
      <div className="flex flex-col gap-3 border-b border-emerald-100 dark:border-emerald-900/50 bg-white/60 dark:bg-gray-950/40 backdrop-blur-sm px-4 py-3 sm:px-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3 flex-1 max-w-md">
          <Select value={selectedBranch} onValueChange={setSelectedBranch}>
            <SelectTrigger className="w-full">
              <MapPin className="mr-2 h-4 w-4 text-muted-foreground" />
              <SelectValue placeholder="Seleccionar sucursal..." />
            </SelectTrigger>
            <SelectContent>
              {branches.map((branch) => (
                <SelectItem key={branch.id} value={branch.id}>
                  {branch.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-4">
          {currentQR && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>QR expira en:</span>
              <span className={qrExpired
                ? 'font-mono font-semibold text-red-600 dark:text-red-400'
                : 'font-mono font-semibold text-emerald-600 dark:text-emerald-400'
              }>
                {countdown}
              </span>
            </div>
          )}
          <Button
            onClick={generateQR}
            disabled={!selectedBranch || loading}
            className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5"
          >
            {loading ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <QrCode className="h-4 w-4" />
            )}
            Generar QR
          </Button>
        </div>
      </div>

      {/* ── Main QR Display Area ───────────────────────────────────────── */}
      <main className="flex flex-1 items-center justify-center px-4 py-8 sm:py-12">
        {!selectedBranch ? (
          /* No branch selected */
          <Card className="w-full max-w-lg">
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
              <MapPin className="h-16 w-16 text-muted-foreground/30 mb-4" />
              <p className="text-lg font-semibold text-muted-foreground">
                Selecciona una sucursal
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                Elige una sucursal para mostrar el código QR de asistencia
              </p>
            </CardContent>
          </Card>
        ) : !currentQR ? (
          /* No active QR */
          <Card className="w-full max-w-lg">
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
              <QrCode className="h-16 w-16 text-muted-foreground/30 mb-4" />
              <p className="text-lg font-semibold text-muted-foreground">
                No hay QR activo
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                No hay QR activo. Genera uno nuevo.
              </p>
              <Button
                onClick={generateQR}
                disabled={loading}
                className="mt-6 bg-emerald-600 hover:bg-emerald-700 text-white gap-2"
              >
                {loading ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  <QrCode className="h-4 w-4" />
                )}
                Generar QR
              </Button>
            </CardContent>
          </Card>
        ) : (
          /* QR Code Display */
          <div className="flex flex-col items-center gap-6 text-center">
            {/* Status badge */}
            <div className="flex items-center gap-2">
              <Badge
                variant="outline"
                className={
                  qrExpired
                    ? 'border-red-300 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-400 gap-1.5 px-3 py-1'
                    : 'border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-400 gap-1.5 px-3 py-1'
                }
              >
                <span
                  className={`inline-block h-2 w-2 rounded-full ${qrExpired ? 'bg-red-500' : 'bg-emerald-500 animate-pulse'}`}
                />
                {qrExpired ? 'QR Expirado' : 'QR Activo'}
              </Badge>
            </div>

            {/* QR Code Card */}
            <Card className="relative overflow-hidden border-2 border-emerald-200 dark:border-emerald-800 shadow-lg shadow-emerald-100 dark:shadow-emerald-950/30">
              <div className="absolute top-0 left-0 h-1 w-full bg-emerald-500" />
              <CardContent className="flex flex-col items-center gap-6 p-6 sm:p-10">
                <QRCodeSVG
                  value={currentQR.code}
                  size={typeof window !== 'undefined' && window.innerWidth < 640 ? 280 : 400}
                  bgColor="transparent"
                  fgColor="#059669"
                  level="H"
                  includeMargin={false}
                />

                {/* Branch name */}
                <h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                  {selectedBranchName}
                </h2>

                {/* Instruction */}
                <p className="text-base text-muted-foreground sm:text-lg">
                  Escanea para marcar asistencia
                </p>

                {/* Date */}
                <p className="text-sm text-muted-foreground/70">
                  {formatSpanishDate(currentTime)}
                </p>
              </CardContent>
            </Card>

            {/* Mobile-only clock */}
            <div className="flex sm:hidden items-center gap-1.5 text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span className="tabular-nums font-mono text-lg font-semibold">
                {formatTimeCaracas(currentTime)}
              </span>
            </div>
          </div>
        )}
      </main>

      {/* ── Bottom Info Bar ─────────────────────────────────────────────── */}
      <footer className="sticky bottom-0 flex items-center justify-between border-t border-emerald-200 dark:border-emerald-900 bg-white/80 dark:bg-gray-950/80 backdrop-blur-sm px-4 py-2 sm:px-6 text-xs text-muted-foreground">
        <div className="flex items-center gap-1.5">
          <MapPin className="h-3.5 w-3.5" />
          <span>Sucursal: {selectedBranchName || '—'}</span>
        </div>

        <div className="flex items-center gap-1.5">
          <span
            className={`inline-block h-2 w-2 rounded-full ${
              qrExpired
                ? 'bg-red-500'
                : 'bg-emerald-500 animate-pulse'
            }`}
          />
          <span>{qrExpired ? 'QR Expirado' : 'QR Activo'}</span>
        </div>

        <div className="font-medium">
          SIGA-RH &copy; {currentTime.getFullYear()}
        </div>
      </footer>
    </div>
  )
}
