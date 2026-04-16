import { db } from '@/lib/db'
import { getAuthPayload } from '@/lib/server-auth'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const { companyId } = getAuthPayload(request)

    const company = await db.company.findUnique({
      where: { id: companyId },
      select: { active: true, planStatus: true }
    })
    if (!company || company.active === false) {
      return NextResponse.json({ error: 'Cuenta suspendida' }, { status: 403 })
    }
    if (company.planStatus === 'suspended') {
      return NextResponse.json({ error: 'Plan suspendido' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const severity = searchParams.get('severity')
    const type = searchParams.get('type')
    const employeeId = searchParams.get('employeeId')

    const where: Record<string, unknown> = { companyId }
    if (status) where.status = status
    if (severity) where.severity = severity
    if (type) where.type = type
    if (employeeId) where.employeeId = employeeId

    const incidents = await db.incident.findMany({
      where,
      orderBy: { date: 'desc' },
      include: {
        employee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            employeeNumber: true,
          },
        },
      },
    })

    return NextResponse.json(incidents)
  } catch (error: any) {
    console.error('List incidents error:', error)
    return NextResponse.json({ error: 'Error al obtener incidencias' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { companyId } = getAuthPayload(request)

    const company = await db.company.findUnique({
      where: { id: companyId },
      select: { active: true, planStatus: true }
    })
    if (!company || company.active === false) {
      return NextResponse.json({ error: 'Cuenta suspendida' }, { status: 403 })
    }
    if (company.planStatus === 'suspended') {
      return NextResponse.json({ error: 'Plan suspendido' }, { status: 403 })
    }

    const body = await request.json()
    const {
      employeeId,
      reportedBy,
      type,
      title,
      description,
      severity,
      date,
      witnesses,
      sanctions,
    } = body

    if (!employeeId || !type || !title || !description || !severity || !date) {
      return NextResponse.json(
        { error: 'employeeId, type, title, description, severity y date son requeridos' },
        { status: 400 }
      )
    }

    const incident = await db.incident.create({
      data: {
        companyId,
        employeeId,
        reportedBy,
        type,
        title,
        description,
        severity,
        date,
        witnesses,
        sanctions,
        status: 'open',
      },
      include: {
        employee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            employeeNumber: true,
          },
        },
      },
    })

    return NextResponse.json(incident, { status: 201 })
  } catch (error: any) {
    console.error('Create incident error:', error)
    return NextResponse.json({ error: 'Error al crear incidencia' }, { status: 500 })
  }
}
