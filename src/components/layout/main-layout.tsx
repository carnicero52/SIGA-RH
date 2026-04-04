'use client'

import { useAppStore } from '@/store/app-store'
import { AppSidebar, AppHeader } from './app-sidebar'
import { LoginView } from '@/components/views/login-view'
import { DashboardView } from '@/components/views/dashboard-view'
import { EmployeesView } from '@/components/views/employees-view'
import { EmployeeDetailView } from '@/components/views/employee-detail-view'
import { BranchesView } from '@/components/views/branches-view'
import { DepartmentsView } from '@/components/views/departments-view'
import { PositionsView } from '@/components/views/positions-view'
import { ShiftsView } from '@/components/views/shifts-view'
import { AttendanceView } from '@/components/views/attendance-view'
import { AttendanceMonitorView } from '@/components/views/attendance-monitor-view'
import { QRDisplayView } from '@/components/views/qr-display-view'
import { CheckInView } from '@/components/views/check-in-view'
import { IncidentsView } from '@/components/views/incidents-view'
import { ContractsView } from '@/components/views/contracts-view'
import { VacanciesView } from '@/components/views/vacancies-view'
import { CandidatesView } from '@/components/views/candidates-view'
import { ReportsView } from '@/components/views/reports-view'
import { CompanyView } from '@/components/views/company-view'

const views: Record<string, React.ComponentType<any>> = {
  login: LoginView,
  dashboard: DashboardView,
  employees: EmployeesView,
  'employee-detail': EmployeeDetailView,
  branches: BranchesView,
  departments: DepartmentsView,
  positions: PositionsView,
  shifts: ShiftsView,
  attendance: AttendanceView,
  'attendance-monitor': AttendanceMonitorView,
  'qr-display': QRDisplayView,
  'check-in': CheckInView,
  incidents: IncidentsView,
  contracts: ContractsView,
  vacancies: VacanciesView,
  candidates: CandidatesView,
  reports: ReportsView,
  company: CompanyView,
}

export function MainLayout() {
  const { currentView, isAuthenticated } = useAppStore()

  if (!isAuthenticated || currentView === 'login') {
    return <LoginView />
  }

  const ViewComponent = views[currentView]

  return (
    <div className="flex h-screen overflow-hidden">
      <AppSidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <AppHeader />
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          {ViewComponent ? <ViewComponent /> : (
            <div className="flex items-center justify-center h-full">
              <p className="text-muted-foreground">Vista no encontrada</p>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
