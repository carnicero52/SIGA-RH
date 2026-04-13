import { db } from '@/lib/db'
import { getAuthPayload } from '@/lib/server-auth'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const { companyId } = getAuthPayload(request)

    const templates = await db.contractTemplate.findMany({
      where: { companyId },
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
    const { companyId } = getAuthPayload(request)

    const body = await request.json()
    const { name, type, content, defaultDurationDays } = body

    if (!name || !type || !content) {
      return NextResponse.json(
        { error: 'name, type y content son requeridos' },
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
