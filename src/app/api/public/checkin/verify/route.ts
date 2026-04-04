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

    const qrCode = await db.qRCode.findFirst({
      where: {
        code: qrcode,
        active: true,
        expiresAt: { gt: new Date() },
      },
      include: {
        branch: {
          include: {
            company: {
              select: {
                id: true,
                name: true,
                logo: true,
              },
            },
          },
        },
      },
    })

    if (!qrCode) {
      return NextResponse.json({
        valid: false,
        error: 'Código QR inválido o expirado',
      })
    }

    return NextResponse.json({
      valid: true,
      branchId: qrCode.branch.id,
      branchName: qrCode.branch.name,
      companyId: qrCode.branch.company.id,
      companyName: qrCode.branch.company.name,
      companyLogo: qrCode.branch.company.logo,
      qrCodeId: qrCode.id,
    })
  } catch (error: any) {
    console.error('Error verifying QR code:', error)
    return NextResponse.json(
      { valid: false, error: 'Error al verificar el código QR' },
      { status: 500 }
    )
  }
}
