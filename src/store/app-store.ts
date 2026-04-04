import { create } from 'zustand'

export type ViewType =
  | 'landing'
  | 'register'
  | 'login'
  | 'dashboard'
  | 'employees'
  | 'employee-detail'
  | 'branches'
  | 'departments'
  | 'positions'
  | 'shifts'
  | 'attendance'
  | 'attendance-monitor'
  | 'qr-display'
  | 'check-in'
  | 'incidents'
  | 'contracts'
  | 'vacancies'
  | 'candidates'
  | 'reports'
  | 'company'
  | 'settings'

interface User {
  id: string
  companyId: string
  name: string
  email: string
  role: string
}

interface AppState {
  // Auth
  user: User | null
  isAuthenticated: boolean
  login: (user: User) => void
  logout: () => void

  // Navigation
  currentView: ViewType
  viewParams: Record<string, string>
  navigate: (view: ViewType, params?: Record<string, string>) => void

  // UI State
  sidebarOpen: boolean
  toggleSidebar: () => void
  setSidebarOpen: (open: boolean) => void

  // Company
  companyName: string
  companyLogo: string
  setCompany: (name: string, logo?: string) => void
}

export const useAppStore = create<AppState>((set) => ({
  // Auth
  user: null,
  isAuthenticated: false,
  login: (user) => set({ user, isAuthenticated: true, currentView: 'dashboard' }),
  logout: () => set({ user: null, isAuthenticated: false, currentView: 'landing' }),

  // Navigation
  currentView: 'landing' as ViewType,
  viewParams: {},
  navigate: (view, params = {}) => set({ currentView: view, viewParams: params }),

  // UI
  sidebarOpen: true,
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),

  // Company
  companyName: 'SIGA-RH',
  companyLogo: '',
  setCompany: (name, logo = '') => set({ companyName: name, companyLogo: logo }),
}))
