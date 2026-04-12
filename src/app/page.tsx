'use client'

import { useEffect } from 'react'
import { MainLayout } from '@/components/layout/main-layout'
import { useAppStore } from '@/store/app-store'

export default function Home() {
  const navigate = useAppStore((s) => s.navigate)
  const isAuthenticated = useAppStore((s) => s.isAuthenticated)

  // ── Detect QR scan from URL ──────────────────────────────────────────
  // When someone scans a QR code, the URL is /?qr=CODE
  // ALWAYS navigate to check-in (no login required for employees)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const qrCode = params.get('qr')
    if (qrCode) {
      // Clean the URL
      window.history.replaceState({}, '', '/')
      // Store in sessionStorage so refresh doesn't lose the QR
      sessionStorage.setItem('pending_qr', qrCode)
      // Navigate directly to public check-in
      navigate('check-in', { qr: qrCode })
      return
    }

    // On refresh, if we were on check-in keep it there (don't fall to landing)
    const store = useAppStore.getState()
    if (store.currentView === 'check-in') {
      const pendingQr = sessionStorage.getItem('pending_qr')
      navigate('check-in', pendingQr ? { qr: pendingQr } : {})
    }
  }, [])

  return <MainLayout />
}
