'use client'

import { useAppStore, type ViewType } from '@/store/app-store'
import {
  LayoutDashboard, Users, Building2, GitBranch, Briefcase,
  Clock, QrCode, ShieldAlert, FileText, Search, BarChart3,
  Settings, ChevronDown, LogOut, Bell, Menu
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useState, useEffect } from 'react'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface NavItem {
  id: ViewType
  label: string
  icon: React.ReactNode
  badge?: string
}

interface NavGroup {
  title: string
  items: NavItem[]
}

const navGroups: NavGroup[] = [
  {
    title: 'PRINCIPAL',
    items: [
      { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="h-4 w-4" /> },
    ],
  },
  {
    title: 'ASISTENCIA',
    items: [
      { id: 'attendance-monitor', label: 'Monitor en Vivo', icon: <Clock className="h-4 w-4" />, badge: 'LIVE' },
      { id: 'attendance', label: 'Registros', icon: <QrCode className="h-4 w-4" /> },
      { id: 'shifts', label: 'Turnos', icon: <Briefcase className="h-4 w-4" /> },
    ],
  },
  {
    title: 'RECURSOS HUMANOS',
    items: [
      { id: 'employees', label: 'Empleados', icon: <Users className="h-4 w-4" /> },
      { id: 'departments', label: 'Departamentos', icon: <GitBranch className="h-4 w-4" /> },
      { id: 'positions', label: 'Puestos', icon: <Briefcase className="h-4 w-4" /> },
      { id: 'branches', label: 'Sucursales', icon: <Building2 className="h-4 w-4" /> },
    ],
  },
  {
    title: 'GESTIÓN',
    items: [
      { id: 'incidents', label: 'Incidencias', icon: <ShieldAlert className="h-4 w-4" /> },
      { id: 'contracts', label: 'Contratos', icon: <FileText className="h-4 w-4" /> },
      { id: 'vacancies', label: 'Vacantes', icon: <Search className="h-4 w-4" /> },
      { id: 'candidates', label: 'Candidatos', icon: <Users className="h-4 w-4" /> },
    ],
  },
  {
    title: 'ANÁLISIS',
    items: [
      { id: 'reports', label: 'Reportes', icon: <BarChart3 className="h-4 w-4" /> },
    ],
  },
]

export function AppSidebar() {
  const { currentView, navigate, sidebarOpen, setSidebarOpen, user, companyName, logout } = useAppStore()
  const [unreadNotifications, setUnreadNotifications] = useState(0)

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const res = await fetch('/api/notifications')
        if (res.ok) {
          const data = await res.json()
          setUnreadNotifications(data.filter((n: any) => !n.read).length)
        }
      } catch {}
    }
    if (useAppStore.getState().isAuthenticated) fetchNotifications()
  }, [currentView])

  return (
    <>
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed left-0 top-0 z-50 h-full w-64 bg-sidebar text-sidebar-foreground transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Logo */}
        <div className="flex h-16 items-center gap-3 border-b border-sidebar-border px-4">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-sidebar-primary/10 overflow-hidden">
            <img src="/logo.png" alt="SIGA-RH" className="h-7 w-7 object-contain" />
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-sm font-bold tracking-tight truncate">{companyName}</h1>
            <p className="text-[10px] text-sidebar-foreground/60 truncate">Gestión de RH</p>
          </div>
        </div>

        {/* Navigation */}
        <ScrollArea className="h-[calc(100%-8rem)] py-4">
          <nav className="space-y-1 px-3">
            {navGroups.map((group) => (
              <div key={group.title} className="mb-4">
                <p className="mb-1.5 px-3 text-[10px] font-semibold uppercase tracking-wider text-sidebar-foreground/50">
                  {group.title}
                </p>
                {group.items.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => {
                      navigate(item.id)
                      if (window.innerWidth < 1024) setSidebarOpen(false)
                    }}
                    className={cn(
                      'flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                      currentView === item.id
                        ? 'bg-sidebar-accent text-sidebar-primary'
                        : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground'
                    )}
                  >
                    {item.icon}
                    <span className="flex-1 text-left">{item.label}</span>
                    {item.badge && (
                      <Badge
                        variant={item.badge === 'LIVE' ? 'destructive' : 'secondary'}
                        className="h-5 text-[10px] px-1.5"
                      >
                        {item.badge}
                      </Badge>
                    )}
                  </button>
                ))}
              </div>
            ))}
          </nav>
        </ScrollArea>

        {/* User section */}
        <div className="absolute bottom-0 left-0 right-0 border-t border-sidebar-border p-3">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm hover:bg-sidebar-accent/50 transition-colors">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-sidebar-primary/20 text-sidebar-primary text-xs">
                    {user?.name?.split(' ').map(n => n[0]).join('').substring(0, 2) || 'AD'}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 text-left min-w-0">
                  <p className="text-sm font-medium truncate">{user?.name || 'Admin'}</p>
                  <p className="text-[10px] text-sidebar-foreground/50 truncate">{user?.role || 'Administrador'}</p>
                </div>
                <ChevronDown className="h-3.5 w-3.5 text-sidebar-foreground/50" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent side="top" align="start" className="w-56">
              <DropdownMenuLabel>Mi Cuenta</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => navigate('company')}>
                <Settings className="mr-2 h-4 w-4" /> Configuración
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={logout} className="text-red-500">
                <LogOut className="mr-2 h-4 w-4" /> Cerrar Sesión
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </aside>
    </>
  )
}

export function AppHeader() {
  const { currentView, toggleSidebar } = useAppStore()
  const [notifications, setNotifications] = useState<any[]>([])
  const [notifOpen, setNotifOpen] = useState(false)

  const viewTitles: Record<string, string> = {
    dashboard: 'Dashboard',
    employees: 'Empleados',
    'employee-detail': 'Detalle de Empleado',
    branches: 'Sucursales',
    departments: 'Departamentos',
    positions: 'Puestos',
    shifts: 'Turnos',
    attendance: 'Registros de Asistencia',
    'attendance-monitor': 'Monitor de Asistencia en Vivo',
    incidents: 'Incidencias',
    contracts: 'Contratos',
    vacancies: 'Vacantes',
    candidates: 'Candidatos',
    reports: 'Reportes',
    company: 'Configuración',
    settings: 'Configuración',
  }

  useEffect(() => {
    const fetchNotifs = async () => {
      try {
        const res = await fetch('/api/notifications')
        if (res.ok) {
          const data = await res.json()
          setNotifications(Array.isArray(data) ? data.slice(0, 8) : [])
        }
      } catch {}
    }
    if (useAppStore.getState().isAuthenticated) fetchNotifs()
  }, [currentView])

  const unreadCount = notifications.filter((n) => !n.read).length

  const typeIcons: Record<string, string> = {
    attendance: '🟢',
    incident: '🟡',
    contract: '📄',
    system: '⚙️',
    alert: '🔴',
  }

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-4 lg:px-6">
      <button
        onClick={toggleSidebar}
        className="lg:hidden p-2 rounded-md hover:bg-accent transition-colors"
      >
        <Menu className="h-5 w-5" />
      </button>

      <div className="flex-1">
        <h2 className="text-lg font-semibold">{viewTitles[currentView] || 'SIGA-RH'}</h2>
      </div>

      {/* Notification bell */}
      <DropdownMenu open={notifOpen} onOpenChange={setNotifOpen}>
        <DropdownMenuTrigger asChild>
          <button className="relative p-2 rounded-md hover:bg-accent transition-colors">
            <Bell className="h-5 w-5 text-muted-foreground" />
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 flex h-4.5 w-4.5 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-80">
          <DropdownMenuLabel className="flex items-center justify-between">
            <span>Notificaciones</span>
            {unreadCount > 0 && (
              <Badge variant="secondary" className="text-[10px]">{unreadCount} nuevas</Badge>
            )}
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          {notifications.length === 0 ? (
            <div className="py-6 text-center">
              <Bell className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">Sin notificaciones</p>
            </div>
          ) : (
            notifications.map((notif: any) => (
              <DropdownMenuItem key={notif.id} className="flex flex-col items-start gap-1 p-3 cursor-pointer">
                <div className="flex items-center gap-2 w-full">
                  <span className="text-sm">{typeIcons[notif.type] || '🔔'}</span>
                  <span className={cn('text-sm font-medium flex-1 truncate', !notif.read && 'text-foreground')}>
                    {notif.title}
                  </span>
                  {!notif.read && <span className="h-2 w-2 rounded-full bg-primary shrink-0" />}
                </div>
                <p className="text-xs text-muted-foreground line-clamp-1 pl-6">{notif.message}</p>
                <p className="text-[10px] text-muted-foreground/60 pl-6">
                  {new Date(notif.createdAt).toLocaleDateString('es-MX', { day: 'numeric', month: 'short' })}
                  {' '}{new Date(notif.createdAt).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}
                </p>
              </DropdownMenuItem>
            ))
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  )
}
