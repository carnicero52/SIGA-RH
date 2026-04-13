import { db } from '@/lib/db'
import { getAuthPayload } from '@/lib/server-auth'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { companyId } = getAuthPayload(_request)
    const { id } = await params
    const branch = await db.branch.findFirst({
      where: { id, companyId },
      include: {
        _count: {
          select: { employees: true, attendanceRecords: true },
        },
      },
    })

    if (!branch) {
      return NextResponse.json({ error: 'Sucursal no encontrada' }, { status: 404 })
    }

    return NextResponse.json(branch)
  } catch (error: any) {
    console.error('Get branch error:', error)
    return NextResponse.json({ error: 'Error al obtener sucursal' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { companyId } = getAuthPayload(request)
    const { id } = await params
    const body = await request.json()
    const { name, code, address, city, state, latitude, longitude, geofenceRadius, phone, managerName } = body

    const existing = await db.branch.findFirst({ where: { id, companyId } })
    if (!existing) {
      return NextResponse.json({ error: 'Sucursal no encontrada' }, { status: 404 })
    }

    const branch = await db.branch.update({
      where: { id: existing.id },
      data: {
        ...(name !== undefined && { name }),
        ...(code !== undefined && { code: code || null }),
        ...(address !== undefined && { address: address || null }),
        ...(city !== undefined && { city: city || null }),
        ...(state !== undefined && { state: state || null }),
        ...(latitude !== undefined && { latitude: Number(latitude) }),
        ...(longitude !== undefined && { longitude: Number(longitude) }),
        ...(geofenceRadius !== undefined && { geofenceRadius: Number(geofenceRadius) }),
        ...(phone !== undefined && { phone: phone || null }),
        ...(managerName !== undefined && { managerName: managerName || null }),
      },
    })

    return NextResponse.json(branch)
  } catch (error: any) {
    console.error('Update branch error:', error)
    return NextResponse.json({ error: 'Error al actualizar sucursal' }, { status: 500 })
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { companyId } = getAuthPayload(_request)
    const { id } = await params
    const existing = await db.branch.findFirst({ where: { id, companyId } })
    if (!existing) {
      return NextResponse.json({ error: 'Sucursal no encontrada' }, { status: 404 })
    }

    const branch = await db.branch.update({
      where: { id: existing.id },
      data: { active: false },
    })
    return NextResponse.json(branch)
  } catch (error: any) {
    console.error('Delete branch error:', error)
    return NextResponse.json({ error: 'Error al desactivar sucursal' }, { status: 500 })
  }
}
