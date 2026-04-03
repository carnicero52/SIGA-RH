import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'
import { v4 as uuidv4 } from 'uuid'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const branchId = searchParams.get('branchId')

    if (!branchId) {
      return NextResponse.json({ error: 'branchId es requerido' }, { status: 400 })
    }

    const qrcodes = await db.qRCode.findMany({
      where: {
        branchId,
        active: true,
        expiresAt: { gt: new Date() },
      },
      include: {
        branch: { select: { name: true } },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(qrcodes)
  } catch (error: any) {
    console.error('Error fetching QR codes:', error)
    return NextResponse.json({ error: 'Error al obtener los códigos QR' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { branchId } = body

    if (!branchId) {
      return NextResponse.json({ error: 'branchId es requerido' }, { status: 400 })
    }

    const branch = await db.branch.findUnique({ where: { id: branchId } })
    if (!branch) {
      return NextResponse.json({ error: 'Sucursal no encontrada' }, { status: 404 })
    }

    // Deactivate old QR codes for this branch
    await db.qRCode.updateMany({
      where: { branchId, active: true },
      data: { active: false },
    })

    const expiresAt = new Date()
    expiresAt.setHours(expiresAt.getHours() + 24)

    const qrcode = await db.qRCode.create({
      data: {
        branchId,
        code: uuidv4(),
        expiresAt,
      },
      include: {
        branch: { select: { name: true } },
      },
    })

    return NextResponse.json(qrcode, { status: 201 })
  } catch (error: any) {
    console.error('Error generating QR code:', error)
    return NextResponse.json({ error: 'Error al generar el código QR' }, { status: 500 })
  }
}
