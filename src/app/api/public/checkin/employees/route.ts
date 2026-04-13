import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const branchId = searchParams.get('branchId')

    if (!branchId) {
      return NextResponse.json(
        { error: 'El parámetro branchId es requerido' },
        { status: 400 }
      )
    }

    const branch = await db.branch.findFirst({ where: { id: branchId, active: true } })
    if (!branch) {
      return NextResponse.json({ error: 'Sucursal no encontrada' }, { status: 404 })
    }

    const employees = await db.employee.findMany({
      where: {
        companyId: branch.companyId,
        branchId: branch.id,
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
