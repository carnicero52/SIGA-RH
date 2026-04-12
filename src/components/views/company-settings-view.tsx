'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import {
  Building2, Mail, MessageSquare, Bell, Send, TestTube, Save,
  Trash2, AlertTriangle, Image as ImageIcon, Globe,
} from 'lucide-react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { COUNTRY_LIST } from '@/lib/country-fields'
import { clearCountryCache } from '@/hooks/useCompanyCountry'
import { toast } from 'sonner'

function authHeaders() {
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${typeof window !== 'undefined' ? localStorage.getItem('siga_token') : ''}`,
  }
}

interface CompanySettings {
  id: string
  name: string
  slogan: string | null
  brandColor: string
  logo: string | null
  country: string
  smtpHost: string | null
  smtpPort: number | null
  smtpUser: string | null
  smtpPassword: string | null
  smtpFrom: string | null
  smtpEnabled: boolean
  telegramBotToken: string | null
  telegramChatId: string | null
  telegramEnabled: boolean
  dailyReportEnabled: boolean
  dailyReportTime: string
  dailyReportRecipients: string | null
}

const CLEAR_ITEMS = [
  { type: 'attendance', label: 'Registros de Asistencia', desc: 'Elimina todos los registros de entradas y salidas' },
  { type: 'incidents', label: 'Incidencias', desc: 'Elimina todas las incidencias registradas' },
  { type: 'notifications', label: 'Notificaciones', desc: 'Limpia el historial de notificaciones del sistema' },
  { type: 'candidates', label: 'Candidatos', desc: 'Elimina todos los candidatos de vacantes' },
  { type: 'contracts', label: 'Contratos', desc: 'Elimina todos los contratos generados' },
]

export function CompanySettingsView() {
  const [settings, setSettings] = useState<CompanySettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [testing, setTesting] = useState<string | null>(null)
  const [clearing, setClearing] = useState<string | null>(null)

  useEffect(() => { fetchSettings() }, [])

  async function fetchSettings() {
    try {
      const res = await fetch('/api/company', { headers: authHeaders() })
      const data = await res.json()
      setSettings(data)
    } catch {
      toast.error('Error al cargar configuración')
    } finally {
      setLoading(false)
    }
  }

  async function saveSettings(section: string) {
    if (!settings) return
    setSaving(true)
    try {
      const res = await fetch('/api/company', {
        method: 'PUT',
        headers: authHeaders(),
        body: JSON.stringify(settings),
      })
      if (res.ok) {
        clearCountryCache() // refresh country-specific fields in other views
        toast.success(`${section} guardado correctamente`)
      } else {
        const err = await res.json()
        throw new Error(err.error || 'Error al guardar')
      }
    } catch (e: any) {
      toast.error(e.message || 'Error al guardar configuración')
    } finally {
      setSaving(false)
    }
  }

  async function testEmail() {
    setTesting('email')
    try {
      const res = await fetch('/api/company/test-email', { method: 'POST', headers: authHeaders() })
      const data = await res.json()
      if (data.success) toast.success('Email de prueba enviado correctamente')
      else throw new Error(data.error)
    } catch (e: any) {
      toast.error(e.message || 'Error al enviar email de prueba')
    } finally { setTesting(null) }
  }

  async function testTelegram() {
    setTesting('telegram')
    try {
      const res = await fetch('/api/company/test-telegram', { method: 'POST', headers: authHeaders() })
      const data = await res.json()
      if (data.success) toast.success('Mensaje de Telegram enviado correctamente')
      else throw new Error(data.error || data.details)
    } catch (e: any) {
      toast.error(e.message || 'Error al enviar mensaje de Telegram')
    } finally { setTesting(null) }
  }

  async function clearData(type: string, label: string) {
    setClearing(type)
    try {
      const res = await fetch('/api/admin/clear', {
        method: 'DELETE',
        headers: authHeaders(),
        body: JSON.stringify({ type }),
      })
      const data = await res.json()
      if (data.success) {
        toast.success(`${data.deletedCount} registros de ${label.toLowerCase()} eliminados`)
      } else {
        throw new Error(data.error)
      }
    } catch (e: any) {
      toast.error(e.message || 'Error al eliminar')
    } finally {
      setClearing(null)
    }
  }

  if (loading) return <div className="p-8 text-center text-muted-foreground">Cargando configuración...</div>
  if (!settings) return <div className="p-8 text-center text-red-500">Error al cargar configuración</div>

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-6">
      <Tabs defaultValue="info" className="space-y-6">
        {/* Tab list — scrollable on mobile */}
        <TabsList className="flex flex-wrap h-auto gap-1 p-1">
          <TabsTrigger value="info" className="flex items-center gap-1.5 text-xs">
            <Building2 className="w-3.5 h-3.5" /> Empresa
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center gap-1.5 text-xs">
            <Mail className="w-3.5 h-3.5" /> SMTP
          </TabsTrigger>
          <TabsTrigger value="reports" className="flex items-center gap-1.5 text-xs">
            <Bell className="w-3.5 h-3.5" /> Reportes
          </TabsTrigger>
          <TabsTrigger value="integrations" className="flex items-center gap-1.5 text-xs">
            <MessageSquare className="w-3.5 h-3.5" /> Telegram
          </TabsTrigger>
          <TabsTrigger value="maintenance" className="flex items-center gap-1.5 text-xs text-red-600">
            <Trash2 className="w-3.5 h-3.5" /> Mantenimiento
          </TabsTrigger>
        </TabsList>

        {/* ── INFORMACIÓN ── */}
        <TabsContent value="info">
          <Card>
            <CardHeader>
              <CardTitle>Información de la Empresa</CardTitle>
              <CardDescription>Datos básicos y apariencia de la plataforma</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="grid gap-2">
                <Label>Nombre de la empresa *</Label>
                <Input
                  value={settings.name}
                  onChange={(e) => setSettings({ ...settings, name: e.target.value })}
                  placeholder="Mi Empresa S.A."
                />
              </div>

              <div className="grid gap-2">
                <Label>Eslogan / Descripción corta</Label>
                <Input
                  value={settings.slogan || ''}
                  onChange={(e) => setSettings({ ...settings, slogan: e.target.value })}
                  placeholder="Tu misión o eslogan corporativo"
                />
              </div>

              <div className="grid gap-2">
                <Label className="flex items-center gap-2">
                  <ImageIcon className="w-4 h-4" /> Logo de la empresa (URL)
                </Label>
                <Input
                  value={settings.logo || ''}
                  onChange={(e) => setSettings({ ...settings, logo: e.target.value })}
                  placeholder="https://mi-empresa.com/logo.png"
                />
                {settings.logo && (
                  <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                    <img
                      src={settings.logo}
                      alt="Logo preview"
                      className="h-12 w-12 object-contain rounded"
                      onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
                    />
                    <span className="text-xs text-muted-foreground truncate">{settings.logo}</span>
                  </div>
                )}
                <p className="text-xs text-muted-foreground">
                  Pega la URL directa de la imagen. También puedes usar servicios como{' '}
                  <a href="https://imgur.com" target="_blank" rel="noreferrer" className="underline">imgur.com</a>{' '}
                  para subir tu logo y obtener la URL.
                </p>
              </div>

              <div className="grid gap-2">
                <Label className="flex items-center gap-2">
                  <Globe className="w-4 h-4" /> País de operación
                </Label>
                <Select
                  value={settings.country || 'Venezuela'}
                  onValueChange={(v) => setSettings({ ...settings, country: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona un país" />
                  </SelectTrigger>
                  <SelectContent className="max-h-64">
                    {COUNTRY_LIST.map((c) => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Define qué documentos de identidad se solicitan a los empleados (Cédula, RIF, IVSS, etc.)
                </p>
              </div>

              <div className="grid gap-2">
                <Label>Color de marca</Label>
                <div className="flex gap-3 items-center">
                  <Input
                    type="color"
                    value={settings.brandColor}
                    onChange={(e) => setSettings({ ...settings, brandColor: e.target.value })}
                    className="w-16 h-10 p-1 cursor-pointer"
                  />
                  <Input
                    value={settings.brandColor}
                    onChange={(e) => setSettings({ ...settings, brandColor: e.target.value })}
                    className="font-mono w-32"
                    maxLength={7}
                  />
                  <div className="h-10 w-10 rounded-lg border" style={{ backgroundColor: settings.brandColor }} />
                </div>
              </div>

              <Button onClick={() => saveSettings('Información')} disabled={saving} className="bg-emerald-600 hover:bg-emerald-700">
                <Save className="w-4 h-4 mr-2" />
                {saving ? 'Guardando...' : 'Guardar cambios'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── SMTP ── */}
        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Configuración SMTP (Gmail)</span>
                <Switch
                  checked={settings.smtpEnabled}
                  onCheckedChange={(v) => setSettings({ ...settings, smtpEnabled: v })}
                />
              </CardTitle>
              <CardDescription>Envío de emails automáticos desde la plataforma</CardDescription>
            </CardHeader>
            <CardContent>
              <div className={!settings.smtpEnabled ? 'opacity-50 pointer-events-none' : ''}>
                <div className="grid gap-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label>Servidor SMTP</Label>
                      <Input value={settings.smtpHost || ''} onChange={(e) => setSettings({ ...settings, smtpHost: e.target.value })} placeholder="smtp.gmail.com" />
                    </div>
                    <div className="grid gap-2">
                      <Label>Puerto</Label>
                      <Input type="number" value={settings.smtpPort || ''} onChange={(e) => setSettings({ ...settings, smtpPort: Number(e.target.value) })} placeholder="465" />
                    </div>
                  </div>
                  <div className="grid gap-2">
                    <Label>Usuario (email)</Label>
                    <Input value={settings.smtpUser || ''} onChange={(e) => setSettings({ ...settings, smtpUser: e.target.value })} placeholder="tu-email@gmail.com" />
                  </div>
                  <div className="grid gap-2">
                    <Label>Contraseña de aplicación</Label>
                    <Input type="password" value={settings.smtpPassword || ''} onChange={(e) => setSettings({ ...settings, smtpPassword: e.target.value })} placeholder="xxxx xxxx xxxx xxxx" />
                    <p className="text-xs text-muted-foreground">Contraseña de aplicación de Google (16 caracteres)</p>
                  </div>
                  <div className="grid gap-2">
                    <Label>Email remitente (opcional)</Label>
                    <Input value={settings.smtpFrom || ''} onChange={(e) => setSettings({ ...settings, smtpFrom: e.target.value })} placeholder="SIGA-RH <noreply@gmail.com>" />
                  </div>
                </div>
                <div className="flex gap-3 mt-6">
                  <Button variant="outline" onClick={testEmail} disabled={testing === 'email'}>
                    <TestTube className="w-4 h-4 mr-2" />{testing === 'email' ? 'Enviando...' : 'Probar'}
                  </Button>
                  <Button onClick={() => saveSettings('SMTP')} disabled={saving} className="bg-emerald-600 hover:bg-emerald-700">
                    <Save className="w-4 h-4 mr-2" />Guardar
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── REPORTES ── */}
        <TabsContent value="reports">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Reporte Diario Automático</span>
                <Switch checked={settings.dailyReportEnabled} onCheckedChange={(v) => setSettings({ ...settings, dailyReportEnabled: v })} />
              </CardTitle>
              <CardDescription>Envía un resumen de asistencia cada día automáticamente</CardDescription>
            </CardHeader>
            <CardContent>
              <div className={!settings.dailyReportEnabled ? 'opacity-50 pointer-events-none' : ''}>
                <div className="grid gap-4">
                  <div className="grid gap-2">
                    <Label>Hora del reporte (hora Venezuela)</Label>
                    <Input type="time" value={settings.dailyReportTime} onChange={(e) => setSettings({ ...settings, dailyReportTime: e.target.value })} />
                  </div>
                  <div className="grid gap-2">
                    <Label>Destinatarios adicionales</Label>
                    <Input value={settings.dailyReportRecipients || ''} onChange={(e) => setSettings({ ...settings, dailyReportRecipients: e.target.value })} placeholder="email1@ejemplo.com, email2@ejemplo.com" />
                    <p className="text-xs text-muted-foreground">Separar múltiples emails con coma.</p>
                  </div>
                </div>
                <Button className="mt-6 bg-emerald-600 hover:bg-emerald-700" onClick={() => saveSettings('Reportes')} disabled={saving}>
                  <Save className="w-4 h-4 mr-2" />Guardar
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── TELEGRAM ── */}
        <TabsContent value="integrations">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Telegram Bot</span>
                <Switch checked={settings.telegramEnabled} onCheckedChange={(v) => setSettings({ ...settings, telegramEnabled: v })} />
              </CardTitle>
              <CardDescription>Recibe notificaciones y reportes por Telegram</CardDescription>
            </CardHeader>
            <CardContent>
              <div className={!settings.telegramEnabled ? 'opacity-50 pointer-events-none' : ''}>
                <div className="grid gap-4">
                  <div className="grid gap-2">
                    <Label>Bot Token</Label>
                    <Input value={settings.telegramBotToken || ''} onChange={(e) => setSettings({ ...settings, telegramBotToken: e.target.value })} placeholder="123456:ABC-DEF..." />
                    <p className="text-xs text-muted-foreground">Obtén el token de @BotFather en Telegram</p>
                  </div>
                  <div className="grid gap-2">
                    <Label>Chat ID</Label>
                    <Input value={settings.telegramChatId || ''} onChange={(e) => setSettings({ ...settings, telegramChatId: e.target.value })} placeholder="123456789" />
                    <p className="text-xs text-muted-foreground">Obtén tu Chat ID con @userinfobot</p>
                  </div>
                </div>
                <div className="flex gap-3 mt-6">
                  <Button variant="outline" onClick={testTelegram} disabled={testing === 'telegram'}>
                    <Send className="w-4 h-4 mr-2" />{testing === 'telegram' ? 'Enviando...' : 'Probar'}
                  </Button>
                  <Button onClick={() => saveSettings('Telegram')} disabled={saving} className="bg-emerald-600 hover:bg-emerald-700">
                    <Save className="w-4 h-4 mr-2" />Guardar
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── MANTENIMIENTO ── */}
        <TabsContent value="maintenance">
          <Card className="border-red-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-red-700">
                <AlertTriangle className="w-5 h-5" />
                Limpiar Historial de Datos
              </CardTitle>
              <CardDescription className="text-red-600">
                ⚠️ Estas acciones son <strong>irreversibles</strong>. Los datos eliminados no se pueden recuperar.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {CLEAR_ITEMS.map(({ type, label, desc }) => (
                <div key={type} className="flex items-center justify-between p-3 rounded-lg border gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{label}</p>
                    <p className="text-xs text-muted-foreground">{desc}</p>
                  </div>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive" size="sm" disabled={clearing === type}>
                        <Trash2 className="w-3.5 h-3.5 mr-1.5" />
                        {clearing === type ? 'Eliminando...' : 'Limpiar'}
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>¿Eliminar {label}?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Esta acción eliminará <strong>TODOS</strong> los registros de {label.toLowerCase()} de forma permanente. No se puede deshacer.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                          className="bg-red-600 hover:bg-red-700"
                          onClick={() => clearData(type, label)}
                        >
                          Sí, eliminar todo
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
