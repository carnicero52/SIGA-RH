'use client'

import { useEffect, useState, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  ArrowLeft, Pencil, Clock, FileText, AlertTriangle, Calendar,
  Building2, GitBranch, Briefcase, UserCircle, CheckCircle2,
  XCircle, Shield, Plus, Trash2, Download, RotateCcw,
} from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { useAppStore } from '@/store/app-store'
import type {
  Employee, AttendanceRecord, Contract, Incident, Document as DocType, EmployeeShift,
} from '@/lib/types'
import {
  employeeStatusLabels, employmentTypeLabels,
  attendanceStatusLabels, incidentTypeLabels, severityLabels,
  incidentStatusLabels, contractStatusLabels,
} from '@/lib/types'

// ---- Auth helper ----
function authHeaders() {
  return { Authorization: `Bearer ${localStorage.getItem('siga_token')}` }
}

// ---- Helpers ----
function getInitials(first: string, last: string) {
  return `${(first?.[0] || '').toUpperCase()}${(last?.[0] || '').toUpperCase()}`
}

function calcAntiquity(hireDate?: string): string {
  if (!hireDate) return '-'
  const start = new Date(hireDate)
  const now = new Date()
  const years = now.getFullYear() - start.getFullYear()
  const months = now.getMonth() - start.getMonth()
  const totalMonths = years * 12 + months
  if (totalMonths < 1) return 'Menos de 1 mes'
  const y = Math.floor(totalMonths / 12)
  const m = totalMonths % 12
  if (y === 0) return `${m} mes${m > 1 ? 'es' : ''}`
  if (m === 0) return `${y} año${y > 1 ? 's' : ''}`
  return `${y} año${y > 1 ? 's' : ''} y ${m} mes${m > 1 ? 'es' : ''}`
}

const dayNames = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']

// ---- Status badges ----
function AttendanceBadge({ status }: { status: string }) {
  const colorClass =
    status === 'on_time'
      ? 'border-emerald-500/50 text-emerald-600 bg-emerald-50'
      : status === 'late'
        ? 'border-amber-500/50 text-amber-600 bg-amber-50'
        : status === 'early_departure'
          ? 'border-orange-500/50 text-orange-600 bg-orange-50'
          : status === 'absent'
            ? 'border-red-500/50 text-red-600 bg-red-50'
            : status === 'fraud_detected'
              ? 'border-purple-500/50 text-purple-600 bg-purple-50'
              : 'border-muted text-muted-foreground'
  return (
    <Badge variant="outline" className={cn('text-[11px] font-medium', colorClass)}>
      {attendanceStatusLabels[status] || status}
    </Badge>
  )
}

function EmployeeStatusBadge({ status }: { status: string }) {
  const colorClass =
    status === 'active'
      ? 'border-emerald-500/50 text-emerald-600 bg-emerald-50'
      : status === 'inactive'
        ? 'border-gray-500/50 text-gray-600 bg-gray-50'
        : status === 'on_leave'
          ? 'border-amber-500/50 text-amber-600 bg-amber-50'
          : 'border-red-500/50 text-red-600 bg-red-50'
  return (
    <Badge variant="outline" className={cn('text-[11px] font-medium', colorClass)}>
      {employeeStatusLabels[status] || status}
    </Badge>
  )
}

function SeverityBadge({ severity }: { severity: string }) {
  const colorClass =
    severity === 'low'
      ? 'border-emerald-500/50 text-emerald-600 bg-emerald-50'
      : severity === 'medium'
        ? 'border-amber-500/50 text-amber-600 bg-amber-50'
        : severity === 'high'
          ? 'border-orange-500/50 text-orange-600 bg-orange-50'
          : 'border-red-500/50 text-red-600 bg-red-50'
  return (
    <Badge variant="outline" className={cn('text-[11px] font-medium', colorClass)}>
      {severityLabels[severity] || severity}
    </Badge>
  )
}

function ContractStatusBadge({ status }: { status: string }) {
  const colorClass =
    status === 'active'
      ? 'border-emerald-500/50 text-emerald-600 bg-emerald-50'
      : status === 'expired'
        ? 'border-gray-500/50 text-gray-600 bg-gray-50'
        : status === 'terminated'
          ? 'border-red-500/50 text-red-600 bg-red-50'
          : 'border-teal-500/50 text-teal-600 bg-teal-50'
  return (
    <Badge variant="outline" className={cn('text-[11px] font-medium', colorClass)}>
      {contractStatusLabels[status] || status}
    </Badge>
  )
}

// ---- Loading skeleton ----
function DetailSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Skeleton className="h-10 w-10 rounded-full" />
        <div className="space-y-2">
          <Skeleton className="h-7 w-48" />
          <Skeleton className="h-4 w-32" />
        </div>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-24 rounded-lg" />
        ))}
      </div>
      <Skeleton className="h-[400px] rounded-lg" />
    </div>
  )
}

// ---- Summary card ----
function SummaryCard({ icon: Icon, label, value, colorClass = 'text-primary' }: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: string | number
  colorClass?: string
}) {
  return (
    <Card className="gap-0">
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
            <Icon className={cn('h-4 w-4', colorClass)} />
          </div>
          <div className="min-w-0">
            <p className="text-xs text-muted-foreground truncate">{label}</p>
            <p className="text-sm font-semibold truncate">{value || '-'}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// =====================
// MAIN COMPONENT
// =====================
export function EmployeeDetailView() {
  const { viewParams, navigate } = useAppStore()
  const employeeId = viewParams.id as string

  const [employee, setEmployee] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  // Document form state
  const [docDialogOpen, setDocDialogOpen] = useState(false)
  const [docForm, setDocForm] = useState({ name: '', type: 'identificacion', notes: '' })
  const [docSubmitting, setDocSubmitting] = useState(false)

  // Documents list
  const [documents, setDocuments] = useState<DocType[]>([])

  // Delete doc state
  const [deletingDocId, setDeletingDocId] = useState<string | null>(null)

  const fetchEmployee = useCallback(async () => {
    if (!employeeId) return
    try {
      setLoading(true)
      const res = await fetch(`/api/employees/${employeeId}`, { headers: authHeaders() })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Error al cargar empleado')
      }
      const data = await res.json()
      setEmployee(data)
      setDocuments(data.documents || [])
    } catch (error: any) {
      toast.error(error.message || 'Error al cargar empleado')
      navigate('employees')
    } finally {
      setLoading(false)
    }
  }, [employeeId, navigate])

  useEffect(() => {
    fetchEmployee()
  }, [fetchEmployee])

  // Document handlers
  const handleCreateDoc = async () => {
    if (!docForm.name.trim() || !employeeId) return
    try {
      setDocSubmitting(true)
      const res = await fetch('/api/documents', {
        method: 'POST',
        headers: { ...authHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: docForm.name,
          type: docForm.type,
          notes: docForm.notes || null,
          employeeId,
        }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Error al crear documento')
      }
      toast.success('Documento agregado correctamente')
      setDocDialogOpen(false)
      setDocForm({ name: '', type: 'identificacion', notes: '' })
      fetchEmployee()
    } catch (error: any) {
      toast.error(error.message || 'Error al crear documento')
    } finally {
      setDocSubmitting(false)
    }
  }

  const handleDeleteDoc = async (docId: string) => {
    try {
      setDeletingDocId(docId)
      const res = await fetch(`/api/documents?id=${docId}`, {
        method: 'DELETE',
        headers: authHeaders(),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Error al eliminar documento')
      }
      toast.success('Documento eliminado correctamente')
      fetchEmployee()
    } catch (error: any) {
      toast.error(error.message || 'Error al eliminar documento')
    } finally {
      setDeletingDocId(null)
    }
  }

  if (loading) return <DetailSkeleton />
  if (!employee) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <p className="text-muted-foreground">Empleado no encontrado</p>
        <Button variant="outline" onClick={() => navigate('employees')} className="mt-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Volver a Empleados
        </Button>
      </div>
    )
  }

  const attendanceRecords: AttendanceRecord[] = employee.attendanceRecords || []
  const contracts: Contract[] = employee.contracts || []
  const incidents: Incident[] = employee.incidents || []
  const docs: DocType[] = documents
  const currentShift: (EmployeeShift & { shift?: any }) | null = employee.employeeShifts?.[0] || null
  const shiftDays = currentShift?.daysOfWeek ? JSON.parse(currentShift.daysOfWeek) : []

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost" size="icon"
            onClick={() => navigate('employees')}
            className="shrink-0"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <Avatar className="h-12 w-12">
            <AvatarFallback className="bg-emerald-100 text-emerald-700 text-base font-semibold">
              {getInitials(employee.firstName, employee.lastName)}
            </AvatarFallback>
          </Avatar>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight">
                {employee.firstName} {employee.lastName}
              </h1>
              <EmployeeStatusBadge status={employee.status} />
            </div>
            <p className="text-sm text-muted-foreground">{employee.email}</p>
          </div>
        </div>
        <Button
          variant="outline"
          onClick={() => navigate('employees')}
          className="shrink-0"
        >
          <Pencil className="h-4 w-4 mr-2" />
          Editar
        </Button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        <SummaryCard icon={GitBranch} label="Departamento" value={employee.department?.name} colorClass="text-teal-600" />
        <SummaryCard icon={Building2} label="Sucursal" value={employee.branch?.name} colorClass="text-emerald-600" />
        <SummaryCard icon={Briefcase} label="Puesto" value={employee.position?.name} colorClass="text-green-600" />
        <SummaryCard icon={Calendar} label="Fecha de Ingreso" value={employee.hireDate ? new Date(employee.hireDate).toLocaleDateString('es-MX') : '-'} colorClass="text-amber-600" />
        <SummaryCard icon={RotateCcw} label="Antigüedad" value={calcAntiquity(employee.hireDate)} colorClass="text-teal-600" />
        <SummaryCard icon={UserCircle} label="No. Empleado" value={employee.employeeNumber || '-'} colorClass="text-emerald-600" />
      </div>

      {/* Tabs */}
      <Tabs defaultValue="asistencia" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="asistencia" className="text-xs sm:text-sm">
            <Clock className="h-4 w-4 mr-1 hidden sm:inline-block" />
            Asistencia
          </TabsTrigger>
          <TabsTrigger value="contratos" className="text-xs sm:text-sm">
            <FileText className="h-4 w-4 mr-1 hidden sm:inline-block" />
            Contratos
          </TabsTrigger>
          <TabsTrigger value="incidencias" className="text-xs sm:text-sm">
            <AlertTriangle className="h-4 w-4 mr-1 hidden sm:inline-block" />
            Incidencias
          </TabsTrigger>
          <TabsTrigger value="documentos" className="text-xs sm:text-sm">
            <FileText className="h-4 w-4 mr-1 hidden sm:inline-block" />
            Documentos
          </TabsTrigger>
          <TabsTrigger value="turnos" className="text-xs sm:text-sm">
            <Calendar className="h-4 w-4 mr-1 hidden sm:inline-block" />
            Turnos
          </TabsTrigger>
        </TabsList>

        {/* Asistencia Tab */}
        <TabsContent value="asistencia">
          <Card className="gap-0">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Registros de Asistencia</CardTitle>
            </CardHeader>
            <CardContent className="px-0">
              {attendanceRecords.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Clock className="h-10 w-10 text-muted-foreground/50 mb-3" />
                  <p className="text-sm text-muted-foreground">Sin registros de asistencia</p>
                </div>
              ) : (
                <div className="max-h-96 overflow-y-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="pl-6">Fecha</TableHead>
                        <TableHead>Tipo</TableHead>
                        <TableHead>Hora</TableHead>
                        <TableHead>Estado</TableHead>
                        <TableHead className="hidden md:table-cell">Sucursal</TableHead>
                        <TableHead className="pr-6">Verificado</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {attendanceRecords.map((rec) => (
                        <TableRow key={rec.id}>
                          <TableCell className="pl-6 text-sm">
                            {new Date(rec.recordTime).toLocaleDateString('es-MX')}
                          </TableCell>
                          <TableCell className="text-sm">
                            <Badge variant="secondary" className="text-[11px]">
                              {rec.recordType === 'check_in' ? 'Entrada' : 'Salida'}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm font-mono tabular-nums">
                            {new Date(rec.recordTime).toLocaleTimeString('es-MX', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </TableCell>
                          <TableCell>
                            <AttendanceBadge status={rec.status} />
                          </TableCell>
                          <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                            {rec.branch?.name || '-'}
                          </TableCell>
                          <TableCell className="pr-6">
                            {rec.verified ? (
                              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                            ) : (
                              <XCircle className="h-4 w-4 text-muted-foreground/40" />
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Contratos Tab */}
        <TabsContent value="contratos">
          <Card className="gap-0">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Contratos</CardTitle>
            </CardHeader>
            <CardContent>
              {contracts.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <FileText className="h-10 w-10 text-muted-foreground/50 mb-3" />
                  <p className="text-sm text-muted-foreground">Sin contratos registrados</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {contracts.map((contract) => (
                    <div
                      key={contract.id}
                      className="flex flex-col sm:flex-row sm:items-center gap-3 rounded-lg border p-4 hover:bg-muted/30 transition-colors"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-medium text-sm">{contract.template?.name || 'Contrato'}</p>
                          <ContractStatusBadge status={contract.status} />
                        </div>
                        <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
                          <span>Inicio: {new Date(contract.startDate).toLocaleDateString('es-MX')}</span>
                          {contract.endDate && (
                            <span>Fin: {new Date(contract.endDate).toLocaleDateString('es-MX')}</span>
                          )}
                        </div>
                      </div>
                      {contract.signedDocumentUrl && (
                        <Button variant="ghost" size="sm" className="shrink-0">
                          <Download className="h-4 w-4 mr-1" />
                          Descargar
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Incidencias Tab */}
        <TabsContent value="incidencias">
          <Card className="gap-0">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Incidencias</CardTitle>
            </CardHeader>
            <CardContent>
              {incidents.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Shield className="h-10 w-10 text-muted-foreground/50 mb-3" />
                  <p className="text-sm text-muted-foreground">Sin incidencias registradas</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {incidents.map((inc) => (
                    <div
                      key={inc.id}
                      className="flex flex-col sm:flex-row sm:items-start gap-3 rounded-lg border p-4 hover:bg-muted/30 transition-colors"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge variant="secondary" className="text-[11px]">
                            {incidentTypeLabels[inc.type] || inc.type}
                          </Badge>
                          <SeverityBadge severity={inc.severity} />
                          <Badge
                            variant="outline"
                            className={cn(
                              'text-[11px] font-medium',
                              inc.status === 'open' && 'border-amber-500/50 text-amber-600 bg-amber-50',
                              inc.status === 'under_review' && 'border-teal-500/50 text-teal-600 bg-teal-50',
                              inc.status === 'resolved' && 'border-emerald-500/50 text-emerald-600 bg-emerald-50',
                              inc.status === 'dismissed' && 'border-gray-500/50 text-gray-600 bg-gray-50',
                            )}
                          >
                            {incidentStatusLabels[inc.status] || inc.status}
                          </Badge>
                        </div>
                        <p className="font-medium text-sm mt-1">{inc.title}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {new Date(inc.date).toLocaleDateString('es-MX')}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Documentos Tab */}
        <TabsContent value="documentos">
          <Card className="gap-0">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Documentos</CardTitle>
                <Button
                  size="sm"
                  className="bg-emerald-600 hover:bg-emerald-700"
                  onClick={() => setDocDialogOpen(true)}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Agregar
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {docs.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <FileText className="h-10 w-10 text-muted-foreground/50 mb-3" />
                  <p className="text-sm text-muted-foreground">Sin documentos</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {docs.map((doc) => (
                    <div
                      key={doc.id}
                      className="flex items-center gap-3 rounded-lg border p-3 hover:bg-muted/30 transition-colors"
                    >
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-teal-50">
                        <FileText className="h-4 w-4 text-teal-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{doc.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {doc.type} {doc.notes ? `· ${doc.notes}` : ''}
                        </p>
                      </div>
                      <Button
                        variant="ghost" size="icon" className="h-8 w-8 shrink-0"
                        onClick={() => handleDeleteDoc(doc.id)}
                        disabled={deletingDocId === doc.id}
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Turnos Tab */}
        <TabsContent value="turnos">
          <Card className="gap-0">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Turno Asignado</CardTitle>
            </CardHeader>
            <CardContent>
              {!currentShift ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Calendar className="h-10 w-10 text-muted-foreground/50 mb-3" />
                  <p className="text-sm text-muted-foreground">Sin turno asignado</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="rounded-lg border p-4">
                      <p className="text-xs text-muted-foreground mb-1">Turno</p>
                      <div className="flex items-center gap-2">
                        <div
                          className="h-3 w-3 rounded-full"
                          style={{ backgroundColor: currentShift.shift?.color || '#10b981' }}
                        />
                        <p className="font-semibold text-sm">{currentShift.shift?.name || '-'}</p>
                      </div>
                    </div>
                    <div className="rounded-lg border p-4">
                      <p className="text-xs text-muted-foreground mb-1">Horario</p>
                      <p className="font-semibold text-sm">
                        {currentShift.shift?.startTime || '-'} - {currentShift.shift?.endTime || '-'}
                      </p>
                    </div>
                    <div className="rounded-lg border p-4">
                      <p className="text-xs text-muted-foreground mb-1">Vigencia</p>
                      <p className="text-sm">
                        {new Date(currentShift.effectiveDate).toLocaleDateString('es-MX')}
                        {currentShift.endDate ? ` → ${new Date(currentShift.endDate).toLocaleDateString('es-MX')}` : ' → Vigente'}
                      </p>
                    </div>
                    <div className="rounded-lg border p-4">
                      <p className="text-xs text-muted-foreground mb-1">Tolerancia</p>
                      <p className="text-sm">{currentShift.shift?.toleranceMinutes || 0} minutos</p>
                    </div>
                  </div>
                  <Separator />
                  <div>
                    <p className="text-xs text-muted-foreground mb-2">Días de Trabajo</p>
                    <div className="flex flex-wrap gap-2">
                      {[1, 2, 3, 4, 5, 6, 0].map((day) => (
                        <div
                          key={day}
                          className={cn(
                            'flex h-9 w-9 items-center justify-center rounded-lg text-xs font-medium transition-colors',
                            shiftDays.includes(day)
                              ? 'bg-emerald-100 text-emerald-700'
                              : 'bg-muted text-muted-foreground/50',
                          )}
                        >
                          {dayNames[day]?.substring(0, 3)}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Create Document Dialog */}
      <Dialog open={docDialogOpen} onOpenChange={setDocDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Agregar Documento</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Nombre *</Label>
              <Input
                value={docForm.name}
                onChange={(e) => setDocForm({ ...docForm, name: e.target.value })}
                placeholder="Nombre del documento"
              />
            </div>
            <div className="space-y-2">
              <Label>Tipo *</Label>
              <Select value={docForm.type} onValueChange={(v) => setDocForm({ ...docForm, type: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="identificacion">Identificación</SelectItem>
                  <SelectItem value="curp">CURP</SelectItem>
                  <SelectItem value="rfc">RFC</SelectItem>
                  <SelectItem value="nss">NSS</SelectItem>
                  <SelectItem value="comprobante_domicilio">Comprobante de Domicilio</SelectItem>
                  <SelectItem value="acta_nacimiento">Acta de Nacimiento</SelectItem>
                  <SelectItem value="cartilla_militar">Cartilla Militar</SelectItem>
                  <SelectItem value="certificado_estudios">Certificado de Estudios</SelectItem>
                  <SelectItem value="referencias">Referencias</SelectItem>
                  <SelectItem value="contrato">Contrato</SelectItem>
                  <SelectItem value="otro">Otro</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Notas</Label>
              <Input
                value={docForm.notes}
                onChange={(e) => setDocForm({ ...docForm, notes: e.target.value })}
                placeholder="Notas opcionales"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDocDialogOpen(false)}>Cancelar</Button>
            <Button
              onClick={handleCreateDoc}
              disabled={docSubmitting || !docForm.name.trim()}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              {docSubmitting ? 'Guardando...' : 'Agregar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
