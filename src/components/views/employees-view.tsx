'use client'

import { useEffect, useState, useCallback } from 'react'
import { Card, CardContent } from '@/components/ui/card'
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
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Plus, Search, ChevronLeft, ChevronRight, Pencil, Trash2, Users,
  Building2, GitBranch, Briefcase, UserCircle, KeyRound,
} from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { useAppStore } from '@/store/app-store'
import type { Employee, Branch, Department, Position } from '@/lib/types'
import { employeeStatusLabels, employmentTypeLabels } from '@/lib/types'
import { useCompanyCountry } from '@/hooks/useCompanyCountry'

// ---- Auth helper ----
function authHeaders() {
  return { Authorization: `Bearer ${localStorage.getItem('siga_token')}` }
}

// ---- Empty form state ----
const emptyForm = {
  firstName: '', lastName: '', email: '', phone: '',
  curp: '', rfc: '', nss: '', birthDate: '', gender: '',
  address: '', city: '', state: '',
  employeeNumber: '', hireDate: '', employmentType: 'full_time', status: 'active',
  branchId: '', departmentId: '', positionId: '',
  bloodType: '',
  emergencyContact: '', emergencyPhone: '', emergencyRelation: '',
  bankName: '', bankAccount: '', bankClabe: '',
  notes: '',
  pin: '',
}

// ---- Status badge helper ----
function StatusBadge({ status }: { status: string }) {
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

// ---- Avatar initials helper ----
function getInitials(first: string, last: string) {
  return `${(first?.[0] || '').toUpperCase()}${(last?.[0] || '').toUpperCase()}`
}

// ---- Loading skeleton ----
function TableSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 px-4">
          <Skeleton className="h-8 w-8 rounded-full" />
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-4 w-40 flex-1" />
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-5 w-16" />
        </div>
      ))}
    </div>
  )
}

// ---- Pagination component ----
function PaginationBar({
  page, totalPages, onPageChange,
}: {
  page: number
  totalPages: number
  onPageChange: (p: number) => void
}) {
  if (totalPages <= 1) return null

  const pages: number[] = []
  const start = Math.max(1, page - 2)
  const end = Math.min(totalPages, page + 2)
  for (let i = start; i <= end; i++) pages.push(i)

  return (
    <div className="flex items-center justify-between px-2">
      <p className="text-sm text-muted-foreground">
        Página {page} de {totalPages}
      </p>
      <div className="flex items-center gap-1">
        <Button
          variant="outline" size="sm"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        {start > 1 && (
          <>
            <Button variant="ghost" size="sm" onClick={() => onPageChange(1)}>1</Button>
            {start > 2 && <span className="px-1 text-muted-foreground">...</span>}
          </>
        )}
        {pages.map((p) => (
          <Button
            key={p}
            variant={p === page ? 'default' : 'ghost'}
            size="sm"
            onClick={() => onPageChange(p)}
          >
            {p}
          </Button>
        ))}
        {end < totalPages && (
          <>
            {end < totalPages - 1 && <span className="px-1 text-muted-foreground">...</span>}
            <Button variant="ghost" size="sm" onClick={() => onPageChange(totalPages)}>{totalPages}</Button>
          </>
        )}
        <Button
          variant="outline" size="sm"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}

// ---- Employee form dialog ----
function EmployeeFormDialog({
  open, onOpenChange, form, setForm, branches, departments, positions,
  onSubmit, loading, editMode, countryConfig,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  form: typeof emptyForm
  setForm: React.Dispatch<React.SetStateAction<typeof emptyForm>>
  branches: Branch[]
  departments: Department[]
  positions: Position[]
  onSubmit: () => void
  loading: boolean
  editMode: boolean
  countryConfig: ReturnType<typeof useCompanyCountry>['config']
}) {
  const [approvedCandidates, setApprovedCandidates] = useState<any[]>([])

  useEffect(() => {
    if (!open || editMode) return
    // Load approved/pending_hire candidates
    fetch('/api/candidates?status=pending_hire,hired,offered', { headers: authHeaders() })
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data)) setApprovedCandidates(data)
        else setApprovedCandidates([])
      })
      .catch(() => setApprovedCandidates([]))
  }, [open, editMode])

  const applyCandidate = (candidateId: string) => {
    const c = approvedCandidates.find(x => x.id === candidateId)
    if (!c) return
    setForm(prev => ({
      ...prev,
      firstName: c.firstName || '',
      lastName: c.lastName || '',
      email: c.email || '',
      phone: c.phone || '',
    }))
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>{editMode ? 'Editar Empleado' : 'Nuevo Empleado'}</DialogTitle>
        </DialogHeader>
        <ScrollArea className="max-h-[70vh] pr-3">
          {/* Candidate pre-fill — only in create mode */}
          {!editMode && approvedCandidates.length > 0 && (
            <div className="mb-4 p-3 rounded-lg border border-emerald-200 bg-emerald-50 space-y-2">
              <p className="text-xs font-semibold text-emerald-800 flex items-center gap-1.5">
                👥 Candidatos aprobados disponibles
              </p>
              <Select onValueChange={applyCandidate}>
                <SelectTrigger className="bg-white border-emerald-300 text-sm">
                  <SelectValue placeholder="Seleccionar candidato aprobado para pre-llenar formulario..." />
                </SelectTrigger>
                <SelectContent>
                  {approvedCandidates.map((c: any) => (
                    <SelectItem key={c.id} value={c.id}>
                      <span className="font-medium">{c.firstName} {c.lastName}</span>
                      <span className="text-muted-foreground ml-2 text-xs">— {c.vacant?.title || 'Sin vacante'}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-emerald-700">Al seleccionar, se pre-llenan nombre, apellido, email y teléfono.</p>
            </div>
          )}

          <Tabs defaultValue="personal" className="w-full">
            <TabsList className="grid w-full grid-cols-4 mb-4">
              <TabsTrigger value="personal">Personal</TabsTrigger>
              <TabsTrigger value="laboral">Laboral</TabsTrigger>
              <TabsTrigger value="emergency">Emergencia</TabsTrigger>
              <TabsTrigger value="banking">Bancarios</TabsTrigger>
            </TabsList>

            {/* Datos Personales */}
            <TabsContent value="personal" className="space-y-4 mt-0">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Nombre *</Label>
                  <Input
                    value={form.firstName}
                    onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                    placeholder="Nombre"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Apellido *</Label>
                  <Input
                    value={form.lastName}
                    onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                    placeholder="Apellido"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Email *</Label>
                  <Input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    placeholder="correo@empresa.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Teléfono</Label>
                  <Input
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    placeholder="(55) 1234-5678"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Fecha de Nacimiento</Label>
                  <Input
                    type="date"
                    value={form.birthDate}
                    onChange={(e) => setForm({ ...form, birthDate: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Género</Label>
                  <Select value={form.gender || undefined} onValueChange={(v) => setForm({ ...form, gender: v })}>
                    <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="M">Masculino</SelectItem>
                      <SelectItem value="F">Femenino</SelectItem>
                      <SelectItem value="other">Otro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Separator />
              <div className="space-y-2">
                <Label>Dirección</Label>
                <Input
                  value={form.address}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                  placeholder="Calle, número, colonia..."
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Ciudad</Label>
                  <Input
                    value={form.city}
                    onChange={(e) => setForm({ ...form, city: e.target.value })}
                    placeholder="Ciudad"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Estado</Label>
                  <Input
                    value={form.state}
                    onChange={(e) => setForm({ ...form, state: e.target.value })}
                    placeholder="Estado"
                  />
                </div>
              </div>
              <Separator />
              {/* Dynamic ID fields by country */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {countryConfig.fields.id1 && (
                  <div className="space-y-1">
                    <Label>{countryConfig.fields.id1.label}</Label>
                    <Input
                      value={form.curp}
                      onChange={(e) => setForm({ ...form, curp: e.target.value.toUpperCase() })}
                      placeholder={countryConfig.fields.id1.placeholder}
                      maxLength={countryConfig.fields.id1.maxLength}
                    />
                    {countryConfig.fields.id1.hint && <p className="text-xs text-muted-foreground">{countryConfig.fields.id1.hint}</p>}
                  </div>
                )}
                {countryConfig.fields.id2 && (
                  <div className="space-y-1">
                    <Label>{countryConfig.fields.id2.label}</Label>
                    <Input
                      value={form.rfc}
                      onChange={(e) => setForm({ ...form, rfc: e.target.value.toUpperCase() })}
                      placeholder={countryConfig.fields.id2.placeholder}
                      maxLength={countryConfig.fields.id2.maxLength}
                    />
                    {countryConfig.fields.id2.hint && <p className="text-xs text-muted-foreground">{countryConfig.fields.id2.hint}</p>}
                  </div>
                )}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {countryConfig.fields.ss && (
                  <div className="space-y-1">
                    <Label>{countryConfig.fields.ss.label}</Label>
                    <Input
                      value={form.nss}
                      onChange={(e) => setForm({ ...form, nss: e.target.value })}
                      placeholder={countryConfig.fields.ss.placeholder}
                      maxLength={countryConfig.fields.ss.maxLength}
                    />
                    {countryConfig.fields.ss.hint && <p className="text-xs text-muted-foreground">{countryConfig.fields.ss.hint}</p>}
                  </div>
                )}
                <div className="space-y-2">
                  <Label>Tipo de Sangre</Label>
                  <Select value={form.bloodType || undefined} onValueChange={(v) => setForm({ ...form, bloodType: v })}>
                    <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                    <SelectContent>
                      {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map((bt) => (
                        <SelectItem key={bt} value={bt}>{bt}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </TabsContent>

            {/* Datos Laborales */}
            <TabsContent value="laboral" className="space-y-4 mt-0">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>No. Empleado</Label>
                  <Input
                    value={form.employeeNumber}
                    onChange={(e) => setForm({ ...form, employeeNumber: e.target.value })}
                    placeholder="EMP-001"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Fecha de Ingreso</Label>
                  <Input
                    type="date"
                    value={form.hireDate}
                    onChange={(e) => setForm({ ...form, hireDate: e.target.value })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Tipo de Contrato</Label>
                  <Select value={form.employmentType} onValueChange={(v) => setForm({ ...form, employmentType: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {Object.entries(employmentTypeLabels).map(([k, v]) => (
                        <SelectItem key={k} value={k}>{v}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Estatus</Label>
                  <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {Object.entries(employeeStatusLabels).map(([k, v]) => (
                        <SelectItem key={k} value={k}>{v}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Separator />
              <div className="space-y-2">
                <Label>Sucursal</Label>
                <Select value={form.branchId || undefined} onValueChange={(v) => setForm({ ...form, branchId: v })}>
                  <SelectTrigger><SelectValue placeholder="Seleccionar sucursal" /></SelectTrigger>
                  <SelectContent>
                    {branches.map((b) => (
                      <SelectItem key={b.id} value={b.id}>{b.name}{!b.active ? ' (Inactiva)' : ''}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Departamento</Label>
                <Select value={form.departmentId || undefined} onValueChange={(v) => setForm({ ...form, departmentId: v })}>
                  <SelectTrigger><SelectValue placeholder="Seleccionar departamento" /></SelectTrigger>
                  <SelectContent>
                    {departments.map((d) => (
                      <SelectItem key={d.id} value={d.id}>{d.name}{!d.active ? ' (Inactivo)' : ''}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Puesto</Label>
                <Select value={form.positionId || undefined} onValueChange={(v) => setForm({ ...form, positionId: v })}>
                  <SelectTrigger><SelectValue placeholder="Seleccionar puesto" /></SelectTrigger>
                  <SelectContent>
                    {positions.map((p) => (
                      <SelectItem key={p.id} value={p.id}>{p.name}{!p.active ? ' (Inactivo)' : ''}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Separator />
              <div className="space-y-2">
                <Label>PIN de Asistencia</Label>
                <Input
                  type="text"
                  value={form.pin}
                  onChange={(e) => setForm({ ...form, pin: e.target.value.replace(/\D/g, '').slice(0, 6) })}
                  placeholder="4-6 dígitos"
                  maxLength={6}
                  inputMode="numeric"
                />
                <p className="text-xs text-muted-foreground">PIN privado para marcar asistencia en el panel público. Solo números, 4-6 dígitos.</p>
              </div>
            </TabsContent>

            {/* Contacto de Emergencia */}
            <TabsContent value="emergency" className="space-y-4 mt-0">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Nombre del Contacto</Label>
                  <Input
                    value={form.emergencyContact}
                    onChange={(e) => setForm({ ...form, emergencyContact: e.target.value })}
                    placeholder="Nombre completo"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Teléfono de Emergencia</Label>
                  <Input
                    value={form.emergencyPhone}
                    onChange={(e) => setForm({ ...form, emergencyPhone: e.target.value })}
                    placeholder="(55) 1234-5678"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Parentesco</Label>
                <Select value={form.emergencyRelation || undefined} onValueChange={(v) => setForm({ ...form, emergencyRelation: v })}>
                  <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Esposo/a">Esposo/a</SelectItem>
                    <SelectItem value="Padre/Madre">Padre/Madre</SelectItem>
                    <SelectItem value="Hijo/a">Hijo/a</SelectItem>
                    <SelectItem value="Hermano/a">Hermano/a</SelectItem>
                    <SelectItem value="Amigo/a">Amigo/a</SelectItem>
                    <SelectItem value="Otro">Otro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </TabsContent>

            {/* Datos Bancarios */}
            <TabsContent value="banking" className="space-y-4 mt-0">
              <div className="space-y-2">
                <Label>Banco</Label>
                <Input
                  value={form.bankName}
                  onChange={(e) => setForm({ ...form, bankName: e.target.value })}
                  placeholder="Nombre del banco"
                />
              </div>
              <div className="space-y-2">
                <Label>Número de Cuenta</Label>
                <Input
                  value={form.bankAccount}
                  onChange={(e) => setForm({ ...form, bankAccount: e.target.value })}
                  placeholder="Número de cuenta"
                />
              </div>
              <div className="space-y-2">
                <Label>CLABE</Label>
                <Input
                  value={form.bankClabe}
                  onChange={(e) => setForm({ ...form, bankClabe: e.target.value })}
                  placeholder="18 dígitos"
                  maxLength={18}
                />
              </div>
            </TabsContent>
          </Tabs>
        </ScrollArea>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button
            onClick={onSubmit}
            disabled={loading || !form.firstName.trim() || !form.lastName.trim() || !form.email.trim()}
            className="bg-emerald-600 hover:bg-emerald-700"
          >
            {loading ? 'Guardando...' : editMode ? 'Actualizar' : 'Crear Empleado'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// =====================
// MAIN COMPONENT
// =====================
export function EmployeesView() {
  const navigate = useAppStore((s) => s.navigate)
  const { config: countryConfig } = useCompanyCountry()

  // Auto-open dialog if coming from hire flow
  useEffect(() => {
    const prefill = typeof window !== 'undefined' ? localStorage.getItem('hire_prefill') : null
    if (prefill) {
      // Small delay to let reference data load first
      setTimeout(() => openCreateDialog(), 800)
    }
  }, [])

  // Data state
  const [employees, setEmployees] = useState<Employee[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const limit = 10

  // Filters
  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [branchFilter, setBranchFilter] = useState('all')
  const [departmentFilter, setDepartmentFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [typeFilter, setTypeFilter] = useState('all')

  // Reference data
  const [branches, setBranches] = useState<Branch[]>([])
  const [departments, setDepartments] = useState<Department[]>([])
  const [positions, setPositions] = useState<Position[]>([])

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editMode, setEditMode] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [submitting, setSubmitting] = useState(false)

  // Delete dialog
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [deletingName, setDeletingName] = useState('')
  const [deleting, setDeleting] = useState(false)

  // Fetch reference data
  const fetchReferenceData = useCallback(async () => {
    try {
      const headers = authHeaders()
      const [bRes, dRes, pRes] = await Promise.all([
        fetch('/api/branches', { headers }),
        fetch('/api/departments', { headers }),
        fetch('/api/positions', { headers }),
      ])
      if (bRes.ok) setBranches(await bRes.json())
      if (dRes.ok) setDepartments(await dRes.json())
      if (pRes.ok) setPositions(await pRes.json())
    } catch {
      // Reference data is optional - filters will just show empty
    }
  }, [])

  // Fetch employees
  const fetchEmployees = useCallback(async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({ page: String(page), limit: String(limit) })
      if (search) params.set('search', search)
      if (branchFilter !== 'all') params.set('branchId', branchFilter)
      if (departmentFilter !== 'all') params.set('departmentId', departmentFilter)
      if (statusFilter !== 'all') params.set('status', statusFilter)
      if (typeFilter !== 'all') params.set('employmentType', typeFilter)

      const res = await fetch(`/api/employees?${params.toString()}`, {
        headers: authHeaders(),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Error al cargar empleados')
      }
      const data = await res.json()
      setEmployees(data.employees)
      setTotal(data.total)
      setTotalPages(data.totalPages)
    } catch (error: any) {
      toast.error(error.message || 'Error al cargar empleados')
    } finally {
      setLoading(false)
    }
  }, [page, search, branchFilter, departmentFilter, statusFilter, typeFilter])

  useEffect(() => {
    fetchReferenceData()
  }, [fetchReferenceData])


  // Search debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput)
      setPage(1)
    }, 400)
    return () => clearTimeout(timer)
  }, [searchInput])

  // Create / Update handler
  const handleSubmit = async () => {
    try {
      setSubmitting(true)
      const body: any = { ...form }
      // Clean empty strings to null for optional fields
      Object.keys(body).forEach((key) => {
        if (body[key] === '') body[key] = null
      })
      // Restore default values for required enums
      if (!body.employmentType) body.employmentType = 'full_time'
      if (!body.status) body.status = 'active'

      const url = editMode && editingId ? `/api/employees/${editingId}` : '/api/employees'
      const method = editMode ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { ...authHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Error al guardar empleado')
      }

      toast.success(editMode ? 'Empleado actualizado correctamente' : 'Empleado creado correctamente')
      setDialogOpen(false)
      setForm(emptyForm)
      setEditMode(false)
      setEditingId(null)
      fetchEmployees()
    } catch (error: any) {
      toast.error(error.message || 'Error al guardar empleado')
    } finally {
      setSubmitting(false)
    }
  }

  // Edit handler
  const handleEdit = (emp: Employee) => {
    setEditMode(true)
    setEditingId(emp.id)
    setForm({
      firstName: emp.firstName,
      lastName: emp.lastName,
      email: emp.email,
      phone: emp.phone || '',
      curp: emp.curp || '',
      rfc: emp.rfc || '',
      nss: emp.nss || '',
      birthDate: emp.birthDate || '',
      gender: emp.gender || '',
      address: emp.address || '',
      city: emp.city || '',
      state: emp.state || '',
      employeeNumber: emp.employeeNumber || '',
      hireDate: emp.hireDate || '',
      employmentType: emp.employmentType || 'full_time',
      status: emp.status || 'active',
      branchId: emp.branchId || '',
      departmentId: emp.departmentId || '',
      positionId: emp.positionId || '',
      bloodType: emp.bloodType || '',
      emergencyContact: emp.emergencyContact || '',
      emergencyPhone: emp.emergencyPhone || '',
      emergencyRelation: emp.emergencyRelation || '',
      bankName: emp.bankName || '',
      bankAccount: emp.bankAccount || '',
      bankClabe: emp.bankClabe || '',
      notes: emp.notes || '',
      pin: (emp as any).pin || '',
    })
    setDialogOpen(true)
  }

  // Delete handler
  const handleDeleteConfirm = async () => {
    if (!deletingId) return
    try {
      setDeleting(true)
      const res = await fetch(`/api/employees/${deletingId}`, {
        method: 'DELETE',
        headers: authHeaders(),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Error al eliminar empleado')
      }
      toast.success('Empleado eliminado correctamente')
      setDeleteDialogOpen(false)
      setDeletingId(null)
      fetchEmployees()
    } catch (error: any) {
      toast.error(error.message || 'Error al eliminar empleado')
    } finally {
      setDeleting(false)
    }
  }

  // Open create dialog
  const openCreateDialog = () => {
    setEditMode(false)
    setEditingId(null)
    // Check if coming from candidate hire flow
    const prefill = typeof window !== 'undefined' ? localStorage.getItem('hire_prefill') : null
    if (prefill) {
      try {
        const data = JSON.parse(prefill)
        setForm({ ...emptyForm, firstName: data.firstName || '', lastName: data.lastName || '', email: data.email || '', phone: data.phone || '' })
        localStorage.removeItem('hire_prefill')
        toast.info('Formulario pre-llenado con datos del candidato')
      } catch { setForm(emptyForm) }
    } else {
      setForm(emptyForm)
    }
    setDialogOpen(true)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Empleados</h1>
          <p className="text-sm text-muted-foreground">
            Gestión del personal de la empresa
          </p>
        </div>
        <Button
          onClick={openCreateDialog}
          className="bg-emerald-600 hover:bg-emerald-700"
        >
          <Plus className="h-4 w-4 mr-2" />
          Nuevo Empleado
        </Button>
      </div>

      {/* Filters */}
      <Card className="gap-0">
        <CardContent className="p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
            {/* Search */}
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                className="pl-9"
                placeholder="Buscar por nombre, email o No. empleado..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
              />
            </div>

            {/* Branch filter */}
            <Select value={branchFilter} onValueChange={(v) => { setBranchFilter(v); setPage(1) }}>
              <SelectTrigger className="w-full sm:w-[160px]">
                <Building2 className="h-4 w-4 mr-2 text-muted-foreground" />
                <SelectValue placeholder="Sucursal" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                {branches.filter((b) => b.active).map((b) => (
                  <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Department filter */}
            <Select value={departmentFilter} onValueChange={(v) => { setDepartmentFilter(v); setPage(1) }}>
              <SelectTrigger className="w-full sm:w-[160px]">
                <GitBranch className="h-4 w-4 mr-2 text-muted-foreground" />
                <SelectValue placeholder="Departamento" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                {departments.filter((d) => d.active).map((d) => (
                  <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Status filter */}
            <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1) }}>
              <SelectTrigger className="w-full sm:w-[150px]">
                <UserCircle className="h-4 w-4 mr-2 text-muted-foreground" />
                <SelectValue placeholder="Estatus" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                {Object.entries(employeeStatusLabels).map(([k, v]) => (
                  <SelectItem key={k} value={k}>{v}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Employment type filter */}
            <Select value={typeFilter} onValueChange={(v) => { setTypeFilter(v); setPage(1) }}>
              <SelectTrigger className="w-full sm:w-[160px]">
                <Briefcase className="h-4 w-4 mr-2 text-muted-foreground" />
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                {Object.entries(employmentTypeLabels).map(([k, v]) => (
                  <SelectItem key={k} value={k}>{v}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card className="gap-0">
        <CardContent className="p-0">
          {loading ? (
            <div className="p-6">
              <TableSkeleton />
            </div>
          ) : employees.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Users className="h-12 w-12 text-muted-foreground/50 mb-4" />
              <p className="text-muted-foreground font-medium">No se encontraron empleados</p>
              <p className="text-sm text-muted-foreground/70 mt-1">
                Intenta ajustar los filtros o crea un nuevo empleado
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-10">#</TableHead>
                    <TableHead className="w-12">Foto</TableHead>
                    <TableHead>Nombre</TableHead>
                    <TableHead className="hidden md:table-cell">Email</TableHead>
                    <TableHead className="hidden lg:table-cell">Departamento</TableHead>
                    <TableHead className="hidden lg:table-cell">Sucursal</TableHead>
                    <TableHead className="hidden xl:table-cell">Puesto</TableHead>
                    <TableHead className="hidden sm:table-cell">No. Empleado</TableHead>
                    <TableHead>Estatus</TableHead>
                    <TableHead className="hidden md:table-cell text-center">Contratos</TableHead>
                    <TableHead className="hidden md:table-cell text-center">Incidencias</TableHead>
                    <TableHead className="w-24 text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {employees.map((emp, idx) => (
                    <TableRow
                      key={emp.id}
                      className="cursor-pointer hover:bg-muted/50 transition-colors"
                      onClick={() => navigate('employee-detail', { id: emp.id })}
                    >
                      <TableCell className="text-muted-foreground text-sm">
                        {(page - 1) * limit + idx + 1}
                      </TableCell>
                      <TableCell>
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="bg-emerald-100 text-emerald-700 text-xs font-semibold">
                            {getInitials(emp.firstName, emp.lastName)}
                          </AvatarFallback>
                        </Avatar>
                      </TableCell>
                      <TableCell className="font-medium">
                        {emp.firstName} {emp.lastName}
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-muted-foreground text-sm truncate max-w-[180px]">
                        {emp.email}
                      </TableCell>
                      <TableCell className="hidden lg:table-cell text-sm text-muted-foreground">
                        {emp.department?.name || '-'}
                      </TableCell>
                      <TableCell className="hidden lg:table-cell text-sm text-muted-foreground">
                        {emp.branch?.name || '-'}
                      </TableCell>
                      <TableCell className="hidden xl:table-cell text-sm text-muted-foreground">
                        {emp.position?.name || '-'}
                      </TableCell>
                      <TableCell className="hidden sm:table-cell text-sm text-muted-foreground font-mono">
                        {emp.employeeNumber || '-'}
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={emp.status} />
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-center">
                        <Badge variant="secondary" className="text-xs">
                          {emp._count?.contracts || 0}
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-center">
                        <Badge variant="secondary" className="text-xs">
                          {emp._count?.incidents || 0}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                          <Button
                            variant="ghost" size="icon" className="h-8 w-8"
                            title="Enviar PIN por email"
                            onClick={async () => {
                              try {
                                const res = await fetch('/api/employees/send-pin', {
                                  method: 'POST',
                                  headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('siga_token')}` },
                                  body: JSON.stringify({ employeeId: emp.id }),
                                })
                                const data = await res.json()
                                if (data.success) {
                                  if (data.emailSent) {
                                    toast.success(`PIN enviado a ${data.sentTo}`)
                                  } else {
                                    toast.info(`PIN generado: ${data.pin} (SMTP no configurado)`)
                                  }
                                } else throw new Error(data.error)
                              } catch (e: any) {
                                toast.error(e.message || 'Error al enviar PIN')
                              }
                            }}
                          >
                            <KeyRound className="h-4 w-4 text-emerald-600" />
                          </Button>
                          <Button
                            variant="ghost" size="icon" className="h-8 w-8"
                            onClick={() => handleEdit(emp)}
                          >
                            <Pencil className="h-4 w-4 text-muted-foreground" />
                          </Button>
                          <Button
                            variant="ghost" size="icon" className="h-8 w-8"
                            onClick={() => {
                              setDeletingId(emp.id)
                              setDeletingName(`${emp.firstName} ${emp.lastName}`)
                              setDeleteDialogOpen(true)
                            }}
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
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

      {/* Pagination */}
      <PaginationBar page={page} totalPages={totalPages} onPageChange={setPage} />

      {/* Create / Edit Dialog */}
      <EmployeeFormDialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open)
          if (!open) {
            setForm(emptyForm)
            setEditMode(false)
            setEditingId(null)
          }
        }}
        form={form}
        setForm={setForm}
        branches={branches}
        departments={departments}
        positions={positions}
        onSubmit={handleSubmit}
        loading={submitting}
        editMode={editMode}
        countryConfig={countryConfig}
      />

      {/* Delete confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar empleado?</AlertDialogTitle>
            <AlertDialogDescription>
              Se dará de baja a <strong>{deletingName}</strong>. Esta acción se puede revertir.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={deleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleting ? 'Eliminando...' : 'Eliminar'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
