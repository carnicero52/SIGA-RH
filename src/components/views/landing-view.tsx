'use client'

import { useAppStore } from '@/store/app-store'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { motion } from 'framer-motion'
import {
  QrCode,
  Users,
  CalendarClock,
  FileCheck,
  AlertTriangle,
  BarChart3,
  Shield,
  Smartphone,
  Building2,
  UserPlus,
  Rocket,
  Check,
  ArrowRight,
  Mail,
  Phone,
  ChevronRight,
  Clock,
  Globe,
  Star,
} from 'lucide-react'

const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0 },
}

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
}

const features = [
  {
    icon: QrCode,
    title: 'Control de Asistencia',
    description: 'Registro con QR, GPS geolocalización y selfie para evitar fraudes de asistencia.',
  },
  {
    icon: Users,
    title: 'Gestión de Empleados',
    description: 'Expedientes completos, documentos, contratos y toda la información centralizada.',
  },
  {
    icon: CalendarClock,
    title: 'Gestión de Turnos',
    description: 'Turnos flexibles, rotativos y fijos con tolerancias y configuración avanzada.',
  },
  {
    icon: FileCheck,
    title: 'Contratos Digitales',
    description: 'Plantillas personalizables, firma digital y seguimiento de vigencia automático.',
  },
  {
    icon: AlertTriangle,
    title: 'Incidencias y Disciplinas',
    description: 'Registro de faltas, retardos, amonestaciones y seguimiento disciplinario completo.',
  },
  {
    icon: BarChart3,
    title: 'Reportes y Dashboard',
    description: 'Métricas en tiempo real, gráficos interactivos y exportación de reportes.',
  },
  {
    icon: Shield,
    title: 'Seguridad de Datos',
    description: 'Encriptación, respaldos automáticos y cumplimiento con normativas de protección.',
  },
  {
    icon: Smartphone,
    title: 'Acceso Móvil',
    description: 'App responsive para que tu equipo pueda consultar y registrar desde cualquier lugar.',
  },
]

const steps = [
  {
    icon: Building2,
    title: 'Registra tu empresa',
    description: 'Crea tu cuenta en menos de 2 minutos. Solo necesitas los datos básicos de tu empresa.',
  },
  {
    icon: UserPlus,
    title: 'Invita a tu equipo',
    description: 'Agrega empleados, define departamentos, sucursales y turnos de trabajo.',
  },
  {
    icon: Rocket,
    title: 'Comienza a gestionar',
    description: 'Activa el control de asistencia, genera reportes y automatiza tus procesos de RRHH.',
  },
]

const plans = [
  {
    name: 'Gratuito',
    price: '$0',
    period: '/siempre',
    description: 'Ideal para comenzar y conocer la plataforma.',
    features: [
      'Hasta 10 empleados',
      '1 sucursal',
      'Control de asistencia básico',
      'Dashboard básico',
      'Soporte por email',
    ],
    cta: 'Comenzar Gratis',
    popular: false,
  },
  {
    name: 'Profesional',
    price: '$299',
    period: '/mes',
    description: 'Para empresas en crecimiento que necesitan más control.',
    features: [
      'Hasta 100 empleados',
      'Sucursales ilimitadas',
      'Control de asistencia con GPS + QR',
      'Reportes avanzados',
      'Gestión de contratos',
      'Soporte prioritario',
      'Integraciones API',
    ],
    cta: 'Prueba Gratis 14 días',
    popular: true,
  },
  {
    name: 'Enterprise',
    price: 'Contactar',
    period: '',
    description: 'Solución a medida para grandes organizaciones.',
    features: [
      'Empleados ilimitados',
      'Sucursales ilimitadas',
      'Todas las funciones',
      'SLA garantizado 99.9%',
      'Soporte dedicado 24/7',
      'Personalización y branding',
      'Capacitación incluida',
    ],
    cta: 'Contactar Ventas',
    popular: false,
  },
]

export function LandingView() {
  const navigate = useAppStore((s) => s.navigate)

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-md">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 overflow-hidden">
                <img src="/logo.png" alt="SIGA-RH" className="h-7 w-7 object-contain" />
              </div>
              <span className="text-xl font-bold tracking-tight">SIGA-RH</span>
            </div>
            <div className="hidden items-center gap-8 md:flex">
              <a href="#funciones" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Funciones
              </a>
              <a href="#como-funciona" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Cómo Funciona
              </a>
              <a href="#precios" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Precios
              </a>
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('login')}
              >
                Iniciar Sesión
              </Button>
              <Button
                size="sm"
                onClick={() => navigate('register')}
              >
                Registrarse
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-50 via-background to-teal-50 dark:from-emerald-950/20 dark:via-background dark:to-teal-950/20" />
        <div className="absolute top-20 left-10 h-72 w-72 rounded-full bg-emerald-500/10 blur-3xl" />
        <div className="absolute bottom-10 right-10 h-96 w-96 rounded-full bg-teal-500/10 blur-3xl" />
        <motion.div
          className="relative mx-auto max-w-7xl px-4 py-24 sm:px-6 sm:py-32 lg:px-8 lg:py-40"
          initial="hidden"
          animate="visible"
          variants={staggerContainer}
        >
          <div className="mx-auto max-w-3xl text-center">
            <motion.div variants={fadeInUp}>
              <Badge variant="secondary" className="mb-6 gap-1.5 bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300">
                <Star className="h-3.5 w-3.5" />
                Plataforma #1 en Gestión de RRHH
              </Badge>
            </motion.div>
            <motion.h1
              variants={fadeInUp}
              className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl"
            >
              Gestión de RRHH{' '}
              <span className="bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                Inteligente
              </span>
            </motion.h1>
            <motion.p
              variants={fadeInUp}
              className="mt-6 text-lg leading-8 text-muted-foreground sm:text-xl"
            >
              Controla asistencia, empleados, nóminas y más desde un solo lugar.
              Automatiza procesos, reduce errores y toma mejores decisiones con datos en tiempo real.
            </motion.p>
            <motion.div
              variants={fadeInUp}
              className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row"
            >
              <Button
                size="lg"
                className="gap-2 px-8 text-base"
                onClick={() => navigate('register')}
              >
                Comenzar Gratis
                <ArrowRight className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="gap-2 px-8 text-base"
                onClick={() => {
                  document.getElementById('funciones')?.scrollIntoView({ behavior: 'smooth' })
                }}
              >
                Ver Funciones
              </Button>
            </motion.div>
            <motion.div variants={fadeInUp} className="mt-12 flex items-center justify-center gap-8 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Check className="h-4 w-4 text-emerald-500" />
                Sin tarjeta de crédito
              </div>
              <div className="flex items-center gap-2">
                <Check className="h-4 w-4 text-emerald-500" />
                14 días de prueba
              </div>
              <div className="hidden items-center gap-2 sm:flex">
                <Check className="h-4 w-4 text-emerald-500" />
                Configura en minutos
              </div>
            </motion.div>
          </div>

          {/* Dashboard Preview */}
          <motion.div
            variants={fadeInUp}
            className="mx-auto mt-16 max-w-5xl"
          >
            <div className="rounded-xl border bg-card/50 p-2 shadow-2xl ring-1 ring-border/50">
              <div className="rounded-lg bg-gradient-to-br from-muted/80 to-muted/40 p-6 sm:p-8">
                <div className="flex items-center gap-2 mb-4">
                  <div className="h-3 w-3 rounded-full bg-red-400" />
                  <div className="h-3 w-3 rounded-full bg-yellow-400" />
                  <div className="h-3 w-3 rounded-full bg-green-400" />
                  <span className="ml-2 text-xs text-muted-foreground">SIGA-RH Dashboard</span>
                </div>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {[
                    { label: 'Empleados Activos', value: '156', color: 'text-emerald-600' },
                    { label: 'Presentes Hoy', value: '142', color: 'text-teal-600' },
                    { label: 'Retardos', value: '8', color: 'text-amber-600' },
                    { label: 'Ausencias', value: '6', color: 'text-red-500' },
                  ].map((stat) => (
                    <div key={stat.label} className="rounded-lg bg-background/80 p-3 shadow-sm">
                      <p className="text-xs text-muted-foreground">{stat.label}</p>
                      <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
                    </div>
                  ))}
                </div>
                <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <div className="col-span-2 rounded-lg bg-background/80 p-3 shadow-sm">
                    <p className="mb-2 text-xs text-muted-foreground">Asistencia Semanal</p>
                    <div className="flex h-24 items-end gap-1">
                      {[92, 88, 95, 90, 87, 45, 0].map((h, i) => (
                        <div key={i} className="flex-1 rounded-t bg-gradient-to-t from-emerald-500 to-emerald-300" style={{ height: `${h}%`, opacity: h === 0 ? 0.2 : 1 }} />
                      ))}
                    </div>
                    <div className="mt-1 flex justify-between text-[10px] text-muted-foreground">
                      <span>Lun</span><span>Mar</span><span>Mié</span><span>Jue</span><span>Vie</span><span>Sáb</span><span>Dom</span>
                    </div>
                  </div>
                  <div className="rounded-lg bg-background/80 p-3 shadow-sm">
                    <p className="mb-2 text-xs text-muted-foreground">Últimos Registros</p>
                    {['María García', 'Carlos López', 'Ana Martínez'].map((name) => (
                      <div key={name} className="flex items-center gap-2 py-1">
                        <div className="h-5 w-5 rounded-full bg-emerald-200 flex items-center justify-center">
                          <span className="text-[8px] font-medium text-emerald-700">{name[0]}</span>
                        </div>
                        <span className="text-xs">{name}</span>
                        <Clock className="ml-auto h-3 w-3 text-muted-foreground" />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </section>

      {/* Features Section */}
      <section id="funciones" className="py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div
            className="mx-auto max-w-2xl text-center"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-100px' }}
            variants={staggerContainer}
          >
            <motion.h2 variants={fadeInUp} className="text-3xl font-bold tracking-tight sm:text-4xl">
              Todo lo que necesitas para gestionar tu equipo
            </motion.h2>
            <motion.p variants={fadeInUp} className="mt-4 text-lg text-muted-foreground">
              Funciones diseñadas para simplificar la administración de recursos humanos en tu empresa.
            </motion.p>
          </motion.div>

          <motion.div
            className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-4"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-100px' }}
            variants={staggerContainer}
          >
            {features.map((feature) => (
              <motion.div key={feature.title} variants={fadeInUp}>
                <Card className="group h-full border-border/50 transition-all hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5">
                  <CardContent className="p-6">
                    <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500/10 to-teal-500/10 group-hover:from-emerald-500/20 group-hover:to-teal-500/20 transition-colors">
                      <feature.icon className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <h3 className="mb-2 font-semibold">{feature.title}</h3>
                    <p className="text-sm leading-relaxed text-muted-foreground">
                      {feature.description}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="como-funciona" className="border-y bg-muted/30 py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div
            className="mx-auto max-w-2xl text-center"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-100px' }}
            variants={staggerContainer}
          >
            <motion.h2 variants={fadeInUp} className="text-3xl font-bold tracking-tight sm:text-4xl">
              Comienza en 3 simples pasos
            </motion.h2>
            <motion.p variants={fadeInUp} className="mt-4 text-lg text-muted-foreground">
              Configura tu empresa y comienza a gestionar tu equipo en minutos, no en semanas.
            </motion.p>
          </motion.div>

          <motion.div
            className="mt-16 grid gap-12 sm:grid-cols-3"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-100px' }}
            variants={staggerContainer}
          >
            {steps.map((step, index) => (
              <motion.div key={step.title} variants={fadeInUp} className="relative text-center">
                <div className="absolute -top-1 left-1/2 -translate-x-1/2 text-6xl font-black text-muted-foreground/10">
                  {index + 1}
                </div>
                <div className="relative mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-500 shadow-lg shadow-emerald-500/25">
                  <step.icon className="h-9 w-9 text-white" />
                </div>
                <h3 className="mb-3 text-xl font-semibold">{step.title}</h3>
                <p className="mx-auto max-w-xs text-sm leading-relaxed text-muted-foreground">
                  {step.description}
                </p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="precios" className="py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div
            className="mx-auto max-w-2xl text-center"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-100px' }}
            variants={staggerContainer}
          >
            <motion.h2 variants={fadeInUp} className="text-3xl font-bold tracking-tight sm:text-4xl">
              Planes para cada etapa de tu negocio
            </motion.h2>
            <motion.p variants={fadeInUp} className="mt-4 text-lg text-muted-foreground">
              Comienza gratis y escala cuando lo necesites. Sin sorpresas ni costos ocultos.
            </motion.p>
          </motion.div>

          <motion.div
            className="mt-16 grid gap-8 lg:grid-cols-3"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-100px' }}
            variants={staggerContainer}
          >
            {plans.map((plan) => (
              <motion.div key={plan.name} variants={fadeInUp}>
                <Card
                  className={`relative h-full ${
                    plan.popular
                      ? 'border-emerald-500 shadow-lg shadow-emerald-500/10'
                      : 'border-border/50'
                  }`}
                >
                  {plan.popular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <Badge className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white border-0">
                        Más Popular
                      </Badge>
                    </div>
                  )}
                  <CardContent className="flex flex-col p-6 sm:p-8">
                    <h3 className="text-xl font-semibold">{plan.name}</h3>
                    <p className="mt-1 text-sm text-muted-foreground">{plan.description}</p>
                    <div className="mt-6 flex items-baseline gap-1">
                      <span className="text-4xl font-bold">{plan.price}</span>
                      {plan.period && (
                        <span className="text-muted-foreground">{plan.period}</span>
                      )}
                    </div>
                    <Separator className="my-6" />
                    <ul className="flex-1 space-y-3">
                      {plan.features.map((feature) => (
                        <li key={feature} className="flex items-start gap-3 text-sm">
                          <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                    <Button
                      className="mt-8 w-full"
                      variant={plan.popular ? 'default' : 'outline'}
                      onClick={() => navigate('register')}
                    >
                      {plan.cta}
                      <ChevronRight className="ml-1 h-4 w-4" />
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="border-t bg-muted/30 py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div
            className="relative mx-auto max-w-2xl text-center"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-100px' }}
            variants={staggerContainer}
          >
            <motion.div
              variants={fadeInUp}
              className="absolute -inset-4 rounded-3xl bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-emerald-500/10 blur-2xl"
            />
            <div className="relative">
              <motion.h2 variants={fadeInUp} className="text-3xl font-bold tracking-tight sm:text-4xl">
                ¿Listo para transformar tu gestión de RRHH?
              </motion.h2>
              <motion.p variants={fadeInUp} className="mt-4 text-lg text-muted-foreground">
                Únete a cientos de empresas que ya usan SIGA-RH para optimizar sus procesos.
              </motion.p>
              <motion.div
                variants={fadeInUp}
                className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row"
              >
                <Button
                  size="lg"
                  className="gap-2 px-8"
                  onClick={() => navigate('register')}
                >
                  Comenzar Ahora
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </motion.div>
              <motion.p variants={fadeInUp} className="mt-6 text-sm text-muted-foreground">
                ¿Tienes preguntas?{' '}
                <a href="mailto:contacto@siga-rh.com" className="font-medium text-emerald-600 hover:underline dark:text-emerald-400">
                  Contáctanos
                </a>
              </motion.p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 overflow-hidden">
                  <img src="/logo.png" alt="SIGA-RH" className="h-6 w-6 object-contain" />
                </div>
                <span className="text-lg font-bold">SIGA-RH</span>
              </div>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                Sistema Integral de Gestión de Asistencia y Recursos Humanos. Automatiza, controla y optimiza.
              </p>
            </div>
            <div>
              <h4 className="font-semibold">Producto</h4>
              <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                <li><a href="#funciones" className="hover:text-foreground transition-colors">Funciones</a></li>
                <li><a href="#precios" className="hover:text-foreground transition-colors">Precios</a></li>
                <li><a href="#como-funciona" className="hover:text-foreground transition-colors">Cómo Funciona</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold">Soporte</h4>
              <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                <li>
                  <a href="mailto:contacto@siga-rh.com" className="flex items-center gap-2 hover:text-foreground transition-colors">
                    <Mail className="h-3.5 w-3.5" /> contacto@siga-rh.com
                  </a>
                </li>
                <li>
                  <a href="tel:+525512345678" className="flex items-center gap-2 hover:text-foreground transition-colors">
                    <Phone className="h-3.5 w-3.5" /> +52 55 1234 5678
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold">Legal</h4>
              <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                <li><span className="hover:text-foreground transition-colors cursor-pointer">Términos y Condiciones</span></li>
                <li><span className="hover:text-foreground transition-colors cursor-pointer">Política de Privacidad</span></li>
                <li><span className="hover:text-foreground transition-colors cursor-pointer">Aviso Legal</span></li>
              </ul>
            </div>
          </div>
          <Separator className="my-8" />
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <p className="text-sm text-muted-foreground">
              &copy; {new Date().getFullYear()} SIGA-RH. Todos los derechos reservados.
            </p>
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <Globe className="h-3.5 w-3.5" />
              México
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
