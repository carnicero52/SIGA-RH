import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const companyId = searchParams.get('companyId')

    if (!companyId) {
      return NextResponse.json(
        { error: 'El parámetro companyId es requerido' },
        { status: 400 }
      )
    }

    const employees = await db.employee.findMany({
      where: {
        companyId,
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

    return NextResponse.json({ employees })
  } catch (error: any) {
    console.error('Error fetching employees:', error)
    return NextResponse.json(
      { error: 'Error al obtener los empleados' },
      { status: 500 }
    )
  }
}
