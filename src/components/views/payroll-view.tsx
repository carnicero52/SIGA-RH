'use client'

import { useEffect, useState, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import {
  DollarSign, Plus, Calculator, CheckCircle2, Clock, AlertTriangle,
  TrendingUp, Users, ArrowLeft, ChevronRight, FileText, Banknote,
} from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { formatCurrency, CURRENCIES } from '@/lib/currencies'

// ─────────────────────────────────────────────────────────────────────────────

const FREQUENCY_LABELS: Record<string, string> = {
  weekly: '📅 Semanal',
  biweekly: '📆 Quincenal',
  monthly: '🗓️ Mensual',
}

const STATUS_STYLES: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-700 border-gray-200',
  approved: 'bg-amber-100 text-amber-700 border-amber-200',
  paid: 'bg-emerald-100 text-emerald-700 border-emerald-200',
}

const STATUS_LABELS: Record<string, string> = {
  draft: '📝 Borrador',
  approved: '✅ Aprobado',
  paid: '💰 Pagado',
}

function authHeaders() {
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${typeof window !== 'undefined' ? localStorage.getItem('siga_token') : ''}`,
  }
}

// ─────────────────────────────────────────────────────────────────────────────

export function PayrollView() {
  const [periods, setPeriods] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedPeriod, setSelectedPeriod] = useState<any>(null)
  const [periodDetail, setPeriodDetail] = useState<any>(null)
  const [loadingDetail, setLoadingDetail] = useState(false)
  const [calculating, setCalculating] = useState(false)
  const [createOpen, setCreateOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    name: '', frequency: 'biweekly', startDate: '', endDate: '', currency: 'USD', notes: '',
  })

  const fetchPeriods = useCallback(async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/payroll', { headers: authHeaders() })
      if (res.ok) setPeriods(await res.json())
    } catch { toast.error('Error al cargar nóminas') }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { fetchPeriods() }, [fetchPeriods])

  const loadDetail = async (period: any) => {
    setSelectedPeriod(period)
    setLoadingDetail(true)
    try {
      const res = await fetch(`/api/payroll/${period.id}`, { headers: authHeaders() })
      if (res.ok) setPeriodDetail(await res.json())
    } catch { toast.error('Error al cargar detalle') }
    finally { setLoadingDetail(false) }
  }

  const handleCreate = async () => {
    if (!form.name || !form.startDate || !form.endDate) {
      toast.error('Nombre, fecha inicio y fecha fin son requeridos')
      return
    }
    setSaving(true)
    try {
      const res = await fetch('/api/payroll', {
        method: 'POST', headers: authHeaders(), body: JSON.stringify(form),
      })
      if (!res.ok) throw new Error((await res.json()).error)
      toast.success('Período de nómina creado')
      setCreateOpen(false)
      fetchPeriods()
    } catch (e: any) {
      toast.error(e.message)
    } finally { setSaving(false) }
  }

  const handleCalculate = async () => {
    if (!selectedPeriod) return
    setCalculating(true)
    try {
      const res = await fetch(`/api/payroll/${selectedPeriod.id}/calculate`, {
        method: 'POST', headers: authHeaders(),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      toast.success(`Nómina calculada: ${data.employeesProcessed} empleados procesados`)
      loadDetail(selectedPeriod)
      fetchPeriods()
    } catch (e: any) {
      toast.error(e.message)
    } finally { setCalculating(false) }
  }

  const handleStatusChange = async (newStatus: string) => {
    if (!selectedPeriod) return
    try {
      const res = await fetch(`/api/payroll/${selectedPeriod.id}`, {
        method: 'PUT', headers: authHeaders(),
        body: JSON.stringify({ status: newStatus }),
      })
      if (!res.ok) throw new Error('Error al actualizar estado')
      toast.success(`Nómina ${STATUS_LABELS[newStatus]}`)
      setSelectedPeriod({ ...selectedPeriod, status: newStatus })
      fetchPeriods()
    } catch (e: any) {
      toast.error(e.message)
    }
  }

  // Auto-generate period name
  const autoName = (freq: string, start: string) => {
    if (!start) return ''
    const d = new Date(start)
    const months = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic']
    if (freq === 'weekly') return `Semana del ${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`
    if (freq === 'biweekly') return `Quincena ${d.getDate() <= 15 ? '1' : '2'} - ${months[d.getMonth()]} ${d.getFullYear()}`
    return `${months[d.getMonth()]} ${d.getFullYear()}`
  }

  // ── Detail view ────────────────────────────────────────────────────────────

  if (selectedPeriod) {
    const items = periodDetail?.items || []
    const totalNet = items.reduce((s: number, i: any) => s + i.netAmount, 0)
    const totalGross = items.reduce((s: number, i: any) => s + i.grossAmount, 0)
    const totalDeductions = items.reduce((s: number, i: any) => s + i.absenceDeduction + i.lateDeduction + i.otherDeductions, 0)
    const totalBonus = items.reduce((s: number, i: any) => s + i.overtimeBonus + i.otherBonuses, 0)
    const currency = periodDetail?.currency || selectedPeriod.currency || 'USD'

    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => { setSelectedPeriod(null); setPeriodDetail(null) }}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <h2 className="text-xl font-bold">{selectedPeriod.name}</h2>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <Badge variant="outline" className={STATUS_STYLES[selectedPeriod.status]}>
                {STATUS_LABELS[selectedPeriod.status]}
              </Badge>
              <span className="text-sm text-muted-foreground">{FREQUENCY_LABELS[selectedPeriod.frequency]}</span>
              <span className="text-sm text-muted-foreground">
                {selectedPeriod.startDate} → {selectedPeriod.endDate}
              </span>
            </div>
          </div>
          <div className="flex gap-2">
            {selectedPeriod.status === 'draft' && (
              <Button onClick={handleCalculate} disabled={calculating} className="bg-emerald-600 hover:bg-emerald-700 gap-2">
                <Calculator className="h-4 w-4" />
                {calculating ? 'Calculando...' : 'Calcular Nómina'}
              </Button>
            )}
            {selectedPeriod.status === 'draft' && items.length > 0 && (
              <Button onClick={() => handleStatusChange('approved')} variant="outline" className="gap-2">
                <CheckCircle2 className="h-4 w-4 text-amber-600" /> Aprobar
              </Button>
            )}
            {selectedPeriod.status === 'approved' && (
              <Button onClick={() => handleStatusChange('paid')} className="bg-green-600 hover:bg-green-700 gap-2">
                <Banknote className="h-4 w-4" /> Marcar como Pagado
              </Button>
            )}
          </div>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">Total Bruto</p>
              <p className="text-xl font-bold text-gray-800">{formatCurrency(totalGross, currency)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">Deducciones</p>
              <p className="text-xl font-bold text-red-600">-{formatCurrency(totalDeductions, currency)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">Horas Extra</p>
              <p className="text-xl font-bold text-emerald-600">+{formatCurrency(totalBonus, currency)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">Total Neto a Pagar</p>
              <p className="text-2xl font-bold text-emerald-700">{formatCurrency(totalNet, currency)}</p>
            </CardContent>
          </Card>
        </div>

        {/* Items table */}
        {loadingDetail ? (
          <Card><CardContent className="p-6"><Skeleton className="h-40 w-full" /></CardContent></Card>
        ) : items.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <Calculator className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
              <p className="font-medium text-muted-foreground">Sin datos calculados</p>
              <p className="text-sm text-muted-foreground mt-1">Haz clic en "Calcular Nómina" para generar los datos de este período</p>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Users className="h-4 w-4" /> Detalle por Empleado ({items.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0 overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/30">
                    <TableHead>Empleado</TableHead>
                    <TableHead>Cargo</TableHead>
                    <TableHead className="text-center">Días\nTrabajados</TableHead>
                    <TableHead className="text-center">Días\nFalta</TableHead>
                    <TableHead className="text-center">Min.\nRetardo</TableHead>
                    <TableHead className="text-center">Hrs.\nExtra</TableHead>
                    <TableHead className="text-right">Salario Base</TableHead>
                    <TableHead className="text-right text-red-600">Deduc.</TableHead>
                    <TableHead className="text-right text-emerald-600">Bonus</TableHead>
                    <TableHead className="text-right font-bold">Neto</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((item: any) => (
                    <TableRow key={item.id} className="hover:bg-muted/20">
                      <TableCell className="font-medium">
                        <p>{item.employee.firstName} {item.employee.lastName}</p>
                        {item.employee.employeeNumber && (
                          <p className="text-xs text-muted-foreground font-mono">#{item.employee.employeeNumber}</p>
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {item.employee.position?.name || '-'}
                      </TableCell>
                      <TableCell className="text-center">
                        <span className="font-mono">{item.daysWorked}</span>
                      </TableCell>
                      <TableCell className="text-center">
                        {item.daysAbsent > 0 ? (
                          <span className="text-red-600 font-mono font-semibold">{item.daysAbsent}</span>
                        ) : <span className="text-muted-foreground">0</span>}
                      </TableCell>
                      <TableCell className="text-center">
                        {item.lateMinutes > 0 ? (
                          <span className="text-amber-600 font-mono">{item.lateMinutes}</span>
                        ) : <span className="text-muted-foreground">0</span>}
                      </TableCell>
                      <TableCell className="text-center">
                        {item.overtimeHours > 0 ? (
                          <span className="text-emerald-600 font-mono">{item.overtimeHours.toFixed(1)}</span>
                        ) : <span className="text-muted-foreground">0</span>}
                      </TableCell>
                      <TableCell className="text-right font-mono text-sm">
                        {formatCurrency(item.baseSalary, item.currency)}
                      </TableCell>
                      <TableCell className="text-right font-mono text-sm text-red-600">
                        {item.absenceDeduction + item.lateDeduction + item.otherDeductions > 0
                          ? `-${formatCurrency(item.absenceDeduction + item.lateDeduction + item.otherDeductions, item.currency)}`
                          : '-'
                        }
                      </TableCell>
                      <TableCell className="text-right font-mono text-sm text-emerald-600">
                        {item.overtimeBonus + item.otherBonuses > 0
                          ? `+${formatCurrency(item.overtimeBonus + item.otherBonuses, item.currency)}`
                          : '-'
                        }
                      </TableCell>
                      <TableCell className="text-right font-mono font-bold text-emerald-700">
                        {formatCurrency(item.netAmount, item.currency)}
                      </TableCell>
                    </TableRow>
                  ))}
                  {/* Total row */}
                  <TableRow className="bg-muted/50 font-bold">
                    <TableCell colSpan={6} className="text-right text-sm">TOTAL</TableCell>
                    <TableCell className="text-right font-mono">{formatCurrency(totalGross, currency)}</TableCell>
                    <TableCell className="text-right font-mono text-red-600">-{formatCurrency(totalDeductions, currency)}</TableCell>
                    <TableCell className="text-right font-mono text-emerald-600">+{formatCurrency(totalBonus, currency)}</TableCell>
                    <TableCell className="text-right font-mono text-emerald-700 text-base">{formatCurrency(totalNet, currency)}</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
      </div>
    )
  }

  // ── Period list ────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Nómina</h1>
          <p className="text-sm text-muted-foreground">Gestión de períodos y cálculo de salarios</p>
        </div>
        <Button onClick={() => setCreateOpen(true)} className="bg-emerald-600 hover:bg-emerald-700 gap-2">
          <Plus className="h-4 w-4" /> Nuevo Período
        </Button>
      </div>

      {/* List */}
      {loading ? (
        <div className="space-y-3">
          {[1,2,3].map(i => <Skeleton key={i} className="h-24 rounded-xl" />)}
        </div>
      ) : periods.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Banknote className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
            <p className="font-medium text-muted-foreground">Sin períodos de nómina</p>
            <p className="text-sm text-muted-foreground mt-1">Crea tu primer período para comenzar a calcular salarios</p>
            <Button onClick={() => setCreateOpen(true)} className="mt-4 bg-emerald-600 hover:bg-emerald-700">
              <Plus className="h-4 w-4 mr-2" /> Crear Período
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {periods.map((period) => (
            <Card key={period.id} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => loadDetail(period)}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold">{period.name}</h3>
                      <Badge variant="outline" className={cn('text-xs', STATUS_STYLES[period.status])}>
                        {STATUS_LABELS[period.status]}
                      </Badge>
                      <Badge variant="secondary" className="text-xs">{FREQUENCY_LABELS[period.frequency]}</Badge>
                    </div>
                    <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground flex-wrap">
                      <span>📅 {period.startDate} → {period.endDate}</span>
                      <span>👥 {period._count?.items || 0} empleados</span>
                      {period.totalAmount > 0 && (
                        <span className="font-medium text-emerald-700">
                          💰 {formatCurrency(period.totalAmount, period.currency)}
                        </span>
                      )}
                    </div>
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground shrink-0" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Nuevo Período de Nómina</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1">
              <Label>Frecuencia de pago</Label>
              <Select value={form.frequency} onValueChange={(v) => {
                const name = autoName(v, form.startDate)
                setForm({ ...form, frequency: v, name: name || form.name })
              }}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="weekly">📅 Semanal</SelectItem>
                  <SelectItem value="biweekly">📆 Quincenal</SelectItem>
                  <SelectItem value="monthly">🗓️ Mensual</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Fecha inicio *</Label>
                <Input type="date" value={form.startDate} onChange={(e) => {
                  const name = autoName(form.frequency, e.target.value)
                  setForm({ ...form, startDate: e.target.value, name: name || form.name })
                }} />
              </div>
              <div className="space-y-1">
                <Label>Fecha fin *</Label>
                <Input type="date" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} />
              </div>
            </div>
            <div className="space-y-1">
              <Label>Nombre del período *</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Quincena 1 - Abril 2025" />
            </div>
            <div className="space-y-1">
              <Label>Moneda</Label>
              <Select value={form.currency} onValueChange={(v) => setForm({ ...form, currency: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent className="max-h-56">
                  {CURRENCIES.map((c) => (
                    <SelectItem key={c.code} value={c.code}>
                      <span className="font-mono font-semibold">{c.code}</span> · {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="p-3 bg-muted rounded-lg text-xs text-muted-foreground space-y-1">
              <p className="font-medium text-foreground">📌 ¿Cómo funciona?</p>
              <p>1. Crea el período con fechas de inicio y fin</p>
              <p>2. Haz clic en <strong>"Calcular Nómina"</strong> — el sistema analiza la asistencia automáticamente</p>
              <p>3. Revisa los resultados, ajusta si es necesario</p>
              <p>4. Aprueba y marca como <strong>Pagado</strong></p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancelar</Button>
            <Button onClick={handleCreate} disabled={saving} className="bg-emerald-600 hover:bg-emerald-700">
              {saving ? 'Creando...' : 'Crear Período'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
