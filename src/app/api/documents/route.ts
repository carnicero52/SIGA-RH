import { db } from '@/lib/db'
import { getAuthPayload } from '@/lib/server-auth'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const { companyId } = getAuthPayload(request)

    const { searchParams } = new URL(request.url)
    const employeeId = searchParams.get('employeeId')

    if (!employeeId) {
      return NextResponse.json({ error: 'employeeId es requerido' }, { status: 400 })
    }

    const employee = await db.employee.findFirst({ where: { id: employeeId, companyId } })
    if (!employee) {
      return NextResponse.json({ error: 'Empleado no encontrado' }, { status: 404 })
    }

    const documents = await db.document.findMany({
      where: { employeeId: employee.id },
      orderBy: { uploadedAt: 'desc' },
    })

    return NextResponse.json(documents)
  } catch (error: any) {
    console.error('List documents error:', error)
    return NextResponse.json({ error: 'Error al obtener documentos' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { companyId } = getAuthPayload(request)
    const body = await request.json()
    const { name, type, notes, employeeId } = body

    if (!name?.trim()) {
      return NextResponse.json({ error: 'El nombre del documento es requerido' }, { status: 400 })
    }
    if (!type?.trim()) {
      return NextResponse.json({ error: 'El tipo de documento es requerido' }, { status: 400 })
    }
    if (!employeeId) {
      return NextResponse.json({ error: 'El ID del empleado es requerido' }, { status: 400 })
    }

    // Verify employee exists
    const employee = await db.employee.findFirst({ where: { id: employeeId, companyId } })
    if (!employee) {
      return NextResponse.json({ error: 'Empleado no encontrado' }, { status: 404 })
    }

    const document = await db.document.create({
      data: {
        employeeId,
        name: name.trim(),
        type: type.trim(),
        notes: notes?.trim() || null,
      },
    })

    return NextResponse.json(document, { status: 201 })
  } catch (error: any) {
    console.error('Create document error:', error)
    return NextResponse.json({ error: 'Error al crear documento' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { companyId } = getAuthPayload(request)

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'id es requerido' }, { status: 400 })
    }

    const existing = await db.document.findFirst({ where: { id, employee: { companyId } } })
    if (!existing) {
      return NextResponse.json({ error: 'Documento no encontrado' }, { status: 404 })
    }

    await db.document.delete({ where: { id: existing.id } })

    return NextResponse.json({ message: 'Documento eliminado correctamente' })
  } catch (error: any) {
    console.error('Delete document error:', error)
    return NextResponse.json({ error: 'Error al eliminar documento' }, { status: 500 })
  }
}
