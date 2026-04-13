import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAuthPayload } from '@/lib/server-auth'

export async function POST(request: NextRequest) {
  try {
    const { companyId } = getAuthPayload(request)

    const company = await db.company.findFirst({
      where: { id: companyId, active: true },
    })

    if (!company) {
      return NextResponse.json({ error: 'Empresa no encontrada' }, { status: 404 })
    }

    if (!company.telegramBotToken || !company.telegramChatId) {
      return NextResponse.json(
        { error: 'Configura el Bot Token y Chat ID de Telegram primero' },
        { status: 400 }
      )
    }

    const date = new Date().toLocaleDateString('es-VE', {
      timeZone: 'America/Caracas',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })

    const message =
      `✅ *Prueba de Telegram \\- SIGA\\-RH*\n\n` +
      `¡Funciona\\! Tu configuración de Telegram es correcta\\.\n\n` +
      `🏢 Empresa: *${company.name.replace(/[_*[\]()~`>#+\-=|{}.!]/g, '\\$&')}*\n` +
      `📅 Fecha: ${date.replace(/[_*[\]()~`>#+\-=|{}.!]/g, '\\$&')}\n\n` +
      `_Este es un mensaje de prueba enviado desde SIGA\\-RH_`

    const response = await fetch(
      `https://api.telegram.org/bot${company.telegramBotToken}/sendMessage`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: company.telegramChatId,
          text: message,
          parse_mode: 'MarkdownV2',
        }),
      }
    )

    const data = await response.json()

    if (!data.ok) {
      return NextResponse.json(
        { success: false, error: 'Error de Telegram API', details: data.description },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Mensaje enviado a Telegram correctamente',
      details: {
        chatId: company.telegramChatId,
        messageId: data.result?.message_id,
        timestamp: new Date().toISOString(),
      },
    })
  } catch (error) {
    console.error('Error en test-telegram:', error)
    return NextResponse.json(
      { error: 'Error al enviar mensaje de Telegram', details: String(error) },
      { status: 500 }
    )
  }
}
