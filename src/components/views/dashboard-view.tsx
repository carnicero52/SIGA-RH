'use client'

import { useEffect, useState, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import {
  ChartContainer, ChartTooltip, ChartTooltipContent,
  ChartLegend, ChartLegendContent,
} from '@/components/ui/chart'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, PieChart, Pie, Cell, ResponsiveContainer,
} from 'recharts'
import {
  Users, UserCheck, Clock, UserX,
  Building2, GitBranch, AlertTriangle, Briefcase,
  TrendingUp, CalendarDays,
} from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import type { DashboardStats, AttendanceRecord } from '@/lib/types'
import { attendanceStatusLabels } from '@/lib/types'

// Chart color palette (emerald/teal)
const COLORS = [
  'hsl(160, 84%, 39%)',  // emerald-500
  'hsl(174, 72%, 56%)',  // teal-400
  'hsl(142, 71%, 45%)',  // green-500
  'hsl(186, 72%, 56%)',  // cyan-400
  'hsl(158, 64%, 52%)',  // emerald-400
  'hsl(152, 69%, 31%)',  // emerald-700
  'hsl(163, 63%, 46%)',  // teal-500
  'hsl(120, 60%, 40%)',  // custom green
]

const attendanceChartConfig = {
  present: { label: 'A Tiempo', color: 'hsl(160, 84%, 39%)' },
  late: { label: 'Retardos', color: 'hsl(38, 92%, 50%)' },
  absent: { label: 'Ausentes', color: 'hsl(0, 84%, 60%)' },
} as const

const branchChartConfig = {
  count: { label: 'Asistencia' },
  SucursalPrincipal: { label: 'Principal', color: COLORS[0] },
  Norte: { label: 'Norte', color: COLORS[1] },
  Sur: { label: 'Sur', color: COLORS[2] },
} as const

const deptChartConfig = {
  count: { label: 'Empleados', color: 'hsl(160, 84%, 39%)' },
} as const

// KPI Card component
function KpiCard({
  icon: Icon,
  label,
  value,
  colorClass,
  bgColorClass,
  loading,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: number
  colorClass: string
  bgColorClass: string
  loading?: boolean
}) {
  return (
    <Card className="gap-0 overflow-hidden">
      <CardContent className="p-4 lg:p-6">
        <div className="flex items-center gap-4">
          <div className={cn('flex h-12 w-12 shrink-0 items-center justify-center rounded-xl', bgColorClass)}>
            <Icon className={cn('h-6 w-6', colorClass)} />
          </div>
          <div className="min-w-0 flex-1">
            {loading ? (
              <Skeleton className="h-8 w-20 mb-1" />
            ) : (
              <p className="text-2xl font-bold tracking-tight lg:text-3xl">{value}</p>
            )}
            {loading ? (
              <Skeleton className="h-4 w-28" />
            ) : (
              <p className="text-sm text-muted-foreground truncate">{label}</p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// Mini stat card
function MiniStatCard({
  icon: Icon,
  label,
  value,
  loading,
  onClick,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: number | string
  loading?: boolean
  onClick?: () => void
}) {
  return (
    <Card
      className={cn('gap-0 cursor-pointer transition-colors hover:bg-accent/50', onClick && 'cursor-pointer')}
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
            <Icon className="h-4 w-4 text-primary" />
          </div>
          <div className="min-w-0 flex-1">
            {loading ? (
              <Skeleton className="h-6 w-12 mb-0.5" />
            ) : (
              <p className="text-lg font-semibold">{value}</p>
            )}
            {loading ? (
              <Skeleton className="h-3 w-20" />
            ) : (
              <p className="text-xs text-muted-foreground truncate">{label}</p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// Status badge helper
function StatusBadge({ status }: { status: string }) {
  const variant = status === 'on_time' ? 'outline' : status === 'late' ? 'outline' : 'outline'
  const colorClass =
    status === 'on_time'
      ? 'border-green-500/50 text-green-600 bg-green-50'
      : status === 'late'
        ? 'border-amber-500/50 text-amber-600 bg-amber-50'
        : status === 'absent'
          ? 'border-red-500/50 text-red-600 bg-red-50'
          : 'border-muted text-muted-foreground'

  return (
    <Badge variant={variant} className={cn('text-[11px] font-medium', colorClass)}>
      {attendanceStatusLabels[status] || status}
    </Badge>
  )
}

// Loading skeleton for charts
function ChartSkeleton() {
  return (
    <Card>
      <CardHeader className="pb-2">
        <Skeleton className="h-5 w-40" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-[280px] w-full rounded-lg" />
      </CardContent>
    </Card>
  )
}

export function DashboardView() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchStats = useCallback(async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('siga_token')
      const res = await fetch('/api/dashboard/stats', {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Error al cargar estadísticas')
      }
      const data = await res.json()
      setStats(data)
    } catch (error: any) {
      toast.error(error.message || 'Error al cargar el dashboard')
    } finally {
      setLoading(false)
    }
  }, [])

  return (
    <div className="space-y-6">
      {/* Page subtitle */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <TrendingUp className="h-4 w-4" />
        <span>Resumen general de la empresa</span>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          icon={Users}
          label="Total Empleados"
          value={stats?.totalEmployees ?? 0}
          colorClass="text-emerald-600"
          bgColorClass="bg-emerald-50"
          loading={loading}
        />
        <KpiCard
          icon={UserCheck}
          label="Presentes Hoy"
          value={stats?.presentToday ?? 0}
          colorClass="text-teal-600"
          bgColorClass="bg-teal-50"
          loading={loading}
        />
        <KpiCard
          icon={Clock}
          label="Retardos Hoy"
          value={stats?.lateToday ?? 0}
          colorClass="text-amber-600"
          bgColorClass="bg-amber-50"
          loading={loading}
        />
        <KpiCard
          icon={UserX}
          label="Ausentes Hoy"
          value={stats?.absentToday ?? 0}
          colorClass="text-red-600"
          bgColorClass="bg-red-50"
          loading={loading}
        />
      </div>

      {/* Mini stat cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        <MiniStatCard icon={Building2} label="Sucursales" value={stats?.totalBranches ?? 0} loading={loading} />
        <MiniStatCard icon={GitBranch} label="Departamentos" value={stats?.totalDepartments ?? 0} loading={loading} />
        <MiniStatCard icon={AlertTriangle} label="Incidencias Abiertas" value={stats?.openIncidents ?? 0} loading={loading} />
        <MiniStatCard icon={Briefcase} label="Vacantes" value={stats?.openVacancies ?? 0} loading={loading} />
        <MiniStatCard icon={CalendarDays} label="Contratos Vigentes" value={stats?.pendingContracts ?? 0} loading={loading} />
      </div>

      {/* Charts section */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Attendance by day - Bar chart */}
        {loading ? (
          <ChartSkeleton />
        ) : (
          <Card className="lg:col-span-2">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Asistencia Últimos 7 Días</CardTitle>
            </CardHeader>
            <CardContent>
              <ChartContainer config={attendanceChartConfig} className="h-[300px] w-full">
                <BarChart data={stats?.attendanceByDay} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis
                    dataKey="date"
                    tickLine={false}
                    axisLine={false}
                    tick={{ fontSize: 12 }}
                  />
                  <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 12 }} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <ChartLegend content={<ChartLegendContent />} />
                  <Bar dataKey="present" stackId="a" fill="var(--color-present)" radius={[0, 0, 0, 0]} />
                  <Bar dataKey="late" stackId="a" fill="var(--color-late)" radius={[0, 0, 0, 0]} />
                  <Bar dataKey="absent" stackId="a" fill="var(--color-absent)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ChartContainer>
            </CardContent>
          </Card>
        )}

        {/* Attendance by branch - Pie chart */}
        {loading ? (
          <ChartSkeleton />
        ) : (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Asistencia por Sucursal</CardTitle>
            </CardHeader>
            <CardContent>
              {stats && stats.attendanceByBranch.length > 0 ? (
                <ChartContainer config={branchChartConfig} className="h-[300px] w-full">
                  <PieChart>
                    <ChartTooltip content={<ChartTooltipContent nameKey="branch" />} />
                    <Pie
                      data={stats.attendanceByBranch}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={90}
                      dataKey="count"
                      nameKey="branch"
                      paddingAngle={2}
                    >
                      {stats.attendanceByBranch.map((_, index) => (
                        <Cell key={index} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <ChartLegend content={<ChartLegendContent nameKey="branch" />} />
                  </PieChart>
                </ChartContainer>
              ) : (
                <div className="flex h-[300px] items-center justify-center text-sm text-muted-foreground">
                  Sin datos de asistencia hoy
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Employees by department - Bar chart */}
      {loading ? (
        <ChartSkeleton />
      ) : (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Empleados por Departamento</CardTitle>
          </CardHeader>
          <CardContent>
            {stats && stats.employeesByDepartment.length > 0 ? (
              <ChartContainer config={deptChartConfig} className="h-[280px] w-full">
                <BarChart
                  data={stats.employeesByDepartment}
                  layout="vertical"
                  margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                  <XAxis type="number" tickLine={false} axisLine={false} tick={{ fontSize: 12 }} />
                  <YAxis
                    type="category"
                    dataKey="department"
                    tickLine={false}
                    axisLine={false}
                    tick={{ fontSize: 11 }}
                    width={120}
                  />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="count" fill="var(--color-count)" radius={[0, 4, 4, 0]} barSize={24} />
                </BarChart>
              </ChartContainer>
            ) : (
              <div className="flex h-[280px] items-center justify-center text-sm text-muted-foreground">
                Sin datos de departamentos
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Bottom section: Recent attendance + Upcoming birthdays */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Recent attendance table */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Asistencia Reciente</CardTitle>
          </CardHeader>
          <CardContent className="px-0">
            {loading ? (
              <div className="space-y-3 px-6">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-10 w-full" />
                ))}
              </div>
            ) : stats && stats.recentAttendance.length > 0 ? (
              <div className="max-h-96 overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="pl-6">Empleado</TableHead>
                      <TableHead>Hora</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead className="pr-6">Sucursal</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {stats.recentAttendance.map((record: AttendanceRecord & { employee?: { firstName: string; lastName: string }; branch?: { name: string } }) => (
                      <TableRow key={record.id}>
                        <TableCell className="pl-6 font-medium">
                          {record.employee
                            ? `${record.employee.firstName} ${record.employee.lastName}`
                            : 'Desconocido'}
                        </TableCell>
                        <TableCell className="text-muted-foreground tabular-nums">
                          {new Date(record.recordTime).toLocaleTimeString('es-MX', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </TableCell>
                        <TableCell>
                          <StatusBadge status={record.status} />
                        </TableCell>
                        <TableCell className="pr-6 text-muted-foreground">
                          {record.branch?.name || '-'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="flex h-48 items-center justify-center text-sm text-muted-foreground">
                Sin registros de asistencia recientes
              </div>
            )}
          </CardContent>
        </Card>

        {/* Upcoming birthdays */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Cumpleaños Próximos</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <Skeleton className="h-9 w-9 rounded-full" />
                    <div className="flex-1">
                      <Skeleton className="h-4 w-28 mb-1" />
                      <Skeleton className="h-3 w-16" />
                    </div>
                  </div>
                ))}
              </div>
            ) : stats && stats.upcomingBirthdays.length > 0 ? (
              <div className="space-y-1 max-h-80 overflow-y-auto">
                {stats.upcomingBirthdays.map((b, i) => (
                  <div key={i} className="flex items-center gap-3 rounded-lg px-2 py-2 hover:bg-muted/50 transition-colors">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-pink-100 text-pink-600 text-sm font-semibold">
                      {b.name.split(' ').map(n => n[0]).join('').substring(0, 2)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">{b.name}</p>
                      <p className="text-xs text-muted-foreground">{b.date}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex h-48 items-center justify-center text-sm text-muted-foreground">
                Sin cumpleaños próximos
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
