import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

const SUPERADMIN_SECRET = process.env.SUPERADMIN_SECRET || 'siga-superadmin-2025'

function verifySuperAdmin(request: NextRequest) {
  const secret =
    request.headers.get('x-superadmin-secret') ||
    request.nextUrl.searchParams.get('secret')
  if (secret !== SUPERADMIN_SECRET) throw new Error('No autorizado')
}

/**
 * GET /api/superadmin/companies
 * Returns all companies with usage stats for the super-admin dashboard.
 */
export async function GET(request: NextRequest) {
  try {
    verifySuperAdmin(request)

    const companies = await db.company.findMany({
      include: {
        _count: {
          select: {
            employees: true,
            branches: true,
            attendanceRecords: true,
            users: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    // Enrich with active employee count (active: true)
    const enriched = await Promise.all(companies.map(async (c) => {
      const activeEmployees = await db.employee.count({
        where: { companyId: c.id, active: true },
      })
      const lastActivity = await db.attendanceRecord.findFirst({
        where: { companyId: c.id },
        orderBy: { recordTime: 'desc' },
        select: { recordTime: true },
      })
      return {
        ...c,
        activeEmployees,
        lastActivityAt: lastActivity?.recordTime || null,
        // Mask sensitive SMTP passwords
        smtpPassword: c.smtpPassword ? '••••••••' : null,
      }
    }))

    return NextResponse.json(enriched)
  } catch (error: any) {
    if (error.message === 'No autorizado') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }
    console.error('SuperAdmin GET error:', error)
    return NextResponse.json({ error: 'Error al obtener empresas: ' + error.message }, { status: 500 })
  }
}
