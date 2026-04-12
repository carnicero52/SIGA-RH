import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const employee = await db.employee.findUnique({
      where: { id },
      include: {
        branch: { select: { id: true, name: true } },
        department: { select: { id: true, name: true } },
        position: { select: { id: true, name: true, department: { select: { name: true } } } },
        contracts: {
          include: { template: { select: { id: true, name: true, type: true } } },
          orderBy: { createdAt: 'desc' },
        },
        incidents: { orderBy: { createdAt: 'desc' } },
        documents: { orderBy: { uploadedAt: 'desc' } },
        employeeShifts: {
          where: { active: true },
          include: { shift: true },
          orderBy: { effectiveDate: 'desc' },
          take: 1,
        },
      },
    })

    if (!employee) {
      return NextResponse.json({ error: 'Empleado no encontrado' }, { status: 404 })
    }

    // Fetch attendance records separately for performance
    const attendanceRecords = await db.attendanceRecord.findMany({
      where: { employeeId: id },
      include: {
        branch: { select: { name: true } },
      },
      orderBy: { recordTime: 'desc' },
      take: 50,
    })

    return NextResponse.json({ ...employee, attendanceRecords })
  } catch (error: any) {
    console.error('Get employee error:', error)
    return NextResponse.json({ error: 'Error al obtener empleado' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()

    const existing = await db.employee.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Empleado no encontrado' }, { status: 404 })
    }

    const {
      firstName, lastName, email, phone,
      curp, rfc, nss, birthDate, gender,
      address, city, state: empState,
      employeeNumber, hireDate, employmentType, status,
      branchId, departmentId, positionId,
      bloodType,
      emergencyContact, emergencyPhone, emergencyRelation,
      bankName, bankAccount, bankClabe,
      notes,
    } = body

    // Validate required fields
    if (firstName !== undefined && !firstName?.trim()) {
      return NextResponse.json({ error: 'El nombre es requerido' }, { status: 400 })
    }
    if (lastName !== undefined && !lastName?.trim()) {
      return NextResponse.json({ error: 'El apellido es requerido' }, { status: 400 })
    }
    if (email !== undefined && !email?.trim()) {
      return NextResponse.json({ error: 'El email es requerido' }, { status: 400 })
    }

    // Check unique email if changed
    if (email?.trim() && email.trim() !== existing.email) {
      const existingEmail = await db.employee.findFirst({
        where: { companyId: existing.companyId, email: email.trim(), active: true, id: { not: id } },
      })
      if (existingEmail) {
        return NextResponse.json({ error: 'Ya existe un empleado con este email' }, { status: 409 })
      }
    }

    // Check unique employeeNumber if changed
    if (employeeNumber?.trim() && employeeNumber.trim() !== existing.employeeNumber) {
      const existingNumber = await db.employee.findFirst({
        where: { companyId: existing.companyId, employeeNumber: employeeNumber.trim(), active: true, id: { not: id } },
      })
      if (existingNumber) {
        return NextResponse.json({ error: 'Ya existe un empleado con este número de empleado' }, { status: 409 })
      }
    }

    const employee = await db.employee.update({
      where: { id },
      data: {
        ...(firstName !== undefined && { firstName: firstName.trim() }),
        ...(lastName !== undefined && { lastName: lastName.trim() }),
        ...(email !== undefined && { email: email.trim() }),
        ...(phone !== undefined && { phone: phone?.trim() || null }),
        ...(curp !== undefined && { curp: curp?.trim() || null }),
        ...(rfc !== undefined && { rfc: rfc?.trim() || null }),
        ...(nss !== undefined && { nss: nss?.trim() || null }),
        ...(birthDate !== undefined && { birthDate: birthDate || null }),
        ...(gender !== undefined && { gender: gender || null }),
        ...(address !== undefined && { address: address?.trim() || null }),
        ...(city !== undefined && { city: city?.trim() || null }),
        ...(empState !== undefined && { state: empState?.trim() || null }),
        ...(employeeNumber !== undefined && { employeeNumber: employeeNumber?.trim() || null }),
        ...(hireDate !== undefined && { hireDate: hireDate || null }),
        ...(employmentType !== undefined && { employmentType: employmentType || 'full_time' }),
        ...(status !== undefined && { status: status || 'active' }),
        ...(branchId !== undefined && { branchId: branchId || null }),
        ...(departmentId !== undefined && { departmentId: departmentId || null }),
        ...(positionId !== undefined && { positionId: positionId || null }),
        ...(bloodType !== undefined && { bloodType: bloodType?.trim() || null }),
        ...(emergencyContact !== undefined && { emergencyContact: emergencyContact?.trim() || null }),
        ...(emergencyPhone !== undefined && { emergencyPhone: emergencyPhone?.trim() || null }),
        ...(emergencyRelation !== undefined && { emergencyRelation: emergencyRelation?.trim() || null }),
        ...(bankName !== undefined && { bankName: bankName?.trim() || null }),
        ...(bankAccount !== undefined && { bankAccount: bankAccount?.trim() || null }),
        ...(bankClabe !== undefined && { bankClabe: bankClabe?.trim() || null }),
        ...(notes !== undefined && { notes: notes?.trim() || null }),
        ...(body.pin !== undefined && { pin: body.pin?.trim() || null }),
      },
      include: {
        branch: { select: { id: true, name: true } },
        department: { select: { id: true, name: true } },
        position: { select: { id: true, name: true } },
      },
    })

    return NextResponse.json(employee)
  } catch (error: any) {
    console.error('Update employee error:', error)
    return NextResponse.json({ error: 'Error al actualizar empleado' }, { status: 500 })
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const existing = await db.employee.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Empleado no encontrado' }, { status: 404 })
    }

    // Soft delete
    await db.employee.update({
      where: { id },
      data: { active: false },
    })

    return NextResponse.json({ message: 'Empleado eliminado correctamente' })
  } catch (error: any) {
    console.error('Delete employee error:', error)
    return NextResponse.json({ error: 'Error al eliminar empleado' }, { status: 500 })
  }
}
