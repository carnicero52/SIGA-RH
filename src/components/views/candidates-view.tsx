'use client'

import { useEffect, useState, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Skeleton } from '@/components/ui/skeleton'
import { ScrollArea } from '@/components/ui/scroll-area'
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
  Users, Plus, Mail, Phone, Calendar, FileText, ChevronRight,
  Trash2, StickyNote, UserPlus,
} from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import type { Candidate, Vacant } from '@/lib/types'
import { candidateStatusLabels } from '@/lib/types'

const PIPELINE_STAGES = [
  'applied',
  'screening',
  'interview',
  'assessment',
  'offered',
  'hired',
  'rejected',
] as const

const stageColors: Record<string, string> = {
  applied: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  screening: 'bg-teal-100 text-teal-700 border-teal-200',
  interview: 'bg-cyan-100 text-cyan-700 border-cyan-200',
  assessment: 'bg-amber-100 text-amber-700 border-amber-200',
  offered: 'bg-orange-100 text-orange-700 border-orange-200',
  hired: 'bg-green-100 text-green-700 border-green-200',
  rejected: 'bg-red-100 text-red-700 border-red-200',
}

const stageHeaderColors: Record<string, string> = {
  applied: 'bg-emerald-500',
  screening: 'bg-teal-500',
  interview: 'bg-cyan-500',
  assessment: 'bg-amber-500',
  offered: 'bg-orange-500',
  hired: 'bg-green-600',
  rejected: 'bg-red-500',
}

const authHeaders = () => ({
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${localStorage.getItem('siga_token')}`,
})

export function CandidatesView() {
  const [candidates, setCandidates] = useState<Candidate[]>([])
  const [vacancies, setVacancies] = useState<Vacant[]>([])
  const [loading, setLoading] = useState(true)
  const [vacantFilter, setVacantFilter] = useState<string>('all')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [form, setForm] = useState({
    vacantId: '',
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    coverLetter: '',
    notes: '',
  })
  const [saving, setSaving] = useState(false)

  const companyId = typeof window !== 'undefined'
    ? JSON.parse(localStorage.getItem('siga_user') || '{}').companyId
    : ''

  const fetchCandidates = useCallback(async () => {
    try {
      setLoading(true)
      const url = vacantFilter === 'all'
        ? '/api/candidates'
        : `/api/candidates?vacantId=${vacantFilter}`
      const res = await fetch(url)
      if (!res.ok) throw new Error('Error al cargar candidatos')
      const data = await res.json()
      setCandidates(data)
    } catch (error: any) {
      toast.error(error.message || 'Error al cargar candidatos')
    } finally {
      setLoading(false)
    }
  }, [vacantFilter])

  const fetchVacancies = useCallback(async () => {
    try {
      const res = await fetch('/api/vacancies')
      if (res.ok) {
        const data = await res.json()
        setVacancies(data)
      }
    } catch {
      // Non-critical
    }
  }, [])

  useEffect(() => {
    fetchCandidates()
  }, [fetchCandidates])

  useEffect(() => {
    fetchVacancies()
  }, [fetchVacancies])

  const openCreate = () => {
    setForm({
      vacantId: vacantFilter === 'all' ? '' : vacantFilter,
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      coverLetter: '',
      notes: '',
    })
    setDialogOpen(true)
  }

  const handleCreate = async () => {
    if (!form.vacantId || !form.firstName || !form.lastName || !form.email) {
      toast.error('Vacante, nombre, apellido y email son requeridos')
      return
    }
    try {
      setSaving(true)
      const res = await fetch('/api/candidates', {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ ...form, companyId }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Error al crear candidato')
      }
      toast.success('Candidato registrado')
      setDialogOpen(false)
      fetchCandidates()
    } catch (error: any) {
      toast.error(error.message)
    } finally {
      setSaving(false)
    }
  }

  const moveStage = async (candidate: Candidate) => {
    const currentIdx = PIPELINE_STAGES.indexOf(candidate.status as any)
    if (currentIdx < 0 || currentIdx >= PIPELINE_STAGES.length - 1) return

    const nextStatus = PIPELINE_STAGES[currentIdx + 1]
    try {
      const res = await fetch(`/api/candidates/${candidate.id}`, {
        method: 'PUT',
        headers: authHeaders(),
        body: JSON.stringify({ status: nextStatus }),
      })
      if (!res.ok) throw new Error('Error al cambiar estado')
      toast.success(`${candidate.firstName} movido a "${candidateStatusLabels[nextStatus]}"`)
      fetchCandidates()
    } catch (error: any) {
      toast.error(error.message)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar este candidato?')) return
    try {
      const res = await fetch(`/api/candidates/${id}`, {
        method: 'DELETE',
        headers: authHeaders(),
      })
      if (!res.ok) throw new Error('Error al eliminar')
      toast.success('Candidato eliminado')
      fetchCandidates()
    } catch (error: any) {
      toast.error(error.message)
    }
  }

  const candidatesByStage = PIPELINE_STAGES.map((stage) => ({
    stage,
    label: candidateStatusLabels[stage],
    candidates: candidates.filter((c) => c.status === stage),
  }))

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Users className="h-4 w-4" />
          <span>Pipeline de reclutamiento</span>
        </div>
        <div className="flex items-center gap-3">
          <Select value={vacantFilter} onValueChange={setVacantFilter}>
            <SelectTrigger className="w-[200px] h-9">
              <SelectValue placeholder="Filtrar por vacante" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas las vacantes</SelectItem>
              {vacancies.map((v) => (
                <SelectItem key={v.id} value={v.id}>{v.title}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={openCreate} size="sm" className="gap-2">
            <UserPlus className="h-4 w-4" />
            <span className="hidden sm:inline">Nuevo Candidato</span>
            <span className="sm:hidden">Nuevo</span>
          </Button>
        </div>
      </div>

      {/* Pipeline Columns */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-4">
          {PIPELINE_STAGES.map((stage) => (
            <div key={stage} className="space-y-3">
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-32 w-full rounded-lg" />
              <Skeleton className="h-32 w-full rounded-lg" />
            </div>
          ))}
        </div>
      ) : (
        <div className="flex gap-4 overflow-x-auto pb-4">
          {candidatesByStage.map(({ stage, label, candidates: stageCandidates }) => (
            <div key={stage} className="flex-shrink-0 w-[260px] sm:w-[240px] lg:w-[220px] xl:w-[230px]">
              {/* Column header */}
              <div className="flex items-center gap-2 mb-3">
                <div className={cn('h-2.5 w-2.5 rounded-full', stageHeaderColors[stage])} />
                <span className="text-sm font-semibold">{label}</span>
                <Badge variant="secondary" className="text-[11px] ml-auto">
                  {stageCandidates.length}
                </Badge>
              </div>

              {/* Cards */}
              <div className="space-y-3">
                {stageCandidates.length === 0 && (
                  <div className="rounded-lg border border-dashed p-6 text-center text-xs text-muted-foreground">
                    Sin candidatos
                  </div>
                )}
                {stageCandidates.map((candidate) => (
                  <Card key={candidate.id} className="transition-shadow hover:shadow-sm">
                    <CardContent className="p-3 space-y-2.5">
                      {/* Name */}
                      <div className="flex items-start justify-between gap-1">
                        <p className="font-medium text-sm leading-tight">
                          {candidate.firstName} {candidate.lastName}
                        </p>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 shrink-0 text-muted-foreground hover:text-red-500"
                          onClick={() => handleDelete(candidate.id)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>

                      {/* Vacant title */}
                      {candidate.vacant && (
                        <p className="text-xs text-muted-foreground truncate">{candidate.vacant.title}</p>
                      )}

                      {/* Contact info */}
                      <div className="space-y-1 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1.5">
                          <Mail className="h-3 w-3" />
                          <span className="truncate">{candidate.email}</span>
                        </div>
                        {candidate.phone && (
                          <div className="flex items-center gap-1.5">
                            <Phone className="h-3 w-3" />
                            <span>{candidate.phone}</span>
                          </div>
                        )}
                      </div>

                      {/* Dates */}
                      <div className="space-y-1 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="h-3 w-3" />
                          <span>Aplicó: {new Date(candidate.createdAt).toLocaleDateString('es-MX')}</span>
                        </div>
                        {candidate.interviewDate && (
                          <div className="flex items-center gap-1.5 text-amber-600">
                            <Calendar className="h-3 w-3" />
                            <span>Entrevista: {new Date(candidate.interviewDate).toLocaleDateString('es-MX')}</span>
                          </div>
                        )}
                      </div>

                      {/* Notes preview */}
                      {candidate.notes && (
                        <div className="flex items-start gap-1.5 text-xs text-muted-foreground">
                          <StickyNote className="h-3 w-3 mt-0.5 shrink-0" />
                          <span className="line-clamp-2">{candidate.notes}</span>
                        </div>
                      )}

                      {/* Move to next stage */}
                      {stage !== 'hired' && stage !== 'rejected' && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full gap-1.5 text-xs h-7"
                          onClick={() => moveStage(candidate)}
                        >
                          Siguiente
                          <ChevronRight className="h-3 w-3" />
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Nuevo Candidato</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Vacante *</Label>
              <Select value={form.vacantId} onValueChange={(v) => setForm({ ...form, vacantId: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar vacante" />
                </SelectTrigger>
                <SelectContent>
                  {vacancies
                    .filter((v) => v.status === 'open')
                    .map((v) => (
                      <SelectItem key={v.id} value={v.id}>{v.title}</SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="c-fname">Nombre *</Label>
                <Input
                  id="c-fname"
                  placeholder="Nombre"
                  value={form.firstName}
                  onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="c-lname">Apellido *</Label>
                <Input
                  id="c-lname"
                  placeholder="Apellido"
                  value={form.lastName}
                  onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="c-email">Email *</Label>
                <Input
                  id="c-email"
                  type="email"
                  placeholder="correo@ejemplo.com"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="c-phone">Teléfono</Label>
                <Input
                  id="c-phone"
                  placeholder="+52 55 1234 5678"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="c-cover">Carta de Presentación</Label>
              <Textarea
                id="c-cover"
                placeholder="Escriba la carta de presentación del candidato..."
                rows={3}
                value={form.coverLetter}
                onChange={(e) => setForm({ ...form, coverLetter: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="c-notes">Notas</Label>
              <Textarea
                id="c-notes"
                placeholder="Notas internas sobre el candidato..."
                rows={2}
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleCreate} disabled={saving}>
              {saving ? 'Guardando...' : 'Registrar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
