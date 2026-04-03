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
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import {
  FileText, Plus, Search, Eye, Check, X, Loader2,
  AlertTriangle, Pencil, Trash2, Filter, Download,
  CalendarDays, Users,
} from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { useAppStore } from '@/store/app-store'
import type { Contract, ContractTemplate, Employee } from '@/lib/types'
import {
  contractStatusLabels,
  contractTypeLabels,
} from '@/lib/types'

const contractStatusClasses: Record<string, string> = {
  active: 'border-emerald-500/50 text-emerald-700 bg-emerald-50',
  expired: 'border-amber-500/50 text-amber-700 bg-amber-50',
  terminated: 'border-red-500/50 text-red-700 bg-red-50',
  renewed: 'border-teal-500/50 text-teal-700 bg-teal-50',
}

// ============ CONTRACTS TAB ============
function ContractsTab() {
  const { user } = useAppStore()
  const [contracts, setContracts] = useState<Contract[]>([])
  const [templates, setTemplates] = useState<ContractTemplate[]>([])
  const [employees, setEmployees] = useState<Employee[]>([])
  const [loading, setLoading] = useState(true)

  // Filters
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [searchEmployee, setSearchEmployee] = useState('')

  // Generate dialog
  const [generateOpen, setGenerateOpen] = useState(false)
  const [generateLoading, setGenerateLoading] = useState(false)
  const [generateForm, setGenerateForm] = useState({
    templateId: '',
    employeeId: '',
    startDate: '',
    endDate: '',
    notes: '',
  })
  const [empSearch, setEmpSearch] = useState('')
  const [showEmpDropdown, setShowEmpDropdown] = useState(false)

  // Detail dialog
  const [detailOpen, setDetailOpen] = useState(false)
  const [detailContract, setDetailContract] = useState<Contract | null>(null)

  // Delete dialog
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleteContract, setDeleteContract] = useState<Contract | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)

  // Status change dialog
  const [statusOpen, setStatusOpen] = useState(false)
  const [statusContract, setStatusContract] = useState<Contract | null>(null)
  const [statusValue, setStatusValue] = useState('')
  const [statusLoading, setStatusLoading] = useState(false)

  const authHeaders = useCallback(() => ({
    'Content-Type': 'application/json',
    ...(localStorage.getItem('siga_token') ? { Authorization: `Bearer ${localStorage.getItem('siga_token')}` } : {}),
  }), [])

  const fetchContracts = useCallback(async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (filterStatus !== 'all') params.set('status', filterStatus)

      const res = await fetch(`/api/contracts?${params.toString()}`, {
        headers: authHeaders(),
      })
      if (!res.ok) throw new Error('Error al cargar contratos')
      const data = await res.json()
      let result = data
      if (searchEmployee) {
        const term = searchEmployee.toLowerCase()
        result = data.filter((c: Contract) =>
          c.employee?.firstName?.toLowerCase().includes(term) ||
          c.employee?.lastName?.toLowerCase().includes(term) ||
          c.employee?.employeeNumber?.includes(term)
        )
      }
      setContracts(result)
    } catch (error: any) {
      toast.error(error.message || 'Error al cargar contratos')
    } finally {
      setLoading(false)
    }
  }, [filterStatus, searchEmployee, authHeaders])

  const fetchTemplates = useCallback(async () => {
    try {
      const res = await fetch('/api/contracts/templates', { headers: authHeaders() })
      if (res.ok) {
        const data = await res.json()
        setTemplates(data.filter((t: ContractTemplate) => t.active))
      }
    } catch {}
  }, [authHeaders])

  const fetchEmployees = useCallback(async (search = '') => {
    try {
      const params = new URLSearchParams({ limit: '50', search })
      const res = await fetch(`/api/employees?${params.toString()}`, { headers: authHeaders() })
      if (res.ok) {
        const data = await res.json()
        setEmployees(data.employees || [])
      }
    } catch {}
  }, [authHeaders])

  useEffect(() => {
    fetchContracts()
  }, [fetchContracts])

  useEffect(() => {
    fetchTemplates()
    fetchEmployees()
  }, [fetchTemplates, fetchEmployees])

  const handleGenerate = async () => {
    if (!generateForm.templateId || !generateForm.employeeId || !generateForm.startDate) {
      toast.error('Completa los campos requeridos')
      return
    }
    try {
      setGenerateLoading(true)
      const companyId = user?.companyId
      if (!companyId) {
        toast.error('No se encontró la empresa')
        return
      }
      const res = await fetch('/api/contracts', {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({
          templateId: generateForm.templateId,
          employeeId: generateForm.employeeId,
          companyId,
          startDate: generateForm.startDate,
          endDate: generateForm.endDate || undefined,
          notes: generateForm.notes || undefined,
        }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Error al generar contrato')
      }
      toast.success('Contrato generado exitosamente')
      setGenerateOpen(false)
      setGenerateForm({ templateId: '', employeeId: '', startDate: '', endDate: '', notes: '' })
      fetchContracts()
    } catch (error: any) {
      toast.error(error.message || 'Error al generar contrato')
    } finally {
      setGenerateLoading(false)
    }
  }

  const handleMarkSigned = async (contractId: string) => {
    try {
      const res = await fetch(`/api/contracts/${contractId}`, {
        method: 'PUT',
        headers: authHeaders(),
        body: JSON.stringify({ signedAt: 'now' }),
      })
      if (!res.ok) throw new Error('Error al firmar contrato')
      toast.success('Contrato marcado como firmado')
      fetchContracts()
      if (detailContract?.id === contractId) {
        const updated = await res.json()
        setDetailContract(updated)
      }
    } catch (error: any) {
      toast.error(error.message || 'Error al firmar')
    }
  }

  const handleStatusChange = async () => {
    if (!statusContract || !statusValue) return
    try {
      setStatusLoading(true)
      const res = await fetch(`/api/contracts/${statusContract.id}`, {
        method: 'PUT',
        headers: authHeaders(),
        body: JSON.stringify({ status: statusValue }),
      })
      if (!res.ok) throw new Error('Error al cambiar estado')
      toast.success('Estado actualizado')
      setStatusOpen(false)
      fetchContracts()
    } catch (error: any) {
      toast.error(error.message || 'Error al cambiar estado')
    } finally {
      setStatusLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteContract) return
    try {
      setDeleteLoading(true)
      const res = await fetch(`/api/contracts/${deleteContract.id}`, {
        method: 'DELETE',
        headers: authHeaders(),
      })
      if (!res.ok) throw new Error('Error al eliminar contrato')
      toast.success('Contrato eliminado')
      setDeleteOpen(false)
      fetchContracts()
    } catch (error: any) {
      toast.error(error.message || 'Error al eliminar')
    } finally {
      setDeleteLoading(false)
    }
  }

  const openStatusDialog = (contract: Contract) => {
    setStatusContract(contract)
    setStatusValue(contract.status)
    setStatusOpen(true)
  }

  const selectedEmployee = employees.find(e => e.id === generateForm.employeeId)
  const filteredEmps = empSearch
    ? employees.filter(e =>
        `${e.firstName} ${e.lastName}`.toLowerCase().includes(empSearch.toLowerCase()) ||
        (e.employeeNumber || '').includes(empSearch)
      )
    : employees

  return (
    <div className="space-y-4">
      {/* Filter + Generate */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Estado</Label>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="h-9 w-40">
                <SelectValue placeholder="Todos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                {Object.entries(contractStatusLabels).map(([key, label]) => (
                  <SelectItem key={key} value={key}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="relative">
            <Label className="text-xs text-muted-foreground">Buscar empleado</Label>
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Nombre o # empleado"
                className="h-9 pl-9 w-48"
                value={searchEmployee}
                onChange={(e) => setSearchEmployee(e.target.value)}
              />
            </div>
          </div>
        </div>
        <Button onClick={() => setGenerateOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Generar Contrato
        </Button>
      </div>

      {/* Contracts Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="space-y-2 p-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : contracts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16">
              <FileText className="h-12 w-12 text-muted-foreground/50 mb-4" />
              <p className="text-lg font-medium text-muted-foreground">No hay contratos</p>
              <p className="text-sm text-muted-foreground/70 mt-1">
                Genera un nuevo contrato para comenzar
              </p>
            </div>
          ) : (
            <div className="max-h-[calc(100vh-320px)] overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Empleado</TableHead>
                    <TableHead className="hidden md:table-cell">Plantilla</TableHead>
                    <TableHead className="hidden sm:table-cell">Inicio</TableHead>
                    <TableHead className="hidden sm:table-cell">Fin</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="hidden sm:table-cell">Firmado</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {contracts.map((contract) => (
                    <TableRow key={contract.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium text-sm">
                            {contract.employee
                              ? `${contract.employee.firstName} ${contract.employee.lastName}`
                              : 'N/A'}
                          </p>
                          {contract.employee?.employeeNumber && (
                            <p className="text-xs text-muted-foreground">#{contract.employee.employeeNumber}</p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                        {contract.template?.name || 'N/A'}
                      </TableCell>
                      <TableCell className="hidden sm:table-cell text-sm">
                        {new Date(contract.startDate).toLocaleDateString('es-MX')}
                      </TableCell>
                      <TableCell className="hidden sm:table-cell text-sm text-muted-foreground">
                        {contract.endDate
                          ? new Date(contract.endDate).toLocaleDateString('es-MX')
                          : '—'}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={cn('text-[11px] font-medium', contractStatusClasses[contract.status])}>
                          {contractStatusLabels[contract.status] || contract.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        {contract.signedAt ? (
                          <Check className="h-4 w-4 text-emerald-600" />
                        ) : (
                          <X className="h-4 w-4 text-muted-foreground/50" />
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => { setDetailContract(contract); setDetailOpen(true) }}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => openStatusDialog(contract)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-red-500 hover:text-red-700"
                            onClick={() => { setDeleteContract(contract); setDeleteOpen(true) }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Generate Contract Dialog */}
      <Dialog open={generateOpen} onOpenChange={setGenerateOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Generar Contrato
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {/* Template */}
            <div className="space-y-1.5">
              <Label>Plantilla <span className="text-red-500">*</span></Label>
              <Select
                value={generateForm.templateId}
                onValueChange={(v) => setGenerateForm({ ...generateForm, templateId: v })}
              >
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Seleccionar plantilla" />
                </SelectTrigger>
                <SelectContent>
                  {templates.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.name} ({contractTypeLabels[t.type] || t.type})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Employee (searchable) */}
            <div className="space-y-1.5">
              <Label>Empleado <span className="text-red-500">*</span></Label>
              <div className="relative">
                {selectedEmployee ? (
                  <div className="flex items-center gap-2 h-9 px-3 rounded-md border bg-muted/50">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm flex-1">
                      {selectedEmployee.firstName} {selectedEmployee.lastName}
                    </span>
                    <button
                      type="button"
                      onClick={() => { setGenerateForm({ ...generateForm, employeeId: '' }); setEmpSearch('') }}
                      className="text-muted-foreground hover:text-foreground"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="relative">
                      <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Buscar empleado..."
                        className="h-9 pl-9"
                        value={empSearch}
                        onChange={(e) => { setEmpSearch(e.target.value); setShowEmpDropdown(true) }}
                        onFocus={() => setShowEmpDropdown(true)}
                      />
                    </div>
                    {showEmpDropdown && filteredEmps.length > 0 && (
                      <div className="absolute z-50 mt-1 w-full max-h-48 overflow-y-auto rounded-md border bg-popover shadow-md">
                        {filteredEmps.map((emp) => (
                          <button
                            key={emp.id}
                            type="button"
                            className="flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-accent transition-colors text-left"
                            onClick={() => {
                              setGenerateForm({ ...generateForm, employeeId: emp.id })
                              setEmpSearch(`${emp.firstName} ${emp.lastName}`)
                              setShowEmpDropdown(false)
                            }}
                          >
                            <Users className="h-3.5 w-3.5 text-muted-foreground" />
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

            {/* Dates */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Fecha inicio <span className="text-red-500">*</span></Label>
                <Input
                  type="date"
                  value={generateForm.startDate}
                  onChange={(e) => setGenerateForm({ ...generateForm, startDate: e.target.value })}
                  className="h-9"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Fecha fin</Label>
                <Input
                  type="date"
                  value={generateForm.endDate}
                  onChange={(e) => setGenerateForm({ ...generateForm, endDate: e.target.value })}
                  className="h-9"
                />
              </div>
            </div>

            {/* Notes */}
            <div className="space-y-1.5">
              <Label>Notas</Label>
              <Textarea
                placeholder="Notas adicionales (opcional)"
                value={generateForm.notes}
                onChange={(e) => setGenerateForm({ ...generateForm, notes: e.target.value })}
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setGenerateOpen(false)} disabled={generateLoading}>
              Cancelar
            </Button>
            <Button onClick={handleGenerate} disabled={generateLoading} className="gap-2">
              {generateLoading && <Loader2 className="h-4 w-4 animate-spin" />}
              Generar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Detail Dialog */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Detalle de Contrato
            </DialogTitle>
          </DialogHeader>
          {detailContract && (
            <ScrollArea className="max-h-[calc(90vh-10rem)] pr-4">
              <div className="space-y-4 py-2">
                {/* Header info */}
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="outline" className={cn('text-xs', contractStatusClasses[detailContract.status])}>
                    {contractStatusLabels[detailContract.status]}
                  </Badge>
                  {detailContract.signedAt && (
                    <Badge variant="outline" className="text-xs border-emerald-500/50 text-emerald-700 bg-emerald-50">
                      Firmado
                    </Badge>
                  )}
                </div>

                <div className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
                  <div>
                    <p className="text-xs text-muted-foreground">Empleado</p>
                    <p className="font-medium">
                      {detailContract.employee
                        ? `${detailContract.employee.firstName} ${detailContract.employee.lastName}`
                        : 'N/A'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Plantilla</p>
                    <p className="font-medium">{detailContract.template?.name || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Fecha inicio</p>
                    <p className="font-medium">
                      {new Date(detailContract.startDate).toLocaleDateString('es-MX', {
                        day: 'numeric', month: 'long', year: 'numeric',
                      })}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Fecha fin</p>
                    <p className="font-medium">
                      {detailContract.endDate
                        ? new Date(detailContract.endDate).toLocaleDateString('es-MX', {
                            day: 'numeric', month: 'long', year: 'numeric',
                          })
                        : 'Indefinido'}
                    </p>
                  </div>
                  {detailContract.signedAt && (
                    <div>
                      <p className="text-xs text-muted-foreground">Fecha firma</p>
                      <p className="font-medium">
                        {new Date(detailContract.signedAt).toLocaleDateString('es-MX', {
                          day: 'numeric', month: 'long', year: 'numeric',
                        })}
                      </p>
                    </div>
                  )}
                  {detailContract.notes && (
                    <div className="sm:col-span-2">
                      <p className="text-xs text-muted-foreground">Notas</p>
                      <p className="font-medium whitespace-pre-wrap">{detailContract.notes}</p>
                    </div>
                  )}
                </div>

                <Separator />

                {/* Contract content */}
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-2">Contenido del Contrato</p>
                  <div
                    className="rounded-lg border bg-muted/30 p-4 text-sm leading-relaxed prose prose-sm max-w-none overflow-y-auto max-h-96"
                    dangerouslySetInnerHTML={{ __html: detailContract.content }}
                  />
                </div>

                {/* Actions */}
                <div className="flex flex-wrap gap-2 pt-2">
                  {!detailContract.signedAt && (
                    <Button
                      size="sm"
                      className="gap-1.5 bg-emerald-600 hover:bg-emerald-700"
                      onClick={() => handleMarkSigned(detailContract.id)}
                    >
                      <Check className="h-3.5 w-3.5" />
                      Marcar como Firmado
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1.5"
                    onClick={() => { setDetailOpen(false); openStatusDialog(detailContract) }}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                    Cambiar Estado
                  </Button>
                </div>
              </div>
            </ScrollArea>
          )}
        </DialogContent>
      </Dialog>

      {/* Status Change Dialog */}
      <Dialog open={statusOpen} onOpenChange={setStatusOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Cambiar Estado</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="text-sm text-muted-foreground">
              Contrato: {statusContract?.employee?.firstName} {statusContract?.employee?.lastName}
            </div>
            <div className="space-y-1.5">
              <Label>Nuevo estado</Label>
              <Select value={statusValue} onValueChange={setStatusValue}>
                <SelectTrigger className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(contractStatusLabels).map(([key, label]) => (
                    <SelectItem key={key} value={key}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setStatusOpen(false)} disabled={statusLoading}>
              Cancelar
            </Button>
            <Button onClick={handleStatusChange} disabled={statusLoading}>
              {statusLoading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Actualizar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              Eliminar Contrato
            </AlertDialogTitle>
            <AlertDialogDescription>
              ¿Estás seguro de que deseas eliminar este contrato? Esta acción no se puede deshacer.
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

// ============ TEMPLATES TAB ============
function TemplatesTab() {
  const { user } = useAppStore()
  const [templates, setTemplates] = useState<ContractTemplate[]>([])
  const [loading, setLoading] = useState(true)

  // Create/Edit dialog
  const [formOpen, setFormOpen] = useState(false)
  const [formLoading, setFormLoading] = useState(false)
  const [editingTemplate, setEditingTemplate] = useState<ContractTemplate | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    type: 'individual_work',
    content: '',
    defaultDurationDays: '',
  })

  // Delete dialog
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleteTemplate, setDeleteTemplate] = useState<ContractTemplate | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)

  const authHeaders = useCallback(() => ({
    'Content-Type': 'application/json',
    ...(localStorage.getItem('siga_token') ? { Authorization: `Bearer ${localStorage.getItem('siga_token')}` } : {}),
  }), [])

  const fetchTemplates = useCallback(async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/contracts/templates', { headers: authHeaders() })
      if (!res.ok) throw new Error('Error al cargar plantillas')
      const data = await res.json()
      setTemplates(data)
    } catch (error: any) {
      toast.error(error.message || 'Error al cargar plantillas')
    } finally {
      setLoading(false)
    }
  }, [authHeaders])

  useEffect(() => {
    fetchTemplates()
  }, [fetchTemplates])

  const openCreateForm = () => {
    setEditingTemplate(null)
    setFormData({ name: '', type: 'individual_work', content: '', defaultDurationDays: '' })
    setFormOpen(true)
  }

  const openEditForm = (template: ContractTemplate) => {
    setEditingTemplate(template)
    setFormData({
      name: template.name,
      type: template.type,
      content: template.content,
      defaultDurationDays: template.defaultDurationDays?.toString() || '',
    })
    setFormOpen(true)
  }

  const handleSave = async () => {
    if (!formData.name || !formData.type || !formData.content) {
      toast.error('Completa los campos requeridos')
      return
    }
    try {
      setFormLoading(true)
      const companyId = user?.companyId
      if (!companyId) {
        toast.error('No se encontró la empresa')
        return
      }
      const url = editingTemplate
        ? `/api/contracts/templates/${editingTemplate.id}`
        : '/api/contracts/templates'
      const method = editingTemplate ? 'PUT' : 'POST'
      const body: Record<string, unknown> = {
        name: formData.name,
        type: formData.type,
        content: formData.content,
        defaultDurationDays: formData.defaultDurationDays || undefined,
      }
      if (!editingTemplate) body.companyId = companyId

      const res = await fetch(url, {
        method,
        headers: authHeaders(),
        body: JSON.stringify(body),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Error al guardar plantilla')
      }
      toast.success(editingTemplate ? 'Plantilla actualizada' : 'Plantilla creada')
      setFormOpen(false)
      fetchTemplates()
    } catch (error: any) {
      toast.error(error.message || 'Error al guardar plantilla')
    } finally {
      setFormLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteTemplate) return
    try {
      setDeleteLoading(true)
      const res = await fetch(`/api/contracts/templates/${deleteTemplate.id}`, {
        method: 'DELETE',
        headers: authHeaders(),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Error al eliminar plantilla')
      }
      toast.success('Plantilla eliminada')
      setDeleteOpen(false)
      fetchTemplates()
    } catch (error: any) {
      toast.error(error.message || 'Error al eliminar')
    } finally {
      setDeleteLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {templates.length} plantilla(s)
        </p>
        <Button onClick={openCreateForm} className="gap-2" size="sm">
          <Plus className="h-4 w-4" />
          Nueva Plantilla
        </Button>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="space-y-2 p-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : templates.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16">
              <FileText className="h-12 w-12 text-muted-foreground/50 mb-4" />
              <p className="text-lg font-medium text-muted-foreground">No hay plantillas</p>
              <p className="text-sm text-muted-foreground/70 mt-1">
                Crea una nueva plantilla de contrato
              </p>
            </div>
          ) : (
            <div className="max-h-[calc(100vh-360px)] overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nombre</TableHead>
                    <TableHead className="hidden sm:table-cell">Tipo</TableHead>
                    <TableHead className="hidden md:table-cell">Duración (días)</TableHead>
                    <TableHead className="hidden sm:table-cell">Contratos</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {templates.map((template) => (
                    <TableRow key={template.id}>
                      <TableCell className="font-medium text-sm">{template.name}</TableCell>
                      <TableCell className="hidden sm:table-cell text-sm text-muted-foreground">
                        {contractTypeLabels[template.type] || template.type}
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                        {template.defaultDurationDays || '—'}
                      </TableCell>
                      <TableCell className="hidden sm:table-cell text-sm text-muted-foreground">
                        {template._count?.contracts || 0}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={cn(
                            'text-[11px] font-medium',
                            template.active
                              ? 'border-emerald-500/50 text-emerald-700 bg-emerald-50'
                              : 'border-gray-500/50 text-gray-600 bg-gray-50'
                          )}
                        >
                          {template.active ? 'Activa' : 'Inactiva'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => openEditForm(template)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-red-500 hover:text-red-700"
                            onClick={() => { setDeleteTemplate(template); setDeleteOpen(true) }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              {editingTemplate ? 'Editar Plantilla' : 'Nueva Plantilla'}
            </DialogTitle>
          </DialogHeader>
          <ScrollArea className="max-h-[calc(90vh-10rem)] pr-4">
            <div className="space-y-4 py-2">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label>Nombre <span className="text-red-500">*</span></Label>
                  <Input
                    placeholder="Nombre de la plantilla"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Tipo <span className="text-red-500">*</span></Label>
                  <Select
                    value={formData.type}
                    onValueChange={(v) => setFormData({ ...formData, type: v })}
                  >
                    <SelectTrigger className="h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(contractTypeLabels).map(([key, label]) => (
                        <SelectItem key={key} value={key}>{label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Contenido (HTML) <span className="text-red-500">*</span></Label>
                <Textarea
                  placeholder="<h1>Contrato de Trabajo</h1><p>Contenido del contrato...</p>"
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  rows={12}
                  className="font-mono text-xs"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Duración predeterminada (días)</Label>
                <Input
                  type="number"
                  placeholder="Ej: 365 (opcional)"
                  value={formData.defaultDurationDays}
                  onChange={(e) => setFormData({ ...formData, defaultDurationDays: e.target.value })}
                  className="h-9 w-48"
                />
              </div>
            </div>
          </ScrollArea>
          <DialogFooter>
            <Button variant="outline" onClick={() => setFormOpen(false)} disabled={formLoading}>
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={formLoading} className="gap-2">
              {formLoading && <Loader2 className="h-4 w-4 animate-spin" />}
              {editingTemplate ? 'Actualizar' : 'Crear'} Plantilla
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              Eliminar Plantilla
            </AlertDialogTitle>
            <AlertDialogDescription>
              {deleteTemplate && deleteTemplate._count?.contracts > 0 ? (
                <>
                  <strong>No se puede eliminar</strong> esta plantilla porque tiene{' '}
                  {deleteTemplate._count.contracts} contrato(s) asociado(s).
                  Elimina primero los contratos asociados.
                </>
              ) : (
                '¿Estás seguro de que deseas eliminar esta plantilla? Esta acción no se puede deshacer.'
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteLoading}>Cancelar</AlertDialogCancel>
            {deleteTemplate && deleteTemplate._count?.contracts > 0 ? (
              <AlertDialogAction onClick={() => setDeleteOpen(false)}>
                Entendido
              </AlertDialogAction>
            ) : (
              <AlertDialogAction
                onClick={handleDelete}
                disabled={deleteLoading}
                className="bg-red-600 hover:bg-red-700"
              >
                {deleteLoading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                Eliminar
              </AlertDialogAction>
            )}
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

// ============ MAIN VIEW ============
export function ContractsView() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Contratos</h1>
        <p className="text-sm text-muted-foreground">Gestión de contratos y plantillas</p>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="contracts">
        <TabsList>
          <TabsTrigger value="contracts" className="gap-2">
            <FileText className="h-4 w-4" />
            Contratos
          </TabsTrigger>
          <TabsTrigger value="templates" className="gap-2">
            <CalendarDays className="h-4 w-4" />
            Plantillas
          </TabsTrigger>
        </TabsList>
        <TabsContent value="contracts" className="mt-4">
          <ContractsTab />
        </TabsContent>
        <TabsContent value="templates" className="mt-4">
          <TemplatesTab />
        </TabsContent>
      </Tabs>
    </div>
  )
}
