import 'dotenv/config'
import { PrismaClient } from '@prisma/client'
import { hash } from 'bcryptjs'
import { v4 as uuid } from 'uuid'

// Seed uses DIRECT_URL via DATABASE_URL env var — standard Prisma connection
const db = new PrismaClient({
  log: ['error'],
})

async function main() {
  console.log('🌱 Seeding Neon database...')
  console.log(`   DB URL: ${process.env.DIRECT_URL?.substring(0, 60)}...`)

  // Clean existing data
  const tables = [
    'appNotification','document','attendanceRecord','qRCode','employeeShift',
    'contract','incident','candidate','vacant','contractTemplate',
    'shift','employee','position','department','branch','user','company'
  ] as const

  for (const t of tables) {
    await (db[t as keyof typeof db] as any).deleteMany()
  }

  // Company
  const company = await db.company.create({
    data: {
      name: 'Corporativo SIGA Demo', taxId: 'CSD200101XXX',
      address: 'Av. Reforma 500, Col. Centro', city: 'Ciudad de México',
      state: 'CDMX', country: 'México', phone: '+52 55 1234 5678',
      email: 'admin@siga-demo.com', website: 'https://siga-demo.com', active: true,
    },
  })
  console.log('   ✓ Company created')

  // User
  const passwordHash = await hash('admin123', 10)
  await db.user.create({
    data: {
      companyId: company.id, name: 'Administrador General',
      email: 'admin@siga-demo.com', passwordHash, role: 'super_admin', active: true,
    },
  })
  console.log('   ✓ User created')

  // Branches
  const branches = await Promise.all([
    db.branch.create({ data: { companyId: company.id, name: 'Sucursal Principal', code: 'SP-001', address: 'Av. Reforma 500, Col. Centro', city: 'Ciudad de México', state: 'CDMX', latitude: 19.4326, longitude: -99.1332, geofenceRadius: 150, phone: '+52 55 1234 5678', managerName: 'Carlos Mendoza', active: true } }),
    db.branch.create({ data: { companyId: company.id, name: 'Sucursal Norte', code: 'SN-002', address: 'Blvd. Norte 200, Col. Industrial', city: 'Ciudad de México', state: 'CDMX', latitude: 19.4517, longitude: -99.1264, geofenceRadius: 100, phone: '+52 55 9876 5432', managerName: 'María López', active: true } }),
    db.branch.create({ data: { companyId: company.id, name: 'Sucursal Sur', code: 'SS-003', address: 'Av. Universidad 800, Col. Copilco', city: 'Ciudad de México', state: 'CDMX', latitude: 19.3835, longitude: -99.1704, geofenceRadius: 120, phone: '+52 55 5555 1234', managerName: 'Ana García', active: true } }),
  ])
  console.log(`   ✓ ${branches.length} branches created`)

  // Departments
  const depts = await Promise.all([
    db.department.create({ data: { companyId: company.id, name: 'Recursos Humanos', description: 'Gestión del capital humano', managerName: 'Ana García', active: true } }),
    db.department.create({ data: { companyId: company.id, name: 'Tecnología', description: 'Desarrollo y soporte técnico', managerName: 'Luis Martínez', active: true } }),
    db.department.create({ data: { companyId: company.id, name: 'Ventas', description: 'Comercialización y atención a clientes', managerName: 'Patricia Ruiz', active: true } }),
    db.department.create({ data: { companyId: company.id, name: 'Operaciones', description: 'Logística y control de calidad', managerName: 'Roberto Sánchez', active: true } }),
    db.department.create({ data: { companyId: company.id, name: 'Contabilidad', description: 'Gestión financiera y fiscal', managerName: 'Laura Torres', active: true } }),
  ])
  console.log(`   ✓ ${depts.length} departments created`)

  // Positions
  const positions = await Promise.all([
    db.position.create({ data: { companyId: company.id, departmentId: depts[0].id, name: 'Director de RH', description: 'Responsable de la gestión de personal', salary: 55000, active: true } }),
    db.position.create({ data: { companyId: company.id, departmentId: depts[0].id, name: 'Analista de RH', description: 'Soporte en procesos de RRHH', salary: 22000, active: true } }),
    db.position.create({ data: { companyId: company.id, departmentId: depts[1].id, name: 'Desarrollador Senior', description: 'Desarrollo de software', salary: 45000, active: true } }),
    db.position.create({ data: { companyId: company.id, departmentId: depts[1].id, name: 'Soporte Técnico', description: 'Atención a incidencias técnicas', salary: 18000, active: true } }),
    db.position.create({ data: { companyId: company.id, departmentId: depts[2].id, name: 'Ejecutivo de Ventas', description: 'Gestión de cuentas clientes', salary: 25000, active: true } }),
    db.position.create({ data: { companyId: company.id, departmentId: depts[3].id, name: 'Supervisor de Operaciones', description: 'Coordinación logística', salary: 30000, active: true } }),
    db.position.create({ data: { companyId: company.id, departmentId: depts[3].id, name: 'Operario', description: 'Personal operativo', salary: 15000, active: true } }),
    db.position.create({ data: { companyId: company.id, departmentId: depts[4].id, name: 'Contador', description: 'Gestión contable y fiscal', salary: 28000, active: true } }),
  ])
  console.log(`   ✓ ${positions.length} positions created`)

  // Shifts
  const shifts = await Promise.all([
    db.shift.create({ data: { companyId: company.id, name: 'Matutino', startTime: '08:00', endTime: '16:00', breakMinutes: 60, toleranceMinutes: 15, type: 'fixed', color: '#10b981', active: true } }),
    db.shift.create({ data: { companyId: company.id, name: 'Vespertino', startTime: '14:00', endTime: '22:00', breakMinutes: 60, toleranceMinutes: 15, type: 'fixed', color: '#f59e0b', active: true } }),
    db.shift.create({ data: { companyId: company.id, name: 'Nocturno', startTime: '22:00', endTime: '06:00', breakMinutes: 30, toleranceMinutes: 10, type: 'fixed', color: '#6366f1', active: true } }),
    db.shift.create({ data: { companyId: company.id, name: 'Administrativo', startTime: '09:00', endTime: '18:00', breakMinutes: 60, toleranceMinutes: 15, type: 'flexible', color: '#ec4899', active: true } }),
  ])
  console.log(`   ✓ ${shifts.length} shifts created`)

  // Employees
  const empData = [
    { f: 'Ana', l: 'García López', e: 'ana.garcia@siga-demo.com', b: 0, d: 0, p: 0, s: 3, n: 'EMP-001', h: '2020-03-15', g: 'F', bl: 'O+' },
    { f: 'Carlos', l: 'Mendoza Ruiz', e: 'carlos.mendoza@siga-demo.com', b: 0, d: 1, p: 2, s: 3, n: 'EMP-002', h: '2021-01-10', g: 'M', bl: 'A+' },
    { f: 'María', l: 'López Hernández', e: 'maria.lopez@siga-demo.com', b: 1, d: 2, p: 4, s: 0, n: 'EMP-003', h: '2021-06-20', g: 'F', bl: 'B+' },
    { f: 'Luis', l: 'Martínez Torres', e: 'luis.martinez@siga-demo.com', b: 0, d: 1, p: 2, s: 3, n: 'EMP-004', h: '2022-02-01', g: 'M', bl: 'O-' },
    { f: 'Patricia', l: 'Ruiz Sánchez', e: 'patricia.ruiz@siga-demo.com', b: 0, d: 2, p: 4, s: 0, n: 'EMP-005', h: '2022-05-15', g: 'F', bl: 'AB+' },
    { f: 'Roberto', l: 'Sánchez Díaz', e: 'roberto.sanchez@siga-demo.com', b: 1, d: 3, p: 5, s: 0, n: 'EMP-006', h: '2021-09-01', g: 'M', bl: 'A-' },
    { f: 'Laura', l: 'Torres Morales', e: 'laura.torres@siga-demo.com', b: 0, d: 4, p: 7, s: 3, n: 'EMP-007', h: '2020-11-20', g: 'F', bl: 'B-' },
    { f: 'Jorge', l: 'Ramírez Flores', e: 'jorge.ramirez@siga-demo.com', b: 1, d: 3, p: 6, s: 0, n: 'EMP-008', h: '2023-01-15', g: 'M', bl: 'O+' },
    { f: 'Diana', l: 'Castro Vega', e: 'diana.castro@siga-demo.com', b: 2, d: 0, p: 1, s: 3, n: 'EMP-009', h: '2022-08-10', g: 'F', bl: 'A+' },
    { f: 'Miguel', l: 'Herrera Paredes', e: 'miguel.herrera@siga-demo.com', b: 1, d: 1, p: 3, s: 1, n: 'EMP-010', h: '2023-03-01', g: 'M', bl: 'B+' },
    { f: 'Sofía', l: 'Vargas Medina', e: 'sofia.vargas@siga-demo.com', b: 2, d: 2, p: 4, s: 0, n: 'EMP-011', h: '2023-06-15', g: 'F', bl: 'AB-' },
    { f: 'Andrés', l: 'Romero Aguilar', e: 'andres.romero@siga-demo.com', b: 0, d: 3, p: 6, s: 2, n: 'EMP-012', h: '2023-02-20', g: 'M', bl: 'O-' },
    { f: 'Fernanda', l: 'Ortiz Luna', e: 'fernanda.ortiz@siga-demo.com', b: 2, d: 4, p: 7, s: 3, n: 'EMP-013', h: '2022-11-01', g: 'F', bl: 'A+' },
    { f: 'Eduardo', l: 'Navarro Ríos', e: 'eduardo.navarro@siga-demo.com', b: 1, d: 1, p: 2, s: 3, n: 'EMP-014', h: '2021-07-10', g: 'M', bl: 'B-' },
    { f: 'Gabriela', l: 'Salinas Cruz', e: 'gabriela.salinas@siga-demo.com', b: 0, d: 0, p: 1, s: 3, n: 'EMP-015', h: '2023-04-01', g: 'F', bl: 'O+' },
  ]

  const employees = await Promise.all(empData.map(d =>
    db.employee.create({
      data: {
        companyId: company.id, branchId: branches[d.b].id, departmentId: depts[d.d].id,
        positionId: positions[d.p].id, firstName: d.f, lastName: d.l, email: d.e,
        phone: `+52 55 ${1000 + Math.floor(Math.random() * 9000)} ${1000 + Math.floor(Math.random() * 9000)}`,
        birthDate: `${1970 + Math.floor(Math.random() * 25)}-${String(1 + Math.floor(Math.random() * 12)).padStart(2, '0')}-${String(1 + Math.floor(Math.random() * 28)).padStart(2, '0')}`,
        gender: d.g, address: 'Calle Principal #100', city: 'Ciudad de México', state: 'CDMX',
        employeeNumber: d.n, hireDate: d.h, employmentType: d.s === 2 ? 'part_time' : 'full_time',
        status: 'active', bloodType: d.bl, active: true,
      },
    })
  ))
  console.log(`   ✓ ${employees.length} employees created`)

  // Assign shifts
  await Promise.all(employees.map((emp, i) =>
    db.employeeShift.create({
      data: { employeeId: emp.id, shiftId: shifts[empData[i].s].id, effectiveDate: empData[i].h, daysOfWeek: '[1,2,3,4,5]', active: true },
    })
  ))

  // Generate attendance for last 7 days
  const now = new Date()
  const attendanceBatch: any[] = []
  for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
    const date = new Date(now)
    date.setDate(date.getDate() - dayOffset)
    if (date.getDay() === 0 || date.getDay() === 6) continue

    for (const emp of employees) {
      if (Math.random() < 0.06) continue

      const empShift = shifts[empData[employees.indexOf(emp)]?.s ?? 0]
      const [sH, sM] = empShift.startTime.split(':').map(Number)
      const schedTime = new Date(date)
      schedTime.setHours(sH, sM, 0, 0)

      const lateMin = Math.random() < 0.22 ? Math.floor(Math.random() * 40) + 1 : 0
      const inTime = new Date(schedTime.getTime() + lateMin * 60000)

      attendanceBatch.push({
        companyId: company.id, branchId: emp.branchId!, employeeId: emp.id,
        recordType: 'check_in', recordTime: inTime, scheduledTime: schedTime,
        latitude: 19.43 + (Math.random() - 0.5) * 0.02,
        longitude: -99.13 + (Math.random() - 0.5) * 0.02,
        gpsAccuracy: 10 + Math.random() * 30,
        status: lateMin > empShift.toleranceMinutes ? 'late' : 'on_time',
        minutesDiff: lateMin, verified: Math.random() > 0.2,
      })

      if (Math.random() < 0.9) {
        const [eH] = empShift.endTime.split(':').map(Number)
        const outTime = new Date(date)
        outTime.setHours(eH, 55 - Math.floor(Math.random() * 10), 0, 0)
        attendanceBatch.push({
          companyId: company.id, branchId: emp.branchId!, employeeId: emp.id,
          recordType: 'check_out', recordTime: outTime,
          scheduledTime: new Date(date.getFullYear(), date.getMonth(), date.getDate(), eH, 0, 0),
          latitude: 19.43 + (Math.random() - 0.5) * 0.02,
          longitude: -99.13 + (Math.random() - 0.5) * 0.02,
          gpsAccuracy: 10 + Math.random() * 30,
          status: 'on_time', minutesDiff: 0, verified: Math.random() > 0.2,
        })
      }
    }
  }

  for (let i = 0; i < attendanceBatch.length; i += 50) {
    await db.attendanceRecord.createMany({ data: attendanceBatch.slice(i, i + 50) })
  }
  console.log(`   ✓ ${attendanceBatch.length} attendance records created`)

  // QR codes
  for (const branch of branches) {
    const exp = new Date(); exp.setDate(exp.getDate() + 1)
    await db.qRCode.create({ data: { branchId: branch.id, code: uuid(), expiresAt: exp, active: true } })
  }
  console.log('   ✓ QR codes created')

  // Incidents
  await db.incident.createMany({ data: [
    { companyId: company.id, employeeId: employees[7].id, reportedBy: 'Roberto Sánchez', type: 'tardiness', title: 'Retardo injustificado', description: 'El empleado llegó 45 minutos tarde sin justificación.', severity: 'low', date: '2025-03-25', status: 'resolved', resolution: 'Amonestación verbal' },
    { companyId: company.id, employeeId: employees[11].id, reportedBy: 'Roberto Sánchez', type: 'absence', title: 'Inasistencia no justificada', description: 'Falta sin aviso previo.', severity: 'medium', date: '2025-03-20', status: 'open' },
    { companyId: company.id, employeeId: employees[2].id, type: 'policy_violation', title: 'Uso de celular', description: 'Uso frecuente del teléfono personal durante horas de trabajo.', severity: 'low', date: '2025-03-22', status: 'resolved', resolution: 'Recordatorio de políticas' },
  ]})
  console.log('   ✓ Incidents created')

  // Contract templates
  await db.contractTemplate.createMany({ data: [
    { companyId: company.id, name: 'Contrato Individual de Trabajo', type: 'individual_work', content: '<h1>CONTRATO INDIVIDUAL DE TRABAJO</h1><p>Contrato que celebran por una parte {{company_name}} y por la otra {{employee_name}}...</p>', defaultDurationDays: 365, active: true },
    { companyId: company.id, name: 'Carta Poder', type: 'power_of_attorney', content: '<h1>CARTA PODER</h1><p>Yo, {{employee_name}}, mayor de edad, otorgo poder amplio a...</p>', defaultDurationDays: 180, active: true },
    { companyId: company.id, name: 'Acuerdo de Confidencialidad', type: 'nda', content: '<h1>NDA</h1><p>El empleado {{employee_name}} se compromete a mantener confidencialidad...</p>', defaultDurationDays: 730, active: true },
  ]})
  console.log('   ✓ Contract templates created')

  // Vacancies
  const vacants = await Promise.all([
    db.vacant.create({ data: { companyId: company.id, departmentId: depts[1].id, positionId: positions[2].id, title: 'Desarrollador Full Stack', description: 'Buscamos desarrollador con experiencia en React y Node.js', requirements: '["React, Node.js, TypeScript", "2+ años experiencia", "SQL"]', salaryMin: 35000, salaryMax: 50000, employmentType: 'full_time', location: 'CDMX', status: 'open', vacanciesCount: 2, publishedAt: new Date('2025-03-01') } }),
    db.vacant.create({ data: { companyId: company.id, departmentId: depts[3].id, positionId: positions[6].id, title: 'Operario de Producción', description: 'Operario con experiencia en línea de producción', requirements: '["Preparatoria", "Manufactura", "Disponibilidad"]', salaryMin: 14000, salaryMax: 17000, employmentType: 'full_time', location: 'CDMX Norte', status: 'open', vacanciesCount: 3, publishedAt: new Date('2025-03-10') } }),
  ])
  console.log('   ✓ Vacancies created')

  // Candidates
  await db.candidate.createMany({ data: [
    { vacantId: vacants[0].id, companyId: company.id, firstName: 'Roberto', lastName: 'Fuentes', email: 'roberto.f@email.com', status: 'interview', interviewDate: '2025-04-05', notes: 'Buen perfil' },
    { vacantId: vacants[0].id, companyId: company.id, firstName: 'Carmen', lastName: 'Delgado', email: 'carmen.d@email.com', status: 'assessment' },
    { vacantId: vacants[0].id, companyId: company.id, firstName: 'Pablo', lastName: 'Ibarra', email: 'pablo.i@email.com', status: 'applied' },
    { vacantId: vacants[1].id, companyId: company.id, firstName: 'Jesús', lastName: 'Morales', email: 'jesus.m@email.com', status: 'screening' },
    { vacantId: vacants[1].id, companyId: company.id, firstName: 'Rosa', lastName: 'Figueroa', email: 'rosa.f@email.com', status: 'interview', interviewDate: '2025-04-08' },
  ]})
  console.log('   ✓ Candidates created')

  // Notifications
  await db.appNotification.createMany({ data: [
    { companyId: company.id, type: 'attendance', title: 'Retardo detectado', message: 'Jorge Ramírez registró llegada tardía a las 08:35 hrs.' },
    { companyId: company.id, type: 'contract', title: 'Contrato por vencer', message: 'El contrato de Andrés Romero vence en 15 días.' },
    { companyId: company.id, type: 'incident', title: 'Nueva incidencia', message: 'Inasistencia registrada para Andrés Romero.', read: true },
    { companyId: company.id, type: 'system', title: 'Bienvenido a SIGA-RH', message: 'Sistema de Gestión de Asistencia y Recursos Humanos v2.0.', read: true },
  ]})
  console.log('   ✓ Notifications created')

  console.log('')
  console.log('✅ Seed completed successfully!')
  console.log(`   Company: ${company.name}`)
  console.log(`   Branches: ${branches.length}`)
  console.log(`   Departments: ${depts.length}`)
  console.log(`   Positions: ${positions.length}`)
  console.log(`   Employees: ${employees.length}`)
  console.log(`   Shifts: ${shifts.length}`)
  console.log(`   Attendance records: ${attendanceBatch.length}`)
  console.log('')
  console.log('🔑 Login: admin@siga-demo.com / admin123')
}

main().catch(console.error).finally(() => db.$disconnect())
