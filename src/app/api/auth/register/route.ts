import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'
import { hash } from 'bcryptjs'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { companyName, taxId, companyEmail, companyPhone, adminName, adminEmail, password } = body

    // Validation
    const errors: string[] = []
    if (!companyName?.trim()) errors.push('El nombre de la empresa es requerido')
    if (!companyEmail?.trim()) errors.push('El email de la empresa es requerido')
    if (!adminName?.trim()) errors.push('El nombre del administrador es requerido')
    if (!adminEmail?.trim()) errors.push('El email del administrador es requerido')
    if (!password || password.length < 8) errors.push('La contraseña debe tener al menos 8 caracteres')

    if (errors.length > 0) {
      return NextResponse.json({ error: errors.join('. ') }, { status: 400 })
    }

    // Check if admin email already exists globally (simple check)
    const existingUser = await db.user.findFirst({
      where: { email: adminEmail.trim().toLowerCase() },
    })
    if (existingUser) {
      return NextResponse.json(
        { error: 'Ya existe una cuenta con este correo electrónico' },
        { status: 409 }
      )
    }

    // Hash password
    const passwordHash = await hash(password, 12)

    // Create company + user + branch + departments in a transaction
    const result = await db.$transaction(async (tx) => {
      // Create Company
      const company = await tx.company.create({
        data: {
          name: companyName.trim(),
          taxId: taxId?.trim() || null,
          email: companyEmail.trim().toLowerCase(),
          phone: companyPhone?.trim() || null,
        },
      })

      // Create admin User
      const user = await tx.user.create({
        data: {
          companyId: company.id,
          name: adminName.trim(),
          email: adminEmail.trim().toLowerCase(),
          passwordHash,
          role: 'admin',
        },
      })

      // Create default branch "Oficina Principal"
      const branch = await tx.branch.create({
        data: {
          companyId: company.id,
          name: 'Oficina Principal',
          code: 'OP',
          latitude: 19.432608, // Default: Mexico City
          longitude: -99.133209,
          geofenceRadius: 100,
        },
      })

      // Create default departments
      await tx.department.createMany({
        data: [
          {
            companyId: company.id,
            name: 'Administración',
            description: 'Departamento de administración general',
          },
          {
            companyId: company.id,
            name: 'Recursos Humanos',
            description: 'Departamento de gestión de personal',
          },
          {
            companyId: company.id,
            name: 'Operaciones',
            description: 'Departamento de operaciones',
          },
        ],
      })

      return { company, user, branch }
    })

    return NextResponse.json({
      success: true,
      message: 'Empresa registrada exitosamente',
      companyId: result.company.id,
      userId: result.user.id,
    })
  } catch (error: any) {
    console.error('Registration error:', error)

    // Handle unique constraint violations
    if (error?.code === 'P2002') {
      return NextResponse.json(
        { error: 'Ya existe un registro con estos datos únicos' },
        { status: 409 }
      )
    }

    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 })
  }
}
