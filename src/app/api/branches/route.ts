import { db } from '@/lib/db'
import { getAuthPayload } from '@/lib/server-auth'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const { companyId } = getAuthPayload(request)

    const branches = await db.branch.findMany({
      where: { active: true, companyId },
      include: {
        _count: {
          select: { employees: true, attendanceRecords: true },
        },
      },
      orderBy: { name: 'asc' },
    })
    return NextResponse.json(branches)
  } catch (error: any) {
    console.error('List branches error:', error)
    return NextResponse.json({ error: 'Error al obtener sucursales' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { companyId } = getAuthPayload(request)
    const body = await request.json()
    const { name, code, address, city, state, latitude, longitude, geofenceRadius, phone, managerName } = body

    if (!name) {
      return NextResponse.json({ error: 'El nombre y la empresa son requeridos' }, { status: 400 })
    }

    const branch = await db.branch.create({
      data: {
        companyId,
        name,
        code: code || null,
        address: address || null,
        city: city || null,
        state: state || null,
        latitude: Number(latitude) || 0,
        longitude: Number(longitude) || 0,
        geofenceRadius: Number(geofenceRadius) || 100,
        phone: phone || null,
        managerName: managerName || null,
      },
    })

    return NextResponse.json(branch, { status: 201 })
  } catch (error: any) {
    console.error('Create branch error:', error)
    return NextResponse.json({ error: 'Error al crear sucursal' }, { status: 500 })
  }
}
