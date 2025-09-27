import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useAuthStore } from '@/stores/authStore'
import { Navigate, useNavigate } from 'react-router-dom'
import { MagnifyingGlassIcon, ChevronLeftIcon, ChevronRightIcon, TrashIcon, LockClosedIcon, LockOpenIcon, BookOpenIcon, PlusIcon } from '@heroicons/react/24/outline'

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

      // Fetch admin stats
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
        // Reset to empty state if API call fails
        setUsers([])
        setTotalPages(1)
        setTotalUsers(0)
      }
    } catch (error) {
      console.error('Error fetching users:', error)
      // Reset to empty state on error
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
        // Refresh users list and stats
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
        const result = await response.json()
        // Refresh the users list to get updated status
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


  const handleManageQuizzes = () => {
    navigate('/admin/quizzes')
  }

  const handleViewAllStatistics = () => {
    // For now, we'll show a simple alert with all stats
    const statsText = `
System Statistics:
- Total Users: ${stats?.totalUsers || 0}
- Total Quizzes: ${stats?.totalQuizzes || 0}
- Quiz Attempts: ${stats?.totalQuizAttempts || 0}
    `
    alert(statsText)
  }

  const handleCreateQuiz = () => {
    navigate('/quizzes/create')
  }



  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value)
    setCurrentPage(1) // Reset to first page when searching
  }

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-lg">Loading admin dashboard...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-600">Welcome back, {user?.firstName}! Manage your KvizHub platform.</p>
        </div>

        {/* Statistics Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                <svg className="h-4 w-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                </svg>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalUsers}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Quizzes</CardTitle>
                <svg className="h-4 w-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalQuizzes}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Quiz Attempts</CardTitle>
                <svg className="h-4 w-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalQuizAttempts}</div>
              </CardContent>
            </Card>

          </div>
        )}

        {/* User Actions Help */}
        <Card className="mb-4 bg-blue-50 border-blue-200">
          <CardContent className="py-4">
            <div className="flex items-start gap-3">
              <svg className="h-5 w-5 text-blue-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div className="text-sm">
                <p className="font-medium text-blue-900 mb-2">User Management Actions:</p>
                <div className="space-y-1 text-blue-800">
                  <p><strong>Disable:</strong> Temporarily prevents user login while preserving their account and quiz data. Can be reversed.</p>
                  <p><strong>Delete:</strong> Permanently removes the user and all their data. This action cannot be undone.</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Comprehensive User Management */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>User Management</span>
              <span className="text-sm font-normal text-gray-500">
                {totalUsers} total users
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {/* Search Bar */}
            <div className="mb-6">
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search users by name or email..."
                  value={searchTerm}
                  onChange={handleSearchChange}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Users Table */}
            {userLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
                <p className="mt-2 text-gray-600">Loading users...</p>
              </div>
            ) : users && users.length > 0 ? (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-3 px-2 font-medium text-gray-700">User</th>
                        <th className="text-left py-3 px-2 font-medium text-gray-700">Role</th>
                        <th className="text-left py-3 px-2 font-medium text-gray-700">Status</th>
                        <th className="text-left py-3 px-2 font-medium text-gray-700">Created</th>
                        <th className="text-right py-3 px-2 font-medium text-gray-700">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(users || []).map((user) => (
                        <tr key={user.id} className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="py-3 px-2">
                            <div>
                              <div className="font-medium text-gray-900">
                                {user.firstName} {user.lastName}
                              </div>
                              <div className="text-sm text-gray-500">{user.email}</div>
                            </div>
                          </td>
                          <td className="py-3 px-2">
                            <div className="flex gap-1">
                              {user.roles.map(role => (
                                <Badge key={role} variant={role === 'Admin' ? 'destructive' : 'default'}>
                                  {role}
                                </Badge>
                              ))}
                            </div>
                          </td>
                          <td className="py-3 px-2">
                            <Badge variant={user.isDisabled ? 'outline' : 'default'}>
                              {user.isDisabled ? 'Disabled' : 'Active'}
                            </Badge>
                          </td>
                          <td className="py-3 px-2 text-sm text-gray-500">
                            {new Date(user.createdAt).toLocaleDateString()}
                          </td>
                          <td className="py-3 px-2">
                            {!user.roles.includes('Admin') && (
                              <div className="flex gap-1 justify-end">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleToggleUserStatus(
                                    user.id,
                                    `${user.firstName} ${user.lastName}`,
                                    user.isDisabled
                                  )}
                                  className="flex items-center gap-1"
                                >
                                  {user.isDisabled ? (
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
                                  variant="destructive"
                                  onClick={() => handleDeleteUser(
                                    user.id,
                                    `${user.firstName} ${user.lastName}`
                                  )}
                                  className="flex items-center gap-1"
                                >
                                  <TrashIcon className="h-3 w-3" />
                                  Delete
                                </Button>
                              </div>
                            )}
                            {user.roles.includes('Admin') && (
                              <span className="text-xs text-gray-400">Protected</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between mt-6">
                    <div className="text-sm text-gray-700">
                      Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, totalUsers)} of {totalUsers} users
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage <= 1}
                        className="flex items-center gap-1"
                      >
                        <ChevronLeftIcon className="h-4 w-4" />
                        Previous
                      </Button>

                      <div className="flex gap-1">
                        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                          const page = Math.max(1, Math.min(totalPages - 4, currentPage - 2)) + i;
                          if (page > totalPages) return null;
                          return (
                            <Button
                              key={page}
                              size="sm"
                              variant={currentPage === page ? "default" : "outline"}
                              onClick={() => handlePageChange(page)}
                              className="w-8"
                            >
                              {page}
                            </Button>
                          );
                        })}
                      </div>

                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage >= totalPages}
                        className="flex items-center gap-1"
                      >
                        Next
                        <ChevronRightIcon className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-8 text-gray-500">
                {searchTerm ? `No users found matching "${searchTerm}"` : 'No users found'}
              </div>
            )}
          </CardContent>
        </Card>


        {/* Quick Actions */}
        <div className="mt-8">
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <Button onClick={handleManageQuizzes} variant="outline" className="h-20 flex flex-col gap-2">
                  <BookOpenIcon className="h-6 w-6" />
                  Manage Quizzes
                </Button>
                <Button onClick={handleViewAllStatistics} variant="outline" className="h-20 flex flex-col gap-2">
                  <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  View All Statistics
                </Button>
                <Button onClick={handleCreateQuiz} variant="outline" className="h-20 flex flex-col gap-2">
                  <PlusIcon className="h-6 w-6" />
                  Create Quiz
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

export default AdminDashboard