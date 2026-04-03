import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const employeeId = searchParams.get('employeeId')

    const where: Record<string, unknown> = {}
    if (status) where.status = status
    if (employeeId) where.employeeId = employeeId

    const contracts = await db.contract.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        template: {
          select: { id: true, name: true, type: true },
        },
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

    return NextResponse.json(contracts)
  } catch (error: any) {
    console.error('List contracts error:', error)
    return NextResponse.json({ error: 'Error al obtener contratos' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { templateId, employeeId, companyId, startDate, endDate, notes } = body

    if (!templateId || !employeeId || !companyId || !startDate) {
      return NextResponse.json(
        { error: 'templateId, employeeId, companyId y startDate son requeridos' },
        { status: 400 }
      )
    }

    // Get template to copy content
    const template = await db.contractTemplate.findUnique({
      where: { id: templateId },
    })

    if (!template) {
      return NextResponse.json({ error: 'Plantilla no encontrada' }, { status: 404 })
    }

    // Calculate endDate if not provided
    let finalEndDate = endDate
    if (!finalEndDate && template.defaultDurationDays) {
      const start = new Date(startDate)
      start.setDate(start.getDate() + template.defaultDurationDays)
      finalEndDate = start.toISOString().split('T')[0]
    }

    const contract = await db.contract.create({
      data: {
        templateId,
        employeeId,
        companyId,
        content: template.content,
        startDate,
        endDate: finalEndDate,
        status: 'active',
        notes,
      },
      include: {
        template: {
          select: { id: true, name: true, type: true },
        },
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

    return NextResponse.json(contract, { status: 201 })
  } catch (error: any) {
    console.error('Create contract error:', error)
    return NextResponse.json({ error: 'Error al crear contrato' }, { status: 500 })
  }
}
