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
    const unread = searchParams.get('unread')

    const where: any = { companyId }
    if (unread === 'true') {
      where.read = false
    }

    const notifications = await db.appNotification.findMany({
      where,
      include: {
        employee: {
          select: { id: true, firstName: true, lastName: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    })

    return NextResponse.json(notifications)
  } catch (error: any) {
    console.error('Notifications GET error:', error)
    return NextResponse.json({ error: 'Error al obtener notificaciones' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
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

    // Mark all as read
    if (body.markAllRead) {
      await db.appNotification.updateMany({
        where: { companyId, read: false },
        data: { read: true },
      })

      return NextResponse.json({ success: true, message: 'Todas las notificaciones marcadas como leídas' })
    }

    // Mark single notification as read
    const { id } = body
    if (!id) {
      return NextResponse.json({ error: 'ID de notificación requerido' }, { status: 400 })
    }

    const existing = await db.appNotification.findFirst({ where: { id, companyId } })
    if (!existing) {
      return NextResponse.json({ error: 'Notificación no encontrada' }, { status: 404 })
    }

    await db.appNotification.update({
      where: { id: existing.id },
      data: { read: true },
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Notifications PUT error:', error)
    return NextResponse.json({ error: 'Error al actualizar notificaciones' }, { status: 500 })
  }
}
