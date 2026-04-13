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
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  Users, Plus, Mail, Phone, Calendar, FileText, ExternalLink,
  Trash2, StickyNote, ChevronDown, UserCheck, Clock, XCircle,
  CheckCircle2, Star, Send, Eye,
} from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { useAppStore } from '@/store/app-store'
import type { Candidate, Vacant } from '@/lib/types'
import { candidateStatusLabels } from '@/lib/types'

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────

const PIPELINE_STAGES = [
  'applied', 'screening', 'interview', 'assessment',
  'pending_hire', 'offered', 'hired', 'rejected',
] as const

const STATUS_OPTIONS = [
  { value: 'applied',      label: 'Postulado',            icon: '📋', color: 'text-emerald-700' },
  { value: 'screening',    label: 'En Cribado',           icon: '🔍', color: 'text-teal-700' },
  { value: 'interview',    label: 'Entrevista',           icon: '🗓️', color: 'text-cyan-700' },
  { value: 'assessment',   label: 'En Evaluación',        icon: '📝', color: 'text-amber-700' },
  { value: 'pending_hire', label: 'Pre-aprobado (espera)', icon: '⏳', color: 'text-orange-700' },
  { value: 'offered',      label: 'Oferta Enviada',       icon: '📌', color: 'text-purple-700' },
  { value: 'hired',        label: 'Contratado',           icon: '✅', color: 'text-green-700' },
  { value: 'rejected',     label: 'Rechazado',            icon: '❌', color: 'text-red-700' },
]

const stageColors: Record<string, string> = {
  applied:      'bg-emerald-100 text-emerald-700 border-emerald-200',
  screening:    'bg-teal-100 text-teal-700 border-teal-200',
  interview:    'bg-cyan-100 text-cyan-700 border-cyan-200',
  assessment:   'bg-amber-100 text-amber-700 border-amber-200',
  pending_hire: 'bg-orange-100 text-orange-700 border-orange-200',
  offered:      'bg-purple-100 text-purple-700 border-purple-200',
  hired:        'bg-green-100 text-green-700 border-green-200',
  rejected:     'bg-red-100 text-red-700 border-red-200',
}

const stageHeaderColors: Record<string, string> = {
  applied:      'bg-emerald-500',
  screening:    'bg-teal-500',
  interview:    'bg-cyan-500',
  assessment:   'bg-amber-500',
  pending_hire: 'bg-orange-500',
  offered:      'bg-purple-500',
  hired:        'bg-green-600',
  rejected:     'bg-red-500',
}

const authHeaders = () => ({
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${localStorage.getItem('siga_token')}`,
})

// ─────────────────────────────────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────────────────────────────────

export function CandidatesView() {
  const { navigate } = useAppStore()
  const [candidates, setCandidates] = useState<Candidate[]>([])
  const [vacancies, setVacancies] = useState<Vacant[]>([])
  const [loading, setLoading] = useState(true)
  const [vacantFilter, setVacantFilter] = useState<string>('all')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [detailCandidate, setDetailCandidate] = useState<Candidate | null>(null)
  const [deleteCandidate, setDeleteCandidate] = useState<Candidate | null>(null)
  const [updatingId, setUpdatingId] = useState<string | null>(null)
  const [form, setForm] = useState({
    vacantId: '', firstName: '', lastName: '', email: '',
    phone: '', coverLetter: '', notes: '', interviewDate: '',
  })
  const [saving, setSaving] = useState(false)

  const companyId = typeof window !== 'undefined'
    ? JSON.parse(localStorage.getItem('siga_user') || '{}').companyId
    : ''

  const fetchCandidates = useCallback(async () => {
    try {
      setLoading(true)
      const url = vacantFilter === 'all' ? '/api/candidates' : `/api/candidates?vacantId=${vacantFilter}`
      const res = await fetch(url, { headers: authHeaders() })
      if (!res.ok) throw new Error('Error al cargar candidatos')
      setCandidates(await res.json())
    } catch (error: any) {
      toast.error(error.message || 'Error al cargar candidatos')
    } finally {
      setLoading(false)
    }
  }, [vacantFilter])

  const fetchVacancies = useCallback(async () => {
    try {
      const res = await fetch('/api/vacancies', { headers: authHeaders() })
      if (res.ok) setVacancies(await res.json())
    } catch {}
  }, [])

  useEffect(() => { fetchCandidates() }, [fetchCandidates])
  useEffect(() => { fetchVacancies() }, [fetchVacancies])

  // ── Status change ────────────────────────────────────────────────────────

  const changeStatus = async (candidate: Candidate, newStatus: string) => {
    setUpdatingId(candidate.id)
    try {
      const res = await fetch(`/api/candidates/${candidate.id}`, {
        method: 'PUT',
        headers: authHeaders(),
        body: JSON.stringify({ status: newStatus }),
      })
      if (!res.ok) throw new Error('Error al actualizar estado')
      const label = STATUS_OPTIONS.find(s => s.value === newStatus)?.label || newStatus
      toast.success(`${candidate.firstName} → ${label}`)
      fetchCandidates()
    } catch (error: any) {
      toast.error(error.message)
    } finally {
      setUpdatingId(null)
    }
  }

  // ── Hire: pre-fill employee form ─────────────────────────────────────────

  const handleHire = (candidate: Candidate) => {
    // Store candidate data to pre-fill employee form
    if (typeof window !== 'undefined') {
      localStorage.setItem('hire_prefill', JSON.stringify({
        firstName: candidate.firstName,
        lastName: candidate.lastName,
        email: candidate.email,
        phone: candidate.phone || '',
        fromCandidateId: candidate.id,
      }))
    }
    navigate('employees')
    toast.info(`Formulario pre-llenado con datos de ${candidate.firstName}. Completa la inscripción.`)
  }

  // ── Create ───────────────────────────────────────────────────────────────

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
        body: JSON.stringify({ ...form }),
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

  // ── Delete ───────────────────────────────────────────────────────────────

  const confirmDelete = async () => {
    if (!deleteCandidate) return
    try {
      const res = await fetch(`/api/candidates/${deleteCandidate.id}`, {
        method: 'DELETE', headers: authHeaders(),
      })
      if (!res.ok) throw new Error('Error al eliminar')
      toast.success('Candidato eliminado')
      setDeleteCandidate(null)
      fetchCandidates()
    } catch (error: any) {
      toast.error(error.message)
    }
  }

  const candidatesByStage = PIPELINE_STAGES.map((stage) => ({
    stage,
    label: STATUS_OPTIONS.find(s => s.value === stage)?.label || stage,
    icon: STATUS_OPTIONS.find(s => s.value === stage)?.icon || '📋',
    candidates: candidates.filter((c) => c.status === stage),
  }))

  // ─────────────────────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Users className="h-4 w-4" />
            <span>{candidates.length} candidatos en pipeline</span>
          </div>
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
          <Button onClick={() => {
            setForm({ vacantId: vacantFilter === 'all' ? '' : vacantFilter, firstName: '', lastName: '', email: '', phone: '', coverLetter: '', notes: '', interviewDate: '' })
            setDialogOpen(true)
          }} size="sm" className="gap-2 bg-emerald-600 hover:bg-emerald-700">
            <Plus className="h-4 w-4" /> Nuevo Candidato
          </Button>
        </div>
      </div>

      {/* Kanban Board */}
      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-48 rounded-xl" />
          ))}
        </div>
      ) : (
        <div className="flex gap-4 overflow-x-auto pb-4">
          {candidatesByStage.map(({ stage, label, icon, candidates: stageCandidates }) => (
            <div key={stage} className="flex-none w-72">
              {/* Stage header */}
              <div className={cn('rounded-t-lg px-3 py-2 flex items-center justify-between', stageHeaderColors[stage])}>
                <div className="flex items-center gap-2 text-white">
                  <span>{icon}</span>
                  <span className="text-sm font-semibold">{label}</span>
                </div>
                <Badge className="bg-white/20 text-white border-0 text-xs">{stageCandidates.length}</Badge>
              </div>

              {/* Cards */}
              <div className="bg-muted/30 rounded-b-lg p-2 space-y-2 min-h-[120px]">
                {stageCandidates.length === 0 && (
                  <div className="rounded-lg border border-dashed p-4 text-center text-xs text-muted-foreground">
                    Sin candidatos
                  </div>
                )}
                {stageCandidates.map((candidate) => (
                  <Card key={candidate.id} className="transition-shadow hover:shadow-md">
                    <CardContent className="p-3 space-y-2">

                      {/* Name + actions */}
                      <div className="flex items-start justify-between gap-1">
                        <p className="font-semibold text-sm leading-tight">
                          {candidate.firstName} {candidate.lastName}
                        </p>
                        <div className="flex items-center gap-0.5 shrink-0">
                          {/* View detail */}
                          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setDetailCandidate(candidate)}>
                            <Eye className="h-3 w-3 text-muted-foreground" />
                          </Button>
                          {/* Delete */}
                          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setDeleteCandidate(candidate)}>
                            <Trash2 className="h-3 w-3 text-red-400" />
                          </Button>
                        </div>
                      </div>

                      {/* Vacant */}
                      {candidate.vacant && (
                        <p className="text-xs text-muted-foreground truncate font-medium">{candidate.vacant.title}</p>
                      )}

                      {/* Contact */}
                      <div className="text-xs text-muted-foreground space-y-0.5">
                        <div className="flex items-center gap-1.5 truncate">
                          <Mail className="h-3 w-3 shrink-0" /> {candidate.email}
                        </div>
                        {candidate.phone && (
                          <div className="flex items-center gap-1.5">
                            <Phone className="h-3 w-3 shrink-0" /> {candidate.phone}
                          </div>
                        )}
                      </div>

                      {/* CV link */}
                      {(candidate as any).cvUrl && (
                        <a href={(candidate as any).cvUrl} target="_blank" rel="noreferrer"
                          className="flex items-center gap-1 text-xs text-blue-600 hover:underline">
                          <ExternalLink className="h-3 w-3" /> Ver CV
                        </a>
                      )}

                      {/* Interview date */}
                      {candidate.interviewDate && (
                        <div className="flex items-center gap-1.5 text-xs text-amber-600">
                          <Calendar className="h-3 w-3" />
                          Entrevista: {new Date(candidate.interviewDate).toLocaleDateString('es-MX')}
                        </div>
                      )}

                      {/* Status dropdown */}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            className={cn('w-full h-7 text-xs gap-1.5 justify-between', stageColors[candidate.status] || '')}
                            disabled={updatingId === candidate.id}
                          >
                            <span>{STATUS_OPTIONS.find(s => s.value === candidate.status)?.icon} {STATUS_OPTIONS.find(s => s.value === candidate.status)?.label || candidate.status}</span>
                            <ChevronDown className="h-3 w-3 opacity-60" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-52">
                          <DropdownMenuLabel className="text-xs">Cambiar estado</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          {STATUS_OPTIONS.map((opt) => (
                            <DropdownMenuItem
                              key={opt.value}
                              onClick={() => changeStatus(candidate, opt.value)}
                              className={cn('text-xs gap-2', opt.value === candidate.status && 'font-bold bg-muted')}
                            >
                              <span>{opt.icon}</span>
                              <span className={opt.color}>{opt.label}</span>
                              {opt.value === candidate.status && <span className="ml-auto text-muted-foreground">✓</span>}
                            </DropdownMenuItem>
                          ))}
                        </DropdownMenuContent>
                      </DropdownMenu>

                      {/* Hire button — only show for pending_hire, offered */}
                      {(candidate.status === 'pending_hire' || candidate.status === 'offered' || candidate.status === 'hired') && (
                        <Button
                          size="sm"
                          className="w-full h-7 text-xs bg-green-600 hover:bg-green-700 text-white gap-1.5"
                          onClick={() => handleHire(candidate)}
                        >
                          <UserCheck className="h-3.5 w-3.5" />
                          Inscribir como Empleado
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
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Nuevo Candidato</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1">
              <Label>Vacante *</Label>
              <Select value={form.vacantId} onValueChange={(v) => setForm({ ...form, vacantId: v })}>
                <SelectTrigger><SelectValue placeholder="Seleccionar vacante" /></SelectTrigger>
                <SelectContent>
                  {vacancies.filter(v => v.status === 'open').map((v) => (
                    <SelectItem key={v.id} value={v.id}>{v.title}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Nombre *</Label>
                <Input value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} placeholder="Nombre" />
              </div>
              <div className="space-y-1">
                <Label>Apellido *</Label>
                <Input value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} placeholder="Apellido" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Email *</Label>
                <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="email@ejemplo.com" />
              </div>
              <div className="space-y-1">
                <Label>Teléfono</Label>
                <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="04XX-XXXXXXX" />
              </div>
            </div>
            <div className="space-y-1">
              <Label>Fecha de entrevista</Label>
              <Input type="datetime-local" value={form.interviewDate} onChange={(e) => setForm({ ...form, interviewDate: e.target.value })} />
            </div>
            <div className="space-y-1">
              <Label>Notas</Label>
              <Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Observaciones..." rows={2} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleCreate} disabled={saving} className="bg-emerald-600 hover:bg-emerald-700">
              {saving ? 'Guardando...' : 'Registrar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Detail Dialog */}
      {detailCandidate && (
        <Dialog open={!!detailCandidate} onOpenChange={() => setDetailCandidate(null)}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>{detailCandidate.firstName} {detailCandidate.lastName}</DialogTitle>
            </DialogHeader>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Vacante</span>
                <span className="font-medium">{detailCandidate.vacant?.title || '-'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Email</span>
                <span>{detailCandidate.email}</span>
              </div>
              {detailCandidate.phone && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Teléfono</span>
                  <span>{detailCandidate.phone}</span>
                </div>
              )}
              {(detailCandidate as any).cvUrl && (
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">CV</span>
                  <a href={(detailCandidate as any).cvUrl} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline flex items-center gap-1">
                    <ExternalLink className="h-3.5 w-3.5" /> Ver CV
                  </a>
                </div>
              )}
              {detailCandidate.interviewDate && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Entrevista</span>
                  <span className="text-amber-600">{new Date(detailCandidate.interviewDate).toLocaleString('es-MX')}</span>
                </div>
              )}
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Estado</span>
                <Badge className={stageColors[detailCandidate.status]}>
                  {STATUS_OPTIONS.find(s => s.value === detailCandidate.status)?.label || detailCandidate.status}
                </Badge>
              </div>
              {detailCandidate.coverLetter && (
                <div>
                  <p className="text-muted-foreground mb-1">Carta de presentación</p>
                  <p className="text-xs bg-muted p-2 rounded whitespace-pre-wrap">{detailCandidate.coverLetter}</p>
                </div>
              )}
              {detailCandidate.notes && (
                <div>
                  <p className="text-muted-foreground mb-1">Notas</p>
                  <p className="text-xs bg-muted p-2 rounded whitespace-pre-wrap">{detailCandidate.notes}</p>
                </div>
              )}
            </div>
            <DialogFooter className="gap-2">
              {(detailCandidate.status === 'pending_hire' || detailCandidate.status === 'offered' || detailCandidate.status === 'hired') && (
                <Button className="bg-green-600 hover:bg-green-700 text-white gap-2" onClick={() => { handleHire(detailCandidate); setDetailCandidate(null) }}>
                  <UserCheck className="h-4 w-4" /> Inscribir como Empleado
                </Button>
              )}
              <Button variant="outline" onClick={() => setDetailCandidate(null)}>Cerrar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteCandidate} onOpenChange={() => setDeleteCandidate(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar candidato?</AlertDialogTitle>
            <AlertDialogDescription>
              Se eliminará a <strong>{deleteCandidate?.firstName} {deleteCandidate?.lastName}</strong> del pipeline. Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction className="bg-red-600 hover:bg-red-700" onClick={confirmDelete}>Eliminar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
