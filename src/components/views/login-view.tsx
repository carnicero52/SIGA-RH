'use client'

import { useState } from 'react'
import { useAppStore } from '@/store/app-store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Shield, Eye, EyeOff, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

export function LoginView() {
  const { login, setCompany, navigate } = useAppStore()
  const [email, setEmail] = useState('admin@siga-demo.com')
  const [password, setPassword] = useState('admin123')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error || 'Error al iniciar sesión')
        return
      }
      localStorage.setItem('siga_token', data.token)
      login(data.user)
      setCompany(data.user.companyName, data.user.companyLogo)
      toast.success(`Bienvenido, ${data.user.name}`)
    } catch {
      toast.error('Error de conexión')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background via-background to-primary/5 p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="mb-8 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 overflow-hidden shadow-lg">
            <img src="/logo.png" alt="SIGA-RH" className="h-12 w-12 object-contain" />
          </div>
          <h1 className="mt-4 text-2xl font-bold tracking-tight">SIGA-RH</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Sistema de Gestión de Asistencia y Recursos Humanos
          </p>
        </div>

        <Card className="border-border/50 shadow-xl">
          <CardHeader className="space-y-1 pb-4">
            <CardTitle className="text-xl">Iniciar Sesión</CardTitle>
            <CardDescription>
              Ingresa tus credenciales para acceder al sistema
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Correo electrónico</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="admin@siga-demo.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="h-10"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Contraseña</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="h-10 pr-10"
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
              <Button type="submit" className="w-full h-10" disabled={loading}>
                {loading ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Ingresando...</>
                ) : (
                  'Iniciar Sesión'
                )}
              </Button>
            </form>

            <div className="mt-6 rounded-lg border bg-muted/50 p-3">
              <p className="text-xs text-muted-foreground">
                <strong>Demo:</strong> admin@siga-demo.com / admin123
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="mt-4 text-center text-sm">
          <span className="text-muted-foreground">¿No tienes cuenta? </span>
          <button
            onClick={() => navigate('register')}
            className="font-medium text-emerald-600 hover:text-emerald-500 dark:text-emerald-400"
          >
            Regístrate aquí
          </button>
        </div>

        <button
          onClick={() => navigate('landing')}
          className="mt-3 flex items-center justify-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors mx-auto"
        >
          ← Volver al inicio
        </button>

        <p className="mt-4 text-center text-xs text-muted-foreground">
          SIGA-RH v2.0 &mdash; Control de Asistencia Inteligente y Antifraude
        </p>
      </div>
    </div>
  )
}
