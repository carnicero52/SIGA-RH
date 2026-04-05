'use client'

import { useEffect } from 'react'
import { MainLayout } from '@/components/layout/main-layout'
import { useAppStore } from '@/store/app-store'

export default function Home() {
  const navigate = useAppStore((s) => s.navigate)
  const isAuthenticated = useAppStore((s) => s.isAuthenticated)
  const login = useAppStore((s) => s.login)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const qrCode = params.get('qr')
    if (qrCode) {
      // Store QR code in sessionStorage for after login
      sessionStorage.setItem('pending_qr', qrCode)
      // Clean URL
      window.history.replaceState({}, '', '/')
      // If authenticated, go to check-in with the QR code
      if (isAuthenticated) {
        navigate('check-in', { qr: qrCode })
      }
      // If not authenticated, the user will need to login first
      // After login, check for pending_qr in sessionStorage
    }
  }, [])

  // Watch for auth changes (when user logs in after scanning QR)
  useEffect(() => {
    const pendingQr = sessionStorage.getItem('pending_qr')
    if (pendingQr && isAuthenticated) {
      sessionStorage.removeItem('pending_qr')
      navigate('check-in', { qr: pendingQr })
    }
  }, [isAuthenticated])

  return <MainLayout />
}
