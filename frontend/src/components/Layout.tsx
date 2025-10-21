import { Outlet, useLocation } from 'react-router-dom'
import Navbar from './Navbar'
import { useAuthStore } from '@/stores/authStore'
import { useEffect } from 'react'
import authService from '@/services/authService'

const Layout = () => {
  const { isAuthenticated, token, setUser, clearAuth } = useAuthStore()
  const location = useLocation()

  useEffect(() => {
    const validateToken = async () => {
      if (isAuthenticated && token) {
        try {
          const user = await authService.getCurrentUser()
          setUser(user)
        } catch (error) {
          clearAuth()
        }
      }
    }

    validateToken()
  }, [isAuthenticated, token, setUser, clearAuth])

  // Check if current page is home page
  const isHomePage = location.pathname === '/'

  return (
    <div className="min-h-screen">
      {/* Background with gradient */}
      <div className="fixed inset-0 -z-10">
        {/* Base gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-secondary-50 via-white to-primary-50"></div>

        {/* Decorative blurred circles */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary-200/30 rounded-full blur-3xl animate-pulse-soft"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-accent-200/30 rounded-full blur-3xl animate-pulse-soft" style={{ animationDelay: '1s' }}></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-primary-100/20 rounded-full blur-3xl animate-pulse-soft" style={{ animationDelay: '2s' }}></div>

        {/* Subtle pattern overlay */}
        <div className="absolute inset-0 bg-pattern-dots opacity-[0.02]"></div>
      </div>

      <Navbar />

      <main className={isHomePage ? '' : 'container-custom py-8'}>
        <Outlet />
      </main>

      {/* Footer */}
      {!isHomePage && (
        <footer className="mt-auto py-8 border-t border-secondary-200/50 bg-white/50 backdrop-blur-sm">
          <div className="container-custom">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold bg-gradient-to-r from-primary-600 to-accent-600 bg-clip-text text-transparent">
                  KvizHub
                </span>
                <span className="text-secondary-500 text-sm">
                  © 2024 All rights reserved
                </span>
              </div>
              <div className="flex items-center gap-6 text-sm text-secondary-600">
                <a href="#" className="hover:text-primary-600 transition-colors">About</a>
                <a href="#" className="hover:text-primary-600 transition-colors">Privacy</a>
                <a href="#" className="hover:text-primary-600 transition-colors">Terms</a>
                <a href="#" className="hover:text-primary-600 transition-colors">Contact</a>
              </div>
            </div>
          </div>
        </footer>
      )}
    </div>
  )
}

export default Layout