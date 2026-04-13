import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

/**
 * POST /api/attendance/public-identify
 * Identify an employee by PIN, phone, or email
 * Used for public check-in without authentication
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { qrCodeId, pin, phone, email } = body

    if (!qrCodeId) {
      return NextResponse.json({ error: 'qrCodeId es requerido' }, { status: 400 })
    }

    // Verify QR code to get company
    const qrCode = await db.qRCode.findFirst({
      where: {
        id: qrCodeId,
        active: true,
        expiresAt: { gt: new Date() },
      },
      include: {
        branch: { select: { id: true, name: true, companyId: true } },
      },
    })

    if (!qrCode) {
      return NextResponse.json({ error: 'Código QR inválido o expirado' }, { status: 400 })
    }

    // Build search criteria
    const searchCriteria: any[] = []

    if (pin) {
      searchCriteria.push({ pin: pin.trim(), active: true })
    }
    if (phone) {
      searchCriteria.push({ phone: { contains: phone.trim() }, active: true })
    }
    if (email) {
      searchCriteria.push({ email: { contains: email.trim().toLowerCase() }, active: true })
    }

    if (searchCriteria.length === 0) {
      return NextResponse.json({ error: 'Proporciona PIN, teléfono o email' }, { status: 400 })
    }

    // Search for employee
    const employee = await db.employee.findFirst({
      where: {
        companyId: qrCode.branch.companyId,
        OR: searchCriteria,
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        employeeNumber: true,
        pin: true,
      },
    })

    if (!employee) {
      return NextResponse.json({ error: 'Empleado no encontrado' }, { status: 404 })
    }

    // Don't expose the actual PIN - just confirm match
    return NextResponse.json({
      employee: {
        id: employee.id,
        firstName: employee.firstName,
        lastName: employee.lastName,
        employeeNumber: employee.employeeNumber,
      },
    })
  } catch (error: any) {
    console.error('Error en identificación pública:', error)
    return NextResponse.json({ error: 'Error al identificar empleado' }, { status: 500 })
  }
}