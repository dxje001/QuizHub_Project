import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'
import { useQuiz } from '@/hooks/useQuiz'
import { QuizAttempt, PaginatedResponse, User } from '@/types'
import authService from '@/services/authService'
import toast from 'react-hot-toast'
import {
  UserIcon,
  CalendarDaysIcon,
  TrophyIcon,
  ChartBarIcon,
  EyeIcon,
  PlayIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  PencilIcon,
  XMarkIcon,
  LockClosedIcon
} from '@heroicons/react/24/outline'

const Profile = () => {
  const { user, setUser } = useAuthStore()
  const { getUserAttempts, loading } = useQuiz()
  const [searchParams, setSearchParams] = useSearchParams()

  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'profile')
  const [userAttempts, setUserAttempts] = useState<PaginatedResponse<QuizAttempt> | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const pageSize = 10

  // Edit profile modal state
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  // Form states
  const [editForm, setEditForm] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || ''
  })
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })

  useEffect(() => {
    if (activeTab === 'attempts') {
      loadUserAttempts()
    }
  }, [activeTab, currentPage])

  useEffect(() => {
    const tab = searchParams.get('tab')
    if (tab && ['profile', 'attempts'].includes(tab)) {
      setActiveTab(tab)
    }
  }, [searchParams])

  const loadUserAttempts = async () => {
    const result = await getUserAttempts(currentPage, pageSize)
    if (result) {
      setUserAttempts(result)
    }
  }

  const handleTabChange = (tab: string) => {
    setActiveTab(tab)
    setSearchParams({ tab })
    if (tab === 'attempts') {
      setCurrentPage(1)
    }
  }

  const getDifficultyLabel = (difficulty: number | string): string => {
    if (typeof difficulty === 'number') {
      switch (difficulty) {
        case 1:
          return 'Easy'
        case 2:
          return 'Medium'
        case 3:
          return 'Hard'
        default:
          return 'Unknown'
      }
    }
    return difficulty
  }

  const getDifficultyColor = (difficulty: number | string) => {
    const label = getDifficultyLabel(difficulty)
    switch (label.toLowerCase()) {
      case 'easy':
        return 'text-green-600 bg-green-100'
      case 'medium':
        return 'text-yellow-600 bg-yellow-100'
      case 'hard':
        return 'text-red-600 bg-red-100'
      default:
        return 'text-gray-600 bg-gray-100'
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const formatDuration = (startTime: string, endTime: string): string => {
    const start = new Date(startTime).getTime()
    const end = new Date(endTime).getTime()
    const durationMinutes = Math.floor((end - start) / (1000 * 60))

    if (durationMinutes < 60) {
      return `${durationMinutes}m`
    }

    const hours = Math.floor(durationMinutes / 60)
    const minutes = durationMinutes % 60
    return `${hours}h ${minutes}m`
  }

  // Calculate statistics from attempts
  const calculateStats = () => {
    if (!userAttempts?.data.length) return null

    const completedAttempts = userAttempts.data.filter(a => a.status === 1)

    if (!completedAttempts.length) return null

    const totalScore = completedAttempts.reduce((sum, attempt) => sum + attempt.percentage, 0)
    const averageScore = Math.round(totalScore / completedAttempts.length)
    const bestScore = Math.round(Math.max(...completedAttempts.map(a => a.percentage)))
    const totalQuizzes = userAttempts.totalCount
    const recentImprovement = completedAttempts.length >= 2
      ? Math.round(completedAttempts[0].percentage - completedAttempts[1].percentage)
      : 0

    return {
      totalQuizzes,
      averageScore,
      bestScore,
      recentImprovement
    }
  }

  const stats = calculateStats()

  // Update form when user changes
  useEffect(() => {
    if (user) {
      setEditForm({
        firstName: user.firstName || '',
        lastName: user.lastName || ''
      })
    }
  }, [user])

  const handleEditProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editForm.firstName.trim() || !editForm.lastName.trim()) {
      toast.error('Please fill in all required fields')
      return
    }

    setIsLoading(true)
    try {
      const updatedUser = await authService.updateProfile({
        firstName: editForm.firstName.trim(),
        lastName: editForm.lastName.trim()
      })
      setUser(updatedUser)
      toast.success('Profile updated successfully!')
      setIsEditModalOpen(false)
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update profile')
    } finally {
      setIsLoading(false)
    }
  }

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword) {
      toast.error('Please fill in all fields')
      return
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error('New passwords do not match')
      return
    }

    if (passwordForm.newPassword.length < 6) {
      toast.error('New password must be at least 6 characters long')
      return
    }

    setIsLoading(true)
    try {
      await authService.changePassword(passwordForm.currentPassword, passwordForm.newPassword)
      toast.success('Password changed successfully!')
      setIsPasswordModalOpen(false)
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' })
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to change password')
    } finally {
      setIsLoading(false)
    }
  }

  const closeEditModal = () => {
    setIsEditModalOpen(false)
    setEditForm({
      firstName: user?.firstName || '',
      lastName: user?.lastName || ''
    })
  }

  const closePasswordModal = () => {
    setIsPasswordModalOpen(false)
    setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' })
  }

  return (
    <div className="max-w-6xl mx-auto">
      {/* Profile Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className="h-20 w-20 rounded-full bg-primary-600 flex items-center justify-center text-white text-2xl font-bold mr-6">
              {user?.firstName?.[0]}{user?.lastName?.[0]}
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {user?.firstName} {user?.lastName}
              </h1>
              <p className="text-gray-600 mt-1">{user?.email}</p>
              <div className="flex items-center mt-2 text-sm text-gray-500">
                <CalendarDaysIcon className="h-4 w-4 mr-1" />
                <span>Member since {user?.createdAt ? formatDate(user.createdAt) : 'N/A'}</span>
              </div>
            </div>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={() => setIsEditModalOpen(true)}
              className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
            >
              <PencilIcon className="h-4 w-4 mr-2" />
              Edit Profile
            </button>
            <button
              onClick={() => setIsPasswordModalOpen(true)}
              className="inline-flex items-center px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <LockClosedIcon className="h-4 w-4 mr-2" />
              Change Password
            </button>
          </div>
        </div>
      </div>

      {/* Performance Stats */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <TrophyIcon className="h-8 w-8 text-blue-600 mr-3" />
              <div>
                <h3 className="text-sm font-medium text-gray-500">Total Quizzes</h3>
                <p className="text-2xl font-bold text-gray-900">{stats.totalQuizzes}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <ChartBarIcon className="h-8 w-8 text-green-600 mr-3" />
              <div>
                <h3 className="text-sm font-medium text-gray-500">Average Score</h3>
                <p className="text-2xl font-bold text-gray-900">{stats.averageScore}%</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <TrophyIcon className="h-8 w-8 text-yellow-600 mr-3" />
              <div>
                <h3 className="text-sm font-medium text-gray-500">Best Score</h3>
                <p className="text-2xl font-bold text-gray-900">{stats.bestScore}%</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <ChartBarIcon className={`h-8 w-8 mr-3 ${
                stats.recentImprovement > 0 ? 'text-green-600' :
                stats.recentImprovement < 0 ? 'text-red-600' : 'text-gray-600'
              }`} />
              <div>
                <h3 className="text-sm font-medium text-gray-500">Recent Trend</h3>
                <p className={`text-2xl font-bold ${
                  stats.recentImprovement > 0 ? 'text-green-600' :
                  stats.recentImprovement < 0 ? 'text-red-600' : 'text-gray-900'
                }`}>
                  {stats.recentImprovement > 0 ? '+' : ''}{stats.recentImprovement}%
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex">
            <button
              onClick={() => handleTabChange('profile')}
              className={`py-4 px-6 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'profile'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <UserIcon className="h-4 w-4 inline mr-2" />
              Profile Information
            </button>
            <button
              onClick={() => handleTabChange('attempts')}
              className={`py-4 px-6 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'attempts'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <TrophyIcon className="h-4 w-4 inline mr-2" />
              Quiz History
            </button>
          </nav>
        </div>

        <div className="p-6">
          {activeTab === 'profile' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">First Name</label>
                  <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg text-gray-900">
                    {user?.firstName || 'N/A'}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Last Name</label>
                  <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg text-gray-900">
                    {user?.lastName || 'N/A'}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
                <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg text-gray-900">
                  {user?.email || 'N/A'}
                </div>
              </div>

              <div className="pt-4 border-t border-gray-200">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium text-gray-900">Account Settings</h3>
                  <div className="flex space-x-3">
                    <button
                      onClick={() => setIsEditModalOpen(true)}
                      className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                    >
                      <PencilIcon className="h-4 w-4 mr-1" />
                      Edit Information
                    </button>
                    <button
                      onClick={() => setIsPasswordModalOpen(true)}
                      className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                    >
                      <LockClosedIcon className="h-4 w-4 mr-1" />
                      Change Password
                    </button>
                  </div>
                </div>
                <p className="text-gray-500 text-sm mt-2">
                  Manage your profile information and account security settings.
                </p>
              </div>
            </div>
          )}

          {activeTab === 'attempts' && (
            <div>
              {loading ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
                  <p className="mt-4 text-gray-600">Loading quiz history...</p>
                </div>
              ) : userAttempts && userAttempts.data.length > 0 ? (
                <div className="space-y-4">
                  {userAttempts.data.map((attempt) => (
                    <div
                      key={attempt.id}
                      className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors"
                    >
                      <div className="flex items-center flex-1 min-w-0">
                        <div className="flex-shrink-0 mr-4">
                          {attempt.status === 1 ? (
                            <div className={`flex items-center justify-center w-12 h-12 rounded-full ${
                              attempt.percentage >= 80 ? 'bg-green-100 text-green-600' :
                              attempt.percentage >= 60 ? 'bg-yellow-100 text-yellow-600' :
                              'bg-red-100 text-red-600'
                            }`}>
                              <CheckCircleIcon className="h-6 w-6" />
                            </div>
                          ) : (
                            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-gray-100 text-gray-400">
                              <XCircleIcon className="h-6 w-6" />
                            </div>
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-2">
                            <h3 className="text-lg font-medium text-gray-900 truncate">
                              {attempt.quiz.title}
                            </h3>
                            {attempt.status === 1 && (
                              <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                                attempt.percentage >= 80 ? 'bg-green-100 text-green-800' :
                                attempt.percentage >= 60 ? 'bg-yellow-100 text-yellow-800' :
                                'bg-red-100 text-red-800'
                              }`}>
                                {Math.round(attempt.percentage)}% Score
                              </span>
                            )}
                          </div>

                          <div className="flex items-center text-sm text-gray-500 space-x-4">
                            <div className="flex items-center">
                              <CalendarDaysIcon className="h-4 w-4 mr-1" />
                              <span>{formatDate(attempt.startedAt)}</span>
                            </div>
                            {attempt.status === 1 && (
                              <>
                                <div className="flex items-center">
                                  <TrophyIcon className="h-4 w-4 mr-1" />
                                  <span>{attempt.score}/{attempt.totalPoints} points</span>
                                </div>
                                <div className="flex items-center">
                                  <ClockIcon className="h-4 w-4 mr-1" />
                                  <span>{formatDuration(attempt.startedAt, attempt.finishedAt || new Date().toISOString())}</span>
                                </div>
                              </>
                            )}
                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getDifficultyColor(attempt.quiz.difficulty)}`}>
                              {getDifficultyLabel(attempt.quiz.difficulty)}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center ml-4 space-x-2">
                        {attempt.status === 1 ? (
                          <a
                            href={`/results/${attempt.id}`}
                            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-primary-700 bg-primary-100 hover:bg-primary-200"
                          >
                            <EyeIcon className="h-4 w-4 mr-1" />
                            View Results
                          </a>
                        ) : (
                          <a
                            href={`/quizzes/${attempt.quizId}/take`}
                            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-gray-700 bg-gray-100 hover:bg-gray-200"
                          >
                            <PlayIcon className="h-4 w-4 mr-1" />
                            Resume
                          </a>
                        )}
                      </div>
                    </div>
                  ))}

                  {/* Pagination */}
                  {userAttempts.totalPages > 1 && (
                    <div className="flex items-center justify-between border-t border-gray-200 pt-6">
                      <div className="text-sm text-gray-700">
                        Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, userAttempts.totalCount)} of {userAttempts.totalCount} attempts
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                          disabled={!userAttempts.hasPreviousPage}
                          className="px-3 py-1 border border-gray-300 rounded-md text-sm text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Previous
                        </button>
                        <span className="text-sm text-gray-700">
                          Page {currentPage} of {userAttempts.totalPages}
                        </span>
                        <button
                          onClick={() => setCurrentPage(Math.min(userAttempts.totalPages, currentPage + 1))}
                          disabled={!userAttempts.hasNextPage}
                          className="px-3 py-1 border border-gray-300 rounded-md text-sm text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Next
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-12">
                  <TrophyIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Quiz Attempts Yet</h3>
                  <p className="text-gray-500 mb-6">Start taking quizzes to track your progress and performance!</p>
                  <a
                    href="/quizzes"
                    className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                  >
                    <PlayIcon className="h-5 w-5 mr-2" />
                    Browse Quizzes
                  </a>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Edit Profile Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900">Edit Profile</h3>
              <button
                onClick={closeEditModal}
                className="text-gray-400 hover:text-gray-600"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleEditProfile} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  First Name *
                </label>
                <input
                  type="text"
                  value={editForm.firstName}
                  onChange={(e) => setEditForm({ ...editForm, firstName: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="Enter your first name"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Last Name *
                </label>
                <input
                  type="text"
                  value={editForm.lastName}
                  onChange={(e) => setEditForm({ ...editForm, lastName: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="Enter your last name"
                  required
                />
              </div>

              <div className="flex items-center justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={closeEditModal}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                  disabled={isLoading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="px-4 py-2 bg-primary-600 text-white rounded-md text-sm font-medium hover:bg-primary-700 disabled:opacity-50 flex items-center"
                >
                  {isLoading && (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  )}
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Change Password Modal */}
      {isPasswordModalOpen && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900">Change Password</h3>
              <button
                onClick={closePasswordModal}
                className="text-gray-400 hover:text-gray-600"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleChangePassword} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Current Password *
                </label>
                <input
                  type="password"
                  value={passwordForm.currentPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="Enter your current password"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  New Password *
                </label>
                <input
                  type="password"
                  value={passwordForm.newPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="Enter your new password"
                  required
                  minLength={6}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Confirm New Password *
                </label>
                <input
                  type="password"
                  value={passwordForm.confirmPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="Confirm your new password"
                  required
                  minLength={6}
                />
              </div>

              <div className="flex items-center justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={closePasswordModal}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                  disabled={isLoading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="px-4 py-2 bg-primary-600 text-white rounded-md text-sm font-medium hover:bg-primary-700 disabled:opacity-50 flex items-center"
                >
                  {isLoading && (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  )}
                  Change Password
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default Profile