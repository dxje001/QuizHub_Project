import { Outlet } from 'react-router-dom'
import Navbar from './Navbar'
import { useAuthStore } from '@/stores/authStore'
import { useEffect } from 'react'
import authService from '@/services/authService'

const Layout = () => {
  const { isAuthenticated, token, setUser, clearAuth } = useAuthStore()

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

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="container mx-auto px-4 py-8">
        <Outlet />
      </main>
    </div>
  )
}

export default Layout