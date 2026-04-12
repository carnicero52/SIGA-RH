'use client'

import { useEffect, useState, useCallback } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Briefcase, Plus, MapPin, Users, DollarSign, Calendar, Edit, Trash2,
  Building2, Filter, QrCode, ExternalLink,
} from 'lucide-react'
import { QRCodeSVG } from 'qrcode.react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import type { Vacant, Department, Position } from '@/lib/types'
import { vacantStatusLabels, employmentTypeLabels } from '@/lib/types'
import { CURRENCIES, formatCurrency } from '@/lib/currencies'

const statusColors: Record<string, string> = {
  open: 'border-emerald-500/50 text-emerald-600 bg-emerald-50',
  closed: 'border-red-500/50 text-red-600 bg-red-50',
  filled: 'border-teal-500/50 text-teal-600 bg-teal-50',
  paused: 'border-amber-500/50 text-amber-600 bg-amber-50',
}

const authHeaders = () => ({
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${localStorage.getItem('siga_token')}`,
})

const defaultForm = {
  title: '',
  departmentId: '',
  positionId: '',
  description: '',
  requirements: '',
  salaryMin: '',
  salaryMax: '',
  currency: 'USD',
  employmentType: 'full_time',
  location: '',
  vacanciesCount: '1',
}

export function VacanciesView() {
  const [vacancies, setVacancies] = useState<Vacant[]>([])
  const [departments, setDepartments] = useState<Department[]>([])
  const [positions, setPositions] = useState<Position[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<Vacant | null>(null)
  const [form, setForm] = useState(defaultForm)
  const [saving, setSaving] = useState(false)
  const [qrModalOpen, setQrModalOpen] = useState(false)
  const [qrVacancy, setQrVacancy] = useState<Vacant | null>(null)

  const companyId = typeof window !== 'undefined'
    ? JSON.parse(localStorage.getItem('siga_user') || '{}').companyId
    : ''

  const fetchVacancies = useCallback(async () => {
    try {
      setLoading(true)
      const url = statusFilter === 'all' ? '/api/vacancies' : `/api/vacancies?status=${statusFilter}`
      const res = await fetch(url)
      if (!res.ok) throw new Error('Error al cargar vacantes')
      const data = await res.json()
      setVacancies(data)
    } catch (error: any) {
      toast.error(error.message || 'Error al cargar vacantes')
    } finally {
      setLoading(false)
    }
  }, [statusFilter])

  const fetchOptions = useCallback(async () => {
    try {
      const [deptRes, posRes] = await Promise.all([
        fetch('/api/departments', { headers: authHeaders() }),
        fetch('/api/positions', { headers: authHeaders() }),
      ])
      if (deptRes.ok) {
        const deptData = await deptRes.json()
        const deptArr = Array.isArray(deptData) ? deptData : deptData.departments || []
        setDepartments(deptArr)
      }
      if (posRes.ok) {
        const posData = await posRes.json()
        const posArr = Array.isArray(posData) ? posData : posData.positions || []
        setPositions(posArr)
      }
    } catch {
      // Non-critical: departments/positions selects may be empty
    }
  }, [])

  useEffect(() => {
    fetchVacancies()
  }, [fetchVacancies])

  useEffect(() => {
    fetchOptions()
  }, [fetchOptions])

  const openCreate = () => {
    setEditing(null)
    setForm(defaultForm)
    setDialogOpen(true)
  }

  const openEdit = (vacant: Vacant) => {
    setEditing(vacant)
    setForm({
      title: vacant.title,
      departmentId: vacant.departmentId || '',
      positionId: vacant.positionId || '',
      description: vacant.description || '',
      requirements: vacant.requirements || '',
      salaryMin: vacant.salaryMin ? String(vacant.salaryMin) : '',
      salaryMax: vacant.salaryMax ? String(vacant.salaryMax) : '',
      employmentType: vacant.employmentType,
      location: vacant.location || '',
      vacanciesCount: String(vacant.vacanciesCount),
    })
    setDialogOpen(true)
  }

  const handleSave = async () => {
    if (!form.title.trim()) {
      toast.error('El título es requerido')
      return
    }
    try {
      setSaving(true)
      const payload = { ...form, companyId }
      let res: Response

      if (editing) {
        res = await fetch(`/api/vacancies/${editing.id}`, {
          method: 'PUT',
          headers: authHeaders(),
          body: JSON.stringify(payload),
        })
      } else {
        res = await fetch('/api/vacancies', {
          method: 'POST',
          headers: authHeaders(),
          body: JSON.stringify(payload),
        })
      }

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Error al guardar')
      }

      toast.success(editing ? 'Vacante actualizada' : 'Vacante creada')
      setDialogOpen(false)
      fetchVacancies()
    } catch (error: any) {
      toast.error(error.message)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar esta vacante?')) return
    try {
      const res = await fetch(`/api/vacancies/${id}`, {
        method: 'DELETE',
        headers: authHeaders(),
      })
      if (!res.ok) throw new Error('Error al eliminar')
      toast.success('Vacante eliminada')
      fetchVacancies()
    } catch (error: any) {
      toast.error(error.message)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Briefcase className="h-4 w-4" />
          <span>Gestión de vacantes de la empresa</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[160px] h-9">
                <SelectValue placeholder="Filtrar estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                {Object.entries(vacantStatusLabels).map(([key, label]) => (
                  <SelectItem key={key} value={key}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={() => {
              const url = typeof window !== 'undefined' ? `${window.location.origin}/careers` : '/careers'
              window.open(url, '_blank')
            }}
          >
            <ExternalLink className="h-4 w-4" />
            <span className="hidden sm:inline">Ver Bolsa</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={() => { setQrVacancy(null); setQrModalOpen(true) }}
          >
            <QrCode className="h-4 w-4" />
            <span className="hidden sm:inline">QR Bolsa</span>
          </Button>
          <Button onClick={openCreate} size="sm" className="gap-2">
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">Nueva Vacante</span>
            <span className="sm:hidden">Nueva</span>
          </Button>
        </div>
      </div>

      {/* Vacancies Grid */}
      {loading ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6 space-y-4">
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
                <div className="flex gap-2">
                  <Skeleton className="h-5 w-20" />
                  <Skeleton className="h-5 w-20" />
                </div>
                <Skeleton className="h-4 w-1/3" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : vacancies.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Briefcase className="h-12 w-12 text-muted-foreground/30 mb-4" />
            <p className="text-muted-foreground text-sm">No hay vacantes registradas</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {vacancies.map((vacant) => (
            <Card key={vacant.id} className="group transition-shadow hover:shadow-md">
              <CardContent className="p-5 space-y-4">
                {/* Title and status */}
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <h3 className="font-semibold text-sm leading-tight truncate">{vacant.title}</h3>
                    {vacant.publishedAt && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Publicada: {new Date(vacant.publishedAt).toLocaleDateString('es-MX')}
                      </p>
                    )}
                  </div>
                  <Badge variant="outline" className={cn('text-[11px] font-medium shrink-0', statusColors[vacant.status] || '')}>
                    {vacantStatusLabels[vacant.status] || vacant.status}
                  </Badge>
                </div>

                {/* Department and Position badges */}
                <div className="flex flex-wrap gap-2">
                  {vacant.department && (
                    <Badge variant="outline" className="gap-1 text-[11px] border-muted">
                      <Building2 className="h-3 w-3" />
                      {vacant.department.name}
                    </Badge>
                  )}
                  {vacant.position && (
                    <Badge variant="outline" className="gap-1 text-[11px] border-muted">
                      {vacant.position.name}
                    </Badge>
                  )}
                </div>

                {/* Details */}
                <div className="space-y-2 text-sm">
                  {(vacant.salaryMin || vacant.salaryMax) && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <DollarSign className="h-3.5 w-3.5" />
                      <span className="font-medium text-emerald-700">
                        {formatCurrency(vacant.salaryMin, (vacant as any).currency || 'USD')}
                        {vacant.salaryMax ? ` — ${formatCurrency(vacant.salaryMax, (vacant as any).currency || 'USD')}` : '+'}
                      </span>
                    </div>
                  )}
                  {vacant.location && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <MapPin className="h-3.5 w-3.5" />
                      <span>{vacant.location}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Calendar className="h-3.5 w-3.5" />
                    <span>{employmentTypeLabels[vacant.employmentType] || vacant.employmentType}</span>
                  </div>
                </div>

                {/* Footer: candidates count + actions */}
                <div className="flex items-center justify-between pt-2 border-t">
                  <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                    <Users className="h-3.5 w-3.5" />
                    <span>{vacant._count?.candidates || 0} candidatos</span>
                    <span className="text-xs ml-1">
                      ({vacant.vacanciesCount} plaza{vacant.vacanciesCount > 1 ? 's' : ''})
                    </span>
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-emerald-600" title="QR de esta vacante" onClick={() => { setQrVacancy(vacant); setQrModalOpen(true) }}>
                      <QrCode className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(vacant)}>
                      <Edit className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50" onClick={() => handleDelete(vacant.id)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? 'Editar Vacante' : 'Nueva Vacante'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="v-title">Título *</Label>
              <Input
                id="v-title"
                placeholder="Ej: Desarrollador Frontend"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Departamento</Label>
                <Select value={form.departmentId} onValueChange={(v) => setForm({ ...form, departmentId: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar" />
                  </SelectTrigger>
                  <SelectContent>
                    {departments.map((d) => (
                      <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Puesto</Label>
                <Select value={form.positionId} onValueChange={(v) => setForm({ ...form, positionId: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar" />
                  </SelectTrigger>
                  <SelectContent>
                    {positions.map((p) => (
                      <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="v-desc">Descripción</Label>
              <Textarea
                id="v-desc"
                placeholder="Descripción del puesto..."
                rows={3}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="v-req">Requisitos</Label>
              <Textarea
                id="v-req"
                placeholder="Requisitos del puesto..."
                rows={3}
                value={form.requirements}
                onChange={(e) => setForm({ ...form, requirements: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label>Moneda</Label>
              <Select value={form.currency} onValueChange={(v) => setForm({ ...form, currency: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent className="max-h-60">
                  {CURRENCIES.map((c) => (
                    <SelectItem key={c.code} value={c.code}>
                      <span className="font-mono font-semibold">{c.code}</span> · {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="v-salmin">Salario Mínimo</Label>
                <Input
                  id="v-salmin"
                  type="number"
                  placeholder="0"
                  value={form.salaryMin}
                  onChange={(e) => setForm({ ...form, salaryMin: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="v-salmax">Salario Máximo</Label>
                <Input
                  id="v-salmax"
                  type="number"
                  placeholder="0"
                  value={form.salaryMax}
                  onChange={(e) => setForm({ ...form, salaryMax: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <Label>Tipo de Empleo</Label>
                <Select value={form.employmentType} onValueChange={(v) => setForm({ ...form, employmentType: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(employmentTypeLabels).map(([key, label]) => (
                      <SelectItem key={key} value={key}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="v-loc">Ubicación</Label>
                <Input
                  id="v-loc"
                  placeholder="Ciudad, Estado"
                  value={form.location}
                  onChange={(e) => setForm({ ...form, location: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="v-count">Vacantes</Label>
                <Input
                  id="v-count"
                  type="number"
                  min="1"
                  value={form.vacanciesCount}
                  onChange={(e) => setForm({ ...form, vacanciesCount: e.target.value })}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? 'Guardando...' : 'Guardar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* QR Modal — Bolsa de Empleo */}
      <Dialog open={qrModalOpen} onOpenChange={setQrModalOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <QrCode className="h-5 w-5 text-emerald-600" />
              QR Bolsa de Empleo
            </DialogTitle>
          </DialogHeader>
          <div className="flex flex-col items-center gap-4 py-2">
            <p className="text-sm text-center text-muted-foreground">
              {qrVacancy
                ? `Escanea para aplicar a: ${qrVacancy.title}`
                : 'Escanea para ver todas las vacantes disponibles'
              }
            </p>
            {typeof window !== 'undefined' && (
              <QRCodeSVG
                value={qrVacancy
                  ? `${window.location.origin}/careers?vacancy=${qrVacancy.id}`
                  : `${window.location.origin}/careers`
                }
                size={240}
                bgColor="#ffffff"
                fgColor="#059669"
                level="H"
                includeMargin
              />
            )}
            <p className="text-xs text-muted-foreground font-mono text-center break-all">
              {typeof window !== 'undefined'
                ? qrVacancy
                  ? `${window.location.origin}/careers?vacancy=${qrVacancy.id}`
                  : `${window.location.origin}/careers`
                : '/careers'
              }
            </p>
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={() => {
                const url = typeof window !== 'undefined'
                  ? qrVacancy
                    ? `${window.location.origin}/careers?vacancy=${qrVacancy.id}`
                    : `${window.location.origin}/careers`
                  : '/careers'
                window.open(url, '_blank')
              }}
            >
              <ExternalLink className="h-4 w-4 mr-2" /> Abrir en el navegador
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
