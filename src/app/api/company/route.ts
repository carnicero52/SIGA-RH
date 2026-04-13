import { db } from '@/lib/db'
import { getAuthPayload } from '@/lib/server-auth'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const { companyId } = getAuthPayload(request)

    const company = await db.company.findUnique({
      where: { id: companyId },
    })

    if (!company) {
      return NextResponse.json({ error: 'Empresa no encontrada' }, { status: 404 })
    }

    return NextResponse.json(company)
  } catch (error: any) {
    console.error('Company GET error:', error)
    return NextResponse.json({ error: 'Error al obtener empresa' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { companyId } = getAuthPayload(request)
    const body = await request.json()

    const existing = await db.company.findUnique({ where: { id: companyId } })
    if (!existing) {
      return NextResponse.json({ error: 'Empresa no encontrada' }, { status: 404 })
    }

    const company = await db.company.update({
      where: { id: companyId },
      data: {
        ...(body.name !== undefined && { name: body.name }),
        ...(body.taxId !== undefined && { taxId: body.taxId || null }),
        ...(body.logo !== undefined && { logo: body.logo || null }),
        ...(body.address !== undefined && { address: body.address || null }),
        ...(body.city !== undefined && { city: body.city || null }),
        ...(body.state !== undefined && { state: body.state || null }),
        ...(body.country !== undefined && { country: body.country }),
        ...(body.phone !== undefined && { phone: body.phone || null }),
        ...(body.email !== undefined && { email: body.email || null }),
        ...(body.website !== undefined && { website: body.website || null }),
        // Branding
        ...(body.slug !== undefined && { slug: body.slug || null }),
        ...(body.slogan !== undefined && { slogan: body.slogan || null }),
        ...(body.brandColor !== undefined && { brandColor: body.brandColor }),
        ...(body.timezone !== undefined && { timezone: body.timezone }),
        // SMTP
        ...(body.smtpHost !== undefined && { smtpHost: body.smtpHost || null }),
        ...(body.smtpPort !== undefined && { smtpPort: body.smtpPort ? Number(body.smtpPort) : null }),
        ...(body.smtpUser !== undefined && { smtpUser: body.smtpUser || null }),
        ...(body.smtpPassword !== undefined && { smtpPassword: body.smtpPassword || null }),
        ...(body.smtpFrom !== undefined && { smtpFrom: body.smtpFrom || null }),
        ...(body.smtpEnabled !== undefined && { smtpEnabled: Boolean(body.smtpEnabled) }),
        // Telegram
        ...(body.telegramBotToken !== undefined && { telegramBotToken: body.telegramBotToken || null }),
        ...(body.telegramChatId !== undefined && { telegramChatId: body.telegramChatId || null }),
        ...(body.telegramEnabled !== undefined && { telegramEnabled: Boolean(body.telegramEnabled) }),
        // Reportes
        ...(body.dailyReportEnabled !== undefined && { dailyReportEnabled: Boolean(body.dailyReportEnabled) }),
        ...(body.dailyReportTime !== undefined && { dailyReportTime: body.dailyReportTime }),
        ...(body.dailyReportRecipients !== undefined && { dailyReportRecipients: body.dailyReportRecipients || null }),
      },
    })

    return NextResponse.json(company)
  } catch (error: any) {
    console.error('Company PUT error:', error)
    return NextResponse.json({ error: 'Error al actualizar empresa' }, { status: 500 })
  }
}
