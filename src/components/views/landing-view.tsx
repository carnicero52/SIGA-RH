'use client'

import { useAppStore } from '@/store/app-store'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { motion } from 'framer-motion'
import {
  QrCode, Users, CalendarClock, FileCheck, AlertTriangle, BarChart3,
  Shield, Smartphone, Building2, UserPlus, Rocket, Check, ArrowRight,
  Star, Globe, DollarSign, Clock, Zap, ChevronRight, Play,
  MapPin, TrendingUp, Lock, Banknote, MessageSquare,
} from 'lucide-react'

const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
}

const stagger = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
}

const features = [
  { icon: QrCode,        color: 'text-emerald-600 bg-emerald-50',  title: 'Asistencia con QR + GPS', desc: 'Registro antifraude con código QR, geolocalización y selfie. Sin papel, sin excusas.' },
  { icon: Banknote,      color: 'text-blue-600 bg-blue-50',        title: 'Nómina Automática',       desc: 'Calcula salarios, descuenta faltas y retardos automáticamente. Semanal, quincenal o mensual.' },
  { icon: Users,         color: 'text-purple-600 bg-purple-50',    title: 'Gestión de Empleados',    desc: 'Expedientes completos, documentos, contratos y toda la información en un solo lugar.' },
  { icon: Globe,         color: 'text-orange-600 bg-orange-50',    title: 'Multi-País',              desc: 'Adaptado para Venezuela, Colombia, México, Perú, Ecuador y toda Latinoamérica.' },
  { icon: CalendarClock, color: 'text-teal-600 bg-teal-50',        title: 'Turnos Inteligentes',     desc: 'Turnos fijos, rotativos y flexibles. Control de horarios con tolerancias configurables.' },
  { icon: FileCheck,     color: 'text-rose-600 bg-rose-50',        title: 'Bolsa de Empleo',         desc: 'Publica vacantes, recibe CVs con QR y gestiona candidatos en un pipeline visual.' },
  { icon: BarChart3,     color: 'text-amber-600 bg-amber-50',      title: 'Reportes en Tiempo Real', desc: 'Dashboard con métricas, gráficas y reportes diarios por email o Telegram.' },
  { icon: MessageSquare, color: 'text-cyan-600 bg-cyan-50',        title: 'Notificaciones',          desc: 'Alertas por email y Telegram. Reporte diario automático para gerencia.' },
]

const plans = [
  {
    name: 'Gratuito',
    price: '$0',
    period: '',
    badge: null,
    desc: 'Para probar sin compromisos.',
    color: 'border-border',
    btnClass: 'variant-outline',
    features: [
      'Hasta 10 empleados',
      '1 sucursal',
      'Control de asistencia QR',
      'Dashboard básico',
      'Soporte por email',
    ],
    cta: 'Empezar Gratis',
    popular: false,
  },
  {
    name: 'Profesional',
    price: '$29',
    period: '/mes',
    badge: '🔥 Más Popular',
    desc: 'Para empresas que necesitan control real.',
    color: 'border-emerald-500 shadow-xl shadow-emerald-100 dark:shadow-emerald-900/20',
    btnClass: '',
    features: [
      'Hasta 100 empleados',
      'Sucursales ilimitadas',
      'QR + GPS + Selfie antifraude',
      'Nómina automática',
      'Bolsa de empleo + CVs',
      'Reportes + Telegram',
      'Soporte prioritario',
    ],
    cta: 'Prueba 14 días gratis',
    popular: true,
  },
  {
    name: 'Empresarial',
    price: '$79',
    period: '/mes',
    badge: null,
    desc: 'Para organizaciones con múltiples sedes.',
    color: 'border-border',
    btnClass: 'variant-outline',
    features: [
      'Empleados ilimitados',
      'Sucursales ilimitadas',
      'Todo el plan Profesional',
      'API para integraciones',
      'SLA 99.9% garantizado',
      'Soporte dedicado 24/7',
      'Personalización y branding',
    ],
    cta: 'Contactar Ventas',
    popular: false,
  },
]

const countries = ['🇻🇪 Venezuela', '🇨🇴 Colombia', '🇲🇽 México', '🇵🇪 Perú', '🇪🇨 Ecuador', '🇦🇷 Argentina', '🇩🇴 Rep. Dominicana', '🇨🇱 Chile', '+más']

const testimonials = [
  { name: 'María González', role: 'Gerente de RRHH', company: 'Distribuidora El Sol', country: '🇻🇪', text: 'Antes perdíamos horas calculando nómina manualmente. Ahora SIGA-RH lo hace en segundos y sin errores.' },
  { name: 'Carlos Restrepo', role: 'Director General', company: 'Construcciones CR', country: '🇨🇴', text: 'El sistema de QR con selfie eliminó completamente el marcaje falso. El ahorro es enorme.' },
  { name: 'Ana Mendoza', role: 'Administradora', company: 'Clínica Santa Rosa', country: '🇵🇪', text: 'La bolsa de empleo nos ahorra semanas de reclutamiento. Recibimos los CVs directamente en el sistema.' },
]

export function LandingView() {
  const { navigate } = useAppStore()

  return (
    <div className="min-h-screen bg-background text-foreground">

      {/* ── NAV ─────────────────────────────────────────────────────────────── */}
      <nav className="sticky top-0 z-50 border-b bg-background/90 backdrop-blur-md">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-600 overflow-hidden shadow-sm">
                <img src="/logo.png" alt="SIGA-RH" className="h-7 w-7 object-contain" onError={(e) => { (e.target as HTMLImageElement).style.display='none' }} />
              </div>
              <span className="text-xl font-bold tracking-tight">SIGA-RH</span>
              <Badge variant="secondary" className="hidden sm:flex text-[10px] bg-emerald-100 text-emerald-700">LATAM</Badge>
            </div>
            <div className="hidden items-center gap-8 md:flex text-sm">
              <a href="#funciones" className="text-muted-foreground hover:text-foreground transition-colors">Funciones</a>
              <a href="#precios" className="text-muted-foreground hover:text-foreground transition-colors">Precios</a>
              <a href="#testimonios" className="text-muted-foreground hover:text-foreground transition-colors">Testimonios</a>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={() => navigate('login')}>Iniciar sesión</Button>
              <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 gap-1" onClick={() => navigate('register')}>
                Empezar gratis <ChevronRight className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* ── HERO ────────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-50 via-background to-teal-50 dark:from-emerald-950/20 dark:via-background dark:to-teal-950/20" />
        <div className="absolute -top-40 -right-40 h-96 w-96 rounded-full bg-emerald-400/10 blur-3xl" />
        <div className="absolute -bottom-20 -left-20 h-72 w-72 rounded-full bg-teal-400/10 blur-3xl" />

        <motion.div
          className="relative mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-32"
          initial="hidden" animate="visible" variants={stagger}
        >
          <div className="mx-auto max-w-4xl text-center">
            <motion.div variants={fadeInUp}>
              <Badge className="mb-6 gap-1.5 bg-emerald-600 text-white px-4 py-1.5 text-sm">
                <Globe className="h-3.5 w-3.5" />
                Diseñado para empresas latinoamericanas
              </Badge>
            </motion.div>

            <motion.h1 variants={fadeInUp} className="text-4xl font-extrabold tracking-tight sm:text-6xl lg:text-7xl leading-tight">
              El sistema de RRHH que{' '}
              <span className="bg-gradient-to-r from-emerald-500 to-teal-500 bg-clip-text text-transparent">
                entiende tu empresa
              </span>
            </motion.h1>

            <motion.p variants={fadeInUp} className="mt-6 text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              Controla asistencia, calcula nómina, recluta empleados y gestiona toda tu empresa desde un solo lugar.
              Funciona para Venezuela, Colombia, México y toda Latinoamérica.
            </motion.p>

            <motion.div variants={fadeInUp} className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button size="lg" className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2 px-8 h-12 text-base shadow-lg shadow-emerald-200 dark:shadow-emerald-900/30" onClick={() => navigate('register')}>
                Empezar gratis — sin tarjeta
                <ArrowRight className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="lg" className="gap-2 h-12 text-base px-6" onClick={() => document.getElementById('funciones')?.scrollIntoView({ behavior: 'smooth' })}>
                <Play className="h-4 w-4 text-emerald-600" /> Ver cómo funciona
              </Button>
            </motion.div>

            <motion.div variants={fadeInUp} className="mt-8 flex flex-wrap items-center justify-center gap-6 text-sm text-muted-foreground">
              {['Sin tarjeta de crédito', '14 días de prueba gratis', 'Cancela cuando quieras', 'Datos seguros'].map(t => (
                <span key={t} className="flex items-center gap-1.5">
                  <Check className="h-4 w-4 text-emerald-500 shrink-0" /> {t}
                </span>
              ))}
            </motion.div>
          </div>

          {/* Stats bar */}
          <motion.div variants={fadeInUp} className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto">
            {[
              { value: '500+', label: 'Empresas activas' },
              { value: '12,000+', label: 'Empleados gestionados' },
              { value: '9 países', label: 'en Latinoamérica' },
              { value: '4.9/5', label: 'Calificación promedio' },
            ].map(({ value, label }) => (
              <div key={label} className="text-center p-4 rounded-xl bg-card border">
                <p className="text-2xl font-bold text-emerald-600">{value}</p>
                <p className="text-xs text-muted-foreground mt-1">{label}</p>
              </div>
            ))}
          </motion.div>

          {/* Countries */}
          <motion.div variants={fadeInUp} className="mt-8 text-center">
            <p className="text-xs text-muted-foreground mb-3">Disponible en</p>
            <div className="flex flex-wrap items-center justify-center gap-2">
              {countries.map(c => (
                <span key={c} className="text-sm px-3 py-1 rounded-full bg-muted border text-muted-foreground">{c}</span>
              ))}
            </div>
          </motion.div>
        </motion.div>
      </section>

      {/* ── FEATURES ────────────────────────────────────────────────────────── */}
      <section id="funciones" className="py-24 bg-muted/30">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <Badge variant="outline" className="mb-4 text-emerald-700 border-emerald-200">Funcionalidades</Badge>
            <h2 className="text-3xl font-bold sm:text-4xl">Todo lo que necesita tu empresa</h2>
            <p className="mt-4 text-muted-foreground max-w-2xl mx-auto">
              Una plataforma completa que reemplaza hojas de cálculo, papelería y múltiples herramientas separadas.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map(({ icon: Icon, color, title, desc }) => (
              <Card key={title} className="border-border/50 hover:shadow-md transition-shadow">
                <CardContent className="p-5">
                  <div className={`inline-flex h-10 w-10 items-center justify-center rounded-xl ${color} mb-4`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="font-semibold mb-2">{title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ────────────────────────────────────────────────────── */}
      <section className="py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <Badge variant="outline" className="mb-4 text-emerald-700 border-emerald-200">Simple y rápido</Badge>
            <h2 className="text-3xl font-bold sm:text-4xl">Listo en menos de 5 minutos</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            <div className="hidden md:block absolute top-12 left-1/3 right-1/3 h-0.5 bg-gradient-to-r from-emerald-200 to-teal-200" />
            {[
              { icon: Building2, step: '01', title: 'Registra tu empresa', desc: 'Crea tu cuenta, elige tu país y configura los datos básicos de tu empresa en minutos.' },
              { icon: UserPlus,  step: '02', title: 'Agrega tu equipo',    desc: 'Importa o crea empleados, define sucursales, departamentos, cargos y turnos.' },
              { icon: Zap,       step: '03', title: 'Automatiza todo',     desc: 'Activa el control de asistencia, genera reportes y deja que el sistema trabaje por ti.' },
            ].map(({ icon: Icon, step, title, desc }) => (
              <div key={step} className="text-center relative">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-600 text-white shadow-lg shadow-emerald-200 dark:shadow-emerald-900/30 mb-6">
                  <Icon className="h-7 w-7" />
                </div>
                <span className="absolute top-0 right-1/2 translate-x-1/2 -translate-y-2 text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">{step}</span>
                <h3 className="font-semibold text-lg mb-2">{title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ────────────────────────────────────────────────────── */}
      <section id="testimonios" className="py-24 bg-muted/30">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <Badge variant="outline" className="mb-4 text-emerald-700 border-emerald-200">Testimonios</Badge>
            <h2 className="text-3xl font-bold sm:text-4xl">Lo que dicen nuestros clientes</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {testimonials.map(({ name, role, company, country, text }) => (
              <Card key={name} className="border-border/50">
                <CardContent className="p-6">
                  <div className="flex items-center gap-1 mb-4">
                    {[1,2,3,4,5].map(i => <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />)}
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed mb-4">"{text}"</p>
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold text-sm">
                      {name.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div>
                      <p className="font-semibold text-sm">{country} {name}</p>
                      <p className="text-xs text-muted-foreground">{role} · {company}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ── PRICING ─────────────────────────────────────────────────────────── */}
      <section id="precios" className="py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <Badge variant="outline" className="mb-4 text-emerald-700 border-emerald-200">Precios</Badge>
            <h2 className="text-3xl font-bold sm:text-4xl">Simple y transparente</h2>
            <p className="mt-4 text-muted-foreground">Precios en USD. Sin costos ocultos. Cancela cuando quieras.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {plans.map((plan) => (
              <Card key={plan.name} className={`relative border-2 ${plan.color} ${plan.popular ? 'scale-105' : ''}`}>
                {plan.badge && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                    <Badge className="bg-emerald-600 text-white px-4 py-1 text-xs">{plan.badge}</Badge>
                  </div>
                )}
                <CardContent className="p-6">
                  <h3 className="font-bold text-lg mb-1">{plan.name}</h3>
                  <p className="text-sm text-muted-foreground mb-4">{plan.desc}</p>
                  <div className="flex items-baseline gap-1 mb-6">
                    <span className="text-4xl font-extrabold">{plan.price}</span>
                    <span className="text-muted-foreground text-sm">{plan.period}</span>
                  </div>
                  <Button
                    className={`w-full mb-6 ${plan.popular ? 'bg-emerald-600 hover:bg-emerald-700 text-white' : ''}`}
                    variant={plan.popular ? 'default' : 'outline'}
                    onClick={() => navigate('register')}
                  >
                    {plan.cta}
                  </Button>
                  <ul className="space-y-2.5">
                    {plan.features.map(f => (
                      <li key={f} className="flex items-start gap-2 text-sm">
                        <Check className="h-4 w-4 text-emerald-500 mt-0.5 shrink-0" />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
          <p className="text-center text-sm text-muted-foreground mt-8">
            ¿Necesitas algo diferente? <button onClick={() => navigate('register')} className="text-emerald-600 hover:underline font-medium">Contáctanos</button>
          </p>
        </div>
      </section>

      {/* ── CTA FINAL ───────────────────────────────────────────────────────── */}
      <section className="py-24 bg-gradient-to-r from-emerald-600 to-teal-600">
        <div className="mx-auto max-w-4xl px-4 text-center text-white">
          <h2 className="text-3xl font-bold sm:text-4xl mb-4">
            ¿Listo para modernizar tu empresa?
          </h2>
          <p className="text-emerald-100 text-lg mb-8 max-w-2xl mx-auto">
            Más de 500 empresas latinoamericanas ya confían en SIGA-RH. Empieza gratis hoy y ve la diferencia.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button size="lg" className="bg-white text-emerald-700 hover:bg-emerald-50 gap-2 px-8 h-12 text-base font-semibold" onClick={() => navigate('register')}>
              Crear cuenta gratis
              <ArrowRight className="h-4 w-4" />
            </Button>
            <p className="text-emerald-100 text-sm">Sin tarjeta · 14 días gratis · Cancela cuando quieras</p>
          </div>
        </div>
      </section>

      {/* ── FOOTER ──────────────────────────────────────────────────────────── */}
      <footer className="border-t py-12 bg-background">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-emerald-600 flex items-center justify-center overflow-hidden">
                <img src="/logo.png" alt="SIGA-RH" className="h-6 w-6 object-contain" onError={(e) => { (e.target as HTMLImageElement).style.display='none' }} />
              </div>
              <span className="font-bold">SIGA-RH</span>
              <span className="text-muted-foreground text-sm">— Sistema de Gestión de RRHH para Latinoamérica</span>
            </div>
            <div className="flex items-center gap-6 text-sm text-muted-foreground">
              <a href="#" className="hover:text-foreground transition-colors">Términos</a>
              <a href="#" className="hover:text-foreground transition-colors">Privacidad</a>
              <a href="#" className="hover:text-foreground transition-colors">Contacto</a>
              <Button variant="ghost" size="sm" onClick={() => navigate('login')}>Iniciar sesión</Button>
            </div>
          </div>
          <p className="mt-8 text-center text-xs text-muted-foreground">
            © {new Date().getFullYear()} SIGA-RH. Todos los derechos reservados.
          </p>
        </div>
      </footer>
    </div>
  )
}
