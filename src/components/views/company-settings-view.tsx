'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Building2, Mail, MessageSquare, Bell, Send, TestTube, Save } from 'lucide-react'
import { toast } from 'sonner'
import { useAppStore } from '@/lib/store'

interface CompanySettings {
  id: string
  name: string
  brandColor: string
  logo: string | null
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

export function CompanySettingsView() {
  const { token } = useAppStore()
  const [settings, setSettings] = useState<CompanySettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [testing, setTesting] = useState<string | null>(null)

  useEffect(() => {
    fetchSettings()
  }, [])

  async function fetchSettings() {
    try {
      const res = await fetch('/api/company', {
        headers: { Authorization: `Bearer ${token}` },
      })
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
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(settings),
      })
      if (res.ok) {
        toast.success(`${section} guardado correctamente`)
      } else {
        throw new Error('Error al guardar')
      }
    } catch {
      toast.error('Error al guardar configuración')
    } finally {
      setSaving(false)
    }
  }

  async function testEmail() {
    setTesting('email')
    try {
      const res = await fetch('/api/company/test-email', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await res.json()
      if (data.success) {
        toast.success('Email de prueba enviado correctamente')
      } else {
        throw new Error(data.error)
      }
    } catch (error: any) {
      toast.error(error.message || 'Error al enviar email de prueba')
    } finally {
      setTesting(null)
    }
  }

  async function testTelegram() {
    setTesting('telegram')
    try {
      const res = await fetch('/api/company/test-telegram', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await res.json()
      if (data.success) {
        toast.success('Mensaje de Telegram enviado correctamente')
      } else {
        throw new Error(data.error || data.details)
      }
    } catch (error: any) {
      toast.error(error.message || 'Error al enviar mensaje de Telegram')
    } finally {
      setTesting(null)
    }
  }

  if (loading) {
    return <div className="p-8 text-center text-muted-foreground">Cargando configuración...</div>
  }

  if (!settings) {
    return <div className="p-8 text-center text-red-500">Error al cargar configuración</div>
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <Tabs defaultValue="info" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="info">
            <Building2 className="w-4 h-4 mr-2" />
            Información
          </TabsTrigger>
          <TabsTrigger value="notifications">
            <Mail className="w-4 h-4 mr-2" />
            Notificaciones
          </TabsTrigger>
          <TabsTrigger value="reports">
            <Bell className="w-4 h-4 mr-2" />
            Reportes
          </TabsTrigger>
          <TabsTrigger value="integrations">
            <MessageSquare className="w-4 h-4 mr-2" />
            Integraciones
          </TabsTrigger>
        </TabsList>

        {/* INFORMACIÓN */}
        <TabsContent value="info">
          <Card>
            <CardHeader>
              <CardTitle>Información de la Empresa</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2">
                <Label>Nombre de la empresa</Label>
                <Input
                  value={settings.name}
                  onChange={(e) => setSettings({ ...settings, name: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label>Color de marca</Label>
                <div className="flex gap-3 items-center">
                  <Input
                    type="color"
                    value={settings.brandColor}
                    onChange={(e) => setSettings({ ...settings, brandColor: e.target.value })}
                    className="w-16 h-10 p-1"
                  />
                  <Input
                    value={settings.brandColor}
                    onChange={(e) => setSettings({ ...settings, brandColor: e.target.value })}
                    className="font-mono"
                  />
                </div>
              </div>
              <Button onClick={() => saveSettings('Información')} disabled={saving}>
                <Save className="w-4 h-4 mr-2" />
                Guardar cambios
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* NOTIFICACIONES - SMTP */}
        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Configuración SMTP (Gmail)</span>
                <Switch
                  checked={settings.smtpEnabled}
                  onCheckedChange={(checked) => setSettings({ ...settings, smtpEnabled: checked })}
                />
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className={!settings.smtpEnabled ? 'opacity-50 pointer-events-none' : ''}>
                <div className="grid gap-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label>Servidor SMTP</Label>
                      <Input
                        value={settings.smtpHost || ''}
                        onChange={(e) => setSettings({ ...settings, smtpHost: e.target.value })}
                        placeholder="smtp.gmail.com"
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label>Puerto</Label>
                      <Input
                        type="number"
                        value={settings.smtpPort || ''}
                        onChange={(e) =>
                          setSettings({ ...settings, smtpPort: Number(e.target.value) })
                        }
                        placeholder="465"
                      />
                    </div>
                  </div>
                  <div className="grid gap-2">
                    <Label>Usuario (email)</Label>
                    <Input
                      value={settings.smtpUser || ''}
                      onChange={(e) => setSettings({ ...settings, smtpUser: e.target.value })}
                      placeholder="tu-email@gmail.com"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label>Contraseña de aplicación</Label>
                    <Input
                      type="password"
                      value={settings.smtpPassword || ''}
                      onChange={(e) =>
                        setSettings({ ...settings, smtpPassword: e.target.value })
                      }
                      placeholder="xxxx xxxx xxxx xxxx"
                    />
                    <p className="text-xs text-muted-foreground">
                      Usa una contraseña de aplicación de Google (16 caracteres sin espacios)
                    </p>
                  </div>
                  <div className="grid gap-2">
                    <Label>Email remitente (opcional)</Label>
                    <Input
                      value={settings.smtpFrom || ''}
                      onChange={(e) => setSettings({ ...settings, smtpFrom: e.target.value })}
                      placeholder="SIGA-RH <noreply@gmail.com>"
                    />
                  </div>
                </div>
                <div className="flex gap-3 mt-6">
                  <Button variant="outline" onClick={testEmail} disabled={testing === 'email'}>
                    <TestTube className="w-4 h-4 mr-2" />
                    {testing === 'email' ? 'Enviando...' : 'Probar'}
                  </Button>
                  <Button onClick={() => saveSettings('SMTP')} disabled={saving}>
                    <Save className="w-4 h-4 mr-2" />
                    Guardar
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* REPORTES */}
        <TabsContent value="reports">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Reporte Diario Automático</span>
                <Switch
                  checked={settings.dailyReportEnabled}
                  onCheckedChange={(checked) =>
                    setSettings({ ...settings, dailyReportEnabled: checked })
                  }
                />
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className={!settings.dailyReportEnabled ? 'opacity-50 pointer-events-none' : ''}>
                <div className="grid gap-4">
                  <div className="grid gap-2">
                    <Label>Hora del reporte (hora Venezuela)</Label>
                    <Input
                      type="time"
                      value={settings.dailyReportTime}
                      onChange={(e) =>
                        setSettings({ ...settings, dailyReportTime: e.target.value })
                      }
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label>Destinatarios adicionales</Label>
                    <Input
                      value={settings.dailyReportRecipients || ''}
                      onChange={(e) =>
                        setSettings({ ...settings, dailyReportRecipients: e.target.value })
                      }
                      placeholder="email1@ejemplo.com, email2@ejemplo.com"
                    />
                    <p className="text-xs text-muted-foreground">
                      Separar múltiples emails con coma. Se enviará también al email configurado en
                      SMTP.
                    </p>
                  </div>
                </div>
                <Button className="mt-6" onClick={() => saveSettings('Reportes')} disabled={saving}>
                  <Save className="w-4 h-4 mr-2" />
                  Guardar
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TELEGRAM */}
        <TabsContent value="integrations">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Telegram Bot</span>
                <Switch
                  checked={settings.telegramEnabled}
                  onCheckedChange={(checked) =>
                    setSettings({ ...settings, telegramEnabled: checked })
                  }
                />
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className={!settings.telegramEnabled ? 'opacity-50 pointer-events-none' : ''}>
                <div className="grid gap-4">
                  <div className="grid gap-2">
                    <Label>Bot Token</Label>
                    <Input
                      value={settings.telegramBotToken || ''}
                      onChange={(e) =>
                        setSettings({ ...settings, telegramBotToken: e.target.value })
                      }
                      placeholder="123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11"
                    />
                    <p className="text-xs text-muted-foreground">
                      Obtén el token de @BotFather en Telegram
                    </p>
                  </div>
                  <div className="grid gap-2">
                    <Label>Chat ID</Label>
                    <Input
                      value={settings.telegramChatId || ''}
                      onChange={(e) =>
                        setSettings({ ...settings, telegramChatId: e.target.value })
                      }
                      placeholder="123456789"
                    />
                    <p className="text-xs text-muted-foreground">
                      Obtén tu Chat ID con @userinfobot
                    </p>
                  </div>
                </div>
                <div className="flex gap-3 mt-6">
                  <Button
                    variant="outline"
                    onClick={testTelegram}
                    disabled={testing === 'telegram'}
                  >
                    <Send className="w-4 h-4 mr-2" />
                    {testing === 'telegram' ? 'Enviando...' : 'Probar'}
                  </Button>
                  <Button onClick={() => saveSettings('Telegram')} disabled={saving}>
                    <Save className="w-4 h-4 mr-2" />
                    Guardar
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
