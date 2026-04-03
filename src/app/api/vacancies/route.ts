import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')

    const where: any = {}
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
    const body = await request.json()
    const {
      companyId,
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

    if (!companyId || !title) {
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
