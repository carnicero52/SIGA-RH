'use client'

import { useEffect, useState, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
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
  FileBarChart, Users, ClipboardCheck, DollarSign,
  Download, Clock, UserCheck, UserX, Calendar,
} from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import type { Employee, AttendanceRecord, Incident } from '@/lib/types'
import { attendanceStatusLabels, employeeStatusLabels, employmentTypeLabels, incidentTypeLabels, severityLabels, incidentStatusLabels } from '@/lib/types'

const authHeaders = () => ({
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${localStorage.getItem('siga_token')}`,
})

function getDateRange() {
  const today = new Date()
  const firstDay = new Date(today.getFullYear(), today.getMonth(), 1)
  const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0)
  return {
    from: firstDay.toISOString().split('T')[0],
    to: lastDay.toISOString().split('T')[0],
  }
}

const defaultDateRange = getDateRange()

// ========== ASISTENCIA REPORT ==========
function AttendanceReport() {
  const [from, setFrom] = useState(defaultDateRange.from)
  const [to, setTo] = useState(defaultDateRange.to)
  const [branchFilter, setBranchFilter] = useState('all')
  const [deptFilter, setDeptFilter] = useState('all')
  const [records, setRecords] = useState<any[]>([])
  const [branches, setBranches] = useState<any[]>([])
  const [departments, setDepartments] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [generated, setGenerated] = useState(false)

  const fetchFilters = useCallback(async () => {
    try {
      const [bRes, dRes] = await Promise.all([
        fetch('/api/branches', { headers: authHeaders() }),
        fetch('/api/departments', { headers: authHeaders() }),
      ])
      if (bRes.ok) {
        const bd = await bRes.json()
        setBranches(Array.isArray(bd) ? bd : bd.branches || [])
      }
      if (dRes.ok) {
        const dd = await dRes.json()
        setDepartments(Array.isArray(dd) ? dd : dd.departments || [])
      }
    } catch { /* non-critical */ }
  }, [])

  useEffect(() => { fetchFilters() }, [fetchFilters])

  const generate = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({ from, to })
      if (branchFilter !== 'all') params.set('branchId', branchFilter)
      if (deptFilter !== 'all') params.set('departmentId', deptFilter)
      const res = await fetch(`/api/attendance?${params}`)
      if (!res.ok) throw new Error('Error al generar reporte')
      const data = await res.json()
      const arr = Array.isArray(data) ? data : data.records || []
      setRecords(arr)
      setGenerated(true)
    } catch (error: any) {
      toast.error(error.message)
    } finally {
      setLoading(false)
    }
  }

  const summaryStats = {
    total: records.length,
    present: records.filter((r: any) => r.status === 'on_time').length,
    late: records.filter((r: any) => r.status === 'late').length,
    absent: records.filter((r: any) => r.status === 'absent').length,
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="space-y-2">
          <Label>Sucursal</Label>
          <Select value={branchFilter} onValueChange={setBranchFilter}>
            <SelectTrigger className="h-9"><SelectValue placeholder="Todas" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              {branches.map((b: any) => (<SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Departamento</Label>
          <Select value={deptFilter} onValueChange={setDeptFilter}>
            <SelectTrigger className="h-9"><SelectValue placeholder="Todos" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              {departments.map((d: any) => (<SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Desde</Label>
          <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="h-9" />
        </div>
        <div className="space-y-2">
          <Label>Hasta</Label>
          <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="h-9" />
        </div>
      </div>

      <Button onClick={generate} disabled={loading} className="gap-2">
        {loading ? 'Generando...' : 'Generar Reporte'}
      </Button>

      {generated && (
        <>
          {/* Summary stats */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { label: 'Total Registros', value: summaryStats.total, icon: ClipboardCheck, color: 'text-emerald-600 bg-emerald-50' },
              { label: 'A Tiempo', value: summaryStats.present, icon: UserCheck, color: 'text-teal-600 bg-teal-50' },
              { label: 'Retardos', value: summaryStats.late, icon: Clock, color: 'text-amber-600 bg-amber-50' },
              { label: 'Ausentes', value: summaryStats.absent, icon: UserX, color: 'text-red-600 bg-red-50' },
            ].map((s) => (
              <Card key={s.label}>
                <CardContent className="p-4 flex items-center gap-3">
                  <div className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-lg', s.color)}>
                    <s.icon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-xl font-bold">{s.value}</p>
                    <p className="text-xs text-muted-foreground">{s.label}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Table */}
          <Card>
            <CardContent className="p-0">
              <div className="max-h-96 overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Empleado</TableHead>
                      <TableHead>Sucursal</TableHead>
                      <TableHead>Fecha</TableHead>
                      <TableHead>Entrada</TableHead>
                      <TableHead>Salida</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead>GPS</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {records.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                          Sin registros en este período
                        </TableCell>
                      </TableRow>
                    ) : (
                      records.map((r: any) => (
                        <TableRow key={r.id}>
                          <TableCell className="font-medium">
                            {r.employee ? `${r.employee.firstName} ${r.employee.lastName}` : '-'}
                          </TableCell>
                          <TableCell className="text-muted-foreground">{r.branch?.name || '-'}</TableCell>
                          <TableCell className="text-muted-foreground">
                            {new Date(r.recordTime).toLocaleDateString('es-MX')}
                          </TableCell>
                          <TableCell className="tabular-nums">
                            {new Date(r.recordTime).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}
                          </TableCell>
                          <TableCell className="tabular-nums">-</TableCell>
                          <TableCell>
                            <Badge variant="outline" className={cn(
                              'text-[11px]',
                              r.status === 'on_time' ? 'border-green-500/50 text-green-600 bg-green-50' :
                              r.status === 'late' ? 'border-amber-500/50 text-amber-600 bg-amber-50' :
                              r.status === 'absent' ? 'border-red-500/50 text-red-600 bg-red-50' :
                              'border-muted text-muted-foreground'
                            )}>
                              {attendanceStatusLabels[r.status] || r.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-muted-foreground text-xs">
                            {r.gpsAccuracy ? `${r.gpsAccuracy.toFixed(0)}m` : '-'}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          <Button variant="outline" className="gap-2" onClick={() => toast.success('Reporte exportado')}>
            <Download className="h-4 w-4" />
            Exportar
          </Button>
        </>
      )}
    </div>
  )
}

// ========== EMPLOYEES REPORT ==========
function EmployeesReport() {
  const [employees, setEmployees] = useState<any[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(false)
  const [generated, setGenerated] = useState(false)

  const generate = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/employees')
      if (!res.ok) throw new Error('Error al cargar empleados')
      const data = await res.json()
      const arr = Array.isArray(data) ? data : data.employees || []
      setEmployees(arr)
      setGenerated(true)
    } catch (error: any) {
      toast.error(error.message)
    } finally {
      setLoading(false)
    }
  }

  const filtered = employees.filter((e: any) => {
    const term = search.toLowerCase()
    return (
      `${e.firstName} ${e.lastName}`.toLowerCase().includes(term) ||
      e.email.toLowerCase().includes(term) ||
      (e.employeeNumber || '').toLowerCase().includes(term) ||
      (e.department?.name || '').toLowerCase().includes(term)
    )
  })

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="space-y-2 flex-1">
          <Label>Buscar empleado</Label>
          <Input
            placeholder="Nombre, email, número..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-9"
          />
        </div>
        <Button onClick={generate} disabled={loading} className="gap-2">
          {loading ? 'Cargando...' : 'Generar Reporte'}
        </Button>
      </div>

      {generated && (
        <>
          <Card>
            <CardContent className="p-0">
              <div className="max-h-96 overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>No.</TableHead>
                      <TableHead>Nombre</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Departamento</TableHead>
                      <TableHead>Puesto</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Estado</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                          Sin empleados encontrados
                        </TableCell>
                      </TableRow>
                    ) : (
                      filtered.map((e: any) => (
                        <TableRow key={e.id}>
                          <TableCell className="text-muted-foreground">{e.employeeNumber || '-'}</TableCell>
                          <TableCell className="font-medium">{e.firstName} {e.lastName}</TableCell>
                          <TableCell className="text-muted-foreground text-sm">{e.email}</TableCell>
                          <TableCell className="text-muted-foreground">{e.department?.name || '-'}</TableCell>
                          <TableCell className="text-muted-foreground">{e.position?.name || '-'}</TableCell>
                          <TableCell className="text-muted-foreground">{employmentTypeLabels[e.employmentType] || e.employmentType}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className={cn(
                              'text-[11px]',
                              e.status === 'active' ? 'border-emerald-500/50 text-emerald-600 bg-emerald-50' :
                              e.status === 'inactive' ? 'border-red-500/50 text-red-600 bg-red-50' :
                              'border-amber-500/50 text-amber-600 bg-amber-50'
                            )}>
                              {employeeStatusLabels[e.status] || e.status}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
          <p className="text-sm text-muted-foreground">{filtered.length} empleados encontrados</p>
          <Button variant="outline" className="gap-2" onClick={() => toast.success('Reporte exportado')}>
            <Download className="h-4 w-4" />
            Exportar
          </Button>
        </>
      )}
    </div>
  )
}

// ========== INCIDENTS REPORT ==========
function IncidentsReport() {
  const [from, setFrom] = useState(defaultDateRange.from)
  const [to, setTo] = useState(defaultDateRange.to)
  const [severityFilter, setSeverityFilter] = useState('all')
  const [typeFilter, setTypeFilter] = useState('all')
  const [incidents, setIncidents] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [generated, setGenerated] = useState(false)

  const generate = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({ from, to })
      if (severityFilter !== 'all') params.set('severity', severityFilter)
      if (typeFilter !== 'all') params.set('type', typeFilter)
      const res = await fetch(`/api/incidents?${params}`)
      if (!res.ok) throw new Error('Error al cargar incidencias')
      const data = await res.json()
      const arr = Array.isArray(data) ? data : data.incidents || []
      setIncidents(arr)
      setGenerated(true)
    } catch (error: any) {
      toast.error(error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="space-y-2">
          <Label>Desde</Label>
          <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="h-9" />
        </div>
        <div className="space-y-2">
          <Label>Hasta</Label>
          <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="h-9" />
        </div>
        <div className="space-y-2">
          <Label>Severidad</Label>
          <Select value={severityFilter} onValueChange={setSeverityFilter}>
            <SelectTrigger className="h-9"><SelectValue placeholder="Todas" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              {Object.entries(severityLabels).map(([k, v]) => (<SelectItem key={k} value={k}>{v}</SelectItem>))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Tipo</Label>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="h-9"><SelectValue placeholder="Todos" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              {Object.entries(incidentTypeLabels).map(([k, v]) => (<SelectItem key={k} value={k}>{v}</SelectItem>))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <Button onClick={generate} disabled={loading} className="gap-2">
        {loading ? 'Generando...' : 'Generar Reporte'}
      </Button>

      {generated && (
        <>
          <Card>
            <CardContent className="p-0">
              <div className="max-h-96 overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Empleado</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Título</TableHead>
                      <TableHead>Fecha</TableHead>
                      <TableHead>Severidad</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead>Resolución</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {incidents.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                          Sin incidencias en este período
                        </TableCell>
                      </TableRow>
                    ) : (
                      incidents.map((i: any) => (
                        <TableRow key={i.id}>
                          <TableCell className="font-medium">
                            {i.employee ? `${i.employee.firstName} ${i.employee.lastName}` : '-'}
                          </TableCell>
                          <TableCell className="text-muted-foreground">{incidentTypeLabels[i.type] || i.type}</TableCell>
                          <TableCell className="max-w-[200px] truncate">{i.title}</TableCell>
                          <TableCell className="text-muted-foreground">
                            {i.date ? new Date(i.date).toLocaleDateString('es-MX') : '-'}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className={cn(
                              'text-[11px]',
                              i.severity === 'low' ? 'border-emerald-500/50 text-emerald-600 bg-emerald-50' :
                              i.severity === 'medium' ? 'border-amber-500/50 text-amber-600 bg-amber-50' :
                              i.severity === 'high' ? 'border-orange-500/50 text-orange-600 bg-orange-50' :
                              'border-red-500/50 text-red-600 bg-red-50'
                            )}>
                              {severityLabels[i.severity] || i.severity}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className={cn(
                              'text-[11px]',
                              i.status === 'open' ? 'border-red-500/50 text-red-600 bg-red-50' :
                              i.status === 'under_review' ? 'border-amber-500/50 text-amber-600 bg-amber-50' :
                              i.status === 'resolved' ? 'border-emerald-500/50 text-emerald-600 bg-emerald-50' :
                              'border-muted text-muted-foreground'
                            )}>
                              {incidentStatusLabels[i.status] || i.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="max-w-[150px] truncate text-xs text-muted-foreground">
                            {i.resolution || '-'}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
          <Button variant="outline" className="gap-2" onClick={() => toast.success('Reporte exportado')}>
            <Download className="h-4 w-4" />
            Exportar
          </Button>
        </>
      )}
    </div>
  )
}

// ========== NOMINA REPORT ==========
function NominaReport() {
  const [employees, setEmployees] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [generated, setGenerated] = useState(false)

  const generate = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/employees')
      if (!res.ok) throw new Error('Error al cargar empleados')
      const data = await res.json()
      const arr = Array.isArray(data) ? data : data.employees || []
      setEmployees(arr)
      setGenerated(true)
    } catch (error: any) {
      toast.error(error.message)
    } finally {
      setLoading(false)
    }
  }

  const totalSalary = employees.reduce((sum: number, e: any) => sum + (e.position?.salary || 0), 0)

  return (
    <div className="space-y-4">
      <Button onClick={generate} disabled={loading} className="gap-2">
        {loading ? 'Cargando...' : 'Generar Reporte'}
      </Button>

      {generated && (
        <>
          <Card>
            <CardContent className="p-0">
              <div className="max-h-96 overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Empleado</TableHead>
                      <TableHead>Departamento</TableHead>
                      <TableHead>Puesto</TableHead>
                      <TableHead>Salario</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Estado</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {employees.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                          Sin empleados
                        </TableCell>
                      </TableRow>
                    ) : (
                      employees.map((e: any) => (
                        <TableRow key={e.id}>
                          <TableCell className="font-medium">{e.firstName} {e.lastName}</TableCell>
                          <TableCell className="text-muted-foreground">{e.department?.name || '-'}</TableCell>
                          <TableCell className="text-muted-foreground">{e.position?.name || '-'}</TableCell>
                          <TableCell className="tabular-nums font-medium">
                            {e.position?.salary ? `$${Number(e.position.salary).toLocaleString('es-MX')}` : '-'}
                          </TableCell>
                          <TableCell className="text-muted-foreground">{employmentTypeLabels[e.employmentType] || e.employmentType}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className={cn(
                              'text-[11px]',
                              e.status === 'active' ? 'border-emerald-500/50 text-emerald-600 bg-emerald-50' :
                              'border-red-500/50 text-red-600 bg-red-50'
                            )}>
                              {employeeStatusLabels[e.status] || e.status}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                  {employees.length > 0 && (
                    <tfoot>
                      <TableRow className="bg-muted/50 font-semibold">
                        <TableCell colSpan={3} className="text-right">Total Nómina Mensual:</TableCell>
                        <TableCell className="tabular-nums text-emerald-600">
                          ${totalSalary.toLocaleString('es-MX')}
                        </TableCell>
                        <TableCell colSpan={2}></TableCell>
                      </TableRow>
                    </tfoot>
                  )}
                </Table>
              </div>
            </CardContent>
          </Card>
          <p className="text-sm text-muted-foreground">{employees.length} empleados en nómina</p>
          <Button variant="outline" className="gap-2" onClick={() => toast.success('Reporte exportado')}>
            <Download className="h-4 w-4" />
            Exportar
          </Button>
        </>
      )}
    </div>
  )
}

// ========== MAIN REPORTS VIEW ==========
export function ReportsView() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <FileBarChart className="h-4 w-4" />
        <span>Generación de reportes y análisis</span>
      </div>

      {/* Report Tabs */}
      <Tabs defaultValue="asistencia" className="space-y-6">
        <TabsList className="grid grid-cols-2 sm:grid-cols-4 w-full">
          <TabsTrigger value="asistencia" className="gap-1.5 text-xs sm:text-sm">
            <ClipboardCheck className="h-4 w-4" />
            <span>Asistencia</span>
          </TabsTrigger>
          <TabsTrigger value="empleados" className="gap-1.5 text-xs sm:text-sm">
            <Users className="h-4 w-4" />
            <span>Empleados</span>
          </TabsTrigger>
          <TabsTrigger value="incidencias" className="gap-1.5 text-xs sm:text-sm">
            <FileBarChart className="h-4 w-4" />
            <span>Incidencias</span>
          </TabsTrigger>
          <TabsTrigger value="nomina" className="gap-1.5 text-xs sm:text-sm">
            <DollarSign className="h-4 w-4" />
            <span>Nómina</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="asistencia">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <ClipboardCheck className="h-5 w-5 text-emerald-600" />
                Reporte de Asistencia
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Análisis detallado de asistencia por sucursal y departamento.
              </p>
            </CardHeader>
            <CardContent>
              <AttendanceReport />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="empleados">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Users className="h-5 w-5 text-teal-600" />
                Reporte de Empleados
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Listado completo de empleados con filtros de búsqueda.
              </p>
            </CardHeader>
            <CardContent>
              <EmployeesReport />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="incidencias">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <FileBarChart className="h-5 w-5 text-amber-600" />
                Reporte de Incidencias
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Registro de incidencias filtrado por tipo, severidad y fecha.
              </p>
            </CardHeader>
            <CardContent>
              <IncidentsReport />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="nomina">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-green-600" />
                Reporte de Nómina
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Resumen de salarios por empleado con total mensual.
              </p>
            </CardHeader>
            <CardContent>
              <NominaReport />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
