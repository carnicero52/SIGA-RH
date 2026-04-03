import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'))
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '10')))
    const search = searchParams.get('search') || ''
    const branchId = searchParams.get('branchId') || ''
    const departmentId = searchParams.get('departmentId') || ''
    const status = searchParams.get('status') || ''
    const employmentType = searchParams.get('employmentType') || ''

    const where: any = { active: true }

    if (search) {
      where.OR = [
        { firstName: { contains: search } },
        { lastName: { contains: search } },
        { email: { contains: search } },
        { employeeNumber: { contains: search } },
      ]
    }
    if (branchId) where.branchId = branchId
    if (departmentId) where.departmentId = departmentId
    if (status) where.status = status
    if (employmentType) where.employmentType = employmentType

    const [employees, total] = await Promise.all([
      db.employee.findMany({
        where,
        include: {
          branch: { select: { id: true, name: true } },
          department: { select: { id: true, name: true } },
          position: { select: { id: true, name: true } },
          _count: {
            select: {
              attendanceRecords: true,
              contracts: true,
              incidents: true,
              documents: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.employee.count({ where }),
    ])

    return NextResponse.json({
      employees,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    })
  } catch (error: any) {
    console.error('List employees error:', error)
    return NextResponse.json({ error: 'Error al obtener empleados' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      firstName, lastName, email, phone,
      curp, rfc, nss, birthDate, gender,
      employeeNumber, hireDate, employmentType, status,
      branchId, departmentId, positionId,
      bloodType,
      emergencyContact, emergencyPhone, emergencyRelation,
      bankName, bankAccount, bankClabe,
      notes,
    } = body

    // Validate required fields
    if (!firstName?.trim()) {
      return NextResponse.json({ error: 'El nombre es requerido' }, { status: 400 })
    }
    if (!lastName?.trim()) {
      return NextResponse.json({ error: 'El apellido es requerido' }, { status: 400 })
    }
    if (!email?.trim()) {
      return NextResponse.json({ error: 'El email es requerido' }, { status: 400 })
    }

    // Check unique email - find first active company
    const firstCompany = await db.company.findFirst({ where: { active: true } })
    if (!firstCompany) {
      return NextResponse.json({ error: 'No hay empresa configurada' }, { status: 400 })
    }

    const existingEmail = await db.employee.findFirst({
      where: { companyId: firstCompany.id, email: email.trim(), active: true },
    })
    if (existingEmail) {
      return NextResponse.json({ error: 'Ya existe un empleado con este email' }, { status: 409 })
    }

    // Check unique employeeNumber
    if (employeeNumber?.trim()) {
      const existingNumber = await db.employee.findFirst({
        where: { companyId: firstCompany.id, employeeNumber: employeeNumber.trim(), active: true },
      })
      if (existingNumber) {
        return NextResponse.json({ error: 'Ya existe un empleado con este número de empleado' }, { status: 409 })
      }
    }

    const employee = await db.employee.create({
      data: {
        companyId: firstCompany.id,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim(),
        phone: phone?.trim() || null,
        curp: curp?.trim() || null,
        rfc: rfc?.trim() || null,
        nss: nss?.trim() || null,
        birthDate: birthDate || null,
        gender: gender || null,
        employeeNumber: employeeNumber?.trim() || null,
        hireDate: hireDate || null,
        employmentType: employmentType || 'full_time',
        status: status || 'active',
        branchId: branchId || null,
        departmentId: departmentId || null,
        positionId: positionId || null,
        bloodType: bloodType?.trim() || null,
        emergencyContact: emergencyContact?.trim() || null,
        emergencyPhone: emergencyPhone?.trim() || null,
        emergencyRelation: emergencyRelation?.trim() || null,
        bankName: bankName?.trim() || null,
        bankAccount: bankAccount?.trim() || null,
        bankClabe: bankClabe?.trim() || null,
        notes: notes?.trim() || null,
      },
      include: {
        branch: { select: { id: true, name: true } },
        department: { select: { id: true, name: true } },
        position: { select: { id: true, name: true } },
      },
    })

    return NextResponse.json(employee, { status: 201 })
  } catch (error: any) {
    console.error('Create employee error:', error)
    return NextResponse.json({ error: 'Error al crear empleado' }, { status: 500 })
  }
}
