'use client'

import { useEffect, useState, useRef } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Camera, QrCode, MapPin, Clock, CheckCircle2, ArrowLeft, User, Hash, Mail, Phone, Eye, EyeOff } from 'lucide-react'
import { toast } from 'sonner'
import { Toaster } from 'sonner'

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

type Step = 'idle' | 'scanning' | 'identify' | 'selfie' | 'gps' | 'confirm' | 'success'
type IdentifierType = 'pin' | 'email' | 'phone'

interface IdentifiedEmployee {
  id: string
  firstName: string
  lastName: string
  employeeNumber: string | null
  hasPendingCheckIn: boolean
}

interface GpsData {
  latitude: number
  longitude: number
  accuracy: number
}

interface SuccessData {
  time: string
  branchName: string
  employeeName: string
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
  const [scannedCode, setScannedCode] = useState('')
  const [manualCode, setManualCode] = useState('')
  const [branchName, setBranchName] = useState('')
  const [branchId, setBranchId] = useState('')
  const [loadingQr, setLoadingQr] = useState(false)

  // Identification
  const [identifierType, setIdentifierType] = useState<IdentifierType>('pin')
  const [identifierValue, setIdentifierValue] = useState('')
  const [showIdentifier, setShowIdentifier] = useState(false)
  const [identifyLoading, setIdentifyLoading] = useState(false)
  const [identifiedEmployee, setIdentifiedEmployee] = useState<IdentifiedEmployee | null>(null)
  const [recordType, setRecordType] = useState<'check_in' | 'check_out'>('check_in')

  // Selfie / GPS / Submit
  const [selfieData, setSelfieData] = useState('')
  const [gpsData, setGpsData] = useState<GpsData | null>(null)
  const [gpsError, setGpsError] = useState('')
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
        (text: string) => { stopScanner(scanner); verifyQrCode(text) },
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

  const verifyQrCode = async (code: string) => {
    setLoadingQr(true)
    try {
      const res = await fetch(`/api/attendance/public-qrcode?qrcode=${encodeURIComponent(code)}`)
      const data = await res.json()
      if (!data.valid) {
        toast.error(data.error || 'Código QR no válido o expirado')
        setStep('idle')
        return
      }
      setBranchName(data.branchName || 'Sucursal')
      setBranchId(data.branchId || '')
      setScannedCode(data.qrId || code)
      toast.success('QR Verificado ✓')
      setStep('identify')
    } catch {
      toast.error('Error al verificar código QR')
      setStep('idle')
    } finally {
      setLoadingQr(false)
    }
  }

  // ── Employee Identification ───────────────────────────────────────────────

  const handleIdentify = async () => {
    if (!identifierValue.trim()) {
      toast.error('Ingresa tu ' + (identifierType === 'pin' ? 'PIN' : identifierType === 'email' ? 'correo electrónico' : 'teléfono'))
      return
    }
    setIdentifyLoading(true)
    try {
      const res = await fetch('/api/attendance/identify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ branchId, identifier: identifierValue.trim(), type: identifierType }),
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error || 'No se encontró el empleado')
        return
      }
      setIdentifiedEmployee(data)
      if (data.hasPendingCheckIn) {
        setRecordType('check_out')
      } else {
        setRecordType('check_in')
      }
      // Proceed to selfie
      await startSelfieCamera()
    } catch {
      toast.error('Error al identificar empleado')
    } finally {
      setIdentifyLoading(false)
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
      setStep('identify')
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
    if (!navigator.geolocation) { setGpsError('Geolocalización no disponible'); resolve(); return }
    navigator.geolocation.getCurrentPosition(
      (pos) => { setGpsData({ latitude: pos.coords.latitude, longitude: pos.coords.longitude, accuracy: pos.coords.accuracy }); resolve() },
      (err) => { setGpsError(['', 'Permiso denegado', 'No disponible', 'Tiempo agotado'][err.code] || 'Error'); resolve() },
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
    if (!identifiedEmployee || !scannedCode) return
    setSubmitting(true)
    try {
      const res = await fetch('/api/attendance/public-checkin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          qrCodeId: scannedCode,
          employeeId: identifiedEmployee.id,
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
        employeeName: `${identifiedEmployee.firstName} ${identifiedEmployee.lastName}`,
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
    setIdentifierValue('')
    setIdentifiedEmployee(null)
    setRecordType('check_in')
    setSuccessData(null)
  }

  const handleBack = () => {
    stopSelfieStream()
    if (step === 'scanning') { stopScanner(); setStep('idle') }
    else if (step === 'identify') { setStep('idle'); setScannedCode(''); setBranchName('') }
    else if (step === 'selfie') { stopSelfieStream(); setStep('identify'); setSelfieData('') }
    else if (step === 'confirm') { setStep('identify') }
    else { handleReset() }
  }

  // ── Render ────────────────────────────────────────────────────────────────

  const identifierIcons = { pin: <Hash className="h-4 w-4" />, email: <Mail className="h-4 w-4" />, phone: <Phone className="h-4 w-4" /> }
  const identifierLabels = { pin: 'PIN de acceso', email: 'Correo electrónico', phone: 'Teléfono' }
  const identifierPlaceholders = { pin: '••••', email: 'empleado@empresa.com', phone: '04XX-XXXXXXX' }

  return (
    <div className="min-h-screen bg-background">
      <Toaster richColors position="top-center" />

      {/* Header — no links to admin panel */}
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
        <span className="text-xs text-muted-foreground hidden sm:block">{formatDateES()}</span>
      </div>

      <div className="mx-auto max-w-md p-4 space-y-4 pb-12">

        {/* ── IDLE ── */}
        {step === 'idle' && (
          <Card>
            <CardContent className="p-6 flex flex-col items-center gap-4">
              <div className="h-16 w-16 rounded-2xl bg-emerald-50 flex items-center justify-center">
                <QrCode className="h-8 w-8 text-emerald-600" />
              </div>
              <div className="text-center">
                <h2 className="font-semibold text-lg">Escanea el código QR</h2>
                <p className="text-sm text-muted-foreground">Escanea el código de tu sucursal para marcar asistencia</p>
              </div>
              <Button onClick={startScanner} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white" size="lg">
                <QrCode className="h-5 w-5 mr-2" /> Escanear Código QR
              </Button>
              <div className="w-full">
                <p className="text-xs text-muted-foreground mb-2 text-center">O ingresa el código manualmente:</p>
                <div className="flex gap-2">
                  <Input value={manualCode} onChange={(e) => setManualCode(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && verifyQrCode(manualCode.trim())} placeholder="Código QR..." className="font-mono text-sm" />
                  <Button variant="outline" onClick={() => verifyQrCode(manualCode.trim())} disabled={!manualCode.trim()}>Verificar</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* ── SCANNING ── */}
        {step === 'scanning' && (
          <Card>
            <CardContent className="p-4">
              <Badge variant="destructive" className="animate-pulse mb-3 block w-fit">● Escaneando...</Badge>
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

        {/* ── IDENTIFY ── */}
        {step === 'identify' && !loadingQr && (
          <>
            <Card className="border-emerald-200">
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                  <span className="font-semibold text-emerald-700">Sucursal: {branchName}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-5 space-y-4">
                <div className="flex items-center gap-2 mb-1">
                  <User className="h-5 w-5 text-muted-foreground" />
                  <h3 className="font-semibold">Identificación</h3>
                </div>

                {/* Identifier type tabs */}
                <div className="grid grid-cols-3 gap-2">
                  {(['pin', 'email', 'phone'] as IdentifierType[]).map((t) => (
                    <button
                      key={t}
                      onClick={() => { setIdentifierType(t); setIdentifierValue('') }}
                      className={`flex flex-col items-center gap-1 p-2 rounded-lg border text-xs font-medium transition-colors ${
                        identifierType === t
                          ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                          : 'border-border text-muted-foreground hover:border-emerald-300'
                      }`}
                    >
                      {identifierIcons[t]}
                      {t === 'pin' ? 'PIN' : t === 'email' ? 'Email' : 'Teléfono'}
                    </button>
                  ))}
                </div>

                {/* Input */}
                <div className="space-y-1">
                  <label className="text-sm font-medium">{identifierLabels[identifierType]}</label>
                  <div className="relative">
                    <Input
                      type={identifierType === 'pin' && !showIdentifier ? 'password' : 'text'}
                      value={identifierValue}
                      onChange={(e) => setIdentifierValue(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleIdentify()}
                      placeholder={identifierPlaceholders[identifierType]}
                      className="pr-10"
                      autoComplete="off"
                      inputMode={identifierType === 'pin' ? 'numeric' : 'text'}
                      maxLength={identifierType === 'pin' ? 6 : undefined}
                    />
                    {identifierType === 'pin' && (
                      <button
                        type="button"
                        onClick={() => setShowIdentifier(!showIdentifier)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                      >
                        {showIdentifier ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    )}
                  </div>
                  {identifierType === 'pin' && (
                    <p className="text-xs text-muted-foreground">Tu PIN de 4-6 dígitos asignado por la empresa</p>
                  )}
                </div>

                <Button onClick={handleIdentify} disabled={identifyLoading || !identifierValue.trim()} className="w-full bg-emerald-600 hover:bg-emerald-700">
                  {identifyLoading ? 'Verificando...' : 'Continuar'}
                </Button>
              </CardContent>
            </Card>
          </>
        )}

        {/* ── SELFIE ── */}
        {step === 'selfie' && (
          <Card>
            <CardContent className="p-4 flex flex-col items-center gap-4">
              {identifiedEmployee && (
                <div className="text-center">
                  <p className="font-semibold">{identifiedEmployee.firstName} {identifiedEmployee.lastName}</p>
                  <Badge className={recordType === 'check_in' ? 'bg-emerald-100 text-emerald-800 mt-1' : 'bg-red-100 text-red-800 mt-1'}>
                    {recordType === 'check_in' ? '🟢 Entrada' : '🔴 Salida'}
                  </Badge>
                </div>
              )}
              <p className="text-sm text-muted-foreground">Toma una selfie para confirmar</p>
              {!selfieData ? (
                <>
                  <div className="relative w-full max-w-xs aspect-square rounded-full overflow-hidden border-4 border-emerald-400">
                    <video ref={selfieVideoRef} autoPlay playsInline muted className="w-full h-full object-cover scale-x-[-1]" />
                  </div>
                  <Button onClick={captureSelfie} className="bg-emerald-600 hover:bg-emerald-700">
                    <Camera className="h-4 w-4 mr-2" /> Capturar Foto
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
        {step === 'confirm' && identifiedEmployee && (
          <Card>
            <CardContent className="p-4 space-y-3">
              <p className="font-semibold">Confirmar Registro</p>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Empleado</span>
                  <span className="font-medium">{identifiedEmployee.firstName} {identifiedEmployee.lastName}</span>
                </div>
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
              <Button onClick={handleSubmit} disabled={submitting} className="w-full bg-emerald-600 hover:bg-emerald-700 mt-2">
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
                <p className="text-sm font-medium mt-1">{successData.employeeName}</p>
                <p className="text-xs text-muted-foreground">{successData.branchName}</p>
              </div>
              <div className="grid grid-cols-3 gap-3 w-full text-sm">
                <div className="bg-muted rounded-lg p-3 text-center">
                  <Clock className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
                  <p className="font-mono font-semibold text-xs">{successData.time}</p>
                  <p className="text-[10px] text-muted-foreground">Hora</p>
                </div>
                <div className="bg-muted rounded-lg p-3 text-center flex flex-col items-center">
                  <Badge className={`text-[10px] ${successData.recordType === 'Entrada' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'}`}>
                    {successData.recordType}
                  </Badge>
                  <p className="text-[10px] text-muted-foreground mt-1">Tipo</p>
                </div>
                <div className="bg-muted rounded-lg p-3 text-center flex flex-col items-center">
                  <Badge className={`text-[10px] ${successData.status === 'A Tiempo' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
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
