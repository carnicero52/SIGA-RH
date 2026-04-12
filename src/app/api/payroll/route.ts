import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') || ''

    const company = await db.company.findFirst({ where: { active: true }, orderBy: { createdAt: 'asc' } })
    if (!company) return NextResponse.json({ error: 'Empresa no encontrada' }, { status: 404 })

    const where: any = { companyId: company.id }
    if (status) where.status = status

    const periods = await db.payrollPeriod.findMany({
      where,
      include: {
        _count: { select: { items: true } },
      },
      orderBy: { startDate: 'desc' },
    })

    return NextResponse.json(periods)
  } catch (error) {
    console.error('Payroll GET error:', error)
    return NextResponse.json({ error: 'Error al obtener nóminas' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, frequency, startDate, endDate, currency, notes } = body

    if (!name || !frequency || !startDate || !endDate) {
      return NextResponse.json({ error: 'name, frequency, startDate y endDate son requeridos' }, { status: 400 })
    }

    const company = await db.company.findFirst({ where: { active: true }, orderBy: { createdAt: 'asc' } })
    if (!company) return NextResponse.json({ error: 'Empresa no encontrada' }, { status: 404 })

    const period = await db.payrollPeriod.create({
      data: {
        companyId: company.id,
        name,
        frequency,
        startDate,
        endDate,
        currency: currency || 'USD',
        notes: notes || null,
        status: 'draft',
        totalAmount: 0,
      },
    })

    return NextResponse.json(period, { status: 201 })
  } catch (error) {
    console.error('Payroll POST error:', error)
    return NextResponse.json({ error: 'Error al crear período de nómina' }, { status: 500 })
  }
}
