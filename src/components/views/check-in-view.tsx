'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  Camera, QrCode, MapPin, Clock, CheckCircle2, XCircle, ArrowLeft,
  RefreshCw, User, Smartphone, LayoutDashboard,
} from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { useAppStore } from '@/store/app-store'
import type { Employee } from '@/lib/types'
// html5-qrcode dynamically imported in startScanner to avoid SSR issues

// ── Types ──────────────────────────────────────────────────────────────────────

type Step = 'idle' | 'scanning' | 'verified' | 'selfie' | 'gps' | 'confirm' | 'success'

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

function getToken(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem('siga_token')
}

function authHeaders(): HeadersInit {
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${getToken()}`,
  }
}

// ── Component ──────────────────────────────────────────────────────────────────

export function CheckInView() {
  const navigate = useAppStore((s) => s.navigate)

  // State machine
  const [step, setStep] = useState<Step>('idle')

  // Employee selection
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>('')
  const [selectedEmployeeName, setSelectedEmployeeName] = useState<string>('')
  const [loadingEmployees, setLoadingEmployees] = useState(true)

  // Identification methods
  const [identifyBy, setIdentifyBy] = useState<'pin' | 'phone' | 'email'>('pin')
  const [identifyValue, setIdentifyValue] = useState('')

  // QR code
  const [scannedCode, setScannedCode] = useState('')
  const [manualCode, setManualCode] = useState('')
  const [branchName, setBranchName] = useState('')
  const [loadingQr, setLoadingQr] = useState(false)

  // Selfie
  const [selfieData, setSelfieData] = useState<string>('')

  // GPS
  const [gpsData, setGpsData] = useState<GpsData | null>(null)
  const [gpsLoading, setGpsLoading] = useState(false)
  const [gpsError, setGpsError] = useState('')

  // Record type
  const [recordType, setRecordType] = useState<'check_in' | 'check_out'>('check_in')
  const [hasPendingCheckIn, setHasPendingCheckIn] = useState(false)

  // Submit / success
  const [submitting, setSubmitting] = useState(false)
  const [successData, setSuccessData] = useState<SuccessData | null>(null)

  // Refs
  const scannerRef = useRef<any>(null)
  const selfieVideoRef = useRef<HTMLVideoElement | null>(null)
  const selfieCanvasRef = useRef<HTMLCanvasElement | null>(null)
  const selfieStreamRef = useRef<MediaStream | null>(null)

  // ── Fetch employees (called after QR verification via public API) ──────
  const fetchEmployees = useCallback(async (companyId?: string) => {
    setLoadingEmployees(true)
    try {
      // Use public API if no auth token, otherwise use authenticated API
      const token = getToken()
      let res: Response
      if (token) {
        res = await fetch('/api/employees?limit=500&status=active', {
          headers: { Authorization: `Bearer ${token}` },
        })
      } else {
        res = await fetch('/api/employees?limit=500&status=active')
      }
      if (!res.ok) {
        // If no auth, employees will be loaded via public-qrcode response
        if (!token) return
        return
      }
      const data = await res.json()
      const list: Employee[] = Array.isArray(data) ? data : data.employees || []
      setEmployees(list)
    } catch {
      // silent — employees will come from QR verification
    } finally {
      setLoadingEmployees(false)
    }
  }, [])

  // ── Auto-verify QR from URL params ─────────────────────────────────────────
  const viewParams = useAppStore((s) => s.viewParams)

  useEffect(() => {
    const qrFromUrl = viewParams?.qr
    if (qrFromUrl && !scannedCode && step === 'idle') {
      verifyQrCode(qrFromUrl)
    }
  }, [viewParams?.qr])

  // ── Cleanup on unmount ──────────────────────────────────────────────────────

  useEffect(() => {
    return () => {
      if (scannerRef.current) {
        scannerRef.current.stop().catch(() => {})
      }
      if (selfieStreamRef.current) {
        selfieStreamRef.current.getTracks().forEach((t) => t.stop())
      }
    }
  }, [])

  // ── QR Scanner ──────────────────────────────────────────────────────────────

  const startScanner = async () => {
    setStep('scanning')
    try {
      // Small delay to ensure the DOM element is rendered
      await new Promise((r) => setTimeout(r, 300))
      const { Html5Qrcode } = await import('html5-qrcode')
      const scanner = new Html5Qrcode('qr-reader-element')
      scannerRef.current = scanner

      await scanner.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 250, height: 250 }, aspectRatio: 1.0 },
        (decodedText) => {
          handleQrScanned(decodedText, scanner)
        },
        () => {
          // No QR found in frame — ignore
        }
      )
    } catch (err: any) {
      console.error('Scanner error:', err)
      toast.error('No se pudo acceder a la cámara. Verifica los permisos.')
      setStep('idle')
    }
  }

  const stopScanner = async (scanner?: Html5Qrcode) => {
    const s = scanner || scannerRef.current
    if (s) {
      try {
        const state = s.getState()
        if (state === 2) {
          // SCANNING
          await s.stop()
        }
      } catch {
        // ignore
      }
      try {
        s.clear()
      } catch {
        // ignore
      }
    }
    scannerRef.current = null
  }

  const handleQrScanned = async (code: string, scanner?: any) => {
    await stopScanner(scanner)
    setScannedCode(code)
    await verifyQrCode(code)
  }

  const verifyQrCode = async (code: string) => {
    setLoadingQr(true)
    try {
      // Use PUBLIC QR verification API (no auth needed)
      const res = await fetch(`/api/attendance/public-qrcode?qrcode=${encodeURIComponent(code)}`)
      const data = await res.json()

      if (!data.valid) {
        toast.error(data.error || 'Código QR no válido o expirado')
        setStep('idle')
 setLoadingQr(false)
        return
      }

      // Set branch info
      setBranchName(data.branchName || 'Sucursal')
      setScannedCode(data.qrId)

      // Load employees from the public API response
      if (data.employees && data.employees.length > 0) {
        setEmployees(data.employees as Employee[])
        setLoadingEmployees(false)
 }

      toast.success('QR Verificado ✓')
      setStep('verified')
      setLoadingQr(false)

      // Check for pending check_in today
      if (selectedEmployeeId) checkPendingCheckIn()
    } catch {
      toast.error('Error al verificar código QR')
      setStep('idle')
      setLoadingQr(false)
    }
  }

  const checkPendingCheckIn = async () => {
    if (!selectedEmployeeId) return
    try {
      const today = new Date().toISOString().split('T')[0]
      const res = await fetch(
        `/api/attendance?employeeId=${selectedEmployeeId}&dateFrom=${today}&dateTo=${today}&recordType=check_in&limit=1`,
        { headers: { Authorization: `Bearer ${getToken()}` } }
      )
      if (res.ok) {
        const data = await res.json()
        const records = data.records || []
        if (records.length > 0) {
          setHasPendingCheckIn(true)
          setRecordType('check_out')
        }
      }
    } catch {
      // silent
    }
  }

  const handleManualVerify = () => {
    const code = manualCode.trim()
    if (!code) {
      toast.error('Ingresa un código QR')
      return
    }
    verifyQrCode(code)
  }

  const handleIdentifyEmployee = async () => {
    if (!identifyValue.trim()) {
      toast.error('Ingresa tu ' + (identifyBy === 'pin' ? 'PIN' : identifyBy === 'phone' ? 'teléfono' : 'email'))
      return
    }
    if (!scannedCode) {
      toast.error('Escanea primero el código QR')
      return
    }
    setLoadingEmployees(true)
    try {
      const payload: any = { qrCodeId: scannedCode }
      if (identifyBy === 'pin') payload.pin = identifyValue.trim()
      else if (identifyBy === 'phone') payload.phone = identifyValue.trim()
      else payload.email = identifyValue.trim()

      const res = await fetch('/api/attendance/public-identify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || 'Error al identificar')
      }
      setSelectedEmployeeId(data.employee.id)
      setSelectedEmployeeName(`${data.employee.firstName} ${data.employee.lastName}`)
      toast.success(`¡Bienvenido, ${data.employee.firstName}!`)
      checkPendingCheckIn()
    } catch (err: any) {
      toast.error(err.message || 'Empleado no encontrado')
    } finally {
      setLoadingEmployees(false)
    }
  }

  // ── Selfie Camera ───────────────────────────────────────────────────────────

  const startSelfieCamera = async () => {
    setStep('selfie')
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

    // Mirror the image (selfie style)
    ctx.translate(canvas.width, 0)
    ctx.scale(-1, 1)
    ctx.drawImage(video, 0, 0)
    ctx.setTransform(1, 0, 0, 1, 0, 0) // reset

    const dataUrl = canvas.toDataURL('image/jpeg', 0.8)
    setSelfieData(dataUrl)

    // Stop the selfie stream
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
      toast.error('No se pudo acceder a la cámara')
    }
  }

  const stopSelfieStream = () => {
    if (selfieStreamRef.current) {
      selfieStreamRef.current.getTracks().forEach((t) => t.stop())
      selfieStreamRef.current = null
    }
  }

  // ── GPS ─────────────────────────────────────────────────────────────────────

  const captureGps = (): Promise<void> => {
    setGpsLoading(true)
    setGpsError('')
    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        setGpsError('Geolocalización no disponible en este navegador')
        setGpsLoading(false)
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
          setGpsLoading(false)
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
              msg = 'Tiempo de espera agotado al obtener ubicación'
              break
          }
          setGpsError(msg)
          setGpsLoading(false)
          resolve()
        },
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
      )
    })
  }

  // ── Proceed to GPS & Confirm ────────────────────────────────────────────────

  const proceedToGps = async () => {
    stopSelfieStream()
    setStep('gps')
    await captureGps()
    setStep('confirm')
  }

  // ── Submit ──────────────────────────────────────────────────────────────────

  const handleSubmit = async () => {
    if (!selectedEmployeeId) {
      toast.error('Selecciona un empleado')
      return
    }
    if (!scannedCode) {
      toast.error('No hay código QR verificado')
      return
    }

    setSubmitting(true)
    try {
      const payload: Record<string, any> = {
        qrCodeId: scannedCode,
        employeeId: selectedEmployeeId,
        recordType,
        latitude: gpsData?.latitude ?? null,
        longitude: gpsData?.longitude ?? null,
        gpsAccuracy: gpsData?.accuracy ?? null,
        selfieData: selfieData || null,
        deviceInfo: navigator.userAgent,
        notes: gpsError ? `GPS: ${gpsError}` : null,
      }

      // Use PUBLIC checkin API (no auth needed for QR-based attendance)
      const res = await fetch('/api/attendance/public-checkin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}))
        throw new Error(errData.error || errData.message || 'Error al registrar asistencia')
      }

      const result = await res.json()
      setSuccessData({
        time: new Date().toLocaleTimeString('es-MX', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        }),
        branchName,
        recordType: recordType === 'check_in' ? 'Entrada' : 'Salida',
        status: result.status === 'late' ? 'Retardo' : 'A Tiempo',
      })
      setStep('success')
      toast.success('¡Asistencia registrada con éxito!')
    } catch (err: any) {
      toast.error(err.message || 'Error al registrar asistencia')
    } finally {
      setSubmitting(false)
    }
  }

  // ── Reset ───────────────────────────────────────────────────────────────────

  const handleReset = () => {
    stopSelfieStream()
    setStep('idle')
    setScannedCode('')
    setManualCode('')
    setBranchName('')
    setSelfieData('')
    setGpsData(null)
    setGpsLoading(false)
    setGpsError('')
    setRecordType('check_in')
    setHasPendingCheckIn(false)
    setSubmitting(false)
    setSuccessData(null)
  }

  const handleBack = () => {
    stopSelfieStream()
    if (step === 'scanning') {
      stopScanner()
      setStep('idle')
    } else if (step === 'verified') {
      setStep('idle')
      setScannedCode('')
      setBranchName('')
    } else if (step === 'selfie') {
      stopSelfieStream()
      setStep('verified')
      setSelfieData('')
    } else if (step === 'gps') {
      setStep('selfie')
    } else if (step === 'confirm') {
      setStep('verified')
    } else {
      handleReset()
    }
  }

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="mx-auto max-w-md space-y-4 pb-8">
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-3 mb-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            const isAuth = useAppStore.getState().isAuthenticated
            if (step !== 'idle') {
              handleBack()
            } else {
              navigate(isAuth ? 'dashboard' : 'landing')
            }
          }}
          className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="text-center flex-1">
          <h1 className="text-2xl font-bold tracking-tight">Marcar Asistencia</h1>
          <p className="text-sm text-muted-foreground mt-1">{formatDateES()}</p>
        </div>
        <div className="w-8" /> {/* Spacer to center the title */}
      </div>

      {/* ── QR Loading ──────────────────────────────────────────────────── */}
      {loadingQr && (
        <Card>
          <CardContent className="p-4 flex flex-col items-center gap-3 py-8">
            <div className="relative">
              <div className="h-12 w-12 rounded-full border-4 border-emerald-200 border-t-emerald-600 animate-spin" />
              <QrCode className="h-5 w-5 text-emerald-600 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
            </div>
            <p className="text-sm text-muted-foreground">Verificando código QR...</p>
          </CardContent>
        </Card>
      )}

      {/* ── Employee Select ────────────────────────────────────────────────── */}
      {!loadingQr && step !== 'success' && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-100">
                <User className="h-5 w-5 text-emerald-600" />
              </div>
              <div className="flex-1 min-w-0">
                <Label className="text-xs text-muted-foreground mb-1 block">Empleado</Label>
                {loadingEmployees ? (
                  <Skeleton className="h-9 w-full" />
                ) : (
                  <Select
                    value={selectedEmployeeId || undefined}
                    onValueChange={(v) => {
                      setSelectedEmployeeId(v)
                      if (scannedCode) checkPendingCheckIn()
                    }}
                  >
                    <SelectTrigger className="h-9">
                      <SelectValue placeholder="Selecciona tu nombre..." />
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
      )}

      {/* ── Step: IDLE ──────────────────────────────────────────────────────── */}
      {step === 'idle' && (
        <div className="space-y-4">
          {/* Scan Button */}
          <Button
            className="w-full h-14 text-base font-semibold gap-3 bg-emerald-600 hover:bg-emerald-700 text-white"
            size="lg"
            onClick={startScanner}
          >
            <QrCode className="h-6 w-6" />
            Escanear Código QR
          </Button>

          <Separator className="my-4">
            <span className="text-xs text-muted-foreground px-2">o</span>
          </Separator>

          {/* Manual Input */}
          <div className="space-y-2">
            <Label className="text-sm text-muted-foreground">
              O ingresa el código manualmente:
            </Label>
            <div className="flex gap-2">
              <Input
                placeholder="UUID del código QR"
                value={manualCode}
                onChange={(e) => setManualCode(e.target.value)}
                className="flex-1 font-mono text-sm"
                onKeyDown={(e) => e.key === 'Enter' && handleManualVerify()}
              />
              <Button
                variant="outline"
                className="shrink-0 border-emerald-300 text-emerald-700 hover:bg-emerald-50"
                onClick={handleManualVerify}
              >
                Verificar
              </Button>
            </div>
          </div>

          {/* Info card */}
          <Card className="border-dashed bg-muted/30">
            <CardContent className="p-4 flex flex-col items-center gap-2 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100">
                <Camera className="h-6 w-6 text-emerald-600" />
              </div>
              <p className="text-sm font-medium">Apunta la cámara al código QR</p>
              <p className="text-xs text-muted-foreground">
                Asegúrate de tener buena iluminación y que el código QR esté visible
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ── Step: SCANNING ──────────────────────────────────────────────────── */}
      {step === 'scanning' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Button variant="ghost" size="sm" onClick={handleBack} className="gap-2 text-muted-foreground">
              <ArrowLeft className="h-4 w-4" />
              Cancelar
            </Button>
            <Badge variant="outline" className="border-emerald-300 bg-emerald-50 text-emerald-700 animate-pulse">
              Escaneando...
            </Badge>
          </div>

          <div className="rounded-xl overflow-hidden border-2 border-emerald-500 bg-black">
            <div
              id="qr-reader-element"
              style={{ width: '100%', minHeight: '300px' }}
            />
          </div>

          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <div className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            Buscando código QR...
          </div>
        </div>
      )}

      {/* ── Step: VERIFIED ─────────────────────────────────────────────────── */}
      {step === 'verified' && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <Button variant="ghost" size="sm" onClick={handleBack} className="gap-2 text-muted-foreground">
              <ArrowLeft className="h-4 w-4" />
              Volver
            </Button>
          </div>

          <Card className="border-emerald-200 bg-emerald-50/50">
            <CardContent className="p-4 text-center space-y-3">
              <CheckCircle2 className="h-12 w-12 text-emerald-600 mx-auto" />
              <div>
                <p className="text-lg font-bold text-emerald-700">QR Verificado ✓</p>
                <p className="text-sm text-muted-foreground mt-1">
                  {branchName || 'Sucursal'}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Employee Identification */}
          {!selectedEmployeeId ? (
            <Card className="border-blue-200 bg-blue-50/50">
              <CardContent className="p-4 space-y-4">
                <div className="text-center">
                  <User className="h-10 w-10 text-blue-600 mx-auto mb-2" />
                  <p className="font-medium text-blue-700">Identifícate</p>
                  <p className="text-xs text-muted-foreground">Ingresa tu PIN, teléfono o email</p>
                </div>

                {/* Method Selection */}
                <div className="grid grid-cols-3 gap-2">
                  <Button
                    type="button"
                    variant={identifyBy === 'pin' ? 'default' : 'outline'}
                    size="sm"
                    className={identifyBy === 'pin' ? 'bg-blue-600' : 'border-blue-200'}
                    onClick={() => { setIdentifyBy('pin'); setIdentifyValue('') }}
                  >
                    🔐 PIN
                  </Button>
                  <Button
                    type="button"
                    variant={identifyBy === 'phone' ? 'default' : 'outline'}
                    size="sm"
                    className={identifyBy === 'phone' ? 'bg-blue-600' : 'border-blue-200'}
                    onClick={() => { setIdentifyBy('phone'); setIdentifyValue('') }}
                  >
                    📱 Teléfono
                  </Button>
                  <Button
                    type="button"
                    variant={identifyBy === 'email' ? 'default' : 'outline'}
                    size="sm"
                    className={identifyBy === 'email' ? 'bg-blue-600' : 'border-blue-200'}
                    onClick={() => { setIdentifyBy('email'); setIdentifyValue('') }}
                  >
                    📧 Email
                  </Button>
                </div>

                {/* Input */}
                <div className="flex gap-2">
                  <Input
                    type={identifyBy === 'pin' ? 'tel' : identifyBy === 'email' ? 'email' : 'tel'}
                    placeholder={
                      identifyBy === 'pin' ? 'Ingresa tu PIN de 6 dígitos' :
                      identifyBy === 'phone' ? 'Ingresa tu número de teléfono' :
                      'Ingresa tu correo electrónico'
                    }
                    value={identifyValue}
                    onChange={(e) => setIdentifyValue(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleIdentifyEmployee()}
                    className="flex-1"
                    maxLength={identifyBy === 'pin' ? 6 : undefined}
                  />
                  <Button
                    onClick={handleIdentifyEmployee}
                    disabled={loadingEmployees}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    {loadingEmployees ? <RefreshCw className="h-4 w-4 animate-spin" /> : 'Identificar'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="border-emerald-200 bg-emerald-50">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-emerald-100 flex items-center justify-center">
                  <User className="h-5 w-5 text-emerald-600" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-emerald-700">{selectedEmployeeName}</p>
                  <p className="text-xs text-muted-foreground">Identificado ✓</p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => { setSelectedEmployeeId(''); setSelectedEmployeeName('') }}
                >
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Record Type Selection */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Tipo de Registro</Label>
            {hasPendingCheckIn && (
              <p className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-md p-2">
                Ya tienes una entrada registrada hoy. Se recomienda registrar tu salida.
              </p>
            )}
            <div className="grid grid-cols-2 gap-3">
              <Button
                type="button"
                variant={recordType === 'check_in' ? 'default' : 'outline'}
                className={cn(
                  'h-16 text-base font-semibold gap-2 flex-col',
                  recordType === 'check_in'
                    ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                    : 'border-emerald-200 text-emerald-700 hover:bg-emerald-50'
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
                  'h-16 text-base font-semibold gap-2 flex-col',
                  recordType === 'check_out'
                    ? 'bg-red-600 hover:bg-red-700 text-white'
                    : 'border-red-200 text-red-700 hover:bg-red-50'
                )}
                onClick={() => setRecordType('check_out')}
              >
                <span className="text-2xl">🔴</span>
                Salida
              </Button>
            </div>
          </div>

          {/* Selfie Button */}
          <Button
            className="w-full h-12 gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
            onClick={startSelfieCamera}
          >
            <Camera className="h-5 w-5" />
            Continuar — Tomar Foto
          </Button>
        </div>
      )}

      {/* ── Step: SELFIE ────────────────────────────────────────────────────── */}
      {step === 'selfie' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Button variant="ghost" size="sm" onClick={handleBack} className="gap-2 text-muted-foreground">
              <ArrowLeft className="h-4 w-4" />
              Atrás
            </Button>
            <Badge variant="outline" className="border-emerald-300 bg-emerald-50 text-emerald-700">
              Foto de Verificación
            </Badge>
          </div>

          <Card>
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Camera className="h-4 w-4 text-emerald-600" />
                Toma una foto para verificar tu identidad
              </div>

              {/* Video / Preview */}
              <div className="relative rounded-xl overflow-hidden bg-black aspect-[4/3] flex items-center justify-center">
                {selfieData ? (
                  <img
                    src={selfieData}
                    alt="Selfie capturada"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <video
                    ref={selfieVideoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover"
                    style={{ transform: 'scaleX(-1)' }}
                  />
                )}

                {/* Face guide overlay */}
                {!selfieData && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="w-40 h-52 rounded-full border-2 border-dashed border-white/40" />
                  </div>
                )}
              </div>

              <canvas ref={selfieCanvasRef} className="hidden" />

              {/* Action buttons */}
              {selfieData ? (
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
                    className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
                    onClick={proceedToGps}
                  >
                    Continuar
                    <ArrowLeft className="h-4 w-4 rotate-180" />
                  </Button>
                </div>
              ) : (
                <Button
                  className="w-full h-12 gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
                  onClick={captureSelfie}
                >
                  <Camera className="h-5 w-5" />
                  Capturar Foto
                </Button>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* ── Step: GPS (brief) ──────────────────────────────────────────────── */}
      {step === 'gps' && (
        <div className="space-y-4 flex flex-col items-center py-12">
          <div className="relative">
            <div className="h-16 w-16 rounded-full border-4 border-emerald-200 border-t-emerald-600 animate-spin" />
            <MapPin className="h-6 w-6 text-emerald-600 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
          </div>
          <p className="text-lg font-semibold text-muted-foreground">
            Obteniendo ubicación...
          </p>
          <p className="text-sm text-muted-foreground">
            Esto puede tomar unos segundos
          </p>
        </div>
      )}

      {/* ── Step: CONFIRM ──────────────────────────────────────────────────── */}
      {step === 'confirm' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Button variant="ghost" size="sm" onClick={handleBack} className="gap-2 text-muted-foreground">
              <ArrowLeft className="h-4 w-4" />
              Atrás
            </Button>
            <Badge variant="outline" className="border-emerald-300 bg-emerald-50 text-emerald-700">
              Confirmar
            </Badge>
          </div>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Resumen de Registro</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Branch */}
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-100">
                  <QrCode className="h-4 w-4 text-emerald-600" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-muted-foreground">Sucursal</p>
                  <p className="text-sm font-medium truncate">{branchName || 'Desconocida'}</p>
                </div>
              </div>

              <Separator />

              {/* Record Type */}
              <div className="flex items-center gap-3">
                <div className={cn(
                  'flex h-9 w-9 shrink-0 items-center justify-center rounded-lg',
                  recordType === 'check_in' ? 'bg-emerald-100' : 'bg-red-100',
                )}>
                  <Clock className={cn(
                    'h-4 w-4',
                    recordType === 'check_in' ? 'text-emerald-600' : 'text-red-600',
                  )} />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Tipo</p>
                  <p className="text-sm font-medium">
                    {recordType === 'check_in' ? '🟢 Entrada' : '🔴 Salida'}
                  </p>
                </div>
              </div>

              <Separator />

              {/* Selfie thumbnail */}
              {selfieData && (
                <>
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-100">
                      <Camera className="h-4 w-4 text-emerald-600" />
                    </div>
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <p className="text-xs text-muted-foreground shrink-0">Foto</p>
                      <div className="h-8 w-8 rounded-full overflow-hidden border-2 border-emerald-300">
                        <img src={selfieData} alt="Selfie" className="w-full h-full object-cover" />
                      </div>
                      <Badge variant="outline" className="text-[10px] bg-emerald-50 text-emerald-700 border-emerald-200">
                        ✓ Capturada
                      </Badge>
                    </div>
                  </div>
                  <Separator />
                </>
              )}

              {/* GPS */}
              <div className="flex items-center gap-3">
                <div className={cn(
                  'flex h-9 w-9 shrink-0 items-center justify-center rounded-lg',
                  gpsData ? 'bg-emerald-100' : 'bg-amber-100',
                )}>
                  <MapPin className={cn(
                    'h-4 w-4',
                    gpsData ? 'text-emerald-600' : 'text-amber-600',
                  )} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-muted-foreground">
                    {gpsData ? 'Ubicación obtenida ✓' : 'Sin ubicación'}
                  </p>
                  {gpsData ? (
                    <p className="text-xs font-mono text-muted-foreground truncate">
                      {gpsData.latitude.toFixed(6)}, {gpsData.longitude.toFixed(6)}
                      <span className="text-[10px] ml-1">
                        (±{Math.round(gpsData.accuracy)}m)
                      </span>
                    </p>
                  ) : (
                    <p className="text-xs text-amber-600">{gpsError || 'No disponible'}</p>
                  )}
                </div>
              </div>

              <Separator />

              {/* Current Time */}
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100">
                  <Smartphone className="h-4 w-4 text-slate-600" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Hora actual</p>
                  <p className="text-sm font-medium">
                    {new Date().toLocaleTimeString('es-MX', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Confirm Button */}
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
                Confirmar Asistencia
              </>
            )}
          </Button>
        </div>
      )}

      {/* ── Step: SUCCESS ──────────────────────────────────────────────────── */}
      {step === 'success' && successData && (
        <div className="space-y-6 py-6">
          {/* Animated checkmark */}
          <div className="flex flex-col items-center gap-4">
            <div className="relative">
              <div className="h-24 w-24 rounded-full bg-emerald-100 flex items-center justify-center animate-[scale-in_0.5s_ease-out]">
                <CheckCircle2 className="h-14 w-14 text-emerald-600" />
              </div>
              <div className="absolute inset-0 h-24 w-24 rounded-full border-4 border-emerald-300 animate-ping opacity-20" />
            </div>
            <div className="text-center">
              <h2 className="text-2xl font-bold text-emerald-700">
                ¡Asistencia Registrada!
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                Tu registro se ha guardado correctamente
              </p>
            </div>
          </div>

          {/* Success details card */}
          <Card className="border-emerald-200">
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
                  <QrCode className="h-4 w-4" />
                  Tipo
                </div>
                <Badge
                  className={cn(
                    'font-semibold',
                    successData.recordType === 'Entrada'
                      ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-100'
                      : 'bg-red-100 text-red-700 hover:bg-red-100',
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
                    <XCircle className="h-4 w-4 text-amber-600" />
                  )}
                  Estado
                </div>
                <Badge
                  className={cn(
                    'font-semibold',
                    successData.status === 'A Tiempo'
                      ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-100'
                      : 'bg-amber-100 text-amber-700 hover:bg-amber-100',
                  )}
                  variant="outline"
                >
                  {successData.status}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Restart button */}
          <Button
            className="w-full h-12 gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
            onClick={handleReset}
          >
            <RefreshCw className="h-5 w-5" />
            Volver a Escanear
          </Button>
        </div>
      )}
    </div>
  )
}
