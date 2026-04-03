import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const severity = searchParams.get('severity')
    const type = searchParams.get('type')
    const employeeId = searchParams.get('employeeId')

    const where: Record<string, unknown> = {}
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
    const body = await request.json()
    const {
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
    } = body

    if (!companyId || !employeeId || !type || !title || !description || !severity || !date) {
      return NextResponse.json(
        { error: 'companyId, employeeId, type, title, description, severity y date son requeridos' },
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
