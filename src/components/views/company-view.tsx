'use client'

import { useEffect, useState, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'
import {
  Building2, MapPin, Globe, Phone, Mail, Edit, Save, X,
  Hash,
} from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { useAppStore } from '@/store/app-store'
import type { Company } from '@/lib/types'

const authHeaders = () => ({
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${localStorage.getItem('siga_token')}`,
})

export function CompanyView() {
  const [company, setCompany] = useState<Company | null>(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    name: '',
    taxId: '',
    logo: '',
    address: '',
    city: '',
    state: '',
    country: 'México',
    phone: '',
    email: '',
    website: '',
  })
  const { setCompany: setStoreCompany } = useAppStore()

  const fetchCompany = useCallback(async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/company', { headers: authHeaders() })
      if (!res.ok) throw new Error('Error al cargar empresa')
      const data = await res.json()
      setCompany(data)
      setForm({
        name: data.name || '',
        taxId: data.taxId || '',
        logo: data.logo || '',
        address: data.address || '',
        city: data.city || '',
        state: data.state || '',
        country: data.country || 'México',
        phone: data.phone || '',
        email: data.email || '',
        website: data.website || '',
      })
      setStoreCompany(data.name, data.logo || '')
    } catch (error: any) {
      toast.error(error.message)
    } finally {
      setLoading(false)
    }
  }, [setStoreCompany])

  useEffect(() => {
    fetchCompany()
  }, [fetchCompany])

  const startEdit = () => {
    setEditing(true)
  }

  const cancelEdit = () => {
    if (company) {
      setForm({
        name: company.name || '',
        taxId: company.taxId || '',
        logo: company.logo || '',
        address: company.address || '',
        city: company.city || '',
        state: company.state || '',
        country: company.country || 'México',
        phone: company.phone || '',
        email: company.email || '',
        website: company.website || '',
      })
    }
    setEditing(false)
  }

  const handleSave = async () => {
    if (!form.name.trim()) {
      toast.error('El nombre de la empresa es requerido')
      return
    }
    if (!company) return

    try {
      setSaving(true)
      const res = await fetch('/api/company', {
        method: 'PUT',
        headers: authHeaders(),
        body: JSON.stringify({ ...form }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Error al guardar')
      }
      toast.success('Empresa actualizada correctamente')
      setEditing(false)
      fetchCompany()
    } catch (error: any) {
      toast.error(error.message)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Building2 className="h-4 w-4" />
          <span>Cargando...</span>
        </div>
        <Card>
          <CardContent className="p-6 space-y-4">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-4 w-64" />
            <Skeleton className="h-4 w-56" />
            <Skeleton className="h-4 w-48" />
            <Skeleton className="h-4 w-40" />
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!company) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Building2 className="h-4 w-4" />
          <span>Configuración de la empresa</span>
        </div>
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Building2 className="h-12 w-12 text-muted-foreground/30 mb-4" />
            <p className="text-muted-foreground text-sm">No se encontró información de la empresa</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Building2 className="h-4 w-4" />
          <span>Configuración de la empresa</span>
        </div>
        {!editing ? (
          <Button variant="outline" size="sm" className="gap-2" onClick={startEdit}>
            <Edit className="h-4 w-4" />
            Editar
          </Button>
        ) : (
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="gap-2" onClick={cancelEdit}>
              <X className="h-4 w-4" />
              Cancelar
            </Button>
            <Button size="sm" className="gap-2" onClick={handleSave} disabled={saving}>
              <Save className="h-4 w-4" />
              {saving ? 'Guardando...' : 'Guardar'}
            </Button>
          </div>
        )}
      </div>

      {/* Company Info Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Información de la Empresa</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Logo & Name */}
          <div className="flex items-center gap-4">
            {(form.logo || company.logo) && !editing ? (
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-muted overflow-hidden">
                <img
                  src={company.logo || form.logo}
                  alt="Logo"
                  className="h-12 w-12 object-contain"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none'
                  }}
                />
              </div>
            ) : editing ? (
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-muted overflow-hidden">
                {(form.logo || company.logo) && (
                  <img
                    src={form.logo}
                    alt="Logo preview"
                    className="h-12 w-12 object-contain"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none'
                    }}
                  />
                )}
              </div>
            ) : (
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-emerald-50">
                <Building2 className="h-8 w-8 text-emerald-600" />
              </div>
            )}
            {editing ? (
              <div className="flex-1 space-y-2">
                <Label htmlFor="c-name">Nombre de la Empresa *</Label>
                <Input
                  id="c-name"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="max-w-md"
                />
              </div>
            ) : (
              <div>
                <h2 className="text-xl font-semibold">{company.name}</h2>
                <Badge variant="outline" className="mt-1 border-emerald-500/50 text-emerald-600 bg-emerald-50 text-xs">
                  Activa
                </Badge>
              </div>
            )}
          </div>

          <Separator />

          {/* Details Grid */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {/* Tax ID */}
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <Hash className="h-3.5 w-3.5" />
                RFC / Tax ID
              </div>
              {editing ? (
                <Input
                  value={form.taxId}
                  onChange={(e) => setForm({ ...form, taxId: e.target.value })}
                  className="h-9"
                  placeholder="XAXX010101000"
                />
              ) : (
                <p className="text-sm">{company.taxId || 'No especificado'}</p>
              )}
            </div>

            {/* Logo URL */}
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <Globe className="h-3.5 w-3.5" />
                URL del Logo
              </div>
              {editing ? (
                <Input
                  value={form.logo}
                  onChange={(e) => setForm({ ...form, logo: e.target.value })}
                  className="h-9"
                  placeholder="https://ejemplo.com/logo.png"
                />
              ) : (
                <p className="text-sm truncate">{company.logo || 'No especificado'}</p>
              )}
            </div>

            {/* Address */}
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <MapPin className="h-3.5 w-3.5" />
                Dirección
              </div>
              {editing ? (
                <Input
                  value={form.address}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                  className="h-9"
                  placeholder="Calle, número"
                />
              ) : (
                <p className="text-sm">{company.address || 'No especificada'}</p>
              )}
            </div>

            {/* City */}
            <div className="space-y-1.5">
              <Label className="text-sm font-medium text-muted-foreground">Ciudad</Label>
              {editing ? (
                <Input
                  value={form.city}
                  onChange={(e) => setForm({ ...form, city: e.target.value })}
                  className="h-9"
                  placeholder="Ciudad"
                />
              ) : (
                <p className="text-sm">{company.city || 'No especificada'}</p>
              )}
            </div>

            {/* State */}
            <div className="space-y-1.5">
              <Label className="text-sm font-medium text-muted-foreground">Estado</Label>
              {editing ? (
                <Input
                  value={form.state}
                  onChange={(e) => setForm({ ...form, state: e.target.value })}
                  className="h-9"
                  placeholder="Estado"
                />
              ) : (
                <p className="text-sm">{company.state || 'No especificado'}</p>
              )}
            </div>

            {/* Country */}
            <div className="space-y-1.5">
              <Label className="text-sm font-medium text-muted-foreground">País</Label>
              {editing ? (
                <Input
                  value={form.country}
                  onChange={(e) => setForm({ ...form, country: e.target.value })}
                  className="h-9"
                />
              ) : (
                <p className="text-sm">{company.country || 'México'}</p>
              )}
            </div>

            {/* Phone */}
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <Phone className="h-3.5 w-3.5" />
                Teléfono
              </div>
              {editing ? (
                <Input
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className="h-9"
                  placeholder="+52 55 1234 5678"
                />
              ) : (
                <p className="text-sm">{company.phone || 'No especificado'}</p>
              )}
            </div>

            {/* Email */}
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <Mail className="h-3.5 w-3.5" />
                Email
              </div>
              {editing ? (
                <Input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="h-9"
                  placeholder="contacto@empresa.com"
                />
              ) : (
                <p className="text-sm">{company.email || 'No especificado'}</p>
              )}
            </div>

            {/* Website */}
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <Globe className="h-3.5 w-3.5" />
                Sitio Web
              </div>
              {editing ? (
                <Input
                  value={form.website}
                  onChange={(e) => setForm({ ...form, website: e.target.value })}
                  className="h-9"
                  placeholder="https://www.empresa.com"
                />
              ) : (
                <p className="text-sm">{company.website || 'No especificado'}</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card className="border-red-200">
        <CardHeader>
          <CardTitle className="text-base text-red-600">Zona de Peligro</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            Esta acción es irreversible. Todos los datos asociados a la empresa serán eliminados permanentemente.
          </p>
          <Button variant="outline" className="border-red-300 text-red-600 hover:bg-red-50 hover:text-red-700" disabled>
            Eliminar Empresa
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
