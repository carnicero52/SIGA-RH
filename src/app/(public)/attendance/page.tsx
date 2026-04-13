'use client'

import { useEffect, useState, useCallback, Suspense, useRef } from 'react'
import { useSearchParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  Camera, MapPin, Clock, CheckCircle2, XCircle,
  RefreshCw, User, Smartphone, AlertTriangle,
} from 'lucide-react'
import { cn } from '@/lib/utils'

// ── Types ──────────────────────────────────────────────────────────────────────

interface VerifyResult {
  valid: boolean
  branchId?: string
  branchName?: string
  companyId?: string
  companyName?: string
  companyLogo?: string
  qrCodeId?: string
  error?: string
}

interface EmployeeOption {
  id: string
  firstName: string
  lastName: string
  employeeNumber?: string | null
}

interface GpsData {
  latitude: number
  longitude: number
  accuracy: number
}

type Step = 'loading' | 'error' | 'select' | 'record' | 'gps' | 'success'

// ── Helpers ────────────────────────────────────────────────────────────────────

function formatDateES(): string {
  const now = new Date()
  const days = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']
  const months = [
    'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
    'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
  ]
  return `${days[now.getDay()]}, ${now.getDate()} de ${months[now.getMonth()]} de ${now.getFullYear()}`
}

// ── Inner Component (needs useSearchParams) ────────────────────────────────────

function PublicCheckInContent() {
  const searchParams = useSearchParams()
  const qrcodeParam = searchParams.get('qrcode') || ''

  // Step state machine
  const [step, setStep] = useState<Step>('loading')
  const [error, setError] = useState('')

  // QR verify data
  const [verifyData, setVerifyData] = useState<VerifyResult | null>(null)

  // Employees
  const [employees, setEmployees] = useState<EmployeeOption[]>([])
  const [selectedEmployeeId, setSelectedEmployeeId] = useState('')
  const [loadingEmployees, setLoadingEmployees] = useState(false)

  // Record type
  const [recordType, setRecordType] = useState<'check_in' | 'check_out'>('check_in')

  // GPS
  const [gpsData, setGpsData] = useState<GpsData | null>(null)
  const [gpsError, setGpsError] = useState('')

  // Submit
  const [submitting, setSubmitting] = useState(false)
  const [successData, setSuccessData] = useState<{
    time: string
    branchName: string
    recordType: string
    status: string
  } | null>(null)

  // Refs
  const selfieVideoRef = useRef<HTMLVideoElement | null>(null)
  const selfieCanvasRef = useRef<HTMLCanvasElement | null>(null)
  const selfieStreamRef = useRef<MediaStream | null>(null)
  const [selfieData, setSelfieData] = useState<string>('')
  const [showSelfie, setShowSelfie] = useState(false)

  // ── Verify QR Code on mount ─────────────────────────────────────────────────

  useEffect(() => {
    if (!qrcodeParam) {
      setStep('error')
      setError('No se proporcionó código QR en la URL')
      return
    }

    async function verify() {
      try {
        const res = await fetch(`/api/public/checkin/verify?qrcode=${encodeURIComponent(qrcodeParam)}`)
        const data: VerifyResult = await res.json()

        if (!data.valid) {
          setStep('error')
          setError(data.error || 'Código QR inválido')
          return
        }

        setVerifyData(data)
        setStep('select')

        // Fetch employees
        if (data.companyId) {
          setLoadingEmployees(true)
          const empRes = await fetch(`/api/public/checkin/employees?branchId=${data.branchId}`)
          if (empRes.ok) {
            const empData = await empRes.json()
            setEmployees(empData.employees || [])
          }
          setLoadingEmployees(false)
        }
      } catch {
        setStep('error')
        setError('Error de conexión. Verifica tu conexión a internet.')
      }
    }

    verify()
  }, [qrcodeParam])

  // ── Cleanup selfie stream on unmount ────────────────────────────────────────

  useEffect(() => {
    return () => {
      if (selfieStreamRef.current) {
        selfieStreamRef.current.getTracks().forEach((t) => t.stop())
      }
    }
  }, [])

  // ── Selfie Camera ───────────────────────────────────────────────────────────

  const startSelfieCamera = async () => {
    setShowSelfie(true)
    setSelfieData('')
    try {
      await new Promise((r) => setTimeout(r, 200))
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: 640, height: 480 },
      })
      selfieStreamRef.current = stream
      if (selfieVideoRef.current) {
        selfieVideoRef.current.srcObject = stream
        await selfieVideoRef.current.play()
      }
    } catch {
      setShowSelfie(false)
    }
  }

  const captureSelfie = () => {
    const video = selfieVideoRef.current
    const canvas = selfieCanvasRef.current
    if (!video || !canvas) return

    canvas.width = video.videoWidth || 640
    canvas.height = video.videoHeight || 480
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    ctx.translate(canvas.width, 0)
    ctx.scale(-1, 1)
    ctx.drawImage(video, 0, 0)
    ctx.setTransform(1, 0, 0, 1, 0, 0)

    const dataUrl = canvas.toDataURL('image/jpeg', 0.8)
    setSelfieData(dataUrl)

    if (selfieStreamRef.current) {
      selfieStreamRef.current.getTracks().forEach((t) => t.stop())
      selfieStreamRef.current = null
    }
  }

  const retakeSelfie = async () => {
    setSelfieData('')
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: 640, height: 480 },
      })
      selfieStreamRef.current = stream
      if (selfieVideoRef.current) {
        selfieVideoRef.current.srcObject = stream
        await selfieVideoRef.current.play()
      }
    } catch {
      // ignore
    }
  }

  const stopSelfieStream = () => {
    if (selfieStreamRef.current) {
      selfieStreamRef.current.getTracks().forEach((t) => t.stop())
      selfieStreamRef.current = null
    }
    setShowSelfie(false)
  }

  // ── GPS Capture ─────────────────────────────────────────────────────────────

  const captureGps = useCallback((): Promise<void> => {
    setGpsError('')
    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        setGpsError('Geolocalización no disponible')
        resolve()
        return
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          setGpsData({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
          })
          resolve()
        },
        (error) => {
          let msg = 'No se pudo obtener la ubicación'
          switch (error.code) {
            case error.PERMISSION_DENIED:
              msg = 'Permiso de ubicación denegado'
              break
            case error.POSITION_UNAVAILABLE:
              msg = 'Ubicación no disponible'
              break
            case error.TIMEOUT:
              msg = 'Tiempo de espera agotado'
              break
          }
          setGpsError(msg)
          resolve()
        },
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
      )
    })
  }, [])

  // ── Proceed to record type selection ────────────────────────────────────────

  const proceedToRecord = () => {
    if (!selectedEmployeeId) return
    setStep('record')
  }

  // ── Submit Attendance ───────────────────────────────────────────────────────

  const handleSubmit = async () => {
    if (!verifyData?.qrCodeId || !selectedEmployeeId) return

    setSubmitting(true)
    setStep('gps')

    try {
      await captureGps()

      const payload: Record<string, unknown> = {
        qrCodeId: verifyData.qrCodeId,
        employeeId: selectedEmployeeId,
        recordType,
        latitude: gpsData?.latitude ?? null,
        longitude: gpsData?.longitude ?? null,
        gpsAccuracy: gpsData?.accuracy ?? null,
        selfieData: selfieData || null,
        deviceInfo: navigator.userAgent,
        notes: gpsError ? `GPS: ${gpsError}` : null,
      }

      const res = await fetch('/api/public/checkin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}))
        throw new Error(errData.error || 'Error al registrar asistencia')
      }

      const result = await res.json()
      setSuccessData({
        time: new Date().toLocaleTimeString('es-MX', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        }),
        branchName: verifyData.branchName || 'Sucursal',
        recordType: recordType === 'check_in' ? 'Entrada' : 'Salida',
        status: result.status === 'late' ? 'Retardo' : result.status === 'early_departure' ? 'Salida Anticipada' : 'A Tiempo',
      })
      setStep('success')
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error al registrar asistencia'
      setError(message)
      setStep('error')
    } finally {
      setSubmitting(false)
    }
  }

  // ── Reset ───────────────────────────────────────────────────────────────────

  const handleReset = () => {
    stopSelfieStream()
    setStep(verifyData ? 'select' : 'loading')
    setSelfieData('')
    setGpsData(null)
    setGpsError('')
    setRecordType('check_in')
    setSubmitting(false)
    setSuccessData(null)
    setError('')
  }

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50 to-white dark:from-gray-950 dark:to-gray-900">
      <div className="mx-auto max-w-md px-4 py-6 space-y-4">
        {/* ── Company Header ─────────────────────────────────────────────── */}
        {verifyData && step !== 'error' && (
          <div className="flex flex-col items-center gap-2 pt-2 pb-1">
            {verifyData.companyLogo && (
              <img
                src={verifyData.companyLogo}
                alt={verifyData.companyName || ''}
                className="h-12 w-12 rounded-full object-cover border-2 border-emerald-200"
              />
            )}
            <h1 className="text-xl font-bold tracking-tight text-foreground">
              {verifyData.companyName || 'SIGA-RH'}
            </h1>
            {verifyData.branchName && (
              <p className="text-sm text-muted-foreground flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5 text-emerald-600" />
                {verifyData.branchName}
              </p>
            )}
            <p className="text-xs text-muted-foreground">{formatDateES()}</p>
          </div>
        )}

        {/* ── Step: LOADING ──────────────────────────────────────────────── */}
        {step === 'loading' && (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div className="relative">
              <div className="h-16 w-16 rounded-full border-4 border-emerald-200 border-t-emerald-600 animate-spin" />
              <CheckCircle2 className="h-6 w-6 text-emerald-600 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
            </div>
            <p className="text-lg font-semibold text-muted-foreground">
              Verificando código QR...
            </p>
          </div>
        )}

        {/* ── Step: ERROR ────────────────────────────────────────────────── */}
        {step === 'error' && (
          <div className="flex flex-col items-center justify-center py-12 gap-6">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-red-100 dark:bg-red-950">
              <XCircle className="h-10 w-10 text-red-600 dark:text-red-400" />
            </div>
            <div className="text-center space-y-2">
              <h2 className="text-xl font-bold text-red-700 dark:text-red-400">
                Error
              </h2>
              <p className="text-sm text-muted-foreground max-w-xs">
                {error}
              </p>
            </div>
            <Button
              className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
              onClick={() => {
                window.location.href = '/'
              }}
            >
              Ir al sitio principal
            </Button>
            {qrcodeParam && (
              <Button variant="outline" className="gap-2" onClick={handleReset}>
                <RefreshCw className="h-4 w-4" />
                Intentar de nuevo
              </Button>
            )}
          </div>
        )}

        {/* ── Step: SELECT EMPLOYEE ──────────────────────────────────────── */}
        {step === 'select' && (
          <div className="space-y-4">
            <Card className="border-emerald-200 dark:border-emerald-800">
              <CardContent className="p-5 text-center space-y-3">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-950 mx-auto">
                  <CheckCircle2 className="h-8 w-8 text-emerald-600" />
                </div>
                <div>
                  <p className="text-lg font-bold text-emerald-700 dark:text-emerald-400">
                    QR Verificado
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {verifyData?.branchName || 'Sucursal'}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Employee Selection */}
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-950">
                    <User className="h-5 w-5 text-emerald-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <Label className="text-xs text-muted-foreground mb-1 block">
                      Selecciona tu nombre
                    </Label>
                    {loadingEmployees ? (
                      <Skeleton className="h-9 w-full" />
                    ) : (
                      <Select
                        value={selectedEmployeeId || undefined}
                        onValueChange={setSelectedEmployeeId}
                      >
                        <SelectTrigger className="h-9">
                          <SelectValue placeholder="Elige tu nombre..." />
                        </SelectTrigger>
                        <SelectContent>
                          {employees.map((emp) => (
                            <SelectItem key={emp.id} value={emp.id}>
                              {emp.firstName} {emp.lastName}
                              {emp.employeeNumber ? ` — #${emp.employeeNumber}` : ''}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Button
              className="w-full h-12 text-base font-semibold gap-2 bg-emerald-600 hover:bg-emerald-700 text-white"
              disabled={!selectedEmployeeId}
              onClick={proceedToRecord}
            >
              Continuar
            </Button>
          </div>
        )}

        {/* ── Step: RECORD TYPE ──────────────────────────────────────────── */}
        {step === 'record' && (
          <div className="space-y-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setStep('select')}
              className="gap-1 text-muted-foreground"
            >
              ← Volver
            </Button>

            {/* Selected employee display */}
            {selectedEmployeeId && (
              <Card>
                <CardContent className="p-3">
                  <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-950">
                      <User className="h-4 w-4 text-emerald-600" />
                    </div>
                    <p className="text-sm font-medium truncate">
                      {employees.find((e) => e.id === selectedEmployeeId)?.firstName}{' '}
                      {employees.find((e) => e.id === selectedEmployeeId)?.lastName}
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Record Type Selection */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Tipo de Registro</Label>
              <div className="grid grid-cols-2 gap-3">
                <Button
                  type="button"
                  variant={recordType === 'check_in' ? 'default' : 'outline'}
                  className={cn(
                    'h-20 text-base font-semibold gap-2 flex-col rounded-xl',
                    recordType === 'check_in'
                      ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-200 dark:shadow-emerald-950'
                      : 'border-emerald-200 text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950'
                  )}
                  onClick={() => setRecordType('check_in')}
                >
                  <span className="text-2xl">🟢</span>
                  Entrada
                </Button>
                <Button
                  type="button"
                  variant={recordType === 'check_out' ? 'default' : 'outline'}
                  className={cn(
                    'h-20 text-base font-semibold gap-2 flex-col rounded-xl',
                    recordType === 'check_out'
                      ? 'bg-red-600 hover:bg-red-700 text-white shadow-md shadow-red-200 dark:shadow-red-950'
                      : 'border-red-200 text-red-700 hover:bg-red-50 dark:hover:bg-red-950'
                  )}
                  onClick={() => setRecordType('check_out')}
                >
                  <span className="text-2xl">🔴</span>
                  Salida
                </Button>
              </div>
            </div>

            {/* Selfie Section */}
            {!showSelfie && !selfieData && (
              <Button
                variant="outline"
                className="w-full h-11 gap-2 border-emerald-200 text-emerald-700 hover:bg-emerald-50 dark:border-emerald-800 dark:hover:bg-emerald-950"
                onClick={startSelfieCamera}
              >
                <Camera className="h-4 w-4" />
                Tomar foto de verificación (opcional)
              </Button>
            )}

            {/* Selfie Camera */}
            {showSelfie && !selfieData && (
              <Card>
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <Camera className="h-4 w-4 text-emerald-600" />
                    Foto de verificación
                  </div>
                  <div className="relative rounded-xl overflow-hidden bg-black aspect-[4/3] flex items-center justify-center">
                    <video
                      ref={selfieVideoRef}
                      autoPlay
                      playsInline
                      muted
                      className="w-full h-full object-cover"
                      style={{ transform: 'scaleX(-1)' }}
                    />
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <div className="w-36 h-48 rounded-full border-2 border-dashed border-white/40" />
                    </div>
                  </div>
                  <canvas ref={selfieCanvasRef} className="hidden" />
                  <div className="grid grid-cols-2 gap-3">
                    <Button
                      variant="outline"
                      className="gap-2"
                      onClick={stopSelfieStream}
                    >
                      Omitir
                    </Button>
                    <Button
                      className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
                      onClick={captureSelfie}
                    >
                      <Camera className="h-4 w-4" />
                      Capturar
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Selfie Preview */}
            {selfieData && (
              <Card>
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <Camera className="h-4 w-4 text-emerald-600" />
                    Foto capturada
                  </div>
                  <div className="relative rounded-xl overflow-hidden bg-black aspect-[4/3] flex items-center justify-center">
                    <img
                      src={selfieData}
                      alt="Selfie capturada"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <Button
                      variant="outline"
                      className="gap-2"
                      onClick={retakeSelfie}
                    >
                      <RefreshCw className="h-4 w-4" />
                      Tomar otra
                    </Button>
                    <Button
                      variant="outline"
                      className="gap-2"
                      onClick={() => { setSelfieData('') }}
                    >
                      Eliminar
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Submit Button */}
            <Button
              className="w-full h-14 text-base font-bold gap-2 bg-emerald-600 hover:bg-emerald-700 text-white"
              size="lg"
              onClick={handleSubmit}
              disabled={submitting}
            >
              {submitting ? (
                <>
                  <RefreshCw className="h-5 w-5 animate-spin" />
                  Registrando...
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-5 w-5" />
                  Marcar Asistencia
                </>
              )}
            </Button>
          </div>
        )}

        {/* ── Step: GPS (brief, during submission) ───────────────────────── */}
        {step === 'gps' && submitting && (
          <div className="space-y-4 flex flex-col items-center py-12">
            <div className="relative">
              <div className="h-16 w-16 rounded-full border-4 border-emerald-200 border-t-emerald-600 animate-spin" />
              <MapPin className="h-6 w-6 text-emerald-600 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
            </div>
            <p className="text-lg font-semibold text-muted-foreground">
              Registrando asistencia...
            </p>
            <p className="text-sm text-muted-foreground">
              Obteniendo ubicación y guardando registro
            </p>
          </div>
        )}

        {/* ── Step: SUCCESS ──────────────────────────────────────────────── */}
        {step === 'success' && successData && (
          <div className="space-y-6 py-4">
            <div className="flex flex-col items-center gap-4">
              <div className="relative">
                <div className="h-24 w-24 rounded-full bg-emerald-100 dark:bg-emerald-950 flex items-center justify-center">
                  <CheckCircle2 className="h-14 w-14 text-emerald-600" />
                </div>
                <div className="absolute inset-0 h-24 w-24 rounded-full border-4 border-emerald-300 animate-ping opacity-20" />
              </div>
              <div className="text-center">
                <h2 className="text-2xl font-bold text-emerald-700 dark:text-emerald-400">
                  ¡Asistencia Registrada!
                </h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Tu registro se ha guardado correctamente
                </p>
              </div>
            </div>

            <Card className="border-emerald-200 dark:border-emerald-800">
              <CardContent className="p-5 space-y-4">
                {/* Time */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    Hora
                  </div>
                  <p className="text-sm font-bold font-mono">{successData.time}</p>
                </div>

                <Separator />

                {/* Branch */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <MapPin className="h-4 w-4" />
                    Sucursal
                  </div>
                  <p className="text-sm font-semibold">{successData.branchName}</p>
                </div>

                <Separator />

                {/* Type */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    Tipo
                  </div>
                  <Badge
                    className={cn(
                      'font-semibold',
                      successData.recordType === 'Entrada'
                        ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950 dark:text-emerald-400'
                        : 'bg-red-100 text-red-700 hover:bg-red-100 dark:bg-red-950 dark:text-red-400',
                    )}
                    variant="outline"
                  >
                    {successData.recordType === 'Entrada' ? '🟢' : '🔴'}{' '}
                    {successData.recordType}
                  </Badge>
                </div>

                <Separator />

                {/* Status */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    {successData.status === 'A Tiempo' ? (
                      <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    ) : (
                      <AlertTriangle className="h-4 w-4 text-amber-600" />
                    )}
                    Estado
                  </div>
                  <Badge
                    className={cn(
                      'font-semibold',
                      successData.status === 'A Tiempo'
                        ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950 dark:text-emerald-400'
                        : 'bg-amber-100 text-amber-700 hover:bg-amber-100 dark:bg-amber-950 dark:text-amber-400',
                    )}
                    variant="outline"
                  >
                    {successData.status}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            <Button
              className="w-full h-12 gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
              onClick={handleReset}
            >
              <RefreshCw className="h-5 w-5" />
              Registrar otro
            </Button>
          </div>
        )}

        {/* ── Footer ─────────────────────────────────────────────────────── */}
        <div className="pt-8 pb-4 text-center">
          <p className="text-xs text-muted-foreground">
            Powered by <span className="font-semibold text-emerald-600">SIGA-RH</span>
          </p>
        </div>
      </div>
    </div>
  )
}

// ── Page Component with Suspense ──────────────────────────────────────────────

export default function PublicCheckInPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-emerald-50 to-white dark:from-gray-950 dark:to-gray-900">
          <div className="relative">
            <div className="h-16 w-16 rounded-full border-4 border-emerald-200 border-t-emerald-600 animate-spin" />
          </div>
        </div>
      }
    >
      <PublicCheckInContent />
    </Suspense>
  )
}
