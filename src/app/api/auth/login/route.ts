import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'
import { compare } from 'bcryptjs'
import { sign } from 'jsonwebtoken'

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json({ error: 'Email y contraseña son requeridos' }, { status: 400 })
    }

    const normalizedEmail = String(email).trim().toLowerCase()

    const user = await db.user.findFirst({
      where: { email: normalizedEmail, active: true },
      include: { company: { select: { name: true, logo: true, slogan: true } } },
    })

    if (!user) {
      return NextResponse.json({ error: 'Credenciales inválidas' }, { status: 401 })
    }

    const valid = await compare(password, user.passwordHash)
    if (!valid) {
      return NextResponse.json({ error: 'Credenciales inválidas' }, { status: 401 })
    }

    const token = sign(
      { userId: user.id, companyId: user.companyId, role: user.role },
      process.env.JWT_SECRET || 'siga-rh-secret',
      { expiresIn: '24h' }
    )

    await db.user.update({
      where: { id: user.id },
      data: { lastLogin: new Date() },
    })

    return NextResponse.json({
      token,
      user: {
        id: user.id,
        companyId: user.companyId,
        name: user.name,
        email: user.email,
        role: user.role,
        companyName: user.company.name,
        companyLogo: user.company.logo,
        companySlogan: user.company.slogan,
        onboardingCompleted: user.company.onboardingCompleted,
      },
    })
  } catch (error: any) {
    console.error('Login error:', error)
    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 })
  }
}
