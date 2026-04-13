import { db } from '@/lib/db'
import { getAuthPayload } from '@/lib/server-auth'
import { NextRequest, NextResponse } from 'next/server'

/**
 * DELETE /api/admin/clear
 * Clears records by type for the company.
 * Body: { type: 'attendance' | 'incidents' | 'notifications' | 'candidates', dateFrom?: string, dateTo?: string }
 */
export async function DELETE(request: NextRequest) {
  try {
    const { companyId } = getAuthPayload(request)

    const body = await request.json()
    const { type, dateFrom, dateTo } = body

    if (!type) {
      return NextResponse.json({ error: 'type es requerido' }, { status: 400 })
    }

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
    if (error.message === 'No autorizado' || error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }
    console.error('Error en clear:', error)
    return NextResponse.json({ error: 'Error al limpiar registros', details: String(error) }, { status: 500 })
  }
}
