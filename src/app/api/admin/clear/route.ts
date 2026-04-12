import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'
import { jwtVerify } from 'jose'

async function verifyAuth(request: NextRequest) {
  const authHeader = request.headers.get('Authorization')
  if (!authHeader?.startsWith('Bearer ')) throw new Error('No autorizado')
  const token = authHeader.split(' ')[1]
  const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'siga-rh-secret-key-2024')
  await jwtVerify(token, secret)
}

/**
 * DELETE /api/admin/clear
 * Clears records by type for the company.
 * Body: { type: 'attendance' | 'incidents' | 'notifications' | 'candidates', dateFrom?: string, dateTo?: string }
 */
export async function DELETE(request: NextRequest) {
  try {
    await verifyAuth(request)

    const body = await request.json()
    const { type, dateFrom, dateTo } = body

    if (!type) {
      return NextResponse.json({ error: 'type es requerido' }, { status: 400 })
    }

    // Get company id
    const company = await db.company.findFirst({ where: { active: true }, orderBy: { createdAt: 'asc' } })
    if (!company) return NextResponse.json({ error: 'Empresa no encontrada' }, { status: 404 })

    const companyId = company.id

    // Build date filter if provided
    const dateFilter: any = {}
    if (dateFrom || dateTo) {
      if (dateFrom) dateFilter.gte = new Date(dateFrom)
      if (dateTo) {
        const end = new Date(dateTo)
        end.setHours(23, 59, 59, 999)
        dateFilter.lte = end
      }
    }

    let deletedCount = 0

    switch (type) {
      case 'attendance': {
        const where: any = { companyId }
        if (Object.keys(dateFilter).length > 0) where.recordTime = dateFilter
        const result = await db.attendanceRecord.deleteMany({ where })
        deletedCount = result.count
        break
      }
      case 'incidents': {
        const where: any = { companyId }
        if (Object.keys(dateFilter).length > 0) where.createdAt = dateFilter
        const result = await db.incident.deleteMany({ where })
        deletedCount = result.count
        break
      }
      case 'notifications': {
        const where: any = { companyId }
        if (Object.keys(dateFilter).length > 0) where.createdAt = dateFilter
        const result = await db.appNotification.deleteMany({ where })
        deletedCount = result.count
        break
      }
      case 'candidates': {
        const where: any = { companyId }
        if (Object.keys(dateFilter).length > 0) where.createdAt = dateFilter
        const result = await db.candidate.deleteMany({ where })
        deletedCount = result.count
        break
      }
      case 'contracts': {
        const where: any = { companyId }
        if (Object.keys(dateFilter).length > 0) where.createdAt = dateFilter
        const result = await db.contract.deleteMany({ where })
        deletedCount = result.count
        break
      }
      default:
        return NextResponse.json({ error: `Tipo no válido: ${type}` }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      type,
      deletedCount,
      message: `Se eliminaron ${deletedCount} registros de ${type}`,
    })
  } catch (error: any) {
    if (error.message === 'No autorizado') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }
    console.error('Error en clear:', error)
    return NextResponse.json({ error: 'Error al limpiar registros', details: String(error) }, { status: 500 })
  }
}
