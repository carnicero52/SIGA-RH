import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import nodemailer from 'nodemailer'

const TIMEZONE = 'America/Caracas'
const CRON_SECRET = process.env.CRON_SECRET || 'siga-rh-cron-2025'

function formatTime(date: Date, tz: string): string {
  return new Intl.DateTimeFormat('es-VE', {
    timeZone: tz,
    hour: '2-digit',
    minute: '2-digit',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date)
}

function getTodayRange(tz: string): { start: Date; end: Date } {
  const now = new Date()
  const venezuelaNow = new Date(now.toLocaleString('en-US', { timeZone: tz }))

  const start = new Date(venezuelaNow)
  start.setHours(0, 0, 0, 0)

  const end = new Date(venezuelaNow)
  end.setHours(23, 59, 59, 999)

  // Convertir de vuelta a UTC con el offset de Venezuela (-4h)
  const offset = now.getTime() - venezuelaNow.getTime()
  return {
    start: new Date(start.getTime() + offset),
    end: new Date(end.getTime() + offset),
  }
}

async function generateDailyReport(companyId: string) {
  const company = await db.company.findUnique({
    where: { id: companyId },
    include: {
      branches: {
        where: { active: true },
        include: {
          employees: { where: { active: true } },
        },
      },
    },
  })

  if (!company) throw new Error('Empresa no encontrada')

  const { start, end } = getTodayRange(TIMEZONE)

  const attendance = await db.attendanceRecord.findMany({
    where: {
      companyId,
      recordTime: { gte: start, lte: end },
      recordType: 'check_in',
    },
    include: {
      employee: { select: { firstName: true, lastName: true, employeeNumber: true } },
      branch: { select: { name: true } },
    },
    orderBy: { recordTime: 'asc' },
  })

  const totalEmployees = company.branches.reduce((sum, b) => sum + b.employees.length, 0)
  const employeesPresent = new Set(attendance.map((a) => a.employeeId)).size
  const lateCount = attendance.filter((a) => a.status === 'late').length

  const byBranch = company.branches.map((branch) => {
    const branchAttendance = attendance.filter((a) => a.branchId === branch.id)
    const present = new Set(branchAttendance.map((a) => a.employeeId)).size
    const total = branch.employees.length
    return { name: branch.name, present, absent: total - present, total }
  })

  return {
    company: company.name,
    date: formatTime(new Date(), TIMEZONE),
    timezone: TIMEZONE,
    stats: {
      totalEmployees,
      present: employeesPresent,
      absent: totalEmployees - employeesPresent,
      late: lateCount,
      checkIns: attendance.length,
    },
    byBranch,
  }
}

function formatEmailHTML(report: Awaited<ReturnType<typeof generateDailyReport>>): string {
  const { company, date, stats, byBranch } = report
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; background: #f5f5f5; padding: 20px; }
    .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; }
    .header { background: linear-gradient(135deg, #F59E0B, #D97706); color: white; padding: 24px; text-align: center; }
    .header h1 { margin: 0; font-size: 24px; }
    .header p { margin: 8px 0 0; opacity: 0.9; }
    .content { padding: 24px; }
    .stats { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin-bottom: 24px; }
    .stat { text-align: center; padding: 16px; background: #f9fafb; border-radius: 8px; }
    .stat-value { font-size: 28px; font-weight: bold; color: #1f2937; }
    .stat-label { font-size: 12px; color: #6b7280; margin-top: 4px; }
    .branch-table { width: 100%; border-collapse: collapse; }
    .branch-table th, .branch-table td { padding: 12px; text-align: left; border-bottom: 1px solid #e5e7eb; }
    .branch-table th { background: #f9fafb; font-weight: 600; }
    .present { color: #10b981; font-weight: 600; }
    .absent { color: #ef4444; font-weight: 600; }
    .footer { text-align: center; padding: 16px; color: #9ca3af; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>📊 Reporte Diario de Asistencia</h1>
      <p>${company} — ${date}</p>
    </div>
    <div class="content">
      <div class="stats">
        <div class="stat">
          <div class="stat-value">${stats.totalEmployees}</div>
          <div class="stat-label">Total Empleados</div>
        </div>
        <div class="stat">
          <div class="stat-value present">${stats.present}</div>
          <div class="stat-label">Presentes</div>
        </div>
        <div class="stat">
          <div class="stat-value absent">${stats.absent}</div>
          <div class="stat-label">Ausentes</div>
        </div>
      </div>
      <h3 style="margin: 0 0 16px;">📍 Por Sucursal</h3>
      <table class="branch-table">
        <thead>
          <tr>
            <th>Sucursal</th>
            <th>Presentes</th>
            <th>Ausentes</th>
            <th>Total</th>
          </tr>
        </thead>
        <tbody>
          ${byBranch
            .map(
              (b) => `
          <tr>
            <td>${b.name}</td>
            <td class="present">${b.present}</td>
            <td class="absent">${b.absent}</td>
            <td>${b.total}</td>
          </tr>`
            )
            .join('')}
        </tbody>
      </table>
    </div>
    <div class="footer">
      Generado automáticamente por SIGA-RH — Zona horaria: ${stats.totalEmployees > 0 ? TIMEZONE : TIMEZONE}
    </div>
  </div>
</body>
</html>`
}

function formatTelegramMessage(report: Awaited<ReturnType<typeof generateDailyReport>>): string {
  const { company, date, stats, byBranch } = report

  let message = `📊 *REPORTE DIARIO DE ASISTENCIA*\n\n`
  message += `🏢 *${company}*\n`
  message += `📅 ${date}\n\n`
  message += `✅ Presentes: *${stats.present}*\n`
  message += `❌ Ausentes: *${stats.absent}*\n`
  message += `⏰ Retardos: *${stats.late}*\n`
  message += `👥 Total: *${stats.totalEmployees}*\n\n`
  message += `📍 *Por Sucursal:*\n`
  byBranch.forEach((b) => {
    message += `• ${b.name}: ${b.present}/${b.total} presentes\n`
  })
  message += `\n_Enviado por SIGA\\-RH_`

  return message
}

async function sendEmail(
  to: string[],
  subject: string,
  html: string,
  config: { host: string; port: number; user: string; password: string; from: string }
) {
  const transporter = nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.port === 465,
    auth: { user: config.user, pass: config.password },
  })

  await transporter.sendMail({
    from: config.from || config.user,
    to: to.join(','),
    subject,
    html,
  })

  return { success: true }
}

async function sendTelegram(message: string, botToken: string, chatId: string) {
  try {
    const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text: message, parse_mode: 'MarkdownV2' }),
    })
    const data = await response.json()
    return { success: data.ok, data }
  } catch (error) {
    return { success: false, error: String(error) }
  }
}

export async function GET(request: NextRequest) {
  try {
    const secret = request.nextUrl.searchParams.get('secret')
    if (secret !== CRON_SECRET) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const companies = await db.company.findMany({
      where: {
        dailyReportEnabled: true,
        OR: [{ smtpEnabled: true }, { telegramEnabled: true }],
      },
    })

    const results = []

    for (const company of companies) {
      try {
        const report = await generateDailyReport(company.id)
        const companyResult: { company: string; sent: object[] } = {
          company: company.name,
          sent: [],
        }

        if (company.smtpEnabled && company.smtpUser && company.smtpPassword) {
          const recipients =
            company.dailyReportRecipients?.split(',').map((e) => e.trim()) || [company.smtpUser]
          const emailResult = await sendEmail(
            recipients,
            `📊 Reporte Diario - ${company.name}`,
            formatEmailHTML(report),
            {
              host: company.smtpHost || 'smtp.gmail.com',
              port: company.smtpPort || 465,
              user: company.smtpUser,
              password: company.smtpPassword,
              from: company.smtpFrom || company.smtpUser,
            }
          )
          companyResult.sent.push({ channel: 'email', recipients, ...emailResult })
        }

        if (company.telegramEnabled && company.telegramBotToken && company.telegramChatId) {
          const telegramResult = await sendTelegram(
            formatTelegramMessage(report),
            company.telegramBotToken,
            company.telegramChatId
          )
          companyResult.sent.push({
            channel: 'telegram',
            chatId: company.telegramChatId,
            ...telegramResult,
          })
        }

        results.push(companyResult)
      } catch (error) {
        results.push({ company: company.name, error: String(error) })
      }
    }

    return NextResponse.json({
      success: true,
      timezone: TIMEZONE,
      timestamp: new Date().toISOString(),
      processed: companies.length,
      results,
    })
  } catch (error) {
    console.error('Error en cron daily-report:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor', details: String(error) },
      { status: 500 }
    )
  }
}
