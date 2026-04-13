import { db } from '@/lib/db'
import { getAuthPayload } from '@/lib/server-auth'
import { NextRequest, NextResponse } from 'next/server'

export async function PUT(request: NextRequest) {
  try {
    const { companyId } = getAuthPayload(request)
    const body = await request.json()
    const { id, verifiedBy } = body

    if (!id) {
      return NextResponse.json({ error: 'ID del registro es requerido' }, { status: 400 })
    }

    const record = await db.attendanceRecord.findFirst({ where: { id, companyId } })
    if (!record) {
      return NextResponse.json({ error: 'Registro no encontrado' }, { status: 404 })
    }

    const newVerified = !record.verified

    const updated = await db.attendanceRecord.update({
      where: { id: record.id },
      data: {
        verified: newVerified,
        verifiedBy: newVerified ? (verifiedBy || 'admin') : null,
        verifiedAt: newVerified ? new Date() : null,
      },
    })

    return NextResponse.json(updated)
  } catch (error: any) {
    console.error('Error verifying attendance record:', error)
    return NextResponse.json({ error: 'Error al verificar el registro' }, { status: 500 })
  }
}
