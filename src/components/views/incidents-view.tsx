'use client'

import { useEffect, useState, useCallback } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import {
  ShieldAlert, Plus, Search, Calendar, User, Eye,
  CheckCircle2, XCircle, Filter, Trash2, AlertTriangle,
  ChevronDown, ChevronUp, Loader2,
} from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { useAppStore } from '@/store/app-store'
import type { Incident, Employee } from '@/lib/types'
import {
  incidentTypeLabels,
  severityLabels,
  incidentStatusLabels,
} from '@/lib/types'

const severityColors: Record<string, string> = {
  low: 'bg-emerald-500',
  medium: 'bg-amber-500',
  high: 'bg-red-500',
  critical: 'bg-red-900',
}

const severityBadgeClasses: Record<string, string> = {
  low: 'border-emerald-500/50 text-emerald-700 bg-emerald-50',
  medium: 'border-amber-500/50 text-amber-700 bg-amber-50',
  high: 'border-red-500/50 text-red-700 bg-red-50',
  critical: 'border-red-900/50 text-red-900 bg-red-50',
}

const statusBadgeClasses: Record<string, string> = {
  open: 'border-teal-500/50 text-teal-700 bg-teal-50',
  under_review: 'border-amber-500/50 text-amber-700 bg-amber-50',
  resolved: 'border-emerald-500/50 text-emerald-700 bg-emerald-50',
  dismissed: 'border-gray-500/50 text-gray-600 bg-gray-50',
}

export function IncidentsView() {
  const { user } = useAppStore()
  const [incidents, setIncidents] = useState<Incident[]>([])
  const [employees, setEmployees] = useState<Employee[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  // Filters
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [filterSeverity, setFilterSeverity] = useState<string>('all')
  const [filterType, setFilterType] = useState<string>('all')

  // Create dialog
  const [createOpen, setCreateOpen] = useState(false)
  const [createLoading, setCreateLoading] = useState(false)
  const [createForm, setCreateForm] = useState({
    employeeId: '',
    type: '',
    title: '',
    description: '',
    severity: 'medium',
    date: new Date().toISOString().split('T')[0],
    witnesses: '',
    sanctions: '',
  })

  // Resolve dialog
  const [resolveOpen, setResolveOpen] = useState(false)
  const [resolveLoading, setResolveLoading] = useState(false)
  const [resolveIncident, setResolveIncident] = useState<Incident | null>(null)
  const [resolveForm, setResolveForm] = useState({
    resolution: '',
    status: 'resolved',
  })

  // Detail dialog
  const [detailOpen, setDetailOpen] = useState(false)
  const [detailIncident, setDetailIncident] = useState<Incident | null>(null)

  // Delete dialog
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleteIncident, setDeleteIncident] = useState<Incident | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)

  // Employee search
  const [employeeSearch, setEmployeeSearch] = useState('')
  const [showEmployeeDropdown, setShowEmployeeDropdown] = useState(false)

  const authHeaders = useCallback(() => ({
    'Content-Type': 'application/json',
    ...(localStorage.getItem('siga_token') ? { Authorization: `Bearer ${localStorage.getItem('siga_token')}` } : {}),
  }), [])

  const fetchIncidents = useCallback(async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (filterStatus !== 'all') params.set('status', filterStatus)
      if (filterSeverity !== 'all') params.set('severity', filterSeverity)
      if (filterType !== 'all') params.set('type', filterType)

      const res = await fetch(`/api/incidents?${params.toString()}`, {
        headers: authHeaders(),
      })
      if (!res.ok) throw new Error('Error al cargar incidencias')
      const data = await res.json()
      setIncidents(data)
    } catch (error: any) {
      toast.error(error.message || 'Error al cargar incidencias')
    } finally {
      setLoading(false)
    }
  }, [filterStatus, filterSeverity, filterType, authHeaders])

  const fetchEmployees = useCallback(async (search = '') => {
    try {
      const params = new URLSearchParams({ limit: '50', search })
      const res = await fetch(`/api/employees?${params.toString()}`, {
        headers: authHeaders(),
      })
      if (res.ok) {
        const data = await res.json()
        setEmployees(data.employees || [])
      }
    } catch {}
  }, [authHeaders])

  useEffect(() => {
    fetchIncidents()
  }, [fetchIncidents])

  useEffect(() => {
    fetchEmployees()
  }, [fetchEmployees])

  const handleCreate = async () => {
    if (!createForm.employeeId || !createForm.type || !createForm.title || !createForm.description) {
      toast.error('Completa los campos requeridos')
      return
    }
    try {
      setCreateLoading(true)
      const companyId = user?.companyId
      if (!companyId) {
        toast.error('No se encontró la empresa')
        return
      }
      const res = await fetch('/api/incidents', {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({
          companyId,
          employeeId: createForm.employeeId,
          reportedBy: user?.name,
          type: createForm.type,
          title: createForm.title,
          description: createForm.description,
          severity: createForm.severity,
          date: createForm.date,
          witnesses: createForm.witnesses || undefined,
          sanctions: createForm.sanctions || undefined,
        }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Error al crear incidencia')
      }
      toast.success('Incidencia creada exitosamente')
      setCreateOpen(false)
      setCreateForm({
        employeeId: '',
        type: '',
        title: '',
        description: '',
        severity: 'medium',
        date: new Date().toISOString().split('T')[0],
        witnesses: '',
        sanctions: '',
      })
      fetchIncidents()
    } catch (error: any) {
      toast.error(error.message || 'Error al crear incidencia')
    } finally {
      setCreateLoading(false)
    }
  }

  const handleResolve = async () => {
    if (!resolveIncident) return
    if (!resolveForm.resolution.trim()) {
      toast.error('Ingresa la resolución')
      return
    }
    try {
      setResolveLoading(true)
      const res = await fetch(`/api/incidents/${resolveIncident.id}`, {
        method: 'PUT',
        headers: authHeaders(),
        body: JSON.stringify({
          status: resolveForm.status,
          resolution: resolveForm.resolution,
          resolvedBy: user?.name,
        }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Error al resolver incidencia')
      }
      toast.success('Incidencia actualizada exitosamente')
      setResolveOpen(false)
      setResolveForm({ resolution: '', status: 'resolved' })
      fetchIncidents()
    } catch (error: any) {
      toast.error(error.message || 'Error al resolver incidencia')
    } finally {
      setResolveLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteIncident) return
    try {
      setDeleteLoading(true)
      const res = await fetch(`/api/incidents/${deleteIncident.id}`, {
        method: 'DELETE',
        headers: authHeaders(),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Error al eliminar incidencia')
      }
      toast.success('Incidencia eliminada exitosamente')
      setDeleteOpen(false)
      setDeleteIncident(null)
      fetchIncidents()
    } catch (error: any) {
      toast.error(error.message || 'Error al eliminar incidencia')
    } finally {
      setDeleteLoading(false)
    }
  }

  const openResolveDialog = (incident: Incident) => {
    setResolveIncident(incident)
    setResolveForm({ resolution: '', status: 'resolved' })
    setResolveOpen(true)
  }

  const openDetailDialog = (incident: Incident) => {
    setDetailIncident(incident)
    setDetailOpen(true)
  }

  const filteredEmployees = employeeSearch
    ? employees.filter(e =>
        `${e.firstName} ${e.lastName}`.toLowerCase().includes(employeeSearch.toLowerCase()) ||
        (e.employeeNumber || '').includes(employeeSearch)
      )
    : employees

  const selectedEmployee = employees.find(e => e.id === createForm.employeeId)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Incidencias</h1>
          <p className="text-sm text-muted-foreground">Gestión de incidencias disciplinarias</p>
        </div>
        <Button onClick={() => setCreateOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Nueva Incidencia
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">Filtros</span>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Estado</Label>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  {Object.entries(incidentStatusLabels).map(([key, label]) => (
                    <SelectItem key={key} value={key}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Severidad</Label>
              <Select value={filterSeverity} onValueChange={setFilterSeverity}>
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Todas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  {Object.entries(severityLabels).map(([key, label]) => (
                    <SelectItem key={key} value={key}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Tipo</Label>
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  {Object.entries(incidentTypeLabels).map(([key, label]) => (
                    <SelectItem key={key} value={key}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Incidents Cards */}
      {loading ? (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <div className="flex gap-4">
                  <Skeleton className="h-full w-1 rounded-full" />
                  <div className="flex-1 space-y-3">
                    <div className="flex items-center gap-2">
                      <Skeleton className="h-5 w-20" />
                      <Skeleton className="h-5 w-16" />
                    </div>
                    <Skeleton className="h-5 w-48" />
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-4 w-full" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : incidents.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <ShieldAlert className="h-12 w-12 text-muted-foreground/50 mb-4" />
            <p className="text-lg font-medium text-muted-foreground">No hay incidencias</p>
            <p className="text-sm text-muted-foreground/70 mt-1">
              Crea una nueva incidencia para comenzar
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {incidents.map((incident) => {
            const isExpanded = expandedId === incident.id
            return (
              <Card
                key={incident.id}
                className={cn(
                  'cursor-pointer transition-all hover:shadow-md',
                  isExpanded && 'ring-2 ring-primary/20'
                )}
                onClick={() => setExpandedId(isExpanded ? null : incident.id)}
              >
                <CardContent className="p-0">
                  <div className="flex">
                    {/* Severity color bar */}
                    <div className={cn('w-1.5 rounded-l-lg flex-shrink-0', severityColors[incident.severity] || 'bg-gray-400')} />
                    <div className="flex-1 p-4 space-y-3">
                      {/* Top row: badges and actions */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge variant="outline" className={cn('text-[11px] font-medium', severityBadgeClasses[incident.severity])}>
                            {severityLabels[incident.severity] || incident.severity}
                          </Badge>
                          <Badge variant="outline" className="text-[11px] font-medium">
                            {incidentTypeLabels[incident.type] || incident.type}
                          </Badge>
                          <Badge variant="outline" className={cn('text-[11px] font-medium', statusBadgeClasses[incident.status])}>
                            {incidentStatusLabels[incident.status] || incident.status}
                          </Badge>
                        </div>
                        {isExpanded ? (
                          <ChevronUp className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                        ) : (
                          <ChevronDown className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                        )}
                      </div>

                      {/* Title */}
                      <h3 className="font-semibold text-sm leading-tight">{incident.title}</h3>

                      {/* Employee and date */}
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          {incident.employee
                            ? `${incident.employee.firstName} ${incident.employee.lastName}`
                            : 'Desconocido'}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {new Date(incident.date).toLocaleDateString('es-MX', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </span>
                      </div>

                      {/* Description (truncated) */}
                      <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                        {incident.description}
                      </p>

                      {/* Expanded content */}
                      {isExpanded && (
                        <div className="pt-2 space-y-3 border-t">
                          <div className="grid grid-cols-1 gap-3 text-xs sm:grid-cols-2">
                            <div>
                              <p className="font-medium text-muted-foreground mb-0.5">Reportado por</p>
                              <p>{incident.reportedBy || 'N/A'}</p>
                            </div>
                            <div>
                              <p className="font-medium text-muted-foreground mb-0.5">No. Empleado</p>
                              <p>{incident.employee?.employeeNumber || 'N/A'}</p>
                            </div>
                            {incident.witnesses && (
                              <div className="sm:col-span-2">
                                <p className="font-medium text-muted-foreground mb-0.5">Testigos</p>
                                <p className="whitespace-pre-wrap">{incident.witnesses}</p>
                              </div>
                            )}
                            {incident.sanctions && (
                              <div className="sm:col-span-2">
                                <p className="font-medium text-muted-foreground mb-0.5">Sanciones</p>
                                <p className="whitespace-pre-wrap">{incident.sanctions}</p>
                              </div>
                            )}
                          </div>

                          {incident.resolution && (
                            <div className="rounded-lg bg-emerald-50 p-3 text-xs">
                              <p className="font-medium text-emerald-700 mb-1">Resolución</p>
                              <p className="text-emerald-800 whitespace-pre-wrap">{incident.resolution}</p>
                              {incident.resolvedBy && (
                                <p className="mt-2 text-emerald-600">
                                  Resuelto por: {incident.resolvedBy}
                                  {incident.resolvedAt && (
                                    <> — {new Date(incident.resolvedAt).toLocaleDateString('es-MX')}</>
                                  )}
                                </p>
                              )}
                            </div>
                          )}

                          {/* Action buttons */}
                          <div className="flex flex-wrap gap-2 pt-1">
                            <Button
                              variant="outline"
                              size="sm"
                              className="gap-1.5 h-7 text-xs"
                              onClick={(e) => { e.stopPropagation(); openDetailDialog(incident) }}
                            >
                              <Eye className="h-3 w-3" />
                              Ver Detalle
                            </Button>
                            {!['resolved', 'dismissed'].includes(incident.status) && (
                              <Button
                                variant="outline"
                                size="sm"
                                className="gap-1.5 h-7 text-xs text-emerald-600 border-emerald-200 hover:bg-emerald-50"
                                onClick={(e) => { e.stopPropagation(); openResolveDialog(incident) }}
                              >
                                <CheckCircle2 className="h-3 w-3" />
                                Resolver
                              </Button>
                            )}
                            <Button
                              variant="outline"
                              size="sm"
                              className="gap-1.5 h-7 text-xs text-red-600 border-red-200 hover:bg-red-50"
                              onClick={(e) => { e.stopPropagation(); setDeleteIncident(incident); setDeleteOpen(true) }}
                            >
                              <Trash2 className="h-3 w-3" />
                              Eliminar
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Create Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-lg max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShieldAlert className="h-5 w-5" />
              Nueva Incidencia
            </DialogTitle>
          </DialogHeader>
          <ScrollArea className="max-h-[calc(90vh-10rem)] pr-4">
            <div className="space-y-4 py-2">
              {/* Employee select (searchable) */}
              <div className="space-y-1.5">
                <Label>Empleado <span className="text-red-500">*</span></Label>
                <div className="relative">
                  {selectedEmployee ? (
                    <div className="flex items-center gap-2 h-9 px-3 rounded-md border bg-muted/50">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm flex-1">
                        {selectedEmployee.firstName} {selectedEmployee.lastName}
                        {selectedEmployee.employeeNumber && (
                          <span className="text-muted-foreground"> (#{selectedEmployee.employeeNumber})</span>
                        )}
                      </span>
                      <button
                        type="button"
                        onClick={() => { setCreateForm({ ...createForm, employeeId: '' }); setShowEmployeeDropdown(true) }}
                        className="text-muted-foreground hover:text-foreground"
                      >
                        <XCircle className="h-4 w-4" />
                      </button>
                    </div>
                  ) : (
                    <>
                      <div className="relative">
                        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          placeholder="Buscar empleado..."
                          className="h-9 pl-9"
                          value={employeeSearch}
                          onChange={(e) => { setEmployeeSearch(e.target.value); setShowEmployeeDropdown(true) }}
                          onFocus={() => setShowEmployeeDropdown(true)}
                        />
                      </div>
                      {showEmployeeDropdown && filteredEmployees.length > 0 && (
                        <div className="absolute z-50 mt-1 w-full max-h-48 overflow-y-auto rounded-md border bg-popover shadow-md">
                          {filteredEmployees.map((emp) => (
                            <button
                              key={emp.id}
                              type="button"
                              className="flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-accent transition-colors text-left"
                              onClick={() => {
                                setCreateForm({ ...createForm, employeeId: emp.id })
                                setEmployeeSearch(`${emp.firstName} ${emp.lastName}`)
                                setShowEmployeeDropdown(false)
                              }}
                            >
                              <User className="h-3.5 w-3.5 text-muted-foreground" />
                              {emp.firstName} {emp.lastName}
                              {emp.employeeNumber && (
                                <span className="text-muted-foreground text-xs">#{emp.employeeNumber}</span>
                              )}
                            </button>
                          ))}
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>

              {/* Type */}
              <div className="space-y-1.5">
                <Label>Tipo <span className="text-red-500">*</span></Label>
                <Select
                  value={createForm.type}
                  onValueChange={(v) => setCreateForm({ ...createForm, type: v })}
                >
                  <SelectTrigger className="h-9">
                    <SelectValue placeholder="Seleccionar tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(incidentTypeLabels).map(([key, label]) => (
                      <SelectItem key={key} value={key}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Title */}
              <div className="space-y-1.5">
                <Label>Título <span className="text-red-500">*</span></Label>
                <Input
                  placeholder="Título de la incidencia"
                  value={createForm.title}
                  onChange={(e) => setCreateForm({ ...createForm, title: e.target.value })}
                />
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <Label>Descripción <span className="text-red-500">*</span></Label>
                <Textarea
                  placeholder="Describe la incidencia en detalle..."
                  value={createForm.description}
                  onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
                  rows={4}
                />
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {/* Severity */}
                <div className="space-y-1.5">
                  <Label>Severidad <span className="text-red-500">*</span></Label>
                  <Select
                    value={createForm.severity}
                    onValueChange={(v) => setCreateForm({ ...createForm, severity: v })}
                  >
                    <SelectTrigger className="h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(severityLabels).map(([key, label]) => (
                        <SelectItem key={key} value={key}>{label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Date */}
                <div className="space-y-1.5">
                  <Label>Fecha <span className="text-red-500">*</span></Label>
                  <Input
                    type="date"
                    value={createForm.date}
                    onChange={(e) => setCreateForm({ ...createForm, date: e.target.value })}
                    className="h-9"
                  />
                </div>
              </div>

              {/* Witnesses */}
              <div className="space-y-1.5">
                <Label>Testigos</Label>
                <Textarea
                  placeholder="Nombres de testigos (opcional)"
                  value={createForm.witnesses}
                  onChange={(e) => setCreateForm({ ...createForm, witnesses: e.target.value })}
                  rows={2}
                />
              </div>

              {/* Sanctions */}
              <div className="space-y-1.5">
                <Label>Sanciones</Label>
                <Textarea
                  placeholder="Sanciones aplicadas (opcional)"
                  value={createForm.sanctions}
                  onChange={(e) => setCreateForm({ ...createForm, sanctions: e.target.value })}
                  rows={2}
                />
              </div>
            </div>
          </ScrollArea>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)} disabled={createLoading}>
              Cancelar
            </Button>
            <Button onClick={handleCreate} disabled={createLoading} className="gap-2">
              {createLoading && <Loader2 className="h-4 w-4 animate-spin" />}
              Crear Incidencia
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Resolve Dialog */}
      <Dialog open={resolveOpen} onOpenChange={setResolveOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-emerald-600" />
              Resolver Incidencia
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="text-sm text-muted-foreground">
              <span className="font-medium text-foreground">{resolveIncident?.title}</span>
              <br />
              Empleado: {resolveIncident?.employee?.firstName} {resolveIncident?.employee?.lastName}
            </div>
            <div className="space-y-1.5">
              <Label>Estado</Label>
              <Select
                value={resolveForm.status}
                onValueChange={(v) => setResolveForm({ ...resolveForm, status: v })}
              >
                <SelectTrigger className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="resolved">{incidentStatusLabels.resolved}</SelectItem>
                  <SelectItem value="dismissed">{incidentStatusLabels.dismissed}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Resolución <span className="text-red-500">*</span></Label>
              <Textarea
                placeholder="Describe la resolución tomada..."
                value={resolveForm.resolution}
                onChange={(e) => setResolveForm({ ...resolveForm, resolution: e.target.value })}
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setResolveOpen(false)} disabled={resolveLoading}>
              Cancelar
            </Button>
            <Button onClick={handleResolve} disabled={resolveLoading} className="gap-2 bg-emerald-600 hover:bg-emerald-700">
              {resolveLoading && <Loader2 className="h-4 w-4 animate-spin" />}
              Confirmar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Detail Dialog */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-lg max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShieldAlert className="h-5 w-5" />
              Detalle de Incidencia
            </DialogTitle>
          </DialogHeader>
          {detailIncident && (
            <ScrollArea className="max-h-[calc(90vh-10rem)] pr-4">
              <div className="space-y-4 py-2">
                {/* Status and severity badges */}
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="outline" className={cn('text-xs', severityBadgeClasses[detailIncident.severity])}>
                    {severityLabels[detailIncident.severity]}
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    {incidentTypeLabels[detailIncident.type] || detailIncident.type}
                  </Badge>
                  <Badge variant="outline" className={cn('text-xs', statusBadgeClasses[detailIncident.status])}>
                    {incidentStatusLabels[detailIncident.status]}
                  </Badge>
                </div>

                <Separator />

                <div>
                  <h3 className="text-lg font-semibold">{detailIncident.title}</h3>
                </div>

                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-xs text-muted-foreground">Empleado</p>
                    <p className="font-medium">
                      {detailIncident.employee
                        ? `${detailIncident.employee.firstName} ${detailIncident.employee.lastName}`
                        : 'N/A'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">No. Empleado</p>
                    <p className="font-medium">{detailIncident.employee?.employeeNumber || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Fecha</p>
                    <p className="font-medium">
                      {new Date(detailIncident.date).toLocaleDateString('es-MX', {
                        day: 'numeric', month: 'long', year: 'numeric',
                      })}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Reportado por</p>
                    <p className="font-medium">{detailIncident.reportedBy || 'N/A'}</p>
                  </div>
                </div>

                <Separator />

                <div>
                  <p className="text-xs text-muted-foreground mb-1">Descripción</p>
                  <p className="text-sm whitespace-pre-wrap leading-relaxed">{detailIncident.description}</p>
                </div>

                {detailIncident.witnesses && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Testigos</p>
                    <p className="text-sm whitespace-pre-wrap">{detailIncident.witnesses}</p>
                  </div>
                )}

                {detailIncident.sanctions && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Sanciones</p>
                    <p className="text-sm whitespace-pre-wrap">{detailIncident.sanctions}</p>
                  </div>
                )}

                {detailIncident.resolution && (
                  <>
                    <Separator />
                    <div className="rounded-lg bg-emerald-50 p-4">
                      <p className="text-xs font-medium text-emerald-700 mb-1">Resolución</p>
                      <p className="text-sm text-emerald-800 whitespace-pre-wrap">{detailIncident.resolution}</p>
                      {detailIncident.resolvedBy && (
                        <p className="mt-2 text-xs text-emerald-600">
                          Resuelto por: {detailIncident.resolvedBy}
                          {detailIncident.resolvedAt && (
                            <> — {new Date(detailIncident.resolvedAt).toLocaleDateString('es-MX')}</>
                          )}
                        </p>
                      )}
                    </div>
                  </>
                )}

                {/* Actions */}
                {!['resolved', 'dismissed'].includes(detailIncident.status) && (
                  <div className="flex gap-2 pt-2">
                    <Button
                      size="sm"
                      className="gap-1.5 bg-emerald-600 hover:bg-emerald-700"
                      onClick={() => {
                        setDetailOpen(false)
                        openResolveDialog(detailIncident)
                      }}
                    >
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      Resolver
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-1.5 text-red-600 border-red-200 hover:bg-red-50"
                      onClick={() => {
                        setDetailOpen(false)
                        setDeleteIncident(detailIncident)
                        setDeleteOpen(true)
                      }}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      Eliminar
                    </Button>
                  </div>
                )}
              </div>
            </ScrollArea>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              Eliminar Incidencia
            </AlertDialogTitle>
            <AlertDialogDescription>
              ¿Estás seguro de que deseas eliminar la incidencia &quot;{deleteIncident?.title}&quot;?
              Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteLoading}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleteLoading}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleteLoading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
