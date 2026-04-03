'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Users, UserCheck, Clock, UserX, MapPin, Radio, RefreshCw, ImageOff,
} from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import type { Employee, Branch, AttendanceRecord } from '@/lib/types'

interface MonitorEmployee {
  id: string
  firstName: string
  lastName: string
  employeeNumber?: string
  branchId?: string
  branchName?: string
  status: 'present' | 'late' | 'absent' | 'en_route'
  lastCheckIn?: string
  selfieUrl?: string
  photo?: string
}

interface MonitorStats {
  present: number
  late: number
  absent: number
  enRoute: number
}

const STATUS_CONFIG = {
  present: { label: 'Dentro', bgClass: 'bg-emerald-100 text-emerald-700 border-emerald-200', dotClass: 'bg-emerald-500' },
  late: { label: 'Retardo', bgClass: 'bg-amber-100 text-amber-700 border-amber-200', dotClass: 'bg-amber-500' },
  absent: { label: 'Ausente', bgClass: 'bg-red-100 text-red-700 border-red-200', dotClass: 'bg-red-500' },
  en_route: { label: 'En Ruta', bgClass: 'bg-slate-100 text-slate-600 border-slate-200', dotClass: 'bg-slate-400' },
} as const

type FilterTab = 'all' | 'present' | 'late' | 'absent'

export function AttendanceMonitorView() {
  const [employees, setEmployees] = useState<MonitorEmployee[]>([])
  const [branches, setBranches] = useState<Branch[]>([])
  const [stats, setStats] = useState<MonitorStats>({ present: 0, late: 0, absent: 0, enRoute: 0 })
  const [loading, setLoading] = useState(true)
  const [branchFilter, setBranchFilter] = useState('')
  const [activeTab, setActiveTab] = useState<FilterTab>('all')
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date())
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  const fetchBranches = useCallback(async () => {
    try {
      const res = await fetch('/api/branches')
      if (!res.ok) return
      const data = await res.json()
      setBranches(Array.isArray(data) ? data : [])
    } catch {
      // silent
    }
  }, [])

  const fetchMonitorData = useCallback(async () => {
    try {
      const today = new Date().toISOString().split('T')[0]
      
      // Fetch all active employees
      const empRes = await fetch('/api/employees')
      if (!empRes.ok) return
      const empData = await empRes.json()
      const allEmployees: Employee[] = Array.isArray(empData) ? empData : empData.employees || []

      // Fetch today's attendance records
      const attRes = await fetch(`/api/attendance?dateFrom=${today}&dateTo=${today}&limit=500&${branchFilter ? `branchId=${branchFilter}` : ''}`)
      if (!attRes.ok) return
      const attData = await attRes.json()
      const todayRecords: AttendanceRecord[] = attData.records || []

      // Build employee status map
      const statusMap = new Map<string, { status: MonitorEmployee['status']; lastCheckIn?: string; selfieUrl?: string }>()

      for (const record of todayRecords) {
        const existing = statusMap.get(record.employeeId)
        // If already marked as present, keep it. Otherwise update based on latest record
        if (existing && existing.status === 'present') continue

        if (record.recordType === 'check_in') {
          if (record.status === 'late') {
            statusMap.set(record.employeeId, {
              status: 'late',
              lastCheckIn: record.recordTime,
              selfieUrl: record.selfieUrl,
            })
          } else if (record.status === 'on_time') {
            statusMap.set(record.employeeId, {
              status: 'present',
              lastCheckIn: record.recordTime,
              selfieUrl: record.selfieUrl,
            })
          }
        }
      }

      // Determine branch name map
      const branchMap = new Map<string, string>()
      allEmployees.forEach((emp) => {
        if (emp.branchId && emp.branch?.name) {
          branchMap.set(emp.branchId, emp.branch.name)
        }
      })

      // Build monitor employees
      const monitorEmployees: MonitorEmployee[] = allEmployees
        .filter((emp) => {
          if (emp.status !== 'active') return false
          if (branchFilter && emp.branchId !== branchFilter) return false
          return true
        })
        .map((emp) => {
          const attStatus = statusMap.get(emp.id)
          return {
            id: emp.id,
            firstName: emp.firstName,
            lastName: emp.lastName,
            employeeNumber: emp.employeeNumber,
            branchId: emp.branchId,
            branchName: emp.branch?.name || branchMap.get(emp.branchId || ''),
            status: attStatus?.status || 'absent',
            lastCheckIn: attStatus?.lastCheckIn,
            selfieUrl: attStatus?.selfieUrl || emp.photo,
          }
        })

      // Calculate stats
      const newStats: MonitorStats = { present: 0, late: 0, absent: 0, enRoute: 0 }
      monitorEmployees.forEach((emp) => {
        newStats[emp.status]++
      })

      setEmployees(monitorEmployees)
      setStats(newStats)
      setLastRefresh(new Date())
    } catch (error: any) {
      toast.error(error.message || 'Error al cargar monitor')
    } finally {
      setLoading(false)
    }
  }, [branchFilter])

  useEffect(() => {
    fetchBranches()
  }, [fetchBranches])

  useEffect(() => {
    fetchMonitorData()
    // Auto-refresh every 30 seconds
    intervalRef.current = setInterval(fetchMonitorData, 30000)
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [fetchMonitorData])

  const filteredEmployees = employees.filter((emp) => {
    if (activeTab === 'all') return true
    if (activeTab === 'present') return emp.status === 'present'
    if (activeTab === 'late') return emp.status === 'late'
    if (activeTab === 'absent') return emp.status === 'absent'
    return true
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Monitor de Asistencia en Vivo</h2>
            <p className="text-sm text-muted-foreground">
              Vista en tiempo real del estado de asistencia
            </p>
          </div>
          <Badge variant="outline" className="border-red-300 bg-red-50 text-red-600 gap-1.5 shrink-0">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500" />
            </span>
            EN VIVO
          </Badge>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">
            Actualizado: {lastRefresh.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
          </span>
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={() => { setLoading(true); fetchMonitorData() }}
          >
            <RefreshCw className={cn('h-4 w-4', loading && 'animate-spin')} />
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Card className="gap-0 overflow-hidden">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50">
                <UserCheck className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                {loading ? (
                  <Skeleton className="h-7 w-10 mb-0.5" />
                ) : (
                  <p className="text-2xl font-bold text-emerald-600">{stats.present}</p>
                )}
                <p className="text-xs text-muted-foreground">Presentes</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="gap-0 overflow-hidden">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-50">
                <Clock className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                {loading ? (
                  <Skeleton className="h-7 w-10 mb-0.5" />
                ) : (
                  <p className="text-2xl font-bold text-amber-600">{stats.late}</p>
                )}
                <p className="text-xs text-muted-foreground">Retardos</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="gap-0 overflow-hidden">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-50">
                <UserX className="h-5 w-5 text-red-600" />
              </div>
              <div>
                {loading ? (
                  <Skeleton className="h-7 w-10 mb-0.5" />
                ) : (
                  <p className="text-2xl font-bold text-red-600">{stats.absent}</p>
                )}
                <p className="text-xs text-muted-foreground">Ausentes</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="gap-0 overflow-hidden">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100">
                <Radio className="h-5 w-5 text-slate-500" />
              </div>
              <div>
                {loading ? (
                  <Skeleton className="h-7 w-10 mb-0.5" />
                ) : (
                  <p className="text-2xl font-bold text-slate-500">{stats.enRoute}</p>
                )}
                <p className="text-xs text-muted-foreground">En Ruta</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <Select value={branchFilter} onValueChange={(v) => setBranchFilter(v === '__all__' ? '' : v)}>
          <SelectTrigger className="w-full sm:w-48 h-9">
            <SelectValue placeholder="Todas las sucursales" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">Todas las sucursales</SelectItem>
            {branches.map((b) => (
              <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as FilterTab)}>
          <TabsList>
            <TabsTrigger value="all" className="text-xs sm:text-sm">
              Todos <span className="ml-1.5 text-[10px] opacity-60">{employees.length}</span>
            </TabsTrigger>
            <TabsTrigger value="present" className="text-xs sm:text-sm">
              Presentes <span className="ml-1.5 text-[10px] opacity-60">{stats.present}</span>
            </TabsTrigger>
            <TabsTrigger value="late" className="text-xs sm:text-sm">
              Retardos <span className="ml-1.5 text-[10px] opacity-60">{stats.late}</span>
            </TabsTrigger>
            <TabsTrigger value="absent" className="text-xs sm:text-sm">
              Ausentes <span className="ml-1.5 text-[10px] opacity-60">{stats.absent}</span>
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Employee Grid */}
      {loading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 12 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="flex-1">
                    <Skeleton className="h-4 w-28 mb-1.5" />
                    <Skeleton className="h-3 w-20" />
                  </div>
                </div>
                <div className="mt-3">
                  <Skeleton className="h-6 w-20" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filteredEmployees.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Users className="h-12 w-12 text-muted-foreground/40 mb-4" />
            <p className="text-lg font-medium text-muted-foreground">
              {activeTab === 'all' ? 'Sin empleados' : 'Sin empleados en esta categoría'}
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              No hay empleados que coincidan con los filtros seleccionados
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredEmployees.map((emp) => {
            const config = STATUS_CONFIG[emp.status]
            const initials = `${emp.firstName[0]}${emp.lastName[0]}`

            return (
              <Card key={emp.id} className="overflow-hidden transition-all hover:shadow-md">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    {/* Avatar */}
                    <div className="relative shrink-0">
                      {emp.selfieUrl ? (
                        <Avatar className="h-11 w-11">
                          <AvatarFallback className="bg-primary/10 text-primary text-sm font-semibold">
                            {initials}
                          </AvatarFallback>
                        </Avatar>
                      ) : (
                        <Avatar className="h-11 w-11">
                          <AvatarFallback className={cn(
                            'text-sm font-semibold',
                            emp.status === 'present' && 'bg-emerald-100 text-emerald-700',
                            emp.status === 'late' && 'bg-amber-100 text-amber-700',
                            emp.status === 'absent' && 'bg-red-100 text-red-700',
                            emp.status === 'en_route' && 'bg-slate-100 text-slate-600',
                          )}>
                            {initials}
                          </AvatarFallback>
                        </Avatar>
                      )}
                      <div className={cn(
                        'absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-2 border-white',
                        config.dotClass
                      )} />
                    </div>

                    {/* Info */}
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold truncate">
                        {emp.firstName} {emp.lastName}
                      </p>
                      {emp.employeeNumber && (
                        <p className="text-xs text-muted-foreground">
                          #{emp.employeeNumber}
                        </p>
                      )}
                      {emp.branchName && (
                        <div className="flex items-center gap-1 mt-0.5">
                          <MapPin className="h-3 w-3 text-muted-foreground" />
                          <p className="text-xs text-muted-foreground truncate">{emp.branchName}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Status Badge */}
                  <div className="mt-3">
                    <Badge
                      variant="outline"
                      className={cn('text-xs font-medium w-full justify-center py-1', config.bgClass)}
                    >
                      {config.label}
                    </Badge>
                  </div>

                  {/* Last check-in time */}
                  {emp.lastCheckIn && (
                    <p className="mt-2 text-[11px] text-muted-foreground text-center">
                      Último registro: {new Date(emp.lastCheckIn).toLocaleTimeString('es-MX', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
