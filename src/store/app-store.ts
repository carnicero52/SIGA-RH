import { create } from 'zustand'
import { persist } from 'zustand/middleware'

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
  | 'company-settings'
  | 'payroll'

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
  companySlogan: string
  setCompany: (name: string, logo?: string) => void
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      // Auth
      user: null,
      isAuthenticated: false,
      login: (user) => set({ user, isAuthenticated: true, currentView: 'dashboard' }),
      logout: () => {
        localStorage.removeItem('siga_token')
        // Clear persisted state
        useAppStore.persist.clearStorage()
        set({ user: null, isAuthenticated: false, currentView: 'landing', companyName: 'SIGA-RH', companyLogo: '', companySlogan: '' })
      },

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
      companySlogan: '',
      setCompany: (name, logo = '') => set({ companyName: name, companyLogo: logo }),
    }),
    {
      name: 'siga-rh-store',
      // Only persist auth and company info — not transient UI state
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
        companyName: state.companyName,
        companyLogo: state.companyLogo,
        companySlogan: state.companySlogan,
        currentView: state.currentView,
      }),
    }
  )
)
