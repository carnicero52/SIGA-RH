'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Toaster, toast } from 'sonner'
import { Briefcase, MapPin, Clock, DollarSign, Send, ArrowLeft, CheckCircle2, Building2, ChevronRight } from 'lucide-react'

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

interface Company {
  id: string
  name: string
  slogan: string | null
  logo: string | null
  brandColor: string
}

interface Vacancy {
  id: string
  title: string
  description: string | null
  requirements: string | null
  salaryMin: number | null
  salaryMax: number | null
  employmentType: string
  location: string | null
  vacanciesCount: number
  department: { name: string } | null
  position: { name: string } | null
  company: Company
  createdAt: string
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

const employmentTypeLabels: Record<string, string> = {
  full_time: 'Tiempo Completo',
  part_time: 'Medio Tiempo',
  contract: 'Por Contrato',
  internship: 'Pasantía',
  temporary: 'Temporal',
}

function formatSalary(min: number | null, max: number | null): string | null {
  if (!min && !max) return null
  const fmt = (n: number) => new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 }).format(n)
  if (min && max) return `${fmt(min)} – ${fmt(max)}`
  if (min) return `Desde ${fmt(min)}`
  if (max) return `Hasta ${fmt(max)}`
  return null
}

// ─────────────────────────────────────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────────────────────────────────────

export default function CareersPage() {
  const [company, setCompany] = useState<Company | null>(null)
  const [vacancies, setVacancies] = useState<Vacancy[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<Vacancy | null>(null)
  const [applying, setApplying] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  // Pre-fill vacantId from URL param (?vacancy=ID)
  const [form, setForm] = useState({
    firstName: '', lastName: '', email: '', phone: '', coverLetter: '', cvUrl: '',
  })

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const companyId = params.get('companyId') || ''
    const vacancyId = params.get('vacancy')
    loadData(vacancyId || undefined)
  }, [])

  async function loadData(preselectedId?: string) {
    try {
      const [companyRes, vacanciesRes] = await Promise.all([
        fetch('/api/public/company-info?companyId=' + companyId),
        fetch('/api/public/vacancies?companyId=' + companyId),
      ])
      const companyData: Company = await companyRes.json()
      const vacanciesData: Vacancy[] = await vacanciesRes.json()
      setCompany(companyData)
      setVacancies(Array.isArray(vacanciesData) ? vacanciesData : [])

      if (preselectedId) {
        const found = vacanciesData.find((v: Vacancy) => v.id === preselectedId)
        if (found) setSelected(found)
      }
    } catch {
      toast.error('Error al cargar las vacantes')
    } finally {
      setLoading(false)
    }
  }

  async function handleApply() {
    if (!selected) return
    if (!form.firstName.trim() || !form.lastName.trim() || !form.email.trim()) {
      toast.error('Nombre, apellido y email son obligatorios')
      return
    }

    setApplying(true)
    try {
      const res = await fetch('/api/public/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ vacantId: selected.id, ...form }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Error al enviar')
      setSubmitted(true)
      toast.success('¡Postulación enviada!')
    } catch (e: any) {
      toast.error(e.message || 'Error al enviar la postulación')
    } finally {
      setApplying(false)
    }
  }

  const resetForm = () => {
    setForm({ firstName: '', lastName: '', email: '', phone: '', coverLetter: '', cvUrl: '' })
    setSubmitted(false)
    setSelected(null)
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────────────────────

  const brandColor = company?.brandColor || '#F59E0B'

  return (
    <div className="min-h-screen bg-gray-50">
      <Toaster richColors position="top-center" />

      {/* Header */}
      <header className="text-white shadow-md" style={{ background: `linear-gradient(135deg, ${brandColor}, ${brandColor}cc)` }}>
        <div className="max-w-4xl mx-auto px-4 py-6 flex items-center gap-4">
          {selected && !submitted && (
            <button onClick={() => setSelected(null)} className="text-white/80 hover:text-white p-1 rounded">
              <ArrowLeft className="h-5 w-5" />
            </button>
          )}
          {company?.logo && (
            <img src={company.logo} alt={company.name} className="h-12 w-12 object-contain rounded-lg bg-white/10 p-1" />
          )}
          {!company?.logo && (
            <div className="h-12 w-12 rounded-lg bg-white/20 flex items-center justify-center">
              <Building2 className="h-6 w-6 text-white" />
            </div>
          )}
          <div>
            <h1 className="text-xl font-bold">{company?.name || 'Bolsa de Trabajo'}</h1>
            {company?.slogan && <p className="text-sm text-white/80">{company.slogan}</p>}
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-8">

        {/* Loading */}
        {loading && (
          <div className="flex items-center justify-center py-20">
            <div className="h-10 w-10 rounded-full border-4 border-gray-200 animate-spin" style={{ borderTopColor: brandColor }} />
          </div>
        )}

        {/* ── VACANCY LIST ── */}
        {!loading && !selected && (
          <>
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-800">Vacantes Disponibles</h2>
              <p className="text-gray-500 mt-1">{vacancies.length} {vacancies.length === 1 ? 'posición abierta' : 'posiciones abiertas'}</p>
            </div>

            {vacancies.length === 0 ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <Briefcase className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 font-medium">No hay vacantes disponibles en este momento</p>
                  <p className="text-gray-400 text-sm mt-1">Vuelve pronto para ver nuevas oportunidades</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {vacancies.map((vacancy) => {
                  const salary = formatSalary(vacancy.salaryMin, vacancy.salaryMax)
                  return (
                    <Card key={vacancy.id} className="hover:shadow-md transition-shadow cursor-pointer border-l-4" style={{ borderLeftColor: brandColor }} onClick={() => setSelected(vacancy)}>
                      <CardContent className="p-5">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 flex-wrap mb-1">
                              <h3 className="font-semibold text-gray-800 text-lg">{vacancy.title}</h3>
                              {vacancy.vacanciesCount > 1 && (
                                <Badge variant="secondary" className="text-xs">{vacancy.vacanciesCount} plazas</Badge>
                              )}
                            </div>
                            <div className="flex items-center flex-wrap gap-3 text-sm text-gray-500">
                              {vacancy.department && (
                                <span className="flex items-center gap-1">
                                  <Building2 className="h-3.5 w-3.5" /> {vacancy.department.name}
                                </span>
                              )}
                              {vacancy.location && (
                                <span className="flex items-center gap-1">
                                  <MapPin className="h-3.5 w-3.5" /> {vacancy.location}
                                </span>
                              )}
                              <span className="flex items-center gap-1">
                                <Clock className="h-3.5 w-3.5" /> {employmentTypeLabels[vacancy.employmentType] || vacancy.employmentType}
                              </span>
                              {salary && (
                                <span className="flex items-center gap-1 font-medium text-emerald-700">
                                  <DollarSign className="h-3.5 w-3.5" /> {salary}
                                </span>
                              )}
                            </div>
                            {vacancy.description && (
                              <p className="text-sm text-gray-600 mt-2 line-clamp-2">{vacancy.description}</p>
                            )}
                          </div>
                          <ChevronRight className="h-5 w-5 text-gray-400 shrink-0 mt-1" />
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            )}
          </>
        )}

        {/* ── VACANCY DETAIL + APPLICATION FORM ── */}
        {!loading && selected && !submitted && (
          <div className="space-y-6">
            {/* Vacancy details */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-start gap-3">
                  <div className="h-10 w-10 rounded-lg flex items-center justify-center text-white shrink-0" style={{ background: brandColor }}>
                    <Briefcase className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-800">{selected.title}</h2>
                    <div className="flex flex-wrap gap-2 mt-1">
                      <Badge variant="secondary">{employmentTypeLabels[selected.employmentType]}</Badge>
                      {selected.department && <Badge variant="outline">{selected.department.name}</Badge>}
                      {selected.location && (
                        <span className="text-sm text-gray-500 flex items-center gap-1">
                          <MapPin className="h-3.5 w-3.5" /> {selected.location}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {formatSalary(selected.salaryMin, selected.salaryMax) && (
                  <div className="flex items-center gap-2 text-emerald-700 font-medium">
                    <DollarSign className="h-4 w-4" />
                    {formatSalary(selected.salaryMin, selected.salaryMax)}
                  </div>
                )}
                {selected.description && (
                  <div>
                    <p className="text-sm font-semibold text-gray-700 mb-1">Descripción del puesto</p>
                    <p className="text-sm text-gray-600 whitespace-pre-wrap">{selected.description}</p>
                  </div>
                )}
                {selected.requirements && (
                  <div>
                    <Separator className="my-3" />
                    <p className="text-sm font-semibold text-gray-700 mb-1">Requisitos</p>
                    <p className="text-sm text-gray-600 whitespace-pre-wrap">{selected.requirements}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Application form */}
            <Card>
              <CardHeader>
                <h3 className="font-semibold text-lg">Aplicar a esta Vacante</h3>
                <p className="text-sm text-gray-500">Completa el formulario para enviar tu postulación</p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label>Nombre *</Label>
                    <Input value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} placeholder="Tu nombre" />
                  </div>
                  <div className="space-y-1">
                    <Label>Apellido *</Label>
                    <Input value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} placeholder="Tu apellido" />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label>Email *</Label>
                    <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="tu@email.com" />
                  </div>
                  <div className="space-y-1">
                    <Label>Teléfono</Label>
                    <Input type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="04XX-XXXXXXX" />
                  </div>
                </div>
                <div className="space-y-1">
                  <Label>URL de tu CV</Label>
                  <Input value={form.cvUrl} onChange={(e) => setForm({ ...form, cvUrl: e.target.value })} placeholder="https://drive.google.com/... o LinkedIn" />
                  <p className="text-xs text-gray-400">Comparte el enlace de tu CV en Google Drive, Dropbox, LinkedIn u otro servicio</p>
                </div>
                <div className="space-y-1">
                  <Label>Carta de presentación (opcional)</Label>
                  <Textarea
                    value={form.coverLetter}
                    onChange={(e) => setForm({ ...form, coverLetter: e.target.value })}
                    placeholder="Cuéntanos por qué eres el candidato ideal para esta posición..."
                    rows={4}
                  />
                </div>
                <Button
                  onClick={handleApply}
                  disabled={applying || !form.firstName.trim() || !form.lastName.trim() || !form.email.trim()}
                  className="w-full text-white"
                  style={{ background: brandColor }}
                  size="lg"
                >
                  {applying ? (
                    <><span className="animate-spin mr-2">⏳</span> Enviando...</>
                  ) : (
                    <><Send className="h-4 w-4 mr-2" /> Enviar Postulación</>
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>
        )}

        {/* ── SUCCESS ── */}
        {submitted && selected && (
          <Card className="border-emerald-300">
            <CardContent className="p-10 text-center flex flex-col items-center gap-5">
              <div className="h-20 w-20 rounded-full bg-emerald-100 flex items-center justify-center">
                <CheckCircle2 className="h-10 w-10 text-emerald-600" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-emerald-700">¡Postulación Enviada!</h2>
                <p className="text-gray-600 mt-2">Tu postulación para <strong>{selected.title}</strong> fue recibida.</p>
                <p className="text-gray-500 text-sm mt-1">Revisaremos tu solicitud y te contactaremos pronto al email: <strong>{form.email}</strong></p>
              </div>
              <Button onClick={resetForm} variant="outline" className="mt-2">
                Ver otras vacantes
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Footer */}
      <footer className="text-center text-xs text-gray-400 py-8 mt-8 border-t">
        {company?.name} — Portal de Empleo | Powered by SIGA-RH
      </footer>
    </div>
  )
}
