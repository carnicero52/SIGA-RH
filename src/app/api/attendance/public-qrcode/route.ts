import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const qrcode = searchParams.get('qrcode')

    if (!qrcode) {
      return NextResponse.json(
        { valid: false, error: 'El parámetro qrcode es requerido' },
        { status: 400 }
      )
    }

    // Look up QR code by its UUID code (not id)
    const qrCode = await db.qRCode.findUnique({
      where: { code: qrcode },
      include: {
        branch: {
          select: {
            id: true,
            name: true,
            companyId: true,
          },
        },
      },
    })

    if (!qrCode) {
      return NextResponse.json({
        valid: false,
        error: 'Código QR no encontrado',
      })
    }

    if (!qrCode.active) {
      return NextResponse.json({
        valid: false,
        error: 'Este código QR ha sido desactivado',
      })
    }

    if (new Date() > qrCode.expiresAt) {
      return NextResponse.json({
        valid: false,
        error: 'Este código QR ha expirado',
      })
    }

    // Fetch active employees for the company that owns this branch
    const employees = await db.employee.findMany({
      where: {
        companyId: qrCode.branch.companyId,
        active: true,
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        employeeNumber: true,
      },
      orderBy: [{ firstName: 'asc' }, { lastName: 'asc' }],
    })

    return NextResponse.json({
      valid: true,
      qrId: qrCode.id,
      branchId: qrCode.branchId,
      branchName: qrCode.branch.name,
      employees,
    })
  } catch (error: any) {
    console.error('Error al validar QR público:', error)
    return NextResponse.json(
      { valid: false, error: 'Error al validar el código QR' },
      { status: 500 }
    )
  }
}
