import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'
import nodemailer from 'nodemailer'

function generatePin(): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

async function sendPinEmail(
  to: string, employeeName: string, pin: string, company: any
) {
  if (!company.smtpEnabled || !company.smtpUser || !company.smtpPassword) return false
  try {
    const transporter = nodemailer.createTransport({
      host: company.smtpHost || 'smtp.gmail.com',
      port: company.smtpPort || 465,
      secure: (company.smtpPort || 465) === 465,
      auth: { user: company.smtpUser, pass: company.smtpPassword },
    })
    await transporter.sendMail({
      from: company.smtpFrom || company.smtpUser,
      to,
      subject: `🔐 Tu PIN de Asistencia — ${company.name}`,
      html: `<div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden">
        <div style="background:linear-gradient(135deg,#10b981,#059669);padding:28px 24px;text-align:center">
          <h1 style="color:white;margin:0;font-size:22px">Acceso al Sistema de Asistencia</h1>
          <p style="color:rgba(255,255,255,0.85);margin:8px 0 0;font-size:14px">${company.name}</p>
        </div>
        <div style="padding:28px 24px">
          <p style="color:#374151">Hola <strong>${employeeName}</strong>,</p>
          <p style="color:#6b7280;font-size:14px">Tu PIN personal para marcar asistencia. No lo compartas con nadie.</p>
          <div style="background:#f0fdf4;border:2px dashed #10b981;border-radius:10px;padding:24px;text-align:center;margin:20px 0">
            <p style="color:#6b7280;font-size:12px;margin:0 0 8px;text-transform:uppercase;letter-spacing:1px">Tu PIN</p>
            <p style="color:#059669;font-size:42px;font-weight:900;letter-spacing:10px;margin:0;font-family:monospace">${pin}</p>
          </div>
          <p style="color:#92400e;background:#fef3c7;padding:12px;border-radius:8px;font-size:13px">
            ⚠️ Este PIN es personal e intransferible.
          </p>
        </div>
        <div style="background:#f9fafb;padding:14px 24px;text-align:center;border-top:1px solid #e5e7eb">
          <p style="color:#9ca3af;font-size:11px;margin:0">Enviado automáticamente por SIGA-RH · ${company.name}</p>
        </div>
      </div>`,
    })
    return true
  } catch { return false }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'))
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '10')))
    const search = searchParams.get('search') || ''
    const branchId = searchParams.get('branchId') || ''
    const departmentId = searchParams.get('departmentId') || ''
    const status = searchParams.get('status') || ''
    const employmentType = searchParams.get('employmentType') || ''

    const where: any = { active: true }

    if (search) {
      where.OR = [
        { firstName: { contains: search } },
        { lastName: { contains: search } },
        { email: { contains: search } },
        { employeeNumber: { contains: search } },
      ]
    }
    if (branchId) where.branchId = branchId
    if (departmentId) where.departmentId = departmentId
    if (status) where.status = status
    if (employmentType) where.employmentType = employmentType

    const [employees, total] = await Promise.all([
      db.employee.findMany({
        where,
        include: {
          branch: { select: { id: true, name: true } },
          department: { select: { id: true, name: true } },
          position: { select: { id: true, name: true } },
          _count: {
            select: {
              attendanceRecords: true,
              contracts: true,
              incidents: true,
              documents: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.employee.count({ where }),
    ])

    return NextResponse.json({
      employees,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    })
  } catch (error: any) {
    console.error('List employees error:', error)
    return NextResponse.json({ error: 'Error al obtener empleados' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      firstName, lastName, email, phone,
      curp, rfc, nss, birthDate, gender,
      address, city, state: empState,
      employeeNumber, hireDate, employmentType, status,
      branchId, departmentId, positionId,
      bloodType,
      emergencyContact, emergencyPhone, emergencyRelation,
      bankName, bankAccount, bankClabe,
      notes,
    } = body

    // Validate required fields
    if (!firstName?.trim()) {
      return NextResponse.json({ error: 'El nombre es requerido' }, { status: 400 })
    }
    if (!lastName?.trim()) {
      return NextResponse.json({ error: 'El apellido es requerido' }, { status: 400 })
    }
    if (!email?.trim()) {
      return NextResponse.json({ error: 'El email es requerido' }, { status: 400 })
    }

    // Check unique email - find first active company
    const firstCompany = await db.company.findFirst({ where: { active: true } })
    if (!firstCompany) {
      return NextResponse.json({ error: 'No hay empresa configurada' }, { status: 400 })
    }

    // Auto-generate PIN if not provided
    const autoPin = body.pin?.trim() || generatePin()

    const existingEmail = await db.employee.findFirst({
      where: { companyId: firstCompany.id, email: email.trim(), active: true },
    })
    if (existingEmail) {
      return NextResponse.json({ error: 'Ya existe un empleado con este email' }, { status: 409 })
    }

    // Check unique employeeNumber
    if (employeeNumber?.trim()) {
      const existingNumber = await db.employee.findFirst({
        where: { companyId: firstCompany.id, employeeNumber: employeeNumber.trim(), active: true },
      })
      if (existingNumber) {
        return NextResponse.json({ error: 'Ya existe un empleado con este número de empleado' }, { status: 409 })
      }
    }

    const employee = await db.employee.create({
      data: {
        companyId: firstCompany.id,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim(),
        phone: phone?.trim() || null,
        curp: curp?.trim() || null,
        rfc: rfc?.trim() || null,
        nss: nss?.trim() || null,
        birthDate: birthDate || null,
        gender: gender || null,
        address: address?.trim() || null,
        city: city?.trim() || null,
        state: empState?.trim() || null,
        employeeNumber: employeeNumber?.trim() || null,
        hireDate: hireDate || null,
        employmentType: employmentType || 'full_time',
        status: status || 'active',
        branchId: branchId || null,
        departmentId: departmentId || null,
        positionId: positionId || null,
        bloodType: bloodType?.trim() || null,
        emergencyContact: emergencyContact?.trim() || null,
        emergencyPhone: emergencyPhone?.trim() || null,
        emergencyRelation: emergencyRelation?.trim() || null,
        bankName: bankName?.trim() || null,
        bankAccount: bankAccount?.trim() || null,
        bankClabe: bankClabe?.trim() || null,
        notes: notes?.trim() || null,
        pin: autoPin,
      },
      include: {
        branch: { select: { id: true, name: true } },
        department: { select: { id: true, name: true } },
        position: { select: { id: true, name: true } },
      },
    })

    // Send PIN by email (non-blocking — don't fail if email fails)
    const emailSent = await sendPinEmail(
      employee.email,
      `${employee.firstName} ${employee.lastName}`,
      autoPin,
      firstCompany
    )

    return NextResponse.json({ ...employee, pinEmailSent: emailSent }, { status: 201 })
  } catch (error: any) {
    console.error('Create employee error:', error)
    return NextResponse.json({ error: 'Error al crear empleado' }, { status: 500 })
  }
}
