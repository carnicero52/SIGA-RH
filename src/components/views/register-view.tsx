'use client'

import { useState } from 'react'
import { useAppStore } from '@/store/app-store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Eye, EyeOff, Loader2, ArrowLeft, Building2, UserCircle } from 'lucide-react'
import { toast } from 'sonner'

export function RegisterView() {
  const navigate = useAppStore((s) => s.navigate)

  // Company fields
  const [companyName, setCompanyName] = useState('')
  const [taxId, setTaxId] = useState('')
  const [companyEmail, setCompanyEmail] = useState('')
  const [companyPhone, setCompanyPhone] = useState('')

  // User fields
  const [adminName, setAdminName] = useState('')
  const [adminEmail, setAdminEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  // Terms
  const [acceptedTerms, setAcceptedTerms] = useState(false)

  // State
  const [loading, setLoading] = useState(false)
  const [useCompanyEmail, setUseCompanyEmail] = useState(true)

  const handleCompanyEmailChange = (val: string) => {
    setCompanyEmail(val)
    if (useCompanyEmail) {
      setAdminEmail(val)
    }
  }

  const handleUseCompanyEmailToggle = () => {
    const newVal = !useCompanyEmail
    setUseCompanyEmail(newVal)
    if (newVal) {
      setAdminEmail(companyEmail)
    } else {
      setAdminEmail('')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validation
    if (!companyName.trim()) {
      toast.error('El nombre de la empresa es requerido')
      return
    }
    if (!companyEmail.trim()) {
      toast.error('El email de la empresa es requerido')
      return
    }
    if (!adminName.trim()) {
      toast.error('El nombre del administrador es requerido')
      return
    }
    if (!adminEmail.trim()) {
      toast.error('El email del administrador es requerido')
      return
    }
    if (password.length < 8) {
      toast.error('La contraseña debe tener al menos 8 caracteres')
      return
    }
    if (password !== confirmPassword) {
      toast.error('Las contraseñas no coinciden')
      return
    }
    if (!acceptedTerms) {
      toast.error('Debes aceptar los términos y condiciones')
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyName: companyName.trim(),
          taxId: taxId.trim() || undefined,
          companyEmail: companyEmail.trim(),
          companyPhone: companyPhone.trim() || undefined,
          adminName: adminName.trim(),
          adminEmail: adminEmail.trim(),
          password,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error || 'Error al registrar la empresa')
        return
      }
      toast.success('Empresa registrada exitosamente. Inicia sesión.')
      navigate('login')
    } catch {
      toast.error('Error de conexión. Intenta de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background via-background to-primary/5 p-4">
      <div className="w-full max-w-lg">
        {/* Logo */}
        <div className="mb-6 text-center">
          <button
            onClick={() => navigate('landing')}
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver al inicio
          </button>
        </div>

        <div className="mb-6 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 overflow-hidden shadow-lg">
            <img src="/logo.png" alt="SIGA-RH" className="h-10 w-10 object-contain" />
          </div>
          <h1 className="mt-4 text-2xl font-bold tracking-tight">Crear Cuenta</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Registra tu empresa y comienza a usar SIGA-RH
          </p>
        </div>

        <Card className="border-border/50 shadow-xl">
          <CardContent className="p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Company Section */}
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10">
                    <Building2 className="h-4 w-4 text-emerald-600" />
                  </div>
                  <h2 className="font-semibold">Datos de la Empresa</h2>
                </div>
                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="companyName">Nombre de la empresa *</Label>
                    <Input
                      id="companyName"
                      placeholder="Mi Empresa S.A. de C.V."
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      required
                      disabled={loading}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label htmlFor="taxId">RFC</Label>
                      <Input
                        id="taxId"
                        placeholder="XAXX010101000"
                        value={taxId}
                        onChange={(e) => setTaxId(e.target.value.toUpperCase())}
                        disabled={loading}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="companyPhone">Teléfono</Label>
                      <Input
                        id="companyPhone"
                        placeholder="+52 55 1234 5678"
                        value={companyPhone}
                        onChange={(e) => setCompanyPhone(e.target.value)}
                        disabled={loading}
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="companyEmail">Email de la empresa *</Label>
                    <Input
                      id="companyEmail"
                      type="email"
                      placeholder="contacto@miempresa.com"
                      value={companyEmail}
                      onChange={(e) => handleCompanyEmailChange(e.target.value)}
                      required
                      disabled={loading}
                    />
                  </div>
                </div>
              </div>

              <Separator />

              {/* Admin Section */}
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10">
                    <UserCircle className="h-4 w-4 text-emerald-600" />
                  </div>
                  <h2 className="font-semibold">Datos del Administrador</h2>
                </div>
                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="adminName">Nombre completo *</Label>
                    <Input
                      id="adminName"
                      placeholder="Juan Pérez García"
                      value={adminName}
                      onChange={(e) => setAdminName(e.target.value)}
                      required
                      disabled={loading}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="adminEmail">Email *</Label>
                      <button
                        type="button"
                        onClick={handleUseCompanyEmailToggle}
                        className="text-xs text-emerald-600 hover:text-emerald-500 dark:text-emerald-400"
                      >
                        {useCompanyEmail ? 'Usar otro email' : 'Usar email de la empresa'}
                      </button>
                    </div>
                    <Input
                      id="adminEmail"
                      type="email"
                      placeholder="admin@miempresa.com"
                      value={adminEmail}
                      onChange={(e) => {
                        setAdminEmail(e.target.value)
                        setUseCompanyEmail(false)
                      }}
                      required
                      disabled={loading}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label htmlFor="password">Contraseña *</Label>
                      <div className="relative">
                        <Input
                          id="password"
                          type={showPassword ? 'text' : 'password'}
                          placeholder="Mín. 8 caracteres"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          required
                          minLength={8}
                          className="pr-10"
                          disabled={loading}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="confirmPassword">Confirmar *</Label>
                      <div className="relative">
                        <Input
                          id="confirmPassword"
                          type={showConfirmPassword ? 'text' : 'password'}
                          placeholder="Repetir contraseña"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          required
                          className="pr-10"
                          disabled={loading}
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                        >
                          {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Terms */}
              <div className="flex items-start gap-3">
                <Checkbox
                  id="terms"
                  checked={acceptedTerms}
                  onCheckedChange={(checked) => setAcceptedTerms(checked === true)}
                  disabled={loading}
                  className="mt-0.5"
                />
                <Label htmlFor="terms" className="text-sm leading-relaxed cursor-pointer">
                  Acepto los{' '}
                  <span className="text-emerald-600 hover:underline dark:text-emerald-400 cursor-pointer">
                    términos y condiciones
                  </span>{' '}
                  y la{' '}
                  <span className="text-emerald-600 hover:underline dark:text-emerald-400 cursor-pointer">
                    política de privacidad
                  </span>
                </Label>
              </div>

              {/* Submit */}
              <Button type="submit" className="w-full h-10" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Registrando...
                  </>
                ) : (
                  'Crear Cuenta'
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        <div className="mt-6 text-center text-sm">
          <span className="text-muted-foreground">¿Ya tienes una cuenta? </span>
          <button
            onClick={() => navigate('login')}
            className="font-medium text-emerald-600 hover:text-emerald-500 dark:text-emerald-400"
          >
            Iniciar Sesión
          </button>
        </div>

        <p className="mt-4 text-center text-xs text-muted-foreground">
          SIGA-RH &mdash; Gestión de RRHH Inteligente
        </p>
      </div>
    </div>
  )
}
