'use client'

import { useEffect, useState, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'

// Auth headers helper
function authHeaders() {
  const token = typeof window !== 'undefined' ? localStorage.getItem('siga_token') : null
  return token ? { Authorization: `Bearer ${token}` } : {}
}

import { Checkbox } from '@/components/ui/checkbox'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import {
  Filter, Search, ShieldCheck, ShieldX, CheckCircle2, XCircle,
  ChevronLeft, ChevronRight, Loader2, ClipboardList,
} from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import type { AttendanceRecord, Employee, Branch } from '@/lib/types'
import { attendanceStatusLabels } from '@/lib/types'

const RECORD_TYPE_LABELS: Record<string, string> = {
  check_in: 'Entrada',
  check_out: 'Salida',
}

function StatusBadge({ status }: { status: string }) {
  const colorClass =
    status === 'on_time'
      ? 'border-green-500/50 text-green-600 bg-green-50'
      : status === 'late'
        ? 'border-amber-500/50 text-amber-600 bg-amber-50'
        : status === 'absent'
          ? 'border-red-500/50 text-red-600 bg-red-50'
          : status === 'fraud_detected'
            ? 'border-red-600/50 text-red-700 bg-red-100'
            : status === 'early_departure'
              ? 'border-orange-500/50 text-orange-600 bg-orange-50'
              : 'border-muted text-muted-foreground'

  return (
    <Badge variant="outline" className={cn('text-[11px] font-medium', colorClass)}>
      {attendanceStatusLabels[status] || status}
    </Badge>
  )
}

function RecordTypeBadge({ type }: { type: string }) {
  return (
    <Badge
      variant="outline"
      className={cn(
        'text-[11px] font-medium',
        type === 'check_in'
          ? 'border-emerald-500/50 text-emerald-600 bg-emerald-50'
          : 'border-slate-500/50 text-slate-600 bg-slate-50'
      )}
    >
      {RECORD_TYPE_LABELS[type] || type}
    </Badge>
  )
}

export function AttendanceView() {
  const [records, setRecords] = useState<AttendanceRecord[]>([])
  const [employees, setEmployees] = useState<Employee[]>([])
  const [branches, setBranches] = useState<Branch[]>([])
  const [loading, setLoading] = useState(true)
  const [verifying, setVerifying] = useState<string | null>(null)

  // Filters
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [branchId, setBranchId] = useState('')
  const [employeeId, setEmployeeId] = useState('')
  const [recordType, setRecordType] = useState('')
  const [statusFilter, setStatusFilter] = useState('')

  // Pagination
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  // Selected for bulk verify
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  const fetchRecords = useCallback(async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      params.set('page', page.toString())
      params.set('limit', '20')
      if (dateFrom) params.set('dateFrom', dateFrom)
      if (dateTo) params.set('dateTo', dateTo)
      if (branchId) params.set('branchId', branchId)
      if (employeeId) params.set('employeeId', employeeId)
      if (recordType) params.set('recordType', recordType)
      if (statusFilter) params.set('status', statusFilter)

      const res = await fetch(`/api/attendance?${params}`, { headers: authHeaders() })
      if (!res.ok) throw new Error('Error al cargar registros')
      const data = await res.json()
      setRecords(data.records || [])
      setTotalPages(data.pagination?.totalPages || 1)
    } catch (error: any) {
      toast.error(error.message || 'Error al cargar registros')
    } finally {
      setLoading(false)
    }
  }, [page, dateFrom, dateTo, branchId, employeeId, recordType, statusFilter])

  const fetchEmployees = useCallback(async () => {
    try {
      const res = await fetch('/api/employees', { headers: authHeaders() })
      if (!res.ok) return
      const data = await res.json()
      setEmployees(Array.isArray(data) ? data : data.employees || [])
    } catch {
      // silent
    }
  }, [])

  const fetchBranches = useCallback(async () => {
    try {
      const res = await fetch('/api/branches', { headers: authHeaders() })
      if (!res.ok) return
      const data = await res.json()
      setBranches(Array.isArray(data) ? data : [])
    } catch {
      // silent
    }
  }, [])

  useEffect(() => {
    fetchEmployees()
    fetchBranches()
    fetchRecords()
  }, [fetchEmployees, fetchBranches, fetchRecords])


  const handleToggleVerify = async (record: AttendanceRecord) => {
    try {
      setVerifying(record.id)
      const res = await fetch('/api/attendance/verify', {
        method: 'PUT',
        headers: { ...authHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: record.id }),
      })
      if (!res.ok) throw new Error('Error al verificar')
      toast.success(record.verified ? 'Registro desverificado' : 'Registro verificado')
      fetchRecords()
      setSelectedIds((prev) => {
        const next = new Set(prev)
        next.delete(record.id)
        return next
      })
    } catch (error: any) {
      toast.error(error.message)
    } finally {
      setVerifying(null)
    }
  }

  const handleBulkVerify = async () => {
    if (selectedIds.size === 0) {
      toast.error('Selecciona al menos un registro')
      return
    }
    try {
      setVerifying('bulk')
      const promises = Array.from(selectedIds).map((id) =>
        fetch('/api/attendance/verify', {
          method: 'PUT',
          headers: { ...authHeaders(), 'Content-Type': 'application/json' },
          body: JSON.stringify({ id }),
        })
      )
      await Promise.all(promises)
      toast.success(`${selectedIds.size} registro(s) verificado(s)`)
      setSelectedIds(new Set())
      fetchRecords()
    } catch {
      toast.error('Error al verificar registros')
    } finally {
      setVerifying(null)
    }
  }

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const toggleSelectAll = () => {
    if (selectedIds.size === records.length && records.length > 0) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(records.map((r) => r.id)))
    }
  }

  const clearFilters = () => {
    setDateFrom('')
    setDateTo('')
    setBranchId('')
    setEmployeeId('')
    setRecordType('')
    setStatusFilter('')
    setPage(1)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Registros de Asistencia</h2>
          <p className="text-sm text-muted-foreground">
            Consulta y verifica los registros de asistencia
          </p>
        </div>
        <Button
          variant="outline"
          onClick={handleBulkVerify}
          disabled={selectedIds.size === 0 || verifying === 'bulk'}
        >
          {verifying === 'bulk' ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <ShieldCheck className="mr-2 h-4 w-4" />
          )}
          Verificar Seleccionados ({selectedIds.size})
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">Filtros</span>
            <Button variant="ghost" size="sm" className="ml-auto text-xs" onClick={clearFilters}>
              Limpiar
            </Button>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Fecha Desde</Label>
              <Input
                type="date"
                value={dateFrom}
                onChange={(e) => { setDateFrom(e.target.value); setPage(1) }}
                className="h-9"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Fecha Hasta</Label>
              <Input
                type="date"
                value={dateTo}
                onChange={(e) => { setDateTo(e.target.value); setPage(1) }}
                className="h-9"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Sucursal</Label>
              <Select value={branchId} onValueChange={(v) => { setBranchId(v === '__all__' ? '' : v); setPage(1) }}>
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Todas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">Todas</SelectItem>
                  {branches.map((b) => (
                    <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Empleado</Label>
              <Select value={employeeId} onValueChange={(v) => { setEmployeeId(v === '__all__' ? '' : v); setPage(1) }}>
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">Todos</SelectItem>
                  {employees.map((emp) => (
                    <SelectItem key={emp.id} value={emp.id}>
                      {emp.firstName} {emp.lastName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Tipo</Label>
              <Select value={recordType} onValueChange={(v) => { setRecordType(v === '__all__' ? '' : v); setPage(1) }}>
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">Todos</SelectItem>
                  <SelectItem value="check_in">Entrada</SelectItem>
                  <SelectItem value="check_out">Salida</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Estado</Label>
              <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v === '__all__' ? '' : v); setPage(1) }}>
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">Todos</SelectItem>
                  <SelectItem value="on_time">A Tiempo</SelectItem>
                  <SelectItem value="late">Retardo</SelectItem>
                  <SelectItem value="absent">Ausente</SelectItem>
                  <SelectItem value="fraud_detected">Fraude</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Records Table */}
      <Card>
        <CardContent className="px-0">
          {loading ? (
            <div className="p-6 space-y-3">
              {Array.from({ length: 8 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : records.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16">
              <ClipboardList className="h-12 w-12 text-muted-foreground/40 mb-4" />
              <p className="text-lg font-medium text-muted-foreground">Sin registros</p>
              <p className="text-sm text-muted-foreground mt-1">
                No se encontraron registros con los filtros seleccionados
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-10 pl-4">
                      <Checkbox
                        checked={selectedIds.size === records.length && records.length > 0}
                        onCheckedChange={toggleSelectAll}
                      />
                    </TableHead>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Hora</TableHead>
                    <TableHead>Empleado</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Sucursal</TableHead>
                    <TableHead>GPS</TableHead>
                    <TableHead className="w-16 text-center">Verif.</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {records.map((record) => (
                    <TableRow key={record.id} className={cn(
                      'transition-colors',
                      selectedIds.has(record.id) && 'bg-emerald-50/50'
                    )}>
                      <TableCell className="pl-4">
                        <Checkbox
                          checked={selectedIds.has(record.id)}
                          onCheckedChange={() => toggleSelect(record.id)}
                        />
                      </TableCell>
                      <TableCell className="text-sm tabular-nums">
                        {new Date(record.recordTime).toLocaleDateString('es-MX', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </TableCell>
                      <TableCell className="text-sm font-medium tabular-nums">
                        {new Date(record.recordTime).toLocaleTimeString('es-MX', {
                          hour: '2-digit',
                          minute: '2-digit',
                          second: '2-digit',
                        })}
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="text-sm font-medium">
                            {record.employee
                              ? `${record.employee.firstName} ${record.employee.lastName}`
                              : 'Desconocido'}
                          </p>
                          {record.employee?.employeeNumber && (
                            <p className="text-xs text-muted-foreground">
                              #{record.employee.employeeNumber}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <RecordTypeBadge type={record.recordType} />
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={record.status} />
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {record.branch?.name || '-'}
                      </TableCell>
                      <TableCell>
                        {record.latitude && record.longitude ? (
                          <p className="text-xs text-muted-foreground tabular-nums">
                            {record.latitude.toFixed(4)}, {record.longitude.toFixed(4)}
                            {record.gpsAccuracy && (
                              <span className="text-[10px] ml-1">
                                ±{record.gpsAccuracy.toFixed(0)}m
                              </span>
                            )}
                          </p>
                        ) : (
                          <span className="text-xs text-muted-foreground/50">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        <button
                          className={cn(
                            'inline-flex h-7 w-7 items-center justify-center rounded-md transition-colors',
                            record.verified
                              ? 'text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50'
                              : 'text-muted-foreground/40 hover:text-muted-foreground hover:bg-muted'
                          )}
                          onClick={() => handleToggleVerify(record)}
                          disabled={verifying === record.id}
                        >
                          {verifying === record.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : record.verified ? (
                            <CheckCircle2 className="h-4 w-4" />
                          ) : (
                            <XCircle className="h-4 w-4" />
                          )}
                        </button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {/* Pagination */}
          {!loading && records.length > 0 && (
            <div className="flex items-center justify-between border-t px-4 py-3">
              <p className="text-sm text-muted-foreground">
                Página {page} de {totalPages}
              </p>
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
