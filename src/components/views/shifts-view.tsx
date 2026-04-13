'use client'

import { useEffect, useState, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from '@/components/ui/dialog'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import {
  Plus, Pencil, Trash2, Clock, Coffee, Users, Palette, Loader2,
} from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import type { Shift, Employee, EmployeeShift } from '@/lib/types'
import { shiftTypeLabels } from '@/lib/types'

const PREDEFINED_COLORS = [
  '#10b981', '#14b8a6', '#06b6d4', '#f59e0b', '#f97316',
  '#ef4444', '#8b5cf6', '#ec4899', '#6366f1', '#84cc16',
]

const DAY_LABELS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']
const DAY_VALUES = [1, 2, 3, 4, 5, 6, 0]

interface ShiftFormData {
  name: string
  startTime: string
  endTime: string
  breakMinutes: number
  toleranceMinutes: number
  type: string
  color: string
}

const emptyForm: ShiftFormData = {
  name: '',
  startTime: '09:00',
  endTime: '18:00',
  breakMinutes: 30,
  toleranceMinutes: 15,
  type: 'fixed',
  color: '#10b981',
}

export function ShiftsView() {
  const [shifts, setShifts] = useState<Shift[]>([])
  const [employees, setEmployees] = useState<Employee[]>([])
  const [assignments, setAssignments] = useState<EmployeeShift[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  // Dialog states
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showAssignDialog, setShowAssignDialog] = useState(false)
  const [editingShift, setEditingShift] = useState<Shift | null>(null)
  const [deletingShift, setDeletingShift] = useState<Shift | null>(null)

  // Form states
  const [form, setForm] = useState<ShiftFormData>(emptyForm)
  const [assignEmployeeId, setAssignEmployeeId] = useState('')
  const [assignShiftId, setAssignShiftId] = useState('')
  const [assignEffectiveDate, setAssignEffectiveDate] = useState('')
  const [assignEndDate, setAssignEndDate] = useState('')
  const [assignDays, setAssignDays] = useState<number[]>([1, 2, 3, 4, 5])
  const [assignSaving, setAssignSaving] = useState(false)

  const fetchShifts = useCallback(async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/shifts', { headers: authHeaders() })
      if (!res.ok) throw new Error('Error al cargar turnos')
      const data = await res.json()
      setShifts(data)
    } catch (error: any) {
      toast.error(error.message || 'Error al cargar turnos')
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchEmployees = useCallback(async () => {
    try {
      const res = await fetch('/api/employees', { headers: authHeaders() })
      if (!res.ok) return
      const data = await res.json()
      setEmployees(Array.isArray(data) ? data : data.employees || [])
    } catch {
      // Silently fail - employees optional for shifts
    }
  }, [])

  useEffect(() => {
    fetchShifts()
    fetchEmployees()
  }, [fetchShifts, fetchEmployees])

  const handleOpenCreate = () => {
    setForm(emptyForm)
    setEditingShift(null)
    setShowCreateDialog(true)
  }

  const handleOpenEdit = (shift: Shift) => {
    setForm({
      name: shift.name,
      startTime: shift.startTime,
      endTime: shift.endTime,
      breakMinutes: shift.breakMinutes,
      toleranceMinutes: shift.toleranceMinutes,
      type: shift.type,
      color: shift.color,
    })
    setEditingShift(shift)
    setShowCreateDialog(true)
  }

  const handleSaveShift = async () => {
    if (!form.name.trim()) {
      toast.error('El nombre del turno es requerido')
      return
    }
    try {
      setSaving(true)
      const url = editingShift ? `/api/shifts/${editingShift.id}` : '/api/shifts'
      const method = editingShift ? 'PUT' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { ...authHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Error al guardar turno')
      }
      toast.success(editingShift ? 'Turno actualizado' : 'Turno creado')
      setShowCreateDialog(false)
      fetchShifts()
    } catch (error: any) {
      toast.error(error.message)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!deletingShift) return
    try {
      const res = await fetch(`/api/shifts/${deletingShift.id}`, {
        method: 'DELETE',
        headers: authHeaders(),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Error al eliminar turno')
      }
      toast.success('Turno eliminado')
      setDeletingShift(null)
      fetchShifts()
    } catch (error: any) {
      toast.error(error.message)
    }
  }

  const handleAssignShift = async () => {
    if (!assignEmployeeId || !assignShiftId || !assignEffectiveDate) {
      toast.error('Empleado, turno y fecha de vigencia son requeridos')
      return
    }
    try {
      setAssignSaving(true)
      const res = await fetch('/api/shifts/assign', {
        method: 'POST',
        headers: { ...authHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employeeId: assignEmployeeId,
          shiftId: assignShiftId,
          effectiveDate: assignEffectiveDate,
          endDate: assignEndDate || undefined,
          daysOfWeek: JSON.stringify(assignDays),
        }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Error al asignar turno')
      }
      toast.success('Turno asignado correctamente')
      setShowAssignDialog(false)
      setAssignEmployeeId('')
      setAssignShiftId('')
      setAssignEffectiveDate('')
      setAssignEndDate('')
      setAssignDays([1, 2, 3, 4, 5])
      fetchShifts()
    } catch (error: any) {
      toast.error(error.message)
    } finally {
      setAssignSaving(false)
    }
  }

  const toggleDay = (day: number) => {
    setAssignDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day].sort()
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Turnos</h2>
          <p className="text-sm text-muted-foreground">
            Gestiona los turnos de trabajo y sus asignaciones
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => { fetchEmployees(); setShowAssignDialog(true) }}>
            <Users className="mr-2 h-4 w-4" />
            Asignar Turno
          </Button>
          <Button onClick={handleOpenCreate}>
            <Plus className="mr-2 h-4 w-4" />
            Nuevo Turno
          </Button>
        </div>
      </div>

      {/* Shifts Grid */}
      {loading ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <Skeleton className="h-5 w-32 mb-4" />
                <Skeleton className="h-4 w-24 mb-2" />
                <Skeleton className="h-4 w-20 mb-4" />
                <div className="flex gap-2">
                  <Skeleton className="h-6 w-16" />
                  <Skeleton className="h-6 w-16" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : shifts.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Clock className="h-12 w-12 text-muted-foreground/40 mb-4" />
            <p className="text-lg font-medium text-muted-foreground">No hay turnos</p>
            <p className="text-sm text-muted-foreground mt-1">
              Crea tu primer turno para empezar a gestionar horarios
            </p>
            <Button onClick={handleOpenCreate} className="mt-4">
              <Plus className="mr-2 h-4 w-4" />
              Crear Turno
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {shifts.map((shift) => (
            <Card key={shift.id} className="relative overflow-hidden">
              {/* Color bar */}
              <div
                className="absolute top-0 left-0 h-1 w-full"
                style={{ backgroundColor: shift.color }}
              />
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div
                      className="h-3 w-3 rounded-full"
                      style={{ backgroundColor: shift.color }}
                    />
                    <h3 className="font-semibold text-base">{shift.name}</h3>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => handleOpenEdit(shift)}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-red-500 hover:text-red-600"
                      onClick={() => setDeletingShift(shift)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>

                {/* Time range */}
                <div className="flex items-center gap-2 mb-3">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium tabular-nums">
                    {shift.startTime} - {shift.endTime}
                  </span>
                </div>

                {/* Break & Tolerance */}
                <div className="flex gap-4 mb-3">
                  <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                    <Coffee className="h-3.5 w-3.5" />
                    <span>{shift.breakMinutes} min</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                    <Clock className="h-3.5 w-3.5" />
                    <span>±{shift.toleranceMinutes} min</span>
                  </div>
                </div>

                {/* Type & Employees */}
                <div className="flex items-center justify-between">
                  <Badge
                    variant="outline"
                    className={cn(
                      'text-xs font-medium',
                      shift.type === 'fixed' && 'border-emerald-500/50 text-emerald-600 bg-emerald-50',
                      shift.type === 'rotating' && 'border-amber-500/50 text-amber-600 bg-amber-50',
                      shift.type === 'flexible' && 'border-teal-500/50 text-teal-600 bg-teal-50'
                    )}
                  >
                    {shiftTypeLabels[shift.type] || shift.type}
                  </Badge>
                  <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                    <Users className="h-3.5 w-3.5" />
                    <span>{shift._count?.employeeShifts || 0}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create / Edit Shift Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingShift ? 'Editar Turno' : 'Nuevo Turno'}
            </DialogTitle>
            <DialogDescription>
              {editingShift ? 'Modifica los datos del turno' : 'Completa los datos para crear un nuevo turno'}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="shift-name">Nombre</Label>
              <Input
                id="shift-name"
                placeholder="Ej: Turno Matutino"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="shift-start">Hora Inicio</Label>
                <Input
                  id="shift-start"
                  type="time"
                  value={form.startTime}
                  onChange={(e) => setForm({ ...form, startTime: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="shift-end">Hora Fin</Label>
                <Input
                  id="shift-end"
                  type="time"
                  value={form.endTime}
                  onChange={(e) => setForm({ ...form, endTime: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="shift-break">Descanso (min)</Label>
                <Input
                  id="shift-break"
                  type="number"
                  min={0}
                  value={form.breakMinutes}
                  onChange={(e) => setForm({ ...form, breakMinutes: parseInt(e.target.value) || 0 })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="shift-tolerance">Tolerancia (min)</Label>
                <Input
                  id="shift-tolerance"
                  type="number"
                  min={0}
                  value={form.toleranceMinutes}
                  onChange={(e) => setForm({ ...form, toleranceMinutes: parseInt(e.target.value) || 0 })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="shift-type">Tipo</Label>
              <Select
                value={form.type}
                onValueChange={(v) => setForm({ ...form, type: v })}
              >
                <SelectTrigger id="shift-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="fixed">{shiftTypeLabels.fixed}</SelectItem>
                  <SelectItem value="rotating">{shiftTypeLabels.rotating}</SelectItem>
                  <SelectItem value="flexible">{shiftTypeLabels.flexible}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Palette className="h-4 w-4" />
                Color
              </Label>
              <div className="flex flex-wrap gap-2">
                {PREDEFINED_COLORS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    className={cn(
                      'h-8 w-8 rounded-full border-2 transition-transform hover:scale-110',
                      form.color === color ? 'border-foreground scale-110' : 'border-transparent'
                    )}
                    style={{ backgroundColor: color }}
                    onClick={() => setForm({ ...form, color })}
                  />
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveShift} disabled={saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {editingShift ? 'Guardar Cambios' : 'Crear Turno'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Assign Shift Dialog */}
      <Dialog open={showAssignDialog} onOpenChange={setShowAssignDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Asignar Turno a Empleado</DialogTitle>
            <DialogDescription>
              Selecciona un empleado y el turno a asignar
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label>Empleado</Label>
              <Select value={assignEmployeeId} onValueChange={setAssignEmployeeId}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar empleado..." />
                </SelectTrigger>
                <SelectContent>
                  {employees.map((emp) => (
                    <SelectItem key={emp.id} value={emp.id}>
                      {emp.firstName} {emp.lastName}
                      {emp.employeeNumber && ` (${emp.employeeNumber})`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Turno</Label>
              <Select value={assignShiftId} onValueChange={setAssignShiftId}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar turno..." />
                </SelectTrigger>
                <SelectContent>
                  {shifts.map((shift) => (
                    <SelectItem key={shift.id} value={shift.id}>
                      <div className="flex items-center gap-2">
                        <div
                          className="h-2.5 w-2.5 rounded-full"
                          style={{ backgroundColor: shift.color }}
                        />
                        {shift.name} ({shift.startTime} - {shift.endTime})
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Fecha Vigencia</Label>
                <Input
                  type="date"
                  value={assignEffectiveDate}
                  onChange={(e) => setAssignEffectiveDate(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Fecha Fin (opcional)</Label>
                <Input
                  type="date"
                  value={assignEndDate}
                  onChange={(e) => setAssignEndDate(e.target.value)}
                />
              </div>
            </div>

            <Separator />

            <div className="space-y-2">
              <Label>Días de la Semana</Label>
              <div className="flex flex-wrap gap-2">
                {DAY_VALUES.map((day, idx) => (
                  <label
                    key={day}
                    className={cn(
                      'flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm cursor-pointer transition-colors',
                      assignDays.includes(day)
                        ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                        : 'border-border hover:bg-muted/50'
                    )}
                  >
                    <Checkbox
                      checked={assignDays.includes(day)}
                      onCheckedChange={() => toggleDay(day)}
                    />
                    {DAY_LABELS[idx]}
                  </label>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAssignDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleAssignShift} disabled={assignSaving}>
              {assignSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Asignar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deletingShift} onOpenChange={() => setDeletingShift(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar turno?</AlertDialogTitle>
            <AlertDialogDescription>
              {deletingShift && deletingShift._count && deletingShift._count.employeeShifts > 0
                ? `Este turno tiene ${deletingShift._count.employeeShifts} empleado(s) asignado(s). No se puede eliminar mientras tenga asignaciones activas.`
                : 'Esta acción desactivará el turno. Los datos se conservarán.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            {deletingShift && deletingShift._count && deletingShift._count.employeeShifts > 0 ? null : (
              <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
                Eliminar
              </AlertDialogAction>
            )}
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
