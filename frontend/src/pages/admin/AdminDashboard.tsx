import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Spinner } from '@/components/ui/spinner'
import { useAuthStore } from '@/stores/authStore'
import { Navigate, useNavigate } from 'react-router-dom'
import {
  MagnifyingGlassIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  TrashIcon,
  LockClosedIcon,
  LockOpenIcon,
  BookOpenIcon,
  PlusIcon,
  UserGroupIcon,
  AcademicCapIcon,
  ChartBarIcon,
  ClockIcon,
  ShieldCheckIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline'

interface AdminStats {
  totalUsers: number
  totalQuizzes: number
  totalQuestions: number
  totalCategories: number
  totalQuizAttempts: number
}

interface User {
  id: string
  email: string
  firstName: string
  lastName: string
  emailConfirmed: boolean
  isDisabled: boolean
  lockoutEnd?: string
  createdAt: string
  roles: string[]
}

interface UserPaginationResponse {
  data: User[]
  totalCount: number
  page: number
  pageSize: number
  totalPages: number
}

const AdminDashboard = () => {
  const { user, token } = useAuthStore()
  const navigate = useNavigate()
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [userLoading, setUserLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalUsers, setTotalUsers] = useState(0)
  const pageSize = 10

  // Check if user is admin
  if (!user?.roles?.includes('Admin')) {
    return <Navigate to="/dashboard" replace />
  }

  useEffect(() => {
    fetchAdminData()
  }, [])

  useEffect(() => {
    fetchUsers()
  }, [currentPage, searchTerm])

  const fetchAdminData = async () => {
    try {
      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }

      const statsResponse = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/stats`, { headers })
      if (statsResponse.ok) {
        const statsData = await statsResponse.json()
        setStats(statsData.data)
      }
    } catch (error) {
      console.error('Error fetching admin data:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchUsers = async () => {
    try {
      setUserLoading(true)
      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }

      const params = new URLSearchParams({
        page: currentPage.toString(),
        pageSize: pageSize.toString(),
        search: searchTerm
      })

      const usersResponse = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/users?${params}`, { headers })
      if (usersResponse.ok) {
        const usersData = await usersResponse.json()
        setUsers(usersData.data || [])
        setTotalPages(usersData.totalPages || 1)
        setTotalUsers(usersData.totalCount || 0)
      } else {
        setUsers([])
        setTotalPages(1)
        setTotalUsers(0)
      }
    } catch (error) {
      console.error('Error fetching users:', error)
      setUsers([])
      setTotalPages(1)
      setTotalUsers(0)
    } finally {
      setUserLoading(false)
    }
  }

  const handleDeleteUser = async (userId: string, userName: string) => {
    if (!confirm(`Are you sure you want to PERMANENTLY DELETE ${userName}? This action cannot be undone and will remove all their quiz data.`)) return

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/users/${userId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        fetchUsers()
        fetchAdminData()
        alert('User permanently deleted successfully')
      } else {
        const errorData = await response.json()
        alert(`Failed to delete user: ${errorData.message}`)
      }
    } catch (error) {
      console.error('Error deleting user:', error)
      alert('Error deleting user')
    }
  }

  const handleToggleUserStatus = async (userId: string, userName: string, isCurrentlyDisabled: boolean) => {
    const action = isCurrentlyDisabled ? 'enable' : 'disable'
    const actionDescription = isCurrentlyDisabled ?
      'This will allow them to login and use the platform again.' :
      'This will prevent them from logging in but preserve their account and data.'

    if (!confirm(`Are you sure you want to ${action.toUpperCase()} ${userName}? ${actionDescription}`)) return

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/users/${userId}/toggle-status`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        fetchUsers()
        alert(`User ${action}d successfully`)
      } else {
        const errorData = await response.json()
        alert(`Failed to ${action} user: ${errorData.message}`)
      }
    } catch (error) {
      console.error('Error toggling user status:', error)
      alert(`Error ${action}ing user`)
    }
  }

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value)
    setCurrentPage(1)
  }

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage)
  }

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-5rem)] flex flex-col items-center justify-center">
        <Spinner size="lg" />
        <p className="mt-4 text-secondary-600 text-lg">Loading admin dashboard...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Header */}
      <div className="card-premium p-8">
        <div className="flex items-center gap-4">
          <div className="p-4 rounded-2xl bg-gradient-to-br from-danger-600 to-danger-500 shadow-glow">
            <ShieldCheckIcon className="h-10 w-10 text-white" />
          </div>
          <div>
            <h1 className="text-4xl font-bold text-secondary-900">Admin Dashboard</h1>
            <p className="text-lg text-secondary-600 mt-1">
              Welcome back, {user?.firstName}! Manage your KvizHub platform.
            </p>
          </div>
        </div>
      </div>

      {/* Statistics Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="card-premium p-6 animate-scale-in">
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 rounded-xl bg-gradient-to-br from-primary-600 to-primary-500 shadow-soft">
                <UserGroupIcon className="h-6 w-6 text-white" />
              </div>
              <div>
                <div className="text-sm text-secondary-600">Total Users</div>
                <div className="text-3xl font-bold text-secondary-900">{stats.totalUsers}</div>
              </div>
            </div>
            <div className="w-full bg-secondary-200 rounded-full h-2">
              <div className="h-2 bg-gradient-to-r from-primary-600 to-primary-500 rounded-full w-full" />
            </div>
          </div>

          <div className="card-premium p-6 animate-scale-in" style={{ animationDelay: '50ms' }}>
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 rounded-xl bg-gradient-to-br from-accent-600 to-accent-500 shadow-soft">
                <AcademicCapIcon className="h-6 w-6 text-white" />
              </div>
              <div>
                <div className="text-sm text-secondary-600">Total Quizzes</div>
                <div className="text-3xl font-bold text-secondary-900">{stats.totalQuizzes}</div>
              </div>
            </div>
            <div className="w-full bg-secondary-200 rounded-full h-2">
              <div className="h-2 bg-gradient-to-r from-accent-600 to-accent-500 rounded-full w-full" />
            </div>
          </div>

          <div className="card-premium p-6 animate-scale-in" style={{ animationDelay: '100ms' }}>
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 rounded-xl bg-gradient-to-br from-warning-600 to-warning-500 shadow-soft">
                <ChartBarIcon className="h-6 w-6 text-white" />
              </div>
              <div>
                <div className="text-sm text-secondary-600">Quiz Attempts</div>
                <div className="text-3xl font-bold text-secondary-900">{stats.totalQuizAttempts}</div>
              </div>
            </div>
            <div className="w-full bg-secondary-200 rounded-full h-2">
              <div className="h-2 bg-gradient-to-r from-warning-600 to-warning-500 rounded-full w-full" />
            </div>
          </div>

          <div className="card-premium p-6 animate-scale-in" style={{ animationDelay: '150ms' }}>
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 rounded-xl bg-gradient-to-br from-secondary-700 to-secondary-600 shadow-soft">
                <BookOpenIcon className="h-6 w-6 text-white" />
              </div>
              <div>
                <div className="text-sm text-secondary-600">Total Questions</div>
                <div className="text-3xl font-bold text-secondary-900">{stats.totalQuestions}</div>
              </div>
            </div>
            <div className="w-full bg-secondary-200 rounded-full h-2">
              <div className="h-2 bg-gradient-to-r from-secondary-700 to-secondary-600 rounded-full w-full" />
            </div>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="card-premium p-6">
        <h2 className="text-2xl font-bold text-secondary-900 mb-4 flex items-center gap-2">
          <ClockIcon className="h-6 w-6 text-primary-600" />
          Quick Actions
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Button
            variant="primary"
            size="lg"
            onClick={() => navigate('/admin/quizzes')}
            className="h-24 flex-col gap-2"
          >
            <BookOpenIcon className="h-8 w-8" />
            <span>Manage Quizzes</span>
          </Button>
          <Button
            variant="accent"
            size="lg"
            onClick={() => navigate('/quizzes/create')}
            className="h-24 flex-col gap-2"
          >
            <PlusIcon className="h-8 w-8" />
            <span>Create New Quiz</span>
          </Button>
          <Button
            variant="secondary"
            size="lg"
            onClick={() => navigate('/admin/results')}
            className="h-24 flex-col gap-2"
          >
            <ChartBarIcon className="h-8 w-8" />
            <span>View All Results</span>
          </Button>
        </div>
      </div>

      {/* User Management Info Alert */}
      <div className="card p-6 bg-primary-50 border-2 border-primary-200">
        <div className="flex items-start gap-3">
          <InformationCircleIcon className="h-6 w-6 text-primary-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-bold text-primary-900 mb-2">User Management Actions:</h3>
            <div className="space-y-1 text-sm text-primary-800">
              <p><strong>Disable:</strong> Temporarily prevents user login while preserving their account and quiz data. Can be reversed.</p>
              <p><strong>Delete:</strong> Permanently removes the user and all their data. This action cannot be undone.</p>
            </div>
          </div>
        </div>
      </div>

      {/* User Management Table */}
      <div className="card-premium overflow-hidden">
        <div className="px-8 py-6 bg-gradient-to-r from-secondary-50 to-primary-50 border-b border-secondary-200">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold text-secondary-900 flex items-center gap-2">
                <UserGroupIcon className="h-6 w-6 text-primary-600" />
                User Management
              </h2>
              <p className="text-secondary-600 mt-1">{totalUsers} total users</p>
            </div>

            {/* Search Bar */}
            <div className="relative w-full md:w-96">
              <MagnifyingGlassIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-secondary-400" />
              <input
                type="text"
                placeholder="Search users by name or email..."
                value={searchTerm}
                onChange={handleSearchChange}
                className="input-field pl-12"
              />
            </div>
          </div>
        </div>

        {/* Users Table */}
        <div className="p-6">
          {userLoading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <Spinner size="lg" />
              <p className="mt-4 text-secondary-600">Loading users...</p>
            </div>
          ) : users && users.length > 0 ? (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-secondary-50 border-b-2 border-secondary-200">
                    <tr>
                      <th className="text-left py-4 px-4 text-xs font-bold text-secondary-700 uppercase tracking-wider">User</th>
                      <th className="text-left py-4 px-4 text-xs font-bold text-secondary-700 uppercase tracking-wider">Role</th>
                      <th className="text-left py-4 px-4 text-xs font-bold text-secondary-700 uppercase tracking-wider">Status</th>
                      <th className="text-left py-4 px-4 text-xs font-bold text-secondary-700 uppercase tracking-wider">Joined</th>
                      <th className="text-right py-4 px-4 text-xs font-bold text-secondary-700 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-secondary-200">
                    {users.map((u, index) => (
                      <tr
                        key={u.id}
                        className="hover:bg-secondary-50 transition-colors animate-fade-in-up"
                        style={{ animationDelay: `${index * 30}ms` }}
                      >
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-600 to-accent-600 flex items-center justify-center text-white font-bold shadow-soft">
                              {u.firstName[0]}{u.lastName[0]}
                            </div>
                            <div>
                              <div className="font-bold text-secondary-900">
                                {u.firstName} {u.lastName}
                              </div>
                              <div className="text-sm text-secondary-600">{u.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex flex-wrap gap-2">
                            {u.roles.map(role => (
                              <Badge
                                key={role}
                                variant={role === 'Admin' ? 'danger' : 'primary'}
                                size="sm"
                              >
                                {role}
                              </Badge>
                            ))}
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <Badge
                            variant={u.isDisabled ? 'secondary' : 'success'}
                            size="sm"
                          >
                            {u.isDisabled ? 'Disabled' : 'Active'}
                          </Badge>
                        </td>
                        <td className="py-4 px-4 text-sm text-secondary-600">
                          {new Date(u.createdAt).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric'
                          })}
                        </td>
                        <td className="py-4 px-4">
                          {!u.roles.includes('Admin') ? (
                            <div className="flex gap-2 justify-end">
                              <Button
                                size="sm"
                                variant={u.isDisabled ? 'accent' : 'secondary'}
                                onClick={() => handleToggleUserStatus(u.id, `${u.firstName} ${u.lastName}`, u.isDisabled)}
                                className="gap-1"
                              >
                                {u.isDisabled ? (
                                  <>
                                    <LockOpenIcon className="h-3 w-3" />
                                    Enable
                                  </>
                                ) : (
                                  <>
                                    <LockClosedIcon className="h-3 w-3" />
                                    Disable
                                  </>
                                )}
                              </Button>
                              <Button
                                size="sm"
                                variant="danger"
                                onClick={() => handleDeleteUser(u.id, `${u.firstName} ${u.lastName}`)}
                                className="gap-1"
                              >
                                <TrashIcon className="h-3 w-3" />
                                Delete
                              </Button>
                            </div>
                          ) : (
                            <div className="flex items-center justify-end gap-1 text-xs text-secondary-500">
                              <ShieldCheckIcon className="h-4 w-4" />
                              Protected
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 mt-6 border-t border-secondary-200">
                  <div className="text-sm text-secondary-600">
                    Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, totalUsers)} of {totalUsers} users
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage <= 1}
                      className="gap-1"
                    >
                      <ChevronLeftIcon className="h-4 w-4" />
                      Previous
                    </Button>

                    <div className="flex gap-1">
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        const page = Math.max(1, Math.min(totalPages - 4, currentPage - 2)) + i
                        if (page > totalPages) return null
                        return (
                          <button
                            key={page}
                            onClick={() => handlePageChange(page)}
                            className={`w-10 h-10 rounded-xl text-sm font-bold transition-all ${
                              currentPage === page
                                ? 'bg-gradient-to-br from-primary-600 to-accent-600 text-white shadow-soft'
                                : 'bg-white border border-secondary-300 text-secondary-700 hover:bg-secondary-50'
                            }`}
                          >
                            {page}
                          </button>
                        )
                      })}
                    </div>

                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage >= totalPages}
                      className="gap-1"
                    >
                      Next
                      <ChevronRightIcon className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-20">
              <div className="inline-flex p-6 rounded-2xl bg-gradient-to-br from-primary-50 to-accent-50 mb-6">
                <UserGroupIcon className="h-16 w-16 text-primary-600" />
              </div>
              <h3 className="text-2xl font-bold text-secondary-900 mb-2">
                {searchTerm ? 'No Users Found' : 'No Users Yet'}
              </h3>
              <p className="text-secondary-600 max-w-md mx-auto">
                {searchTerm
                  ? `No users found matching "${searchTerm}". Try adjusting your search.`
                  : 'No users have registered yet.'
                }
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default AdminDashboard
