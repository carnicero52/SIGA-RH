'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog'
import { Toaster, toast } from 'sonner'
import {
  Building2, Users, Clock, Globe, CheckCircle2, XCircle,
  AlertTriangle, DollarSign, Search, RefreshCw, Shield,
} from 'lucide-react'

// ─────────────────────────────────────────────────────────────────────────────

const PLAN_LABELS: Record<string, string> = {
  free: 'Gratuito',
  professional: 'Profesional',
  enterprise: 'Empresarial',
}

const STATUS_COLORS: Record<string, string> = {
  active:    'bg-emerald-100 text-emerald-700 border-emerald-200',
  trial:     'bg-blue-100 text-blue-700 border-blue-200',
  suspended: 'bg-red-100 text-red-700 border-red-200',
  cancelled: 'bg-gray-100 text-gray-600 border-gray-200',
}

const STATUS_ICONS: Record<string, string> = {
  active:    '✅',
  trial:     '⏳',
  suspended: '🚫',
  cancelled: '❌',
}

// ─────────────────────────────────────────────────────────────────────────────

export default function SuperAdminPage() {
  const [secret, setSecret] = useState('')
  const [authed, setAuthed] = useState(false)
  const [companies, setCompanies] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [editCompany, setEditCompany] = useState<any>(null)
  const [saving, setSaving] = useState(false)
  const [autoRefresh, setAutoRefresh] = useState(true)

  // Auto-refresh every 10 seconds
  useEffect(() => {
    if (!authed || !autoRefresh) return
    const interval = setInterval(() => {
      fetchCompanies(false) // false = don't show loading indicator
    }, 10000)
    return () => clearInterval(interval)
  }, [authed, autoRefresh])

  const superHeaders = () => ({
    'x-superadmin-secret': secret,
    'Content-Type': 'application/json',
  })

  const fetchCompanies = async (showLoading = true) => {
    if (showLoading) setLoading(true)
    try {
      const res = await fetch(`/api/superadmin/companies?secret=${encodeURIComponent(secret)}`, { headers: superHeaders() })
      if (!res.ok) throw new Error('No autorizado')
      setCompanies(await res.json())
      setAuthed(true)
    } catch (e: any) {
      toast.error(e.message || 'Error al cargar')
      setAuthed(false)
    } finally {
      if (showLoading) setLoading(false)
    }
  }

  const handleSave = async () => {
    if (!editCompany) return
    setSaving(true)
    try {
      const res = await fetch(`/api/superadmin/companies/${editCompany.id}?secret=${encodeURIComponent(secret)}`, {
        method: 'PUT',
        headers: superHeaders(),
        body: JSON.stringify({
          plan: editCompany.plan,
          planStatus: editCompany.planStatus,
          maxEmployees: editCompany.maxEmployees,
          adminNotes: editCompany.adminNotes,
          planExpiresAt: editCompany.planExpiresAt || null,
          trialEndsAt: editCompany.trialEndsAt || null,
        }),
      })
      if (!res.ok) throw new Error('Error al guardar')
      toast.success('Empresa actualizada')
      setEditCompany(null)
      fetchCompanies()
    } catch (e: any) {
      toast.error(e.message)
    } finally {
      setSaving(false)
    }
  }

  const quickAction = async (companyId: string, action: 'suspend' | 'activate') => {
    try {
      const res = await fetch(`/api/superadmin/companies/${companyId}?secret=${encodeURIComponent(secret)}`, {
        method: 'PUT',
        headers: superHeaders(),
        body: JSON.stringify({ planStatus: action === 'suspend' ? 'suspended' : 'active' }),
      })
      if (!res.ok) throw new Error('Error')
      toast.success(action === 'suspend' ? '🚫 Empresa suspendida' : '✅ Empresa activada')
      fetchCompanies()
    } catch (e: any) {
      toast.error(e.message)
    }
  }

  const filtered = companies.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.email?.toLowerCase().includes(search.toLowerCase()) ||
    c.country?.toLowerCase().includes(search.toLowerCase())
  )

  const stats = {
    total: companies.length,
    active: companies.filter(c => c.planStatus === 'active').length,
    suspended: companies.filter(c => c.planStatus === 'suspended').length,
    totalEmployees: companies.reduce((s, c) => s + (c.activeEmployees || 0), 0),
    pro: companies.filter(c => c.plan === 'professional').length,
    enterprise: companies.filter(c => c.plan === 'enterprise').length,
  }

  // ── Auth gate ─────────────────────────────────────────────────────────────

  if (!authed) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
        <Toaster richColors position="top-center" />
        <Card className="w-full max-w-sm border-gray-800 bg-gray-900 text-white">
          <CardContent className="p-8 space-y-5">
            <div className="text-center">
              <div className="h-14 w-14 rounded-2xl bg-emerald-600 flex items-center justify-center mx-auto mb-4">
                <Shield className="h-7 w-7 text-white" />
              </div>
              <h1 className="text-xl font-bold">Super Admin</h1>
              <p className="text-sm text-gray-400 mt-1">SIGA-RH — Panel de Control</p>
            </div>
            <div className="space-y-2">
              <Label className="text-gray-300">Clave de acceso</Label>
              <Input
                type="password"
                value={secret}
                onChange={(e) => setSecret(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && fetchCompanies()}
                placeholder="••••••••••"
                className="bg-gray-800 border-gray-700 text-white"
              />
            </div>
            <Button onClick={fetchCompanies} disabled={loading} className="w-full bg-emerald-600 hover:bg-emerald-700">
              {loading ? 'Verificando...' : 'Ingresar'}
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // ── Dashboard ─────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <Toaster richColors position="top-right" />

      {/* Header */}
      <header className="border-b border-gray-800 bg-gray-900 px-6 py-4">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-emerald-600 flex items-center justify-center">
              <Shield className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-lg">SIGA-RH Super Admin</h1>
              <p className="text-xs text-gray-400">Panel de gestión de clientes</p>
            </div>
          </div>
          <Button variant="outline" size="sm" className="border-gray-700 text-gray-300 hover:bg-gray-800" onClick={fetchCompanies} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} /> Actualizar
          </Button>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
          {[
            { label: 'Total Empresas', value: stats.total, icon: Building2, color: 'text-white' },
            { label: 'Activas', value: stats.active, icon: CheckCircle2, color: 'text-emerald-400' },
            { label: 'Suspendidas', value: stats.suspended, icon: XCircle, color: 'text-red-400' },
            { label: 'Profesional', value: stats.pro, icon: DollarSign, color: 'text-amber-400' },
            { label: 'Empresarial', value: stats.enterprise, icon: Globe, color: 'text-purple-400' },
            { label: 'Empleados Total', value: stats.totalEmployees, icon: Users, color: 'text-blue-400' },
          ].map(({ label, value, icon: Icon, color }) => (
            <Card key={label} className="bg-gray-900 border-gray-800">
              <CardContent className="p-4 flex items-center gap-3">
                <Icon className={`h-6 w-6 shrink-0 ${color}`} />
                <div>
                  <p className="text-2xl font-bold text-white">{value}</p>
                  <p className="text-xs text-gray-400">{label}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Search */}
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar empresa, email o país..."
            className="pl-9 bg-gray-900 border-gray-700 text-white placeholder-gray-500"
          />
        </div>

        {/* Companies table */}
        <div className="space-y-3">
          {filtered.map((company) => {
            const usagePct = Math.round((company.activeEmployees / company.maxEmployees) * 100)
            const isNearLimit = usagePct >= 80
            const isOverLimit = company.activeEmployees >= company.maxEmployees

            return (
              <Card key={company.id} className="bg-gray-900 border-gray-800 hover:border-gray-600 transition-colors">
                <CardContent className="p-5">
                  <div className="flex flex-col md:flex-row md:items-center gap-4">

                    {/* Company info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <h3 className="font-semibold text-white truncate">{company.name}</h3>
                        <Badge className={`text-xs border ${STATUS_COLORS[company.planStatus] || STATUS_COLORS.active}`}>
                          {STATUS_ICONS[company.planStatus]} {company.planStatus === 'active' ? 'Activa' : company.planStatus === 'suspended' ? 'Suspendida' : company.planStatus === 'trial' ? 'Trial' : 'Cancelada'}
                        </Badge>
                        <Badge variant="outline" className="text-xs border-gray-700 text-gray-300">
                          {PLAN_LABELS[company.plan] || company.plan}
                        </Badge>
                      </div>
                      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-400">
                        <span>📧 {company.email || 'Sin email'}</span>
                        <span>🌎 {company.country || 'N/A'}</span>
                        <span>📅 Registrada: {new Date(company.createdAt).toLocaleDateString('es')}</span>
                        {company.lastActivityAt && (
                          <span>⚡ Última actividad: {new Date(company.lastActivityAt).toLocaleDateString('es')}</span>
                        )}
                      </div>
                    </div>

                    {/* Usage */}
                    <div className="flex items-center gap-6 text-center shrink-0">
                      <div>
                        <p className={`text-xl font-bold ${isOverLimit ? 'text-red-400' : isNearLimit ? 'text-amber-400' : 'text-white'}`}>
                          {company.activeEmployees} / {company.maxEmployees}
                        </p>
                        <p className="text-xs text-gray-400">Empleados</p>
                        {isNearLimit && (
                          <p className="text-[10px] text-amber-400 mt-0.5">{usagePct}% del límite</p>
                        )}
                      </div>
                      <div>
                        <p className="text-xl font-bold text-white">{company._count?.branches || 0}</p>
                        <p className="text-xs text-gray-400">Sucursales</p>
                      </div>
                      <div>
                        <p className="text-xl font-bold text-white">{company._count?.attendanceRecords || 0}</p>
                        <p className="text-xs text-gray-400">Registros</p>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 shrink-0">
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-gray-700 text-gray-300 hover:bg-gray-800"
                        onClick={() => setEditCompany({ ...company })}
                      >
                        Gestionar
                      </Button>
                      {company.planStatus === 'suspended' ? (
                        <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white" onClick={() => quickAction(company.id, 'activate')}>
                          ✅ Activar
                        </Button>
                      ) : (
                        <Button size="sm" variant="destructive" onClick={() => quickAction(company.id, 'suspend')}>
                          🚫 Suspender
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Admin notes */}
                  {company.adminNotes && (
                    <div className="mt-3 px-3 py-2 bg-amber-950/30 border border-amber-900/50 rounded-lg text-xs text-amber-300">
                      📝 {company.adminNotes}
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>

      {/* Edit Dialog */}
      {editCompany && (
        <Dialog open onOpenChange={() => setEditCompany(null)}>
          <DialogContent className="max-w-md bg-gray-900 border-gray-700 text-white">
            <DialogHeader>
              <DialogTitle className="text-white">Gestionar: {editCompany.name}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-gray-300">Plan</Label>
                  <Select value={editCompany.plan} onValueChange={(v) => {
                    const limits: Record<string, number> = { free: 10, professional: 100, enterprise: 99999 }
                    setEditCompany({ ...editCompany, plan: v, maxEmployees: limits[v] || 10 })
                  }}>
                    <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-800 border-gray-700 text-white">
                      <SelectItem value="free">Gratuito (10 emp.)</SelectItem>
                      <SelectItem value="professional">Profesional (100 emp.)</SelectItem>
                      <SelectItem value="enterprise">Empresarial (ilimitado)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-gray-300">Estado</Label>
                  <Select value={editCompany.planStatus} onValueChange={(v) => setEditCompany({ ...editCompany, planStatus: v })}>
                    <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-800 border-gray-700 text-white">
                      <SelectItem value="active">✅ Activo</SelectItem>
                      <SelectItem value="trial">⏳ Trial</SelectItem>
                      <SelectItem value="suspended">🚫 Suspendido</SelectItem>
                      <SelectItem value="cancelled">❌ Cancelado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-1">
                <Label className="text-gray-300">Límite de empleados</Label>
                <Input
                  type="number"
                  value={editCompany.maxEmployees}
                  onChange={(e) => setEditCompany({ ...editCompany, maxEmployees: Number(e.target.value) })}
                  className="bg-gray-800 border-gray-700 text-white"
                />
                <p className="text-xs text-gray-500">Actual: {editCompany.activeEmployees} empleados activos</p>
              </div>

              <div className="space-y-1">
                <Label className="text-gray-300">Vence el (opcional)</Label>
                <Input
                  type="date"
                  value={editCompany.planExpiresAt ? new Date(editCompany.planExpiresAt).toISOString().split('T')[0] : ''}
                  onChange={(e) => setEditCompany({ ...editCompany, planExpiresAt: e.target.value })}
                  className="bg-gray-800 border-gray-700 text-white"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-gray-300">Notas internas</Label>
                <Textarea
                  value={editCompany.adminNotes || ''}
                  onChange={(e) => setEditCompany({ ...editCompany, adminNotes: e.target.value })}
                  placeholder="Notas sobre el pago, contacto, etc."
                  className="bg-gray-800 border-gray-700 text-white"
                  rows={3}
                />
              </div>

              {/* Current usage summary */}
              <div className="p-3 bg-gray-800 rounded-lg text-xs space-y-1 text-gray-300">
                <p className="font-medium text-white">📊 Uso actual</p>
                <p>👥 {editCompany.activeEmployees} empleados activos de {editCompany.maxEmployees} permitidos</p>
                <p>🏢 {editCompany._count?.branches || 0} sucursales</p>
                <p>📅 {editCompany._count?.attendanceRecords || 0} registros de asistencia</p>
                {editCompany.lastActivityAt && (
                  <p>⚡ Última actividad: {new Date(editCompany.lastActivityAt).toLocaleString('es')}</p>
                )}
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditCompany(null)} className="border-gray-700 text-gray-300">Cancelar</Button>
              <Button onClick={handleSave} disabled={saving} className="bg-emerald-600 hover:bg-emerald-700">
                {saving ? 'Guardando...' : 'Guardar cambios'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
