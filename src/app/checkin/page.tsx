'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Camera, QrCode, MapPin, Clock, CheckCircle2, XCircle, ArrowLeft, User } from 'lucide-react'
import { toast } from 'sonner'
import { Toaster } from 'sonner'

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

type Step = 'idle' | 'scanning' | 'verified' | 'selfie' | 'gps' | 'confirm' | 'success'

interface Employee {
  id: string
  firstName: string
  lastName: string
  employeeNumber: string | null
}

interface GpsData {
  latitude: number
  longitude: number
  accuracy: number
}

interface SuccessData {
  time: string
  branchName: string
  recordType: string
  status: string
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function formatDateES(): string {
  const now = new Date()
  const days = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']
  const months = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre']
  return `${days[now.getDay()]}, ${now.getDate()} de ${months[now.getMonth()]} de ${now.getFullYear()}`
}

// ─────────────────────────────────────────────────────────────────────────────
// Page — completely isolated, no admin panel access
// ─────────────────────────────────────────────────────────────────────────────

export default function CheckInPage() {
  const [step, setStep] = useState<Step>('idle')
  const [employees, setEmployees] = useState<Employee[]>([])
  const [selectedEmployeeId, setSelectedEmployeeId] = useState('')
  const [loadingEmployees, setLoadingEmployees] = useState(false)
  const [scannedCode, setScannedCode] = useState('')
  const [manualCode, setManualCode] = useState('')
  const [branchName, setBranchName] = useState('')
  const [branchId, setBranchId] = useState('')
  const [loadingQr, setLoadingQr] = useState(false)
  const [selfieData, setSelfieData] = useState('')
  const [gpsData, setGpsData] = useState<GpsData | null>(null)
  const [gpsError, setGpsError] = useState('')
  const [recordType, setRecordType] = useState<'check_in' | 'check_out'>('check_in')
  const [hasPendingCheckIn, setHasPendingCheckIn] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [successData, setSuccessData] = useState<SuccessData | null>(null)

  const scannerRef = useRef<any>(null)
  const selfieVideoRef = useRef<HTMLVideoElement | null>(null)
  const selfieCanvasRef = useRef<HTMLCanvasElement | null>(null)
  const selfieStreamRef = useRef<MediaStream | null>(null)

  // Read QR from URL on load
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const qr = params.get('qr')
    if (qr) {
      window.history.replaceState({}, '', '/checkin')
      verifyQrCode(qr)
    }
  }, [])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopScanner()
      stopSelfieStream()
    }
  }, [])

  // ── QR Scanner ────────────────────────────────────────────────────────────

  const startScanner = async () => {
    setStep('scanning')
    try {
      await new Promise((r) => setTimeout(r, 300))
      const { Html5Qrcode } = await import('html5-qrcode')
      const scanner = new Html5Qrcode('qr-reader')
      scannerRef.current = scanner
      await scanner.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        (text: string) => handleQrScanned(text, scanner),
        () => {}
      )
    } catch {
      toast.error('No se pudo acceder a la cámara. Verifica los permisos.')
      setStep('idle')
    }
  }

  const stopScanner = async (s?: any) => {
    const scanner = s || scannerRef.current
    if (scanner) {
      try { if (scanner.getState() === 2) await scanner.stop() } catch {}
      try { scanner.clear() } catch {}
    }
    scannerRef.current = null
  }

  const handleQrScanned = async (code: string, scanner?: any) => {
    await stopScanner(scanner)
    await verifyQrCode(code)
  }

  const verifyQrCode = async (code: string) => {
    setLoadingQr(true)
    setScannedCode(code)
    try {
      const res = await fetch(`/api/attendance/public-qrcode?qrcode=${encodeURIComponent(code)}`)
      const data = await res.json()
      if (!data.valid) {
        toast.error(data.error || 'Código QR no válido o expirado')
        setStep('idle')
        setLoadingQr(false)
        return
      }
      setBranchName(data.branchName || 'Sucursal')
      setBranchId(data.branchId || '')
      setScannedCode(data.qrId || code)
      if (data.employees?.length > 0) {
        setEmployees(data.employees)
        setLoadingEmployees(false)
      }
      toast.success('QR Verificado ✓')
      setStep('verified')
    } catch {
      toast.error('Error al verificar código QR')
      setStep('idle')
    } finally {
      setLoadingQr(false)
    }
  }

  // ── Selfie ────────────────────────────────────────────────────────────────

  const startSelfieCamera = async () => {
    setStep('selfie')
    setSelfieData('')
    try {
      await new Promise((r) => setTimeout(r, 200))
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user', width: 640, height: 480 } })
      selfieStreamRef.current = stream
      if (selfieVideoRef.current) {
        selfieVideoRef.current.srcObject = stream
        await selfieVideoRef.current.play()
      }
    } catch {
      toast.error('No se pudo acceder a la cámara frontal')
      setStep('verified')
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
    setSelfieData(canvas.toDataURL('image/jpeg', 0.8))
    stopSelfieStream()
  }

  const stopSelfieStream = () => {
    selfieStreamRef.current?.getTracks().forEach((t) => t.stop())
    selfieStreamRef.current = null
  }

  // ── GPS ───────────────────────────────────────────────────────────────────

  const captureGps = (): Promise<void> => new Promise((resolve) => {
    if (!navigator.geolocation) {
      setGpsError('Geolocalización no disponible')
      resolve()
      return
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setGpsData({ latitude: pos.coords.latitude, longitude: pos.coords.longitude, accuracy: pos.coords.accuracy })
        resolve()
      },
      (err) => {
        const msgs: Record<number, string> = { 1: 'Permiso de ubicación denegado', 2: 'Ubicación no disponible', 3: 'Tiempo agotado' }
        setGpsError(msgs[err.code] || 'No se pudo obtener ubicación')
        resolve()
      },
      { enableHighAccuracy: true, timeout: 15000 }
    )
  })

  const proceedToGps = async () => {
    stopSelfieStream()
    setStep('gps')
    await captureGps()
    setStep('confirm')
  }

  // ── Submit ────────────────────────────────────────────────────────────────

  const handleSubmit = async () => {
    if (!selectedEmployeeId) { toast.error('Selecciona un empleado'); return }
    if (!scannedCode) { toast.error('No hay código QR verificado'); return }

    setSubmitting(true)
    try {
      const res = await fetch('/api/attendance/public-checkin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          qrCodeId: scannedCode,
          employeeId: selectedEmployeeId,
          recordType,
          latitude: gpsData?.latitude ?? null,
          longitude: gpsData?.longitude ?? null,
          gpsAccuracy: gpsData?.accuracy ?? null,
          selfieData: selfieData || null,
          deviceInfo: navigator.userAgent,
          notes: gpsError ? `GPS: ${gpsError}` : null,
        }),
      })

      const result = await res.json()
      if (!res.ok) throw new Error(result.error || 'Error al registrar')

      setSuccessData({
        time: new Date().toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        branchName,
        recordType: recordType === 'check_in' ? 'Entrada' : 'Salida',
        status: result.status === 'late' ? 'Retardo' : result.status === 'early_departure' ? 'Salida anticipada' : 'A Tiempo',
      })
      setStep('success')
      toast.success('¡Asistencia registrada!')
    } catch (err: any) {
      toast.error(err.message || 'Error al registrar asistencia')
    } finally {
      setSubmitting(false)
    }
  }

  // ── Reset ─────────────────────────────────────────────────────────────────

  const handleReset = () => {
    stopSelfieStream()
    setStep('idle')
    setScannedCode('')
    setManualCode('')
    setBranchName('')
    setBranchId('')
    setSelfieData('')
    setGpsData(null)
    setGpsError('')
    setRecordType('check_in')
    setHasPendingCheckIn(false)
    setSuccessData(null)
    setSelectedEmployeeId('')
  }

  const handleBack = () => {
    stopSelfieStream()
    if (step === 'scanning') { stopScanner(); setStep('idle') }
    else if (step === 'verified') { setStep('idle'); setScannedCode(''); setBranchName('') }
    else if (step === 'selfie') { stopSelfieStream(); setStep('verified'); setSelfieData('') }
    else if (step === 'confirm') { setStep('verified') }
    else { handleReset() }
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-background">
      <Toaster richColors position="top-center" />

      {/* Header — NO links to admin panel */}
      <div className="border-b bg-card px-4 py-3 flex items-center gap-3">
        {step !== 'idle' && step !== 'success' && (
          <Button variant="ghost" size="sm" onClick={handleBack} className="h-8 w-8 p-0">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        )}
        <div className="flex items-center gap-2 flex-1">
          <div className="h-7 w-7 rounded-lg bg-emerald-600 flex items-center justify-center">
            <QrCode className="h-4 w-4 text-white" />
          </div>
          <span className="font-semibold text-sm">Marcar Asistencia</span>
        </div>
        <span className="text-xs text-muted-foreground">{formatDateES()}</span>
      </div>

      <div className="mx-auto max-w-md p-4 space-y-4 pb-12">

        {/* ── IDLE ── */}
        {step === 'idle' && (
          <>
            {/* Employee selector */}
            {employees.length > 0 && (
              <Card>
                <CardContent className="p-4">
                  <label className="text-sm font-medium mb-2 block">Selecciona tu nombre</label>
                  <Select value={selectedEmployeeId} onValueChange={setSelectedEmployeeId}>
                    <SelectTrigger><SelectValue placeholder="— Elige un empleado —" /></SelectTrigger>
                    <SelectContent>
                      {employees.map((e) => (
                        <SelectItem key={e.id} value={e.id}>
                          {e.firstName} {e.lastName} {e.employeeNumber ? `(#${e.employeeNumber})` : ''}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </CardContent>
              </Card>
            )}

            <Card>
              <CardContent className="p-6 flex flex-col items-center gap-4">
                <div className="h-16 w-16 rounded-2xl bg-emerald-50 flex items-center justify-center">
                  <QrCode className="h-8 w-8 text-emerald-600" />
                </div>
                <Button onClick={startScanner} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white" size="lg">
                  Escanear Código QR
                </Button>
                <div className="w-full">
                  <p className="text-xs text-muted-foreground mb-2 text-center">O ingresa el código manualmente:</p>
                  <div className="flex gap-2">
                    <Input
                      value={manualCode}
                      onChange={(e) => setManualCode(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && verifyQrCode(manualCode.trim())}
                      placeholder="Código QR..."
                      className="font-mono text-sm"
                    />
                    <Button variant="outline" onClick={() => verifyQrCode(manualCode.trim())} disabled={!manualCode.trim()}>
                      Verificar
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </>
        )}

        {/* ── SCANNING ── */}
        {step === 'scanning' && (
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <Badge variant="destructive" className="animate-pulse">● Escaneando...</Badge>
              </div>
              <div id="qr-reader" className="w-full rounded-lg overflow-hidden" />
            </CardContent>
          </Card>
        )}

        {/* ── LOADING QR ── */}
        {loadingQr && (
          <Card>
            <CardContent className="p-8 flex flex-col items-center gap-3">
              <div className="h-10 w-10 rounded-full border-4 border-emerald-200 border-t-emerald-600 animate-spin" />
              <p className="text-sm text-muted-foreground">Verificando código QR...</p>
            </CardContent>
          </Card>
        )}

        {/* ── VERIFIED ── */}
        {step === 'verified' && !loadingQr && (
          <>
            <Card className="border-emerald-200">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-1">
                  <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                  <span className="font-semibold text-emerald-700">QR Verificado</span>
                </div>
                <p className="text-sm text-muted-foreground">Sucursal: <strong>{branchName}</strong></p>
              </CardContent>
            </Card>

            {/* Employee selector */}
            <Card>
              <CardContent className="p-4">
                <label className="text-sm font-medium mb-2 block flex items-center gap-2">
                  <User className="h-4 w-4" /> Selecciona tu nombre
                </label>
                <Select value={selectedEmployeeId} onValueChange={setSelectedEmployeeId}>
                  <SelectTrigger><SelectValue placeholder="— Elige un empleado —" /></SelectTrigger>
                  <SelectContent>
                    {employees.map((e) => (
                      <SelectItem key={e.id} value={e.id}>
                        {e.firstName} {e.lastName} {e.employeeNumber ? `(#${e.employeeNumber})` : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>

            {/* Record type */}
            {hasPendingCheckIn && (
              <Card className="border-amber-200 bg-amber-50">
                <CardContent className="p-3 text-sm text-amber-800">
                  ⚠️ Ya tienes una entrada registrada hoy. Se registrará <strong>Salida</strong>.
                </CardContent>
              </Card>
            )}
            <div className="grid grid-cols-2 gap-3">
              <Button
                variant={recordType === 'check_in' ? 'default' : 'outline'}
                onClick={() => setRecordType('check_in')}
                className={recordType === 'check_in' ? 'bg-emerald-600 hover:bg-emerald-700' : ''}
                disabled={hasPendingCheckIn}
              >
                🟢 Entrada
              </Button>
              <Button
                variant={recordType === 'check_out' ? 'default' : 'outline'}
                onClick={() => setRecordType('check_out')}
                className={recordType === 'check_out' ? 'bg-red-600 hover:bg-red-700 text-white' : ''}
              >
                🔴 Salida
              </Button>
            </div>
            <Button
              onClick={startSelfieCamera}
              className="w-full bg-emerald-600 hover:bg-emerald-700"
              disabled={!selectedEmployeeId}
            >
              <Camera className="h-4 w-4 mr-2" /> Continuar — Tomar Foto
            </Button>
          </>
        )}

        {/* ── SELFIE ── */}
        {step === 'selfie' && (
          <Card>
            <CardContent className="p-4 flex flex-col items-center gap-4">
              <p className="text-sm font-medium">Toma una selfie para confirmar</p>
              {!selfieData ? (
                <>
                  <div className="relative w-full max-w-xs aspect-square rounded-full overflow-hidden border-4 border-emerald-400">
                    <video ref={selfieVideoRef} autoPlay playsInline muted className="w-full h-full object-cover scale-x-[-1]" />
                  </div>
                  <Button onClick={captureSelfie} className="bg-emerald-600 hover:bg-emerald-700">
                    <Camera className="h-4 w-4 mr-2" /> Capturar
                  </Button>
                </>
              ) : (
                <>
                  <img src={selfieData} alt="selfie" className="w-32 h-32 rounded-full object-cover border-4 border-emerald-400" />
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={() => { setSelfieData(''); startSelfieCamera() }}>Repetir</Button>
                    <Button onClick={proceedToGps} className="bg-emerald-600 hover:bg-emerald-700">Continuar</Button>
                  </div>
                </>
              )}
              <canvas ref={selfieCanvasRef} className="hidden" />
            </CardContent>
          </Card>
        )}

        {/* ── GPS ── */}
        {step === 'gps' && (
          <Card>
            <CardContent className="p-8 flex flex-col items-center gap-3">
              <MapPin className="h-10 w-10 text-emerald-600 animate-bounce" />
              <p className="text-sm text-muted-foreground">Obteniendo ubicación GPS...</p>
            </CardContent>
          </Card>
        )}

        {/* ── CONFIRM ── */}
        {step === 'confirm' && (
          <Card>
            <CardContent className="p-4 space-y-3">
              <p className="font-semibold">Confirmar Registro</p>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Sucursal</span>
                  <span className="font-medium">{branchName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Tipo</span>
                  <Badge className={recordType === 'check_in' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'}>
                    {recordType === 'check_in' ? 'Entrada' : 'Salida'}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Hora</span>
                  <span className="font-mono">{new Date().toLocaleTimeString('es')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">GPS</span>
                  {gpsData
                    ? <span className="text-emerald-600 text-xs">✓ Obtenido (±{Math.round(gpsData.accuracy)}m)</span>
                    : <span className="text-amber-600 text-xs">⚠ No disponible</span>
                  }
                </div>
                {selfieData && (
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Selfie</span>
                    <img src={selfieData} alt="selfie" className="w-10 h-10 rounded-full object-cover border-2 border-emerald-400" />
                  </div>
                )}
              </div>
              <Button
                onClick={handleSubmit}
                disabled={submitting}
                className="w-full bg-emerald-600 hover:bg-emerald-700 mt-2"
              >
                {submitting ? 'Registrando...' : '✓ Confirmar Asistencia'}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* ── SUCCESS ── */}
        {step === 'success' && successData && (
          <Card className="border-emerald-300">
            <CardContent className="p-8 flex flex-col items-center gap-4 text-center">
              <div className="relative">
                <div className="h-20 w-20 rounded-full bg-emerald-100 flex items-center justify-center">
                  <CheckCircle2 className="h-10 w-10 text-emerald-600" />
                </div>
                <span className="absolute -bottom-1 -right-1 h-6 w-6 rounded-full bg-emerald-500 border-2 border-white animate-ping" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-emerald-700">¡Asistencia Registrada!</h2>
                <p className="text-sm text-muted-foreground mt-1">{successData.branchName}</p>
              </div>
              <div className="grid grid-cols-3 gap-3 w-full text-sm">
                <div className="bg-muted rounded-lg p-3 text-center">
                  <Clock className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
                  <p className="font-mono font-semibold">{successData.time}</p>
                  <p className="text-[10px] text-muted-foreground">Hora</p>
                </div>
                <div className="bg-muted rounded-lg p-3 text-center">
                  <Badge className={successData.recordType === 'Entrada' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'}>
                    {successData.recordType}
                  </Badge>
                  <p className="text-[10px] text-muted-foreground mt-1">Tipo</p>
                </div>
                <div className="bg-muted rounded-lg p-3 text-center">
                  <Badge className={successData.status === 'A Tiempo' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}>
                    {successData.status}
                  </Badge>
                  <p className="text-[10px] text-muted-foreground mt-1">Estado</p>
                </div>
              </div>
              <Button onClick={handleReset} variant="outline" className="w-full mt-2">
                Volver a Escanear
              </Button>
            </CardContent>
          </Card>
        )}

      </div>
    </div>
  )
}
