import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

export async function GET() {
  try {
    const templates = await db.contractTemplate.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: { contracts: true },
        },
      },
    })

    return NextResponse.json(templates)
  } catch (error: any) {
    console.error('List contract templates error:', error)
    return NextResponse.json({ error: 'Error al obtener plantillas' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { companyId, name, type, content, defaultDurationDays } = body

    if (!companyId || !name || !type || !content) {
      return NextResponse.json(
        { error: 'companyId, name, type y content son requeridos' },
        { status: 400 }
      )
    }

    const template = await db.contractTemplate.create({
      data: {
        companyId,
        name,
        type,
        content,
        defaultDurationDays: defaultDurationDays ? parseInt(defaultDurationDays, 10) : null,
        active: true,
      },
      include: {
        _count: {
          select: { contracts: true },
        },
      },
    })

    return NextResponse.json(template, { status: 201 })
  } catch (error: any) {
    console.error('Create contract template error:', error)
    return NextResponse.json({ error: 'Error al crear plantilla' }, { status: 500 })
  }
}
