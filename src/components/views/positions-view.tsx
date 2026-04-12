'use client'

import { useEffect, useState, useCallback } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import {
  Briefcase, Plus, Pencil, Trash2, Users, Filter, Search,
} from 'lucide-react'
import { toast } from 'sonner'
import { useAppStore } from '@/store/app-store'
import type { Position, Department } from '@/lib/types'
import { CURRENCIES, POSITION_LEVELS, formatCurrency } from '@/lib/currencies'

// Helper: auth headers
function authHeaders() {
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${localStorage.getItem('siga_token')}`,
  }
}

// Status badge
function PosStatusBadge({ active }: { active: boolean }) {
  return (
    <Badge
      variant="outline"
      className={
        active
          ? 'border-emerald-300 text-emerald-700 bg-emerald-50 text-[11px] font-medium'
          : 'border-red-300 text-red-700 bg-red-50 text-[11px] font-medium'
      }
    >
      {active ? 'Activo' : 'Inactivo'}
    </Badge>
  )
}

// Empty state
function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed py-16 px-4">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-50 mb-4">
        <Briefcase className="h-8 w-8 text-emerald-600" />
      </div>
      <h3 className="text-lg font-semibold mb-1">Sin Cargos Registrados</h3>
      <p className="text-sm text-muted-foreground text-center max-w-sm">
        No hay cargos registrados. Crea tu primer cargo para definir los niveles y roles de tu empresa.
      </p>
    </div>
  )
}

// Table skeleton
function TableSkeleton() {
  return (
    <Card className="gap-0">
      <CardContent className="p-0">
        <div className="space-y-0">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 px-6 py-4 border-b last:border-0">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-5 w-24" />
              <Skeleton className="h-4 w-40 hidden lg:block" />
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-8 w-16" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

// Position form data
interface PosFormData {
  departmentId: string
  name: string
  description: string
  salary: string
  currency: string
  level: string
  payrollFrequency: string
  overtimeRate: string
}

const defaultFormData: PosFormData = {
  departmentId: '',
  name: '',
  description: '',
  salary: '',
  currency: 'USD',
  level: '',
  payrollFrequency: 'biweekly',
  overtimeRate: '1.5',
}

export function PositionsView() {
  const { user } = useAppStore()
  const [positions, setPositions] = useState<Position[]>([])
  const [departments, setDepartments] = useState<Department[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterDept, setFilterDept] = useState<string>('all')

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingPos, setEditingPos] = useState<Position | null>(null)
  const [formData, setFormData] = useState<PosFormData>(defaultFormData)
  const [saving, setSaving] = useState(false)

  // Delete dialog state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deletingPos, setDeletingPos] = useState<Position | null>(null)
  const [deleting, setDeleting] = useState(false)

  // Fetch departments for select
  const fetchDepartments = useCallback(async () => {
    try {
      const res = await fetch('/api/departments', { headers: authHeaders() })
      if (!res.ok) return
      const data = await res.json()
      setDepartments(data)
    } catch {
      // silent
    }
  }, [])

  // Fetch positions
  const fetchPositions = useCallback(async () => {
    try {
      setLoading(true)
      const url = filterDept && filterDept !== 'all'
        ? `/api/positions?departmentId=${filterDept}`
        : '/api/positions'
      const res = await fetch(url, { headers: authHeaders() })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Error al cargar puestos')
      }
      const data = await res.json()
      setPositions(data)
    } catch (error: any) {
      toast.error(error.message || 'Error al cargar puestos')
    } finally {
      setLoading(false)
    }
  }, [filterDept])

  useEffect(() => {
    fetchDepartments()
  }, [fetchDepartments])

  useEffect(() => {
    fetchPositions()
  }, [fetchPositions])

  const handleCreate = () => {
    setEditingPos(null)
    setFormData(defaultFormData)
    setDialogOpen(true)
  }

  const handleEdit = (pos: Position) => {
    setEditingPos(pos)
    setFormData({
      departmentId: pos.departmentId,
      name: pos.name,
      description: pos.description || '',
      salary: pos.salary != null ? String(pos.salary) : '',
      currency: (pos as any).currency || 'USD',
      level: (pos as any).level || '',
      payrollFrequency: (pos as any).payrollFrequency || 'biweekly',
      overtimeRate: String((pos as any).overtimeRate || '1.5'),
    })
    setDialogOpen(true)
  }

  const handleSave = async () => {
    if (!formData.name.trim()) {
      toast.error('El nombre es requerido')
      return
    }
    if (!formData.departmentId) {
      toast.error('El departamento es requerido')
      return
    }

    try {
      setSaving(true)
      const payload = {
        companyId: user?.companyId,
        departmentId: formData.departmentId,
        name: formData.name,
        description: formData.description || null,
        salary: formData.salary ? Number(formData.salary) : null,
        currency: formData.currency || 'USD',
        level: formData.level || null,
        payrollFrequency: formData.payrollFrequency || 'biweekly',
        overtimeRate: formData.overtimeRate ? Number(formData.overtimeRate) : 1.5,
      }

      if (editingPos) {
        const res = await fetch(`/api/positions/${editingPos.id}`, {
          method: 'PUT',
          headers: authHeaders(),
          body: JSON.stringify(payload),
        })
        if (!res.ok) {
          const data = await res.json()
          throw new Error(data.error || 'Error al actualizar')
        }
        toast.success('Puesto actualizado')
      } else {
        const res = await fetch('/api/positions', {
          method: 'POST',
          headers: authHeaders(),
          body: JSON.stringify(payload),
        })
        if (!res.ok) {
          const data = await res.json()
          throw new Error(data.error || 'Error al crear')
        }
        toast.success('Puesto creado')
      }

      setDialogOpen(false)
      fetchPositions()
    } catch (error: any) {
      toast.error(error.message || 'Error al guardar')
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteClick = (pos: Position) => {
    setDeletingPos(pos)
    setDeleteDialogOpen(true)
  }

  const handleDelete = async () => {
    if (!deletingPos) return

    try {
      setDeleting(true)
      const res = await fetch(`/api/positions/${deletingPos.id}`, {
        method: 'DELETE',
        headers: authHeaders(),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Error al eliminar')
      }
      toast.success('Puesto desactivado')
      setDeleteDialogOpen(false)
      setDeletingPos(null)
      fetchPositions()
    } catch (error: any) {
      toast.error(error.message || 'Error al eliminar')
    } finally {
      setDeleting(false)
    }
  }

  // Filter positions
  const filteredPositions = positions.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    (p.department?.name && p.department.name.toLowerCase().includes(search.toLowerCase()))
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Puestos</h2>
          <p className="text-sm text-muted-foreground">Define los roles y salarios de tu organización</p>
        </div>
        <Button onClick={handleCreate} className="shrink-0">
          <Plus className="mr-2 h-4 w-4" />
          Nuevo Puesto
        </Button>
      </div>

      {/* Search + Filter row */}
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar puesto..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground shrink-0" />
          <Select value={filterDept} onValueChange={setFilterDept}>
            <SelectTrigger className="w-full sm:w-[200px]">
              <SelectValue placeholder="Todos los departamentos" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los departamentos</SelectItem>
              {departments.map((dept) => (
                <SelectItem key={dept.id} value={dept.id}>
                  {dept.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <TableSkeleton />
      ) : filteredPositions.length === 0 ? (
        <EmptyState />
      ) : (
        <Card className="gap-0 overflow-hidden">
          <CardContent className="p-0">
            {/* Desktop table */}
            <div className="hidden md:block">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/30">
                    <TableHead>Cargo</TableHead>
                    <TableHead>Nivel</TableHead>
                    <TableHead>Departamento</TableHead>
                    <TableHead>Salario</TableHead>
                    <TableHead className="text-center">Empleados</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="w-[100px]">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPositions.map((pos) => (
                    <TableRow key={pos.id} className="hover:bg-muted/20">
                      <TableCell>
                        <div>
                          <p className="font-medium">{pos.name}</p>
                          {pos.description && <p className="text-xs text-muted-foreground truncate max-w-[180px]">{pos.description}</p>}
                        </div>
                      </TableCell>
                      <TableCell>
                        {(pos as any).level ? (
                          <Badge variant="outline" className="text-xs border-amber-300 text-amber-700 bg-amber-50">
                            {POSITION_LEVELS.find(l => l.value === (pos as any).level)?.label || (pos as any).level}
                          </Badge>
                        ) : <span className="text-muted-foreground text-xs">-</span>}
                      </TableCell>
                      <TableCell>
                        {pos.department && (
                          <Badge variant="outline" className="border-teal-300 text-teal-700 bg-teal-50 text-xs">
                            {pos.department.name}
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="font-mono text-sm text-emerald-700 font-semibold">
                        {formatCurrency(pos.salary, (pos as any).currency || 'USD')}
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="inline-flex items-center gap-1.5">
                          <Users className="h-3.5 w-3.5 text-muted-foreground" />
                          <span>{pos._count?.employees ?? 0}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <PosStatusBadge active={pos.active} />
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => handleEdit(pos)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50"
                            onClick={() => handleDeleteClick(pos)}
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

            {/* Mobile cards */}
            <div className="md:hidden divide-y">
              {filteredPositions.map((pos) => (
                <div key={pos.id} className="p-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <h3 className="font-semibold">{pos.name}</h3>
                        <PosStatusBadge active={pos.active} />
                      </div>
                      {pos.department && (
                        <Badge variant="outline" className="border-teal-300 text-teal-700 bg-teal-50 text-xs">
                          {pos.department.name}
                        </Badge>
                      )}
                    </div>
                    <div className="flex gap-1 shrink-0 ml-2">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEdit(pos)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500" onClick={() => handleDeleteClick(pos)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  {pos.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2">{pos.description}</p>
                  )}
                  <div className="flex items-center gap-4 text-sm">
                    <span className="font-mono font-medium text-emerald-700">{formatCurrency(pos.salary, (pos as any).currency || 'USD')}</span>
                    <span className="text-muted-foreground flex items-center gap-1">
                      <Users className="h-3.5 w-3.5" />
                      {pos._count?.employees ?? 0} empleados
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Create / Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingPos ? 'Editar Cargo' : 'Nuevo Cargo'}
            </DialogTitle>
          </DialogHeader>

          <div className="grid gap-4 py-2">
            <div className="grid gap-2">
              <Label htmlFor="pos-name">Nombre *</Label>
              <Input
                id="pos-name"
                placeholder="Desarrollador Frontend"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="pos-dept">Departamento *</Label>
              <Select
                value={formData.departmentId}
                onValueChange={(val) => setFormData({ ...formData, departmentId: val })}
              >
                <SelectTrigger id="pos-dept">
                  <SelectValue placeholder="Seleccionar departamento" />
                </SelectTrigger>
                <SelectContent>
                  {departments.map((dept) => (
                    <SelectItem key={dept.id} value={dept.id}>
                      {dept.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="pos-desc">Descripción</Label>
              <Textarea
                id="pos-desc"
                placeholder="Descripción del puesto..."
                rows={3}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>

            <div className="grid gap-2">
              <Label>Nivel Jerárquico</Label>
              <Select value={formData.level || 'none'} onValueChange={(v) => setFormData({ ...formData, level: v === 'none' ? '' : v })}>
                <SelectTrigger><SelectValue placeholder="Seleccionar nivel" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Sin nivel específico</SelectItem>
                  {POSITION_LEVELS.map((l) => (
                    <SelectItem key={l.value} value={l.value}>{l.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-2">
                <Label>Frecuencia de pago</Label>
                <Select value={formData.payrollFrequency} onValueChange={(v) => setFormData({ ...formData, payrollFrequency: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="weekly">📅 Semanal</SelectItem>
                    <SelectItem value="biweekly">📆 Quincenal</SelectItem>
                    <SelectItem value="monthly">🗓️ Mensual</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Multiplicador Horas Extra</Label>
                <Input type="number" step="0.1" min="1" max="3" value={formData.overtimeRate} onChange={(e) => setFormData({ ...formData, overtimeRate: e.target.value })} placeholder="1.5" />
                <p className="text-xs text-muted-foreground">1.5 = 50% extra por hora</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-2">
                <Label htmlFor="pos-salary">Salario Mensual</Label>
                <Input
                  id="pos-salary"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="1500.00"
                  value={formData.salary}
                  onChange={(e) => setFormData({ ...formData, salary: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label>Moneda</Label>
                <Select value={formData.currency} onValueChange={(v) => setFormData({ ...formData, currency: v })}>
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
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={saving}>
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? 'Guardando...' : editingPos ? 'Actualizar' : 'Crear'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Desactivar Puesto</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div>
                <p className="mb-2">
                  ¿Estás seguro de que deseas desactivar el puesto{' '}
                  <strong>{deletingPos?.name}</strong>?
                </p>
                {(deletingPos?._count?.employees ?? 0) > 0 && (
                  <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
                    <strong className="block mb-1">⚠ Advertencia:</strong>
                    Este puesto tiene {deletingPos?._count?.employees} empleado(s) asignado(s).
                  </div>
                )}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
            >
              {deleting ? 'Desactivando...' : 'Desactivar'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
