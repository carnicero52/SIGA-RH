import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAuthPayload } from '@/lib/server-auth'

export async function POST(request: NextRequest) {
  try {
    const auth = getAuthPayload(request)
    const companyId = auth.companyId

    // Check if onboarding already completed
    const company = await db.company.findUnique({ where: { id: companyId } })
      return NextResponse.json({ success: true, message: 'Already completed' })
    }

    // 1. Create branch
    let branchId = null
    if (branch?.name) {
      const newBranch = await db.branch.create({
        data: {
          companyId,
          name: branch.name,
          address: branch.address || '',
          city: branch.city || '',
          latitude: 0,
          longitude: 0,
        },
      })
      branchId = newBranch.id
    }

    // 2. Create departments
    const deptIds: Record<string, string> = {}
    for (const deptName of departments) {
      if (deptName?.trim()) {
        const dept = await db.department.create({
          data: {
            companyId,
            name: deptName.trim(),
          },
        })
        deptIds[deptName] = dept.id
      }
    }

    // 3. Create positions
    const posIds: Record<string, string> = {}
    for (const pos of positions) {
      if (pos?.name?.trim() && pos.department && deptIds[pos.department]) {
        const newPos = await db.position.create({
          data: {
            companyId,
            departmentId: deptIds[pos.department],
            name: pos.name.trim(),
          },
        })
        posIds[pos.name] = newPos.id
      }
    }

    // 4. Create shifts
    const shiftIds: Record<string, string> = {}
    for (const shift of shifts) {
      if (shift?.name?.trim()) {
        const newShift = await db.shift.create({
          data: {
            companyId,
            name: shift.name.trim(),
            startTime: shift.start || '09:00',
            endTime: shift.end || '18:00',
          },
        })
        shiftIds[shift.name] = newShift.id
      }
    }

    // 5. Create employees
    for (const emp of employees) {
      if (emp?.name?.trim() && emp?.email?.trim()) {
        const nameParts = emp.name.trim().split(' ')
        const firstName = nameParts[0] || emp.name
        const lastName = nameParts.slice(1).join(' ') || ''

        await db.employee.create({
          data: {
            companyId,
            branchId: branchId || undefined,
            departmentId: Object.keys(deptIds).length > 0 ? Object.values(deptIds)[0] : undefined,
            positionId: emp.position && posIds[emp.position] ? posIds[emp.position] : undefined,
            firstName,
            lastName,
            email: emp.email.trim().toLowerCase(),
          },
        })
      }
    }

    // Update company to mark onboarding complete
    await db.company.update({
      where: { id: companyId },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Onboarding error:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}