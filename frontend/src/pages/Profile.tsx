import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'
import { useQuiz } from '@/hooks/useQuiz'
import { QuizAttempt, PaginatedResponse } from '@/types'
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
  LockClosedIcon,
  FireIcon,
  AcademicCapIcon,
  ArrowTrendingUpIcon,
  SparklesIcon
} from '@heroicons/react/24/outline'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Spinner } from '@/components/ui/spinner'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { getDifficultyLabel, getDifficultyBadgeVariant } from '@/utils/difficulty'

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

  // Get user initials
  const userInitials = `${user?.firstName?.[0] || ''}${user?.lastName?.[0] || ''}`.toUpperCase()

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Profile Header Card */}
      <div className="card-premium p-8">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-center gap-6">
            {/* Avatar */}
            <div className="relative">
              <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-primary-600 to-accent-600 flex items-center justify-center text-white text-3xl font-bold shadow-glow">
                {userInitials}
              </div>
              <div className="absolute -bottom-2 -right-2 p-2 rounded-xl bg-accent-100 border-2 border-white shadow-soft">
                <UserIcon className="h-5 w-5 text-accent-600" />
              </div>
            </div>

            {/* User Info */}
            <div>
              <h1 className="text-4xl font-bold text-secondary-900 mb-2">
                {user?.firstName} {user?.lastName}
              </h1>
              <p className="text-lg text-secondary-600 mb-3">{user?.email}</p>
              <div className="flex items-center gap-2 text-secondary-600">
                <CalendarDaysIcon className="h-5 w-5" />
                <span>Member since {user?.createdAt ? formatDate(user.createdAt) : 'N/A'}</span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button
              variant="primary"
              size="md"
              onClick={() => setIsEditModalOpen(true)}
              className="gap-2"
            >
              <PencilIcon className="h-4 w-4" />
              Edit Profile
            </Button>
            <Button
              variant="secondary"
              size="md"
              onClick={() => setIsPasswordModalOpen(true)}
              className="gap-2"
            >
              <LockClosedIcon className="h-4 w-4" />
              Change Password
            </Button>
          </div>
        </div>
      </div>

      {/* Performance Stats */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="card-premium p-6 animate-scale-in">
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 rounded-xl bg-gradient-to-br from-primary-600 to-primary-500 shadow-soft">
                <AcademicCapIcon className="h-6 w-6 text-white" />
              </div>
              <div>
                <div className="text-sm text-secondary-600">Total Quizzes</div>
                <div className="text-3xl font-bold text-secondary-900">{stats.totalQuizzes}</div>
              </div>
            </div>
            <div className="w-full bg-secondary-200 rounded-full h-2">
              <div className="h-2 bg-gradient-to-r from-primary-600 to-primary-500 rounded-full w-full" />
            </div>
          </div>

          <div className="card-premium p-6 animate-scale-in" style={{ animationDelay: '50ms' }}>
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 rounded-xl bg-gradient-to-br from-accent-600 to-accent-500 shadow-soft">
                <ChartBarIcon className="h-6 w-6 text-white" />
              </div>
              <div>
                <div className="text-sm text-secondary-600">Average Score</div>
                <div className="text-3xl font-bold text-secondary-900">{stats.averageScore}%</div>
              </div>
            </div>
            <div className="w-full bg-secondary-200 rounded-full h-2">
              <div
                className="h-2 bg-gradient-to-r from-accent-600 to-accent-500 rounded-full transition-all duration-500"
                style={{ width: `${stats.averageScore}%` }}
              />
            </div>
          </div>

          <div className="card-premium p-6 animate-scale-in" style={{ animationDelay: '100ms' }}>
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 rounded-xl bg-gradient-to-br from-warning-600 to-warning-500 shadow-soft">
                <TrophyIcon className="h-6 w-6 text-white" />
              </div>
              <div>
                <div className="text-sm text-secondary-600">Best Score</div>
                <div className="text-3xl font-bold text-secondary-900">{stats.bestScore}%</div>
              </div>
            </div>
            <Badge variant="warning" className="gap-1">
              <FireIcon className="h-3 w-3" />
              Personal Best
            </Badge>
          </div>

          <div className="card-premium p-6 animate-scale-in" style={{ animationDelay: '150ms' }}>
            <div className="flex items-center gap-4 mb-4">
              <div className={`p-3 rounded-xl shadow-soft ${
                stats.recentImprovement > 0
                  ? 'bg-gradient-to-br from-accent-600 to-accent-500'
                  : stats.recentImprovement < 0
                  ? 'bg-gradient-to-br from-danger-600 to-danger-500'
                  : 'bg-gradient-to-br from-secondary-600 to-secondary-500'
              }`}>
                <ArrowTrendingUpIcon className="h-6 w-6 text-white" />
              </div>
              <div>
                <div className="text-sm text-secondary-600">Recent Trend</div>
                <div className={`text-3xl font-bold ${
                  stats.recentImprovement > 0 ? 'text-accent-600' :
                  stats.recentImprovement < 0 ? 'text-danger-600' : 'text-secondary-900'
                }`}>
                  {stats.recentImprovement > 0 ? '+' : ''}{stats.recentImprovement}%
                </div>
              </div>
            </div>
            <Badge variant={stats.recentImprovement >= 0 ? 'success' : 'danger'}>
              {stats.recentImprovement >= 0 ? 'Improving' : 'Needs Work'}
            </Badge>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="card-premium overflow-hidden">
        <div className="border-b border-secondary-200">
          <nav className="flex">
            <button
              onClick={() => handleTabChange('profile')}
              className={`flex items-center gap-2 py-4 px-8 text-sm font-semibold border-b-2 transition-all ${
                activeTab === 'profile'
                  ? 'border-primary-600 text-primary-600 bg-primary-50/50'
                  : 'border-transparent text-secondary-600 hover:text-secondary-900 hover:border-secondary-300'
              }`}
            >
              <UserIcon className="h-5 w-5" />
              Profile Information
            </button>
            <button
              onClick={() => handleTabChange('attempts')}
              className={`flex items-center gap-2 py-4 px-8 text-sm font-semibold border-b-2 transition-all ${
                activeTab === 'attempts'
                  ? 'border-primary-600 text-primary-600 bg-primary-50/50'
                  : 'border-transparent text-secondary-600 hover:text-secondary-900 hover:border-secondary-300'
              }`}
            >
              <TrophyIcon className="h-5 w-5" />
              Quiz History
            </button>
          </nav>
        </div>

        <div className="p-8">
          {activeTab === 'profile' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label>First Name</Label>
                  <div className="mt-2 p-4 bg-secondary-50 border border-secondary-200 rounded-xl text-secondary-900 font-medium">
                    {user?.firstName || 'N/A'}
                  </div>
                </div>
                <div>
                  <Label>Last Name</Label>
                  <div className="mt-2 p-4 bg-secondary-50 border border-secondary-200 rounded-xl text-secondary-900 font-medium">
                    {user?.lastName || 'N/A'}
                  </div>
                </div>
              </div>

              <div>
                <Label>Email Address</Label>
                <div className="mt-2 p-4 bg-secondary-50 border border-secondary-200 rounded-xl text-secondary-900 font-medium">
                  {user?.email || 'N/A'}
                </div>
              </div>

              <div className="pt-6 border-t border-secondary-200">
                <div className="flex items-start justify-between gap-6">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-xl font-bold text-secondary-900">Account Settings</h3>
                      <SparklesIcon className="h-5 w-5 text-primary-600" />
                    </div>
                    <p className="text-secondary-600">
                      Manage your profile information and account security settings.
                    </p>
                  </div>
                  <div className="flex gap-3">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => setIsEditModalOpen(true)}
                      className="gap-2"
                    >
                      <PencilIcon className="h-4 w-4" />
                      Edit Info
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => setIsPasswordModalOpen(true)}
                      className="gap-2"
                    >
                      <LockClosedIcon className="h-4 w-4" />
                      Password
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'attempts' && (
            <div>
              {loading ? (
                <div className="flex flex-col items-center justify-center py-20">
                  <Spinner size="lg" />
                  <p className="mt-4 text-secondary-600 text-lg">Loading quiz history...</p>
                </div>
              ) : userAttempts && userAttempts.data.length > 0 ? (
                <div className="space-y-4">
                  {userAttempts.data.map((attempt, index) => (
                    <div
                      key={attempt.id}
                      className="card-interactive p-6 animate-fade-in-up"
                      style={{ animationDelay: `${index * 30}ms` }}
                    >
                      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                        {/* Left Section */}
                        <div className="flex items-start gap-4 flex-1 min-w-0">
                          {/* Status Icon */}
                          <div className="flex-shrink-0">
                            {attempt.status === 1 ? (
                              <div className={`flex items-center justify-center w-14 h-14 rounded-xl shadow-soft ${
                                attempt.percentage >= 80
                                  ? 'bg-gradient-to-br from-accent-600 to-accent-500'
                                  : attempt.percentage >= 60
                                  ? 'bg-gradient-to-br from-warning-600 to-warning-500'
                                  : 'bg-gradient-to-br from-danger-600 to-danger-500'
                              }`}>
                                <CheckCircleIcon className="h-7 w-7 text-white" />
                              </div>
                            ) : (
                              <div className="flex items-center justify-center w-14 h-14 rounded-xl bg-secondary-100 shadow-soft">
                                <XCircleIcon className="h-7 w-7 text-secondary-400" />
                              </div>
                            )}
                          </div>

                          {/* Attempt Info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-3">
                              <h3 className="text-xl font-bold text-secondary-900 truncate">
                                {attempt.quiz.title}
                              </h3>
                              {attempt.status === 1 && (
                                <Badge
                                  variant={
                                    attempt.percentage >= 80 ? 'success' :
                                    attempt.percentage >= 60 ? 'warning' : 'danger'
                                  }
                                  size="lg"
                                >
                                  {Math.round(attempt.percentage)}%
                                </Badge>
                              )}
                            </div>

                            <div className="flex flex-wrap items-center gap-4 text-sm text-secondary-600">
                              <div className="flex items-center gap-1">
                                <CalendarDaysIcon className="h-4 w-4" />
                                <span>{formatDate(attempt.startedAt)}</span>
                              </div>
                              {attempt.status === 1 && (
                                <>
                                  <div className="flex items-center gap-1">
                                    <TrophyIcon className="h-4 w-4" />
                                    <span>{attempt.score}/{attempt.totalPoints} pts</span>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <ClockIcon className="h-4 w-4" />
                                    <span>{formatDuration(attempt.startedAt, attempt.finishedAt || new Date().toISOString())}</span>
                                  </div>
                                </>
                              )}
                              <Badge variant={getDifficultyBadgeVariant(attempt.quiz.difficulty)} size="sm">
                                {getDifficultyLabel(attempt.quiz.difficulty)}
                              </Badge>
                            </div>
                          </div>
                        </div>

                        {/* Right Section - Action Button */}
                        <div className="flex-shrink-0">
                          {attempt.status === 1 ? (
                            <a href={`/results/${attempt.id}`}>
                              <Button variant="primary" size="md" className="gap-2">
                                <EyeIcon className="h-4 w-4" />
                                View Results
                              </Button>
                            </a>
                          ) : (
                            <a href={`/quizzes/${attempt.quizId}/take`}>
                              <Button variant="secondary" size="md" className="gap-2">
                                <PlayIcon className="h-4 w-4" />
                                Resume
                              </Button>
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}

                  {/* Pagination */}
                  {userAttempts.totalPages > 1 && (
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t border-secondary-200">
                      <div className="text-sm text-secondary-600">
                        Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, userAttempts.totalCount)} of {userAttempts.totalCount} attempts
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                          disabled={!userAttempts.hasPreviousPage}
                        >
                          Previous
                        </Button>
                        <span className="text-sm font-semibold text-secondary-700 px-4">
                          Page {currentPage} of {userAttempts.totalPages}
                        </span>
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => setCurrentPage(Math.min(userAttempts.totalPages, currentPage + 1))}
                          disabled={!userAttempts.hasNextPage}
                        >
                          Next
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-20">
                  <div className="inline-flex p-6 rounded-2xl bg-gradient-to-br from-primary-50 to-accent-50 mb-6">
                    <TrophyIcon className="h-16 w-16 text-primary-600" />
                  </div>
                  <h3 className="text-2xl font-bold text-secondary-900 mb-2">No Quiz Attempts Yet</h3>
                  <p className="text-secondary-600 mb-8 max-w-md mx-auto">
                    Start taking quizzes to track your progress and performance!
                  </p>
                  <a href="/quizzes">
                    <Button variant="primary" size="lg" className="gap-2">
                      <PlayIcon className="h-5 w-5" />
                      Browse Quizzes
                    </Button>
                  </a>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Edit Profile Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 bg-secondary-900/50 backdrop-blur-sm overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
          <div className="card-premium w-full max-w-md p-8 animate-scale-in">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-secondary-900">Edit Profile</h3>
              <button
                onClick={closeEditModal}
                className="text-secondary-400 hover:text-secondary-600 transition-colors"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleEditProfile} className="space-y-5">
              <div>
                <Label required>First Name</Label>
                <Input
                  type="text"
                  value={editForm.firstName}
                  onChange={(e) => setEditForm({ ...editForm, firstName: e.target.value })}
                  placeholder="Enter your first name"
                  required
                />
              </div>

              <div>
                <Label required>Last Name</Label>
                <Input
                  type="text"
                  value={editForm.lastName}
                  onChange={(e) => setEditForm({ ...editForm, lastName: e.target.value })}
                  placeholder="Enter your last name"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={closeEditModal}
                  disabled={isLoading}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  disabled={isLoading}
                  isLoading={isLoading}
                >
                  Save Changes
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Change Password Modal */}
      {isPasswordModalOpen && (
        <div className="fixed inset-0 bg-secondary-900/50 backdrop-blur-sm overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
          <div className="card-premium w-full max-w-md p-8 animate-scale-in">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-secondary-900">Change Password</h3>
              <button
                onClick={closePasswordModal}
                className="text-secondary-400 hover:text-secondary-600 transition-colors"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleChangePassword} className="space-y-5">
              <div>
                <Label required>Current Password</Label>
                <Input
                  type="password"
                  value={passwordForm.currentPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                  placeholder="Enter your current password"
                  required
                />
              </div>

              <div>
                <Label required>New Password</Label>
                <Input
                  type="password"
                  value={passwordForm.newPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                  placeholder="Enter your new password"
                  required
                  minLength={6}
                />
              </div>

              <div>
                <Label required>Confirm New Password</Label>
                <Input
                  type="password"
                  value={passwordForm.confirmPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                  placeholder="Confirm your new password"
                  required
                  minLength={6}
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={closePasswordModal}
                  disabled={isLoading}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  disabled={isLoading}
                  isLoading={isLoading}
                >
                  Change Password
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default Profile
