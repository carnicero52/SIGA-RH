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

    const where: any = { companyId }
    if (status) {
      where.status = status
    }

    const vacancies = await db.vacant.findMany({
      where,
      include: {
        department: { select: { id: true, name: true } },
        position: { select: { id: true, name: true } },
        _count: { select: { candidates: true } },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(vacancies)
  } catch (error: any) {
    console.error('Vacancies GET error:', error)
    return NextResponse.json({ error: 'Error al obtener vacantes' }, { status: 500 })
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
      departmentId,
      positionId,
      title,
      description,
      requirements,
      salaryMin,
      salaryMax,
      employmentType,
      location,
      vacanciesCount,
    } = body

    if (!title) {
      return NextResponse.json({ error: 'Empresa y título son requeridos' }, { status: 400 })
    }

    const vacant = await db.vacant.create({
      data: {
        companyId,
        departmentId: departmentId || null,
        positionId: positionId || null,
        title,
        description: description || null,
        requirements: requirements || null,
        salaryMin: salaryMin ? parseFloat(salaryMin) : null,
        salaryMax: salaryMax ? parseFloat(salaryMax) : null,
        employmentType: employmentType || 'full_time',
        location: location || null,
        vacanciesCount: vacanciesCount ? parseInt(vacanciesCount) : 1,
        publishedAt: new Date(),
      },
      include: {
        department: { select: { id: true, name: true } },
        position: { select: { id: true, name: true } },
        _count: { select: { candidates: true } },
      },
    })

    return NextResponse.json(vacant, { status: 201 })
  } catch (error: any) {
    console.error('Vacancies POST error:', error)
    return NextResponse.json({ error: 'Error al crear vacante' }, { status: 500 })
  }
}
