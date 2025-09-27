import api from './api'
import { LoginRequest, RegisterRequest, AuthResponse, User, ApiResponse } from '@/types'

class AuthService {
  async login(credentials: LoginRequest): Promise<AuthResponse> {
    const response = await api.post<any>('/api/auth/login', credentials)
    const { user, token, refreshToken } = response.data
    return { user, token, refreshToken: refreshToken || '' }
  }

  async register(userData: RegisterRequest): Promise<AuthResponse> {
    const response = await api.post<any>('/api/auth/register', userData)
    const { user, token, refreshToken } = response.data
    return { user, token, refreshToken: refreshToken || '' }
  }

  async refreshToken(refreshToken: string): Promise<{ token: string; refreshToken: string }> {
    const response = await api.post<ApiResponse<{ token: string; refreshToken: string }>>('/api/auth/refresh', {
      refreshToken,
    })
    return response.data.data
  }

  async logout(): Promise<void> {
    await api.post('/api/auth/logout')
  }

  async getCurrentUser(): Promise<User> {
    const response = await api.get<any>('/api/auth/me')
    return response.data
  }

  async updateProfile(userData: Partial<User>): Promise<User> {
    // Convert camelCase to PascalCase for backend
    const backendData = {
      FirstName: userData.firstName,
      LastName: userData.lastName
    }
    const response = await api.put<any>('/api/auth/profile', backendData)
    return response.data.user
  }

  async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    await api.post('/api/auth/change-password', {
      currentPassword,
      newPassword,
    })
  }

  async forgotPassword(email: string): Promise<void> {
    await api.post('/api/auth/forgot-password', { email })
  }

  async resetPassword(token: string, newPassword: string): Promise<void> {
    await api.post('/api/auth/reset-password', {
      token,
      newPassword,
    })
  }
}

export default new AuthService()