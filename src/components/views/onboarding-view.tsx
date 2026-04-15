'use client'

import React, { useState } from 'react'
import { useAppStore } from '@/store/app-store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { 
  Building2, Users, Clock, MapPin, CheckCircle2, 
  ChevronRight, ChevronLeft, ArrowRight, Building, UserPlus
} from 'lucide-react'
import { toast } from 'sonner'

const STEPS = [
  { id: 1, title: 'Sucursal', icon: Building2, description: '¿Dónde trabajas?' },
  { id: 2, title: 'Departamentos', icon: MapPin, description: 'Organiza tu empresa' },
  { id: 3, title: 'Puestos', icon: Users, description: 'Define posiciones' },
  { id: 4, title: 'Turnos', icon: Clock, description: 'Horarios de trabajo' },
  { id: 5, title: 'Empleados', icon: UserPlus, description: 'Añade tu equipo' },
]

export function OnboardingView() {
  const navigate = useAppStore((s) => s.navigate)
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  
  // Step 1: Branch
  const [branchName, setBranchName] = useState('')
  const [branchAddress, setBranchAddress] = useState('')
  const [branchCity, setBranchCity] = useState('')
  
  // Step 2: Departments
  const [departments, setDepartments] = useState<string[]>(['Administración'])
  
  // Step 3: Positions
  const [positions, setPositions] = useState<{name: string, department: string}[]>([])
  
  // Step 4: Shifts
  const [shifts, setShifts] = useState<{name: string, start: string, end: string}[]>([])
  
  // Step 5: Employees
  const [employees, setEmployees] = useState<{name: string, email: string, position: string, shift: string}[]>([])

  const progress = (step / STEPS.length) * 100

  const handleNext = () => {
    if (step < STEPS.length) {
      setStep(step + 1)
    }
  }

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1)
    }
  }

  const handleFinish = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/onboarding/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          branch: { name: branchName, address: branchAddress, city: branchCity },
          departments,
          positions,
          shifts,
          employees,
        }),
      })
      
      if (!res.ok) throw new Error('Error al guardar')
      
      toast.success('¡Configuración completada!')
      navigate('dashboard')
    } catch (e) {
      toast.error('Error al guardar. Intenta de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  const addDepartment = () => setDepartments([...departments, ''])
  const updateDepartment = (i: number, val: string) => {
    const updated = [...departments]
    updated[i] = val
    setDepartments(updated)
  }
  const removeDepartment = (i: number) => setDepartments(departments.filter((_, idx) => idx !== i))

  const addPosition = () => setPositions([...positions, { name: '', department: departments[0] || '' }])
  const updatePosition = (i: number, field: string, val: string) => {
    const updated = [...positions]
    // @ts-ignore
    updated[i][field] = val
    setPositions(updated)
  }
  const removePosition = (i: number) => setPositions(positions.filter((_, idx) => idx !== i))

  const addShift = () => setShifts([...shifts, { name: 'Turno Matutino', start: '09:00', end: '18:00' }])
  const updateShift = (i: number, field: string, val: string) => {
    const updated = [...shifts]
    // @ts-ignore
    updated[i][field] = val
    setShifts(updated)
  }
  const removeShift = (i: number) => setShifts(shifts.filter((_, idx) => idx !== i))

  const addEmployee = () => setEmployees([...employees, { name: '', email: '', position: positions[0]?.name || '', shift: shifts[0]?.name || '' }])
  const updateEmployee = (i: number, field: string, val: string) => {
    const updated = [...employees]
    // @ts-ignore
    updated[i][field] = val
    setEmployees(updated)
  }
  const removeEmployee = (i: number) => setEmployees(employees.filter((_, idx) => idx !== i))

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 p-4 md:p-8">
      <div className="max-w-2xl mx-auto">
        {/* Progress */}
        <div className="mb-8">
          <div className="flex justify-between mb-2">
            <span className="text-sm font-medium">Paso {step} de {STEPS.length}</span>
            <span className="text-sm text-muted-foreground">{Math.round(progress)}%</span>
          </div>
          <Progress value={progress} className="h-2" />
          <div className="flex justify-between mt-4">
            {STEPS.map((s) => (
              <div key={s.id} className={`flex flex-col items-center ${step >= s.id ? 'text-primary' : 'text-muted-foreground'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs ${step >= s.id ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                  {step > s.id ? <CheckCircle2 className="w-4 h-4" /> : s.id}
                </div>
                <span className="text-xs mt-1 hidden md:block">{s.title}</span>
              </div>
            ))}
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {STEPS[step - 1] ? React.createElement(STEPS[step - 1].icon, { className: "w-5 h-5" }) : null}
              {STEPS[step - 1]?.title || 'Configuración'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Step 1: Branch */}
            {step === 1 && (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">¿Dónde está tu lugar de trabajo principal?</p>
                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <Label>Nombre de la sucursal</Label>
                    <Input 
                      placeholder="Oficina Principal" 
                      value={branchName}
                      onChange={(e) => setBranchName(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Dirección</Label>
                    <Input 
                      placeholder="Av. Principal 123" 
                      value={branchAddress}
                      onChange={(e) => setBranchAddress(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Ciudad</Label>
                    <Input 
                      placeholder="Ciudad de México" 
                      value={branchCity}
                      onChange={(e) => setBranchCity(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Departments */}
            {step === 2 && (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">¿Qué departamentos tiene tu empresa?</p>
                {departments.map((dept, i) => (
                  <div key={i} className="flex gap-2">
                    <Input 
                      value={dept}
                      onChange={(e) => updateDepartment(i, e.target.value)}
                      placeholder="Nombre del departamento"
                    />
                    {departments.length > 1 && (
                      <Button variant="outline" size="icon" onClick={() => removeDepartment(i)}>✕</Button>
                    )}
                  </div>
                ))}
                <Button variant="outline" onClick={addDepartment} className="w-full">
                  + Añadir departamento
                </Button>
              </div>
            )}

            {/* Step 3: Positions */}
            {step === 3 && (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">¿Qué puestos hay en cada departamento?</p>
                {positions.length === 0 && (
                  <div className="text-center py-4 text-muted-foreground">
                    <p>No hay puestos. Añade departamentos primero.</p>
                  </div>
                )}
                {positions.map((pos, i) => (
                  <div key={i} className="flex gap-2">
                    <Input 
                      value={pos.name}
                      onChange={(e) => updatePosition(i, 'name', e.target.value)}
                      placeholder="Nombre del puesto"
                      className="flex-1"
                    />
                    <select 
                      value={pos.department}
                      onChange={(e) => updatePosition(i, 'department', e.target.value)}
                      className="flex-1 px-3 py-2 border rounded-md bg-background"
                    >
                      {departments.map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                    <Button variant="outline" size="icon" onClick={() => removePosition(i)}>✕</Button>
                  </div>
                ))}
                <Button variant="outline" onClick={addPosition} className="w-full">
                  + Añadir puesto
                </Button>
              </div>
            )}

            {/* Step 4: Shifts */}
            {step === 4 && (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">¿Cuáles son los horarios de trabajo?</p>
                {shifts.map((shift, i) => (
                  <div key={i} className="flex gap-2 items-center">
                    <Input 
                      value={shift.name}
                      onChange={(e) => updateShift(i, 'name', e.target.value)}
                      placeholder="Nombre del turno"
                      className="flex-1"
                    />
                    <Input 
                      type="time"
                      value={shift.start}
                      onChange={(e) => updateShift(i, 'start', e.target.value)}
                      className="w-24"
                    />
                    <span className="text-muted-foreground">a</span>
                    <Input 
                      type="time"
                      value={shift.end}
                      onChange={(e) => updateShift(i, 'end', e.target.value)}
                      className="w-24"
                    />
                    <Button variant="outline" size="icon" onClick={() => removeShift(i)}>✕</Button>
                  </div>
                ))}
                <Button variant="outline" onClick={addShift} className="w-full">
                  + Añadir turno
                </Button>
              </div>
            )}

            {/* Step 5: Employees */}
            {step === 5 && (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">¿Quiénes trabajan en tu empresa?</p>
                {employees.length === 0 && (
                  <div className="text-center py-4 text-muted-foreground">
                    <p>Sin empleados. Puedes añadir después.</p>
                  </div>
                )}
                {employees.map((emp, i) => (
                  <div key={i} className="flex gap-2 flex-wrap">
                    <Input 
                      value={emp.name}
                      onChange={(e) => updateEmployee(i, 'name', e.target.value)}
                      placeholder="Nombre completo"
                      className="flex-1 min-w-[150px]"
                    />
                    <Input 
                      type="email"
                      value={emp.email}
                      onChange={(e) => updateEmployee(i, 'email', e.target.value)}
                      placeholder="Email"
                      className="flex-1 min-w-[150px]"
                    />
                    <select 
                      value={emp.position}
                      onChange={(e) => updateEmployee(i, 'position', e.target.value)}
                      className="px-3 py-2 border rounded-md bg-background"
                    >
                      <option value="">Puesto</option>
                      {positions.map(p => <option key={p.name} value={p.name}>{p.name}</option>)}
                    </select>
                    <select 
                      value={emp.shift}
                      onChange={(e) => updateEmployee(i, 'shift', e.target.value)}
                      className="px-3 py-2 border rounded-md bg-background"
                    >
                      <option value="">Turno</option>
                      {shifts.map(s => <option key={s.name} value={s.name}>{s.name}</option>)}
                    </select>
                    <Button variant="outline" size="icon" onClick={() => removeEmployee(i)}>✕</Button>
                  </div>
                ))}
                <Button variant="outline" onClick={addEmployee} className="w-full">
                  + Añadir empleado
                </Button>
              </div>
            )}
          </CardContent>

          {/* Navigation */}
          <div className="flex justify-between p-6 pt-0">
            <Button 
              variant="outline" 
              onClick={step === 1 ? () => navigate('dashboard') : handleBack}
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              {step === 1 ? 'Saltar' : 'Atrás'}
            </Button>
            <Button onClick={step === STEPS.length ? handleFinish : handleNext} disabled={loading}>
              {loading ? 'Guardando...' : step === STEPS.length ? 'Finalizar' : 'Siguiente'}
              {step !== STEPS.length && <ChevronRight className="w-4 h-4 ml-1" />}
            </Button>
          </div>
        </Card>
      </div>
    </div>
  )
}