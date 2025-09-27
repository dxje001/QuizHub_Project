import { useState, useEffect } from 'react'
import { useAuthStore } from '@/stores/authStore'
import authService from '@/services/authService'
import { LoginRequest, RegisterRequest } from '@/types'
import toast from 'react-hot-toast'

export const useAuth = () => {
  const [isLoading, setIsLoading] = useState(false)
  const [isInitializing, setIsInitializing] = useState(true)
  const { user, token, isAuthenticated, setAuth, logout: clearAuth, setLoading, setUser } = useAuthStore()

  // Initialize auth state on mount
  useEffect(() => {
    const initializeAuth = async () => {
      // Small delay to ensure Zustand store is hydrated
      await new Promise(resolve => setTimeout(resolve, 100))

      const currentState = useAuthStore.getState()
      console.log('Auth initialization - Current state:', {
        hasToken: !!currentState.token,
        isAuthenticated: currentState.isAuthenticated,
        hasUser: !!currentState.user
      })

      if (currentState.token && currentState.isAuthenticated) {
        try {
          // Validate token and get current user data
          console.log('Calling getCurrentUser...')
          const currentUser = await authService.getCurrentUser()
          setUser(currentUser)
          console.log('✅ User profile refreshed successfully:', currentUser)
        } catch (error) {
          // Token is invalid or expired, clear auth
          clearAuth()
          console.error('❌ Token validation failed:', error)
        }
      } else {
        console.log('⚠️ No valid token found, skipping profile refresh')
      }
      setIsInitializing(false)
    }

    initializeAuth()
  }, [])

  const login = async (credentials: LoginRequest) => {
    try {
      setIsLoading(true)
      setLoading(true)

      const authData = await authService.login(credentials)
      setAuth(authData)

      toast.success('Login successful!')
      return authData
    } catch (error: any) {
      const message = error.response?.data?.message || 'Login failed'
      toast.error(message)
      throw error
    } finally {
      setIsLoading(false)
      setLoading(false)
    }
  }

  const register = async (userData: RegisterRequest) => {
    try {
      setIsLoading(true)
      setLoading(true)

      const authData = await authService.register(userData)
      setAuth(authData)

      toast.success('Registration successful!')
      return authData
    } catch (error: any) {
      const message = error.response?.data?.message || 'Registration failed'
      toast.error(message)
      throw error
    } finally {
      setIsLoading(false)
      setLoading(false)
    }
  }

  const logout = async () => {
    try {
      setIsLoading(true)
      await authService.logout()
      clearAuth()
      toast.success('Logged out successfully!')
    } catch (error: any) {
      // Clear auth even if logout call fails
      clearAuth()
      toast.success('Logged out successfully!')
    } finally {
      setIsLoading(false)
    }
  }

  const getCurrentUser = async (shouldClearOnError = true) => {
    try {
      const user = await authService.getCurrentUser()
      return user
    } catch (error: any) {
      // If getting current user fails, clear auth (unless specified otherwise)
      if (shouldClearOnError) {
        clearAuth()
      }
      throw error
    }
  }

  return {
    user,
    token,
    isAuthenticated,
    isLoading: isLoading || isInitializing,
    isInitializing,
    login,
    register,
    logout,
    getCurrentUser,
  }
}