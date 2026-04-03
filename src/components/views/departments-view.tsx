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
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import {
  GitBranch, Plus, Pencil, Trash2, Users, Briefcase, UserCog, Search,
} from 'lucide-react'
import { toast } from 'sonner'
import { useAppStore } from '@/store/app-store'
import type { Department } from '@/lib/types'

// Helper: auth headers
function authHeaders() {
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${localStorage.getItem('siga_token')}`,
  }
}

// Status badge for departments
function DeptStatusBadge({ active }: { active: boolean }) {
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
        <GitBranch className="h-8 w-8 text-emerald-600" />
      </div>
      <h3 className="text-lg font-semibold mb-1">Sin Departamentos</h3>
      <p className="text-sm text-muted-foreground text-center max-w-sm">
        No hay departamentos registrados. Crea tu primer departamento para organizar la estructura de tu empresa.
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
              <Skeleton className="h-4 w-36" />
              <Skeleton className="h-4 w-48 hidden lg:block" />
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-4 w-16" />
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

// Department form data
interface DeptFormData {
  name: string
  description: string
  managerName: string
}

const defaultFormData: DeptFormData = {
  name: '',
  description: '',
  managerName: '',
}

export function DepartmentsView() {
  const { user } = useAppStore()
  const [departments, setDepartments] = useState<Department[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingDept, setEditingDept] = useState<Department | null>(null)
  const [formData, setFormData] = useState<DeptFormData>(defaultFormData)
  const [saving, setSaving] = useState(false)

  // Delete dialog state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deletingDept, setDeletingDept] = useState<Department | null>(null)
  const [deleting, setDeleting] = useState(false)

  const fetchDepartments = useCallback(async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/departments', { headers: authHeaders() })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Error al cargar departamentos')
      }
      const data = await res.json()
      setDepartments(data)
    } catch (error: any) {
      toast.error(error.message || 'Error al cargar departamentos')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchDepartments()
  }, [fetchDepartments])

  const handleCreate = () => {
    setEditingDept(null)
    setFormData(defaultFormData)
    setDialogOpen(true)
  }

  const handleEdit = (dept: Department) => {
    setEditingDept(dept)
    setFormData({
      name: dept.name,
      description: dept.description || '',
      managerName: dept.managerName || '',
    })
    setDialogOpen(true)
  }

  const handleSave = async () => {
    if (!formData.name.trim()) {
      toast.error('El nombre es requerido')
      return
    }

    try {
      setSaving(true)
      const payload = {
        companyId: user?.companyId,
        ...formData,
      }

      if (editingDept) {
        const res = await fetch(`/api/departments/${editingDept.id}`, {
          method: 'PUT',
          headers: authHeaders(),
          body: JSON.stringify(payload),
        })
        if (!res.ok) {
          const data = await res.json()
          throw new Error(data.error || 'Error al actualizar')
        }
        toast.success('Departamento actualizado')
      } else {
        const res = await fetch('/api/departments', {
          method: 'POST',
          headers: authHeaders(),
          body: JSON.stringify(payload),
        })
        if (!res.ok) {
          const data = await res.json()
          throw new Error(data.error || 'Error al crear')
        }
        toast.success('Departamento creado')
      }

      setDialogOpen(false)
      fetchDepartments()
    } catch (error: any) {
      toast.error(error.message || 'Error al guardar')
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteClick = (dept: Department) => {
    setDeletingDept(dept)
    setDeleteDialogOpen(true)
  }

  const handleDelete = async () => {
    if (!deletingDept) return

    try {
      setDeleting(true)
      const res = await fetch(`/api/departments/${deletingDept.id}`, {
        method: 'DELETE',
        headers: authHeaders(),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Error al eliminar')
      }
      toast.success('Departamento desactivado')
      setDeleteDialogOpen(false)
      setDeletingDept(null)
      fetchDepartments()
    } catch (error: any) {
      toast.error(error.message || 'Error al eliminar')
    } finally {
      setDeleting(false)
    }
  }

  const filteredDepartments = departments.filter((d) =>
    d.name.toLowerCase().includes(search.toLowerCase()) ||
    (d.managerName && d.managerName.toLowerCase().includes(search.toLowerCase()))
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Departamentos</h2>
          <p className="text-sm text-muted-foreground">Organiza las áreas funcionales de tu empresa</p>
        </div>
        <Button onClick={handleCreate} className="shrink-0">
          <Plus className="mr-2 h-4 w-4" />
          Nuevo Departamento
        </Button>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Buscar departamento..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Content */}
      {loading ? (
        <TableSkeleton />
      ) : filteredDepartments.length === 0 ? (
        <EmptyState />
      ) : (
        <Card className="gap-0 overflow-hidden">
          <CardContent className="p-0">
            {/* Desktop table */}
            <div className="hidden md:block">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/30">
                    <TableHead>Nombre</TableHead>
                    <TableHead>Descripción</TableHead>
                    <TableHead>Encargado</TableHead>
                    <TableHead className="text-center">Empleados</TableHead>
                    <TableHead className="text-center">Puestos</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="w-[100px]">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredDepartments.map((dept) => (
                    <TableRow key={dept.id} className="hover:bg-muted/20">
                      <TableCell className="font-medium">{dept.name}</TableCell>
                      <TableCell className="text-muted-foreground max-w-[200px] truncate">
                        {dept.description || '-'}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {dept.managerName || '-'}
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="inline-flex items-center gap-1.5">
                          <Users className="h-3.5 w-3.5 text-muted-foreground" />
                          <span>{dept._count?.employees ?? 0}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="inline-flex items-center gap-1.5">
                          <Briefcase className="h-3.5 w-3.5 text-muted-foreground" />
                          <span>{dept._count?.positions ?? 0}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <DeptStatusBadge active={dept.active} />
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => handleEdit(dept)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50"
                            onClick={() => handleDeleteClick(dept)}
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
              {filteredDepartments.map((dept) => (
                <div key={dept.id} className="p-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold truncate">{dept.name}</h3>
                        <DeptStatusBadge active={dept.active} />
                      </div>
                      {dept.description && (
                        <p className="text-sm text-muted-foreground line-clamp-2">{dept.description}</p>
                      )}
                    </div>
                    <div className="flex gap-1 shrink-0 ml-2">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEdit(dept)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500" onClick={() => handleDeleteClick(dept)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                    {dept.managerName && (
                      <div className="flex items-center gap-1.5">
                        <UserCog className="h-3.5 w-3.5" />
                        <span>{dept.managerName}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-1.5">
                      <Users className="h-3.5 w-3.5" />
                      <span>{dept._count?.employees ?? 0} empleados</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Briefcase className="h-3.5 w-3.5" />
                      <span>{dept._count?.positions ?? 0} puestos</span>
                    </div>
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
              {editingDept ? 'Editar Departamento' : 'Nuevo Departamento'}
            </DialogTitle>
          </DialogHeader>

          <div className="grid gap-4 py-2">
            <div className="grid gap-2">
              <Label htmlFor="dept-name">Nombre *</Label>
              <Input
                id="dept-name"
                placeholder="Recursos Humanos"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="dept-desc">Descripción</Label>
              <Textarea
                id="dept-desc"
                placeholder="Descripción del departamento..."
                rows={3}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="dept-manager">Nombre del Encargado</Label>
              <Input
                id="dept-manager"
                placeholder="María García"
                value={formData.managerName}
                onChange={(e) => setFormData({ ...formData, managerName: e.target.value })}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={saving}>
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? 'Guardando...' : editingDept ? 'Actualizar' : 'Crear'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Desactivar Departamento</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div>
                <p className="mb-2">
                  ¿Estás seguro de que deseas desactivar el departamento{' '}
                  <strong>{deletingDept?.name}</strong>?
                </p>
                {(deletingDept?._count?.employees ?? 0) > 0 && (
                  <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
                    <strong className="block mb-1">⚠ Advertencia:</strong>
                    Este departamento tiene {deletingDept?._count?.employees} empleado(s) asignado(s).
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
