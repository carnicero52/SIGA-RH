import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

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

    // 1. Validate QR code (active and not expired)
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

    // 2. Validate employee exists and is active
    const employee = await db.employee.findFirst({
      where: { id: employeeId, companyId: qrCode.branch.companyId },
    })

    if (!employee || !employee.active) {
      return NextResponse.json(
        { error: 'Empleado no encontrado o inactivo' },
        { status: 404 }
      )
    }

    // 3. Get branch from QR code
    const branch = await db.branch.findFirst({
      where: { id: qrCode.branchId, companyId: qrCode.branch.companyId },
    })

    if (!branch) {
      return NextResponse.json(
        { error: 'Sucursal no encontrada' },
        { status: 404 }
      )
    }

    // 4. Validate employee belongs to this branch
    if (employee.branchId && employee.branchId !== branch.id) {
      return NextResponse.json(
        { error: 'Este empleado no pertenece a la sucursal de este código QR' },
        { status: 403 }
      )
    }

    // 5. Validate shift schedule — only allow check-in/out within allowed window
    const now = new Date()
    const todayStr = now.toISOString().split('T')[0]
    const currentMinutes = now.getHours() * 60 + now.getMinutes()

    const employeeShiftForValidation = await db.employeeShift.findFirst({
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

    if (employeeShiftForValidation) {
      const shift = employeeShiftForValidation.shift
      const shiftStartMinutes = timeToMinutes(shift.startTime)
      const shiftEndMinutes = timeToMinutes(shift.endTime)
      const tolerance = shift.toleranceMinutes ?? 15
      // Allow check_in from 60 min before shift start up to shift end
      const checkInWindowStart = shiftStartMinutes - 60
      const checkInWindowEnd = shiftEndMinutes
      // Allow check_out from (shift end - 60 min) to (shift end + 120 min)
      const checkOutWindowStart = shiftEndMinutes - 60
      const checkOutWindowEnd = shiftEndMinutes + 120

      if (recordType === 'check_in') {
        if (currentMinutes < checkInWindowStart) {
          const diffMin = checkInWindowStart - currentMinutes
          return NextResponse.json(
            { error: `Aún no es hora de marcar entrada. Tu turno inicia a las ${shift.startTime}. Faltan ${diffMin} minutos.` },
            { status: 400 }
          )
        }
        if (currentMinutes > checkInWindowEnd + tolerance) {
          return NextResponse.json(
            { error: `El período de entrada ya cerró. Tu turno era de ${shift.startTime} a ${shift.endTime}.` },
            { status: 400 }
          )
        }
      } else if (recordType === 'check_out') {
        if (currentMinutes < checkOutWindowStart) {
          const diffMin = checkOutWindowStart - currentMinutes
          return NextResponse.json(
            { error: `Aún no es hora de marcar salida. Tu turno termina a las ${shift.endTime}. Faltan ${diffMin} minutos.` },
            { status: 400 }
          )
        }
        if (currentMinutes > checkOutWindowEnd) {
          return NextResponse.json(
            { error: `El período de salida ya cerró. Contacta a tu supervisor.` },
            { status: 400 }
          )
        }
      }
    }
    // If no shift assigned, allow check-in (admin can configure shift later)

    // 6. Geofence check
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

    // 5. Detect duplicate
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
        },
        orderBy: { recordTime: 'desc' },
      })

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

    // 7. Determine status based on shift (reuse already-fetched shift)
    let status = 'on_time'
    let scheduledTime: Date | null = null
    let minutesDiff: number | null = null

    const employeeShift = employeeShiftForValidation

    if (employeeShift) {
      const shift = employeeShift.shift

      if (recordType === 'check_in') {
        const shiftStartMinutes = timeToMinutes(shift.startTime)
        const tolerance = shift.toleranceMinutes
        minutesDiff = currentMinutes - shiftStartMinutes

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

        scheduledTime = new Date(now)
        scheduledTime.setHours(Math.floor(shiftEndMinutes / 60), shiftEndMinutes % 60, 0, 0)

        if (currentMinutes < shiftEndMinutes - 30) {
          status = 'early_departure'
        } else {
          status = 'on_time'
        }
      }
    }
    // If no shift assigned, default to 'on_time'

    // 7. Create AttendanceRecord
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
        notes: null,
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

    // 8. Create notification
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

    // 9. Return created record
    return NextResponse.json(attendanceRecord, { status: 201 })
  } catch (error: any) {
    console.error('Error en registro de asistencia pública:', error)
    return NextResponse.json(
      { error: 'Error al procesar el registro de asistencia' },
      { status: 500 }
    )
  }
}
