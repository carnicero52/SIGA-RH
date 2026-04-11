import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import nodemailer from 'nodemailer'

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    // Obtener la empresa (single-tenant: primera activa)
    const company = await db.company.findFirst({
      where: { active: true },
      orderBy: { createdAt: 'asc' },
    })

    if (!company) {
      return NextResponse.json({ error: 'Empresa no encontrada' }, { status: 404 })
    }

    if (!company.smtpUser || !company.smtpPassword) {
      return NextResponse.json(
        { error: 'Configura el usuario y contraseña SMTP primero' },
        { status: 400 }
      )
    }

    const testEmailHtml = `
<div style="font-family: Arial, sans-serif; padding: 20px; background: #f5f5f5;">
  <div style="max-width: 500px; margin: 0 auto; background: white; padding: 24px; border-radius: 12px;">
    <h2 style="color: #F59E0B; margin: 0 0 16px;">✅ Email de Prueba</h2>
    <p style="color: #666;">Este es un email de prueba desde <strong>SIGA-RH</strong>.</p>
    <p style="color: #666;">Tu configuración SMTP está funcionando correctamente.</p>
    <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
    <p style="color: #999; font-size: 12px; margin: 0;">
      Enviado desde ${company.smtpHost || 'smtp.gmail.com'}:${company.smtpPort || 465}
    </p>
  </div>
</div>`

    const transporter = nodemailer.createTransport({
      host: company.smtpHost || 'smtp.gmail.com',
      port: company.smtpPort || 465,
      secure: (company.smtpPort || 465) === 465,
      auth: {
        user: company.smtpUser,
        pass: company.smtpPassword,
      },
    })

    await transporter.sendMail({
      from: company.smtpFrom || company.smtpUser,
      to: company.smtpUser,
      subject: '✅ Prueba de configuración SMTP - SIGA-RH',
      html: testEmailHtml,
    })

    return NextResponse.json({
      success: true,
      message: 'Email de prueba enviado correctamente',
      details: {
        from: company.smtpFrom || company.smtpUser,
        to: company.smtpUser,
        host: company.smtpHost || 'smtp.gmail.com',
        port: company.smtpPort || 465,
        subject: '✅ Prueba de configuración SMTP - SIGA-RH',
      },
    })
  } catch (error) {
    console.error('Error en test-email:', error)
    return NextResponse.json(
      { error: 'Error al enviar email de prueba', details: String(error) },
      { status: 500 }
    )
  }
}
