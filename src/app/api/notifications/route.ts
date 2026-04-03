import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const unread = searchParams.get('unread')
    const companyId = searchParams.get('companyId')

    const where: any = {}
    if (companyId) {
      where.companyId = companyId
    }
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
    const body = await request.json()

    // Mark all as read
    if (body.markAllRead) {
      const companyId = body.companyId
      if (!companyId) {
        return NextResponse.json({ error: 'ID de empresa requerido' }, { status: 400 })
      }

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

    const existing = await db.appNotification.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Notificación no encontrada' }, { status: 404 })
    }

    await db.appNotification.update({
      where: { id },
      data: { read: true },
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Notifications PUT error:', error)
    return NextResponse.json({ error: 'Error al actualizar notificaciones' }, { status: 500 })
  }
}
