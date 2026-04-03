import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const dateFrom = searchParams.get('dateFrom')
    const dateTo = searchParams.get('dateTo')
    const branchId = searchParams.get('branchId')
    const employeeId = searchParams.get('employeeId')
    const recordType = searchParams.get('recordType')
    const status = searchParams.get('status')

    const where: any = {}

    if (dateFrom || dateTo) {
      where.recordTime = {}
      if (dateFrom) {
        where.recordTime.gte = new Date(dateFrom + 'T00:00:00')
      }
      if (dateTo) {
        where.recordTime.lte = new Date(dateTo + 'T23:59:59')
      }
    }

    if (branchId) where.branchId = branchId
    if (employeeId) where.employeeId = employeeId
    if (recordType) where.recordType = recordType
    if (status) where.status = status

    const [records, total] = await Promise.all([
      db.attendanceRecord.findMany({
        where,
        include: {
          employee: {
            select: { firstName: true, lastName: true, employeeNumber: true },
          },
          branch: {
            select: { name: true },
          },
        },
        orderBy: { recordTime: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.attendanceRecord.count({ where }),
    ])

    return NextResponse.json({
      records,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error: any) {
    console.error('Error fetching attendance records:', error)
    return NextResponse.json({ error: 'Error al obtener los registros' }, { status: 500 })
  }
}
