'use client'

import { useEffect, useState, useCallback } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
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
  Building2, Plus, Pencil, Trash2, MapPin, Users, Phone,
  Navigation, UserCog, Search,
} from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { useAppStore } from '@/store/app-store'
import type { Branch } from '@/lib/types'

// Helper: auth headers
function authHeaders() {
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${localStorage.getItem('siga_token')}`,
  }
}

// Empty state for no branches
function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed py-16 px-4">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-50 mb-4">
        <Building2 className="h-8 w-8 text-emerald-600" />
      </div>
      <h3 className="text-lg font-semibold mb-1">Sin Sucursales</h3>
      <p className="text-sm text-muted-foreground text-center max-w-sm">
        No hay sucursales registradas. Crea tu primera sucursal para comenzar a gestionar las ubicaciones de tu empresa.
      </p>
    </div>
  )
}

// Card skeleton for loading
function CardSkeleton() {
  return (
    <Card className="gap-0">
      <CardContent className="p-4 lg:p-6 space-y-4">
        <div className="flex items-start justify-between">
          <div className="space-y-2 flex-1">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-5 w-14" />
          </div>
          <Skeleton className="h-8 w-8 rounded-lg" />
        </div>
        <div className="space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-24" />
        </div>
        <div className="flex gap-4">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-24" />
        </div>
        <div className="flex gap-3">
          <Skeleton className="h-9 w-20" />
          <Skeleton className="h-9 w-20" />
        </div>
      </CardContent>
    </Card>
  )
}

// Branch form data
interface BranchFormData {
  name: string
  code: string
  address: string
  city: string
  state: string
  latitude: string
  longitude: string
  geofenceRadius: string
  phone: string
  managerName: string
}

const defaultFormData: BranchFormData = {
  name: '',
  code: '',
  address: '',
  city: '',
  state: '',
  latitude: '0',
  longitude: '0',
  geofenceRadius: '100',
  phone: '',
  managerName: '',
}

export function BranchesView() {
  const { user } = useAppStore()
  const [branches, setBranches] = useState<Branch[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingBranch, setEditingBranch] = useState<Branch | null>(null)
  const [formData, setFormData] = useState<BranchFormData>(defaultFormData)
  const [saving, setSaving] = useState(false)

  // Delete dialog state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deletingBranch, setDeletingBranch] = useState<Branch | null>(null)
  const [deleting, setDeleting] = useState(false)

  const fetchBranches = useCallback(async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/branches', { headers: authHeaders() })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Error al cargar sucursales')
      }
      const data = await res.json()
      setBranches(data)
    } catch (error: any) {
      toast.error(error.message || 'Error al cargar sucursales')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchBranches()
  }, [fetchBranches])

  // Open create dialog
  const handleCreate = () => {
    setEditingBranch(null)
    setFormData(defaultFormData)
    setDialogOpen(true)
  }

  // Open edit dialog
  const handleEdit = (branch: Branch) => {
    setEditingBranch(branch)
    setFormData({
      name: branch.name,
      code: branch.code || '',
      address: branch.address || '',
      city: branch.city || '',
      state: branch.state || '',
      latitude: String(branch.latitude),
      longitude: String(branch.longitude),
      geofenceRadius: String(branch.geofenceRadius),
      phone: branch.phone || '',
      managerName: branch.managerName || '',
    })
    setDialogOpen(true)
  }

  // Save (create or update)
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
        latitude: Number(formData.latitude) || 0,
        longitude: Number(formData.longitude) || 0,
        geofenceRadius: Number(formData.geofenceRadius) || 100,
      }

      if (editingBranch) {
        const res = await fetch(`/api/branches/${editingBranch.id}`, {
          method: 'PUT',
          headers: authHeaders(),
          body: JSON.stringify(payload),
        })
        if (!res.ok) {
          const data = await res.json()
          throw new Error(data.error || 'Error al actualizar')
        }
        toast.success('Sucursal actualizada')
      } else {
        const res = await fetch('/api/branches', {
          method: 'POST',
          headers: authHeaders(),
          body: JSON.stringify(payload),
        })
        if (!res.ok) {
          const data = await res.json()
          throw new Error(data.error || 'Error al crear')
        }
        toast.success('Sucursal creada')
      }

      setDialogOpen(false)
      fetchBranches()
    } catch (error: any) {
      toast.error(error.message || 'Error al guardar')
    } finally {
      setSaving(false)
    }
  }

  // Open delete dialog
  const handleDeleteClick = (branch: Branch) => {
    setDeletingBranch(branch)
    setDeleteDialogOpen(true)
  }

  // Confirm delete
  const handleDelete = async () => {
    if (!deletingBranch) return

    try {
      setDeleting(true)
      const res = await fetch(`/api/branches/${deletingBranch.id}`, {
        method: 'DELETE',
        headers: authHeaders(),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Error al eliminar')
      }
      toast.success('Sucursal desactivada')
      setDeleteDialogOpen(false)
      setDeletingBranch(null)
      fetchBranches()
    } catch (error: any) {
      toast.error(error.message || 'Error al eliminar')
    } finally {
      setDeleting(false)
    }
  }

  // Filter branches by search
  const filteredBranches = branches.filter((b) =>
    b.name.toLowerCase().includes(search.toLowerCase()) ||
    (b.code && b.code.toLowerCase().includes(search.toLowerCase())) ||
    (b.city && b.city.toLowerCase().includes(search.toLowerCase()))
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Sucursales</h2>
          <p className="text-sm text-muted-foreground">Gestiona las ubicaciones de tu empresa</p>
        </div>
        <Button onClick={handleCreate} className="shrink-0">
          <Plus className="mr-2 h-4 w-4" />
          Nueva Sucursal
        </Button>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Buscar sucursal..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Content */}
      {loading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      ) : filteredBranches.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredBranches.map((branch) => (
            <Card
              key={branch.id}
              className="gap-0 transition-all hover:shadow-md hover:border-emerald-200"
            >
              <CardContent className="p-4 lg:p-6 space-y-4">
                {/* Header: name + actions */}
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <h3 className="font-semibold text-base truncate">{branch.name}</h3>
                    {branch.code && (
                      <Badge variant="outline" className="mt-1 text-xs font-mono border-emerald-300 text-emerald-700 bg-emerald-50">
                        {branch.code}
                      </Badge>
                    )}
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => handleEdit(branch)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50"
                      onClick={() => handleDeleteClick(branch)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* Location info */}
                <div className="space-y-1.5 text-sm text-muted-foreground">
                  {branch.address && (
                    <div className="flex items-start gap-2">
                      <MapPin className="h-4 w-4 shrink-0 mt-0.5 text-emerald-500" />
                      <span className="truncate">{branch.address}</span>
                    </div>
                  )}
                  {(branch.city || branch.state) && (
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 shrink-0 text-teal-500" />
                      <span>{[branch.city, branch.state].filter(Boolean).join(', ')}</span>
                    </div>
                  )}
                </div>

                {/* Stats row */}
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
                  <div className="flex items-center gap-1.5">
                    <Users className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="text-muted-foreground">{branch._count?.employees ?? 0} empleados</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Navigation className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="text-muted-foreground">{branch.geofenceRadius}m geocerca</span>
                  </div>
                </div>

                {/* Manager + contact row */}
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
                  {branch.managerName && (
                    <div className="flex items-center gap-1.5">
                      <UserCog className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className="text-muted-foreground truncate max-w-[140px]">{branch.managerName}</span>
                    </div>
                  )}
                  {branch.phone && (
                    <div className="flex items-center gap-1.5">
                      <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className="text-muted-foreground">{branch.phone}</span>
                    </div>
                  )}
                </div>

                {/* Map indicator */}
                <div className="flex items-center gap-2 rounded-lg bg-muted/50 px-3 py-2 text-xs text-muted-foreground">
                  <Navigation className="h-3.5 w-3.5 text-emerald-500" />
                  <span className="font-mono">
                    {branch.latitude.toFixed(6)}, {branch.longitude.toFixed(6)}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create / Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingBranch ? 'Editar Sucursal' : 'Nueva Sucursal'}
            </DialogTitle>
          </DialogHeader>

          <div className="grid gap-4 py-2">
            <div className="grid gap-2">
              <Label htmlFor="br-name">Nombre *</Label>
              <Input
                id="br-name"
                placeholder="Sucursal Principal"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="br-code">Código</Label>
              <Input
                id="br-code"
                placeholder="SUC-001"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="br-address">Dirección</Label>
              <Input
                id="br-address"
                placeholder="Av. Principal #123"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="br-city">Ciudad</Label>
                <Input
                  id="br-city"
                  placeholder="Ciudad de México"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="br-state">Estado</Label>
                <Input
                  id="br-state"
                  placeholder="CDMX"
                  value={formData.state}
                  onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="br-lat">Latitud</Label>
                <Input
                  id="br-lat"
                  type="number"
                  step="any"
                  placeholder="19.432608"
                  value={formData.latitude}
                  onChange={(e) => setFormData({ ...formData, latitude: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="br-lng">Longitud</Label>
                <Input
                  id="br-lng"
                  type="number"
                  step="any"
                  placeholder="-99.133209"
                  value={formData.longitude}
                  onChange={(e) => setFormData({ ...formData, longitude: e.target.value })}
                />
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="br-radius">Radio de Geocerca (metros)</Label>
              <Input
                id="br-radius"
                type="number"
                placeholder="100"
                value={formData.geofenceRadius}
                onChange={(e) => setFormData({ ...formData, geofenceRadius: e.target.value })}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="br-phone">Teléfono</Label>
              <Input
                id="br-phone"
                placeholder="+52 55 1234 5678"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="br-manager">Nombre del Encargado</Label>
              <Input
                id="br-manager"
                placeholder="Juan Pérez"
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
              {saving ? 'Guardando...' : editingBranch ? 'Actualizar' : 'Crear'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Desactivar Sucursal</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div>
                <p className="mb-2">
                  ¿Estás seguro de que deseas desactivar la sucursal{' '}
                  <strong>{deletingBranch?.name}</strong>?
                </p>
                {(deletingBranch?._count?.employees ?? 0) > 0 && (
                  <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
                    <strong className="block mb-1">⚠ Advertencia:</strong>
                    Esta sucursal tiene {deletingBranch?._count?.employees} empleado(s) asignado(s).
                    Los empleados no serán eliminados, pero la sucursal quedará inactiva.
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
