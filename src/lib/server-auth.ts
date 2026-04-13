import { NextRequest } from 'next/server'
import { verify } from 'jsonwebtoken'

type AuthPayload = {
  userId: string
  companyId: string
  role?: string
}

export function getAuthPayload(request: NextRequest): AuthPayload {
  const authHeader = request.headers.get('Authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    throw new Error('No autorizado')
  }

  const token = authHeader.slice(7)

  const decoded = verify(
    token,
    process.env.JWT_SECRET || 'siga-rh-secret'
  ) as AuthPayload

  if (!decoded?.userId || !decoded?.companyId) {
    throw new Error('No autorizado')
  }

  return decoded
}
