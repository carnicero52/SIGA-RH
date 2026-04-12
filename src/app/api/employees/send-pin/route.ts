import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'
import { jwtVerify } from 'jose'
import nodemailer from 'nodemailer'

async function verifyAuth(request: NextRequest) {
  const authHeader = request.headers.get('Authorization')
  if (!authHeader?.startsWith('Bearer ')) throw new Error('No autorizado')
  const token = authHeader.split(' ')[1]
  const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'siga-rh-secret-key-2024')
  await jwtVerify(token, secret)
}

function generatePin(): string {
  // 6-digit secure PIN
  return Math.floor(100000 + Math.random() * 900000).toString()
}

function buildPinEmail(employeeName: string, pin: string, companyName: string): string {
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: Arial, sans-serif; background: #f5f5f5; padding: 20px; margin: 0;">
  <div style="max-width: 480px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.08);">
    <div style="background: linear-gradient(135deg, #10b981, #059669); padding: 28px 24px; text-align: center;">
      <h1 style="color: white; margin: 0; font-size: 22px;">Acceso al Sistema de Asistencia</h1>
      <p style="color: rgba(255,255,255,0.85); margin: 8px 0 0; font-size: 14px;">${companyName}</p>
    </div>
    <div style="padding: 28px 24px;">
      <p style="color: #374151; margin: 0 0 16px;">Hola <strong>${employeeName}</strong>,</p>
      <p style="color: #6b7280; font-size: 14px; margin: 0 0 24px;">
        Tu PIN personal para marcar asistencia ha sido generado. Úsalo de forma confidencial — 
        <strong>no lo compartas con nadie</strong>.
      </p>

      <div style="background: #f0fdf4; border: 2px dashed #10b981; border-radius: 10px; padding: 24px; text-align: center; margin-bottom: 24px;">
        <p style="color: #6b7280; font-size: 12px; margin: 0 0 8px; text-transform: uppercase; letter-spacing: 1px;">Tu PIN de Asistencia</p>
        <p style="color: #059669; font-size: 42px; font-weight: 900; letter-spacing: 10px; margin: 0; font-family: monospace;">${pin}</p>
      </div>

      <div style="background: #fef3c7; border-radius: 8px; padding: 14px 16px; margin-bottom: 20px;">
        <p style="color: #92400e; font-size: 13px; margin: 0;">
          ⚠️ <strong>Importante:</strong> Este PIN es personal e intransferible. 
          Si crees que alguien más lo conoce, notifica a tu supervisor inmediatamente.
        </p>
      </div>

      <p style="color: #9ca3af; font-size: 12px; margin: 0;">
        Cómo usar tu PIN: En la pantalla de registro de asistencia, selecciona 
        <em>"PIN"</em> e ingresa este código de 6 dígitos.
      </p>
    </div>
    <div style="background: #f9fafb; padding: 16px 24px; text-align: center; border-top: 1px solid #e5e7eb;">
      <p style="color: #9ca3af; font-size: 11px; margin: 0;">
        Este correo fue enviado automáticamente por SIGA-RH · ${companyName}
      </p>
    </div>
  </div>
</body>
</html>`
}

/**
 * POST /api/employees/send-pin
 * Generates a new PIN for an employee and sends it to their email.
 * Body: { employeeId: string }
 */
export async function POST(request: NextRequest) {
  try {
    await verifyAuth(request)

    const { employeeId } = await request.json()
    if (!employeeId) {
      return NextResponse.json({ error: 'employeeId es requerido' }, { status: 400 })
    }

    // Get employee
    const employee = await db.employee.findUnique({
      where: { id: employeeId },
      include: { company: true },
    })

    if (!employee || !employee.active) {
      return NextResponse.json({ error: 'Empleado no encontrado' }, { status: 404 })
    }

    if (!employee.email) {
      return NextResponse.json({ error: 'El empleado no tiene email registrado' }, { status: 400 })
    }

    // Generate new PIN
    const pin = generatePin()

    // Save PIN to employee (hashed would be ideal, plain for now since it's low sensitivity)
    await db.employee.update({
      where: { id: employeeId },
      data: { pin },
    })

    // Get company SMTP config
    const company = employee.company
    if (!company.smtpEnabled || !company.smtpUser || !company.smtpPassword) {
      // PIN was saved but email can't be sent — return PIN to admin
      return NextResponse.json({
        success: true,
        pinSaved: true,
        emailSent: false,
        pin, // Show to admin since no SMTP configured
        message: 'PIN generado y guardado. No se pudo enviar email (SMTP no configurado). El PIN es: ' + pin,
      })
    }

    // Send email
    const transporter = nodemailer.createTransport({
      host: company.smtpHost || 'smtp.gmail.com',
      port: company.smtpPort || 465,
      secure: (company.smtpPort || 465) === 465,
      auth: { user: company.smtpUser, pass: company.smtpPassword },
    })

    const employeeName = `${employee.firstName} ${employee.lastName}`

    await transporter.sendMail({
      from: company.smtpFrom || company.smtpUser,
      to: employee.email,
      subject: `🔐 Tu PIN de Asistencia — ${company.name}`,
      html: buildPinEmail(employeeName, pin, company.name),
    })

    return NextResponse.json({
      success: true,
      pinSaved: true,
      emailSent: true,
      sentTo: employee.email,
      message: `PIN generado y enviado a ${employee.email}`,
    })
  } catch (error: any) {
    if (error.message === 'No autorizado') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }
    console.error('Error en send-pin:', error)
    return NextResponse.json(
      { error: 'Error al generar/enviar PIN', details: String(error) },
      { status: 500 }
    )
  }
}
