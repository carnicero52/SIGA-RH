import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

const SECRET = process.env.SUPERADMIN_SECRET || 'siga-superadmin-2025'

export async function GET(request: NextRequest) {
  const secret = request.nextUrl.searchParams.get('secret')
  if (secret !== SECRET) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  try {
    const companies = await db.company.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: {
            employees: { where: { active: true } },
            branches: { where: { active: true } },
            departments: { where: { active: true } },
            attendanceRecords: true,
          },
        },
      },
    })
    
    // Add activeEmployees computed field
    const companiesWithStats = companies.map(c => ({
      ...c,
      activeEmployees: c._count.employees,
      activeBranches: c._count.branches,
      activeDepartments: c._count.departments,
    }))
    
    return NextResponse.json(companiesWithStats)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
