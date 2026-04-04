import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'
import { jwtVerify } from 'jose'

function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLon = ((lon2 - lon1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

function timeToMinutes(timeStr: string): number {
  const [hours, minutes] = timeStr.split(':').map(Number)
  return hours * 60 + minutes
}

export async function POST(request: NextRequest) {
  try {
    // 1. Validate auth
    const authHeader = request.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }
    const token = authHeader.split(' ')[1]
    const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'siga-rh-secret-key-2024')
    const { payload } = await jwtVerify(token, secret)

    const userId = payload.userId as string

    // Parse request body
    const body = await request.json()
    const {
      qrCodeId,
      employeeId,
      recordType,
      latitude,
      longitude,
      gpsAccuracy,
      selfieData,
      deviceInfo,
      notes,
    } = body

    if (!qrCodeId || !employeeId || !recordType) {
      return NextResponse.json(
        { error: 'qrCodeId, employeeId y recordType son requeridos' },
        { status: 400 }
      )
    }

    if (!['check_in', 'check_out'].includes(recordType)) {
      return NextResponse.json(
        { error: 'recordType debe ser check_in o check_out' },
        { status: 400 }
      )
    }

    // 2. Validate QR code
    const qrCode = await db.qRCode.findFirst({
      where: {
        id: qrCodeId,
        active: true,
        expiresAt: { gt: new Date() },
      },
    })

    if (!qrCode) {
      return NextResponse.json(
        { error: 'Código QR inválido o expirado' },
        { status: 400 }
      )
    }

    // 3. Validate employee
    const employee = await db.employee.findUnique({
      where: { id: employeeId },
    })

    if (!employee || !employee.active) {
      return NextResponse.json(
        { error: 'Empleado no encontrado o inactivo' },
        { status: 404 }
      )
    }

    // 4. Get branch from QR
    const branch = await db.branch.findUnique({
      where: { id: qrCode.branchId },
    })

    if (!branch) {
      return NextResponse.json(
        { error: 'Sucursal no encontrada' },
        { status: 404 }
      )
    }

    // 5. Geofence check
    const fraudFlags: string[] = []

    if (latitude != null && longitude != null) {
      const distance = haversineDistance(
        latitude,
        longitude,
        branch.latitude,
        branch.longitude
      )

      if (distance > branch.geofenceRadius) {
        fraudFlags.push('outside_geofence')
      }
    }

    // 6. Detect duplicate
    const todayStart = new Date()
    todayStart.setHours(0, 0, 0, 0)

    const todayEnd = new Date()
    todayEnd.setHours(23, 59, 59, 999)

    if (recordType === 'check_in') {
      const pendingCheckIn = await db.attendanceRecord.findFirst({
        where: {
          employeeId,
          branchId: branch.id,
          recordType: 'check_in',
          recordTime: { gte: todayStart, lte: todayEnd },
          // No matching check_out: there is no check_out record for this employee/branch today
          // that came after this check_in. We check by looking for a check_in that doesn't
          // have a corresponding check_out.
        },
        orderBy: { recordTime: 'desc' },
      })

      // Check if the latest record is a check_in without a matching check_out
      if (pendingCheckIn) {
        const matchingCheckOut = await db.attendanceRecord.findFirst({
          where: {
            employeeId,
            branchId: branch.id,
            recordType: 'check_out',
            recordTime: { gte: pendingCheckIn.recordTime, lte: todayEnd },
          },
        })

        if (!matchingCheckOut) {
          return NextResponse.json(
            { error: 'Ya tienes un registro de entrada pendiente' },
            { status: 400 }
          )
        }
      }
    } else if (recordType === 'check_out') {
      // Find the latest check_in without a check_out
      const lastCheckIn = await db.attendanceRecord.findFirst({
        where: {
          employeeId,
          branchId: branch.id,
          recordType: 'check_in',
          recordTime: { gte: todayStart, lte: todayEnd },
        },
        orderBy: { recordTime: 'desc' },
      })

      if (!lastCheckIn) {
        return NextResponse.json(
          { error: 'No tienes un registro de entrada para marcar salida' },
          { status: 400 }
        )
      }

      // Check if it already has a check_out
      const existingCheckOut = await db.attendanceRecord.findFirst({
        where: {
          employeeId,
          branchId: branch.id,
          recordType: 'check_out',
          recordTime: { gte: lastCheckIn.recordTime, lte: todayEnd },
        },
      })

      if (existingCheckOut) {
        return NextResponse.json(
          { error: 'Ya tienes un registro de salida para esta entrada' },
          { status: 400 }
        )
      }
    }

    // 7. Determine status
    const now = new Date()
    const currentMinutes = now.getHours() * 60 + now.getMinutes()
    let status = 'on_time'
    let scheduledTime: Date | null = null
    let minutesDiff: number | null = null

    // Get employee's current shift
    const todayStr = now.toISOString().split('T')[0]
    const employeeShift = await db.employeeShift.findFirst({
      where: {
        employeeId,
        active: true,
        effectiveDate: { lte: todayStr },
        OR: [{ endDate: null }, { endDate: { gte: todayStr } }],
      },
      include: { shift: true },
      orderBy: { effectiveDate: 'desc' },
      take: 1,
    })

    if (employeeShift) {
      const shift = employeeShift.shift

      if (recordType === 'check_in') {
        const shiftStartMinutes = timeToMinutes(shift.startTime)
        const tolerance = shift.toleranceMinutes
        minutesDiff = currentMinutes - shiftStartMinutes

        // Set scheduled time for today
        scheduledTime = new Date(now)
        scheduledTime.setHours(Math.floor(shiftStartMinutes / 60), shiftStartMinutes % 60, 0, 0)

        if (minutesDiff <= tolerance) {
          status = 'on_time'
        } else {
          status = 'late'
        }
      } else if (recordType === 'check_out') {
        const shiftEndMinutes = timeToMinutes(shift.endTime)
        minutesDiff = currentMinutes - shiftEndMinutes

        // Set scheduled time for today
        scheduledTime = new Date(now)
        scheduledTime.setHours(Math.floor(shiftEndMinutes / 60), shiftEndMinutes % 60, 0, 0)

        // Early departure: leaving more than 30 minutes before shift end
        if (currentMinutes < shiftEndMinutes - 30) {
          status = 'early_departure'
        } else {
          status = 'on_time'
        }
      }
    }

    // 8. Create AttendanceRecord
    const attendanceRecord = await db.attendanceRecord.create({
      data: {
        companyId: employee.companyId,
        branchId: branch.id,
        employeeId,
        qrCodeId: qrCode.id,
        recordType,
        recordTime: now,
        scheduledTime,
        latitude: latitude ?? null,
        longitude: longitude ?? null,
        gpsAccuracy: gpsAccuracy ?? null,
        selfieUrl: selfieData || null,
        status,
        minutesDiff,
        fraudFlags: fraudFlags.length > 0 ? JSON.stringify(fraudFlags) : null,
        deviceInfo: deviceInfo || null,
        notes: notes || null,
      },
      include: {
        employee: {
          select: {
            firstName: true,
            lastName: true,
            employeeNumber: true,
          },
        },
        branch: {
          select: {
            name: true,
          },
        },
      },
    })

    // 9. Create notification
    const recordTypeLabel = recordType === 'check_in' ? 'entrada' : 'salida'
    const statusLabels: Record<string, string> = {
      on_time: 'a tiempo',
      late: 'tarde',
      early_departure: 'salida anticipada',
    }
    const statusLabel = statusLabels[status] || status

    await db.appNotification.create({
      data: {
        companyId: employee.companyId,
        type: 'attendance',
        title: 'Registro de Asistencia',
        message: `${employee.firstName} ${employee.lastName} registró ${recordTypeLabel} en ${branch.name} - ${statusLabel}`,
      },
    })

    // 10. Return created record
    return NextResponse.json(attendanceRecord, { status: 201 })
  } catch (error: any) {
    console.error('Error en registro de asistencia:', error)
    if (error.name === 'JWTExpired' || error.name === 'JWTInvalid') {
      return NextResponse.json({ error: 'Token inválido o expirado' }, { status: 401 })
    }
    return NextResponse.json(
      { error: 'Error al procesar el registro de asistencia' },
      { status: 500 }
    )
  }
}
