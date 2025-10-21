import { useState, useEffect } from 'react'
import { QuizAttempt } from '@/types'
import quizService from '@/services/quizService'
import {
  MagnifyingGlassIcon,
  TrophyIcon,
  ClockIcon,
  CalendarIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ChartBarIcon,
  UserIcon,
  FunnelIcon,
  CheckCircleIcon,
  AcademicCapIcon,
  FireIcon
} from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Spinner } from '@/components/ui/spinner'

const AllResults = () => {
  const [attempts, setAttempts] = useState<QuizAttempt[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalAttempts, setTotalAttempts] = useState(0)
  const [selectedQuiz, setSelectedQuiz] = useState<string>('')
  const [selectedUser, setSelectedUser] = useState<string>('')
  const pageSize = 15

  useEffect(() => {
    fetchAllAttempts()
  }, [currentPage])

  const fetchAllAttempts = async () => {
    setLoading(true)
    try {
      const response = await quizService.getAllAttempts(currentPage, pageSize)
      setAttempts(response.data)
      setTotalPages(response.totalPages)
      setTotalAttempts(response.totalCount)
    } catch (error) {
      console.error('Error fetching all attempts:', error)
      try {
        const fallbackResponse = await quizService.getUserAttempts(currentPage, pageSize)
        setAttempts(fallbackResponse.data)
        setTotalPages(fallbackResponse.totalPages)
        setTotalAttempts(fallbackResponse.totalCount)
        toast.error('Admin endpoint not available yet - showing your results only')
      } catch (fallbackError) {
        toast.error('Failed to load quiz results')
      }
    } finally {
      setLoading(false)
    }
  }

  const filteredAttempts = attempts.filter(attempt => {
    const matchesSearch = searchTerm === '' ||
      attempt.quiz.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      attempt.quiz.category.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      `${attempt.user?.firstName} ${attempt.user?.lastName}`.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesQuiz = selectedQuiz === '' || attempt.quizId === selectedQuiz
    const matchesUser = selectedUser === '' || attempt.userId === selectedUser

    return matchesSearch && matchesQuiz && matchesUser
  })

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatDuration = (startTime: string, endTime: string) => {
    const start = new Date(startTime).getTime()
    const end = new Date(endTime || startTime).getTime()
    const durationSeconds = Math.floor((end - start) / 1000)
    const minutes = Math.floor(durationSeconds / 60)
    const seconds = durationSeconds % 60
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }

  const getScoreVariant = (percentage: number): 'success' | 'warning' | 'danger' => {
    if (percentage >= 80) return 'success'
    if (percentage >= 60) return 'warning'
    return 'danger'
  }

  const getScoreGrade = (percentage: number) => {
    if (percentage >= 90) return 'A'
    if (percentage >= 80) return 'B'
    if (percentage >= 70) return 'C'
    if (percentage >= 60) return 'D'
    return 'F'
  }

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage)
  }

  const clearFilters = () => {
    setSearchTerm('')
    setSelectedQuiz('')
    setSelectedUser('')
  }

  const hasActiveFilters = searchTerm || selectedQuiz || selectedUser

  // Get unique quizzes and users for filters
  const uniqueQuizzes = Array.from(new Set(attempts.map(a => a.quiz.title)))
    .map(title => attempts.find(a => a.quiz.title === title)!)
    .map(a => ({ id: a.quizId, title: a.quiz.title }))

  const uniqueUsers = Array.from(new Set(attempts.map(a => a.userId)))
    .map(userId => attempts.find(a => a.userId === userId)!)
    .map(a => ({
      id: a.userId,
      name: `${a.user?.firstName || ''} ${a.user?.lastName || ''}`.trim() || a.user?.email || 'Unknown User'
    }))

  if (loading && attempts.length === 0) {
    return (
      <div className="min-h-[calc(100vh-5rem)] flex flex-col items-center justify-center">
        <Spinner size="lg" />
        <p className="mt-4 text-secondary-600 text-lg">Loading all results...</p>
      </div>
    )
  }

  const avgScore = attempts.length > 0
    ? Math.round(attempts.reduce((sum, a) => sum + a.percentage, 0) / attempts.length)
    : 0
  const passedCount = attempts.filter(a => a.percentage >= 70).length
  const uniqueUserCount = new Set(attempts.map(a => a.userId)).size

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Header */}
      <div className="card-premium p-8">
        <div className="flex items-center gap-4">
          <div className="p-4 rounded-2xl bg-gradient-to-br from-primary-600 to-accent-600 shadow-glow">
            <ChartBarIcon className="h-10 w-10 text-white" />
          </div>
          <div>
            <h1 className="text-4xl font-bold text-secondary-900">All Quiz Results</h1>
            <p className="text-lg text-secondary-600 mt-1">
              View and analyze quiz attempts from all users across the platform
            </p>
          </div>
        </div>
      </div>

      {/* Stats Overview */}
      {totalAttempts > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="card-premium p-6 animate-scale-in">
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 rounded-xl bg-gradient-to-br from-primary-600 to-primary-500 shadow-soft">
                <ChartBarIcon className="h-6 w-6 text-white" />
              </div>
              <div>
                <div className="text-sm text-secondary-600">Total Attempts</div>
                <div className="text-3xl font-bold text-secondary-900">{totalAttempts}</div>
              </div>
            </div>
            <div className="w-full bg-secondary-200 rounded-full h-2">
              <div className="h-2 bg-gradient-to-r from-primary-600 to-primary-500 rounded-full w-full" />
            </div>
          </div>

          <div className="card-premium p-6 animate-scale-in" style={{ animationDelay: '50ms' }}>
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 rounded-xl bg-gradient-to-br from-accent-600 to-accent-500 shadow-soft">
                <TrophyIcon className="h-6 w-6 text-white" />
              </div>
              <div>
                <div className="text-sm text-secondary-600">Average Score</div>
                <div className="text-3xl font-bold text-secondary-900">{avgScore}%</div>
              </div>
            </div>
            <div className="w-full bg-secondary-200 rounded-full h-2">
              <div
                className="h-2 bg-gradient-to-r from-accent-600 to-accent-500 rounded-full transition-all duration-500"
                style={{ width: `${avgScore}%` }}
              />
            </div>
          </div>

          <div className="card-premium p-6 animate-scale-in" style={{ animationDelay: '100ms' }}>
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 rounded-xl bg-gradient-to-br from-warning-600 to-warning-500 shadow-soft">
                <CheckCircleIcon className="h-6 w-6 text-white" />
              </div>
              <div>
                <div className="text-sm text-secondary-600">Passed (≥70%)</div>
                <div className="text-3xl font-bold text-secondary-900">{passedCount}</div>
              </div>
            </div>
            <div className="w-full bg-secondary-200 rounded-full h-2">
              <div
                className="h-2 bg-gradient-to-r from-warning-600 to-warning-500 rounded-full transition-all duration-500"
                style={{ width: `${totalAttempts > 0 ? (passedCount / totalAttempts) * 100 : 0}%` }}
              />
            </div>
          </div>

          <div className="card-premium p-6 animate-scale-in" style={{ animationDelay: '150ms' }}>
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 rounded-xl bg-gradient-to-br from-secondary-700 to-secondary-600 shadow-soft">
                <UserIcon className="h-6 w-6 text-white" />
              </div>
              <div>
                <div className="text-sm text-secondary-600">Unique Users</div>
                <div className="text-3xl font-bold text-secondary-900">{uniqueUserCount}</div>
              </div>
            </div>
            <Badge variant="secondary" className="gap-1">
              <FireIcon className="h-3 w-3" />
              Active
            </Badge>
          </div>
        </div>
      )}

      {/* Search and Filters */}
      <div className="card-premium p-6">
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <MagnifyingGlassIcon className="h-5 w-5 absolute left-4 top-1/2 transform -translate-y-1/2 text-secondary-400" />
              <input
                type="text"
                placeholder="Search by quiz, category, or user..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input-field pl-12"
              />
            </div>

            <div className="relative">
              <FunnelIcon className="h-5 w-5 absolute left-4 top-1/2 transform -translate-y-1/2 text-secondary-400" />
              <select
                value={selectedQuiz}
                onChange={(e) => setSelectedQuiz(e.target.value)}
                className="select-field pl-12"
              >
                <option value="">All Quizzes</option>
                {uniqueQuizzes.map((quiz) => (
                  <option key={quiz.id} value={quiz.id}>
                    {quiz.title}
                  </option>
                ))}
              </select>
            </div>

            <div className="relative">
              <UserIcon className="h-5 w-5 absolute left-4 top-1/2 transform -translate-y-1/2 text-secondary-400" />
              <select
                value={selectedUser}
                onChange={(e) => setSelectedUser(e.target.value)}
                className="select-field pl-12"
              >
                <option value="">All Users</option>
                {uniqueUsers.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {hasActiveFilters && (
            <div className="flex justify-end">
              <Button
                variant="secondary"
                size="sm"
                onClick={clearFilters}
                className="gap-2"
              >
                Clear All Filters
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Results List */}
      <div className="card-premium overflow-hidden">
        {filteredAttempts.length > 0 ? (
          <>
            <div className="px-8 py-6 bg-gradient-to-r from-secondary-50 to-primary-50 border-b border-secondary-200">
              <h2 className="text-2xl font-bold text-secondary-900 flex items-center gap-2">
                <AcademicCapIcon className="h-6 w-6 text-primary-600" />
                Quiz Results
                <Badge variant="secondary" size="lg">
                  {filteredAttempts.length} {filteredAttempts.length === 1 ? 'result' : 'results'}
                </Badge>
              </h2>
            </div>

            <div className="divide-y divide-secondary-200">
              {filteredAttempts.map((attempt, index) => (
                <div
                  key={attempt.id}
                  className="p-6 hover:bg-secondary-50 transition-colors animate-fade-in-up"
                  style={{ animationDelay: `${index * 30}ms` }}
                >
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                    {/* Left Section */}
                    <div className="flex items-start gap-4 flex-1 min-w-0">
                      <div className="text-4xl flex-shrink-0 animate-bounce-subtle">
                        {attempt.quiz.category.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-2 flex-wrap">
                          <h3 className="text-xl font-bold text-secondary-900 truncate">
                            {attempt.quiz.title}
                          </h3>
                          <Badge variant="secondary" size="sm">
                            {attempt.quiz.category.name}
                          </Badge>
                        </div>
                        <div className="flex flex-wrap items-center gap-4 text-sm text-secondary-600">
                          <div className="flex items-center gap-1">
                            <UserIcon className="h-4 w-4" />
                            <span>
                              {attempt.user?.firstName && attempt.user?.lastName
                                ? `${attempt.user.firstName} ${attempt.user.lastName}`
                                : attempt.user?.email || 'Unknown User'
                              }
                            </span>
                          </div>
                          <div className="flex items-center gap-1">
                            <CalendarIcon className="h-4 w-4" />
                            <span>{formatDate(attempt.finishedAt || attempt.startedAt)}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <ClockIcon className="h-4 w-4" />
                            <span>{formatDuration(attempt.startedAt, attempt.finishedAt || attempt.startedAt)}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Right Section - Score */}
                    <div className="flex-shrink-0 text-center">
                      <div className={`inline-flex items-center justify-center w-24 h-24 rounded-2xl border-4 ${
                        attempt.percentage >= 80
                          ? 'bg-accent-50 border-accent-300'
                          : attempt.percentage >= 60
                          ? 'bg-warning-50 border-warning-300'
                          : 'bg-danger-50 border-danger-300'
                      }`}>
                        <div>
                          <div className={`text-3xl font-bold ${
                            attempt.percentage >= 80 ? 'text-accent-600' :
                            attempt.percentage >= 60 ? 'text-warning-600' : 'text-danger-600'
                          }`}>
                            {Math.round(attempt.percentage)}%
                          </div>
                          <div className="text-sm font-bold text-secondary-700">
                            {getScoreGrade(attempt.percentage)}
                          </div>
                        </div>
                      </div>
                      <div className="text-xs text-secondary-600 mt-2">
                        {attempt.score}/{attempt.totalPoints} points
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="px-8 py-6 border-t border-secondary-200 bg-secondary-50">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="text-sm text-secondary-600">
                    Page {currentPage} of {totalPages} • {totalAttempts} total attempts
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
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-20">
            <div className="inline-flex p-6 rounded-2xl bg-gradient-to-br from-primary-50 to-accent-50 mb-6">
              <TrophyIcon className="h-16 w-16 text-primary-600" />
            </div>
            <h3 className="text-2xl font-bold text-secondary-900 mb-2">
              {hasActiveFilters ? 'No Results Found' : 'No Quiz Attempts Yet'}
            </h3>
            <p className="text-secondary-600 mb-8 max-w-md mx-auto">
              {hasActiveFilters
                ? 'No quiz results match your current filters. Try adjusting your search or filters.'
                : 'No users have taken any quizzes yet.'
              }
            </p>
            {hasActiveFilters && (
              <Button
                variant="primary"
                size="lg"
                onClick={clearFilters}
                className="gap-2"
              >
                Clear Filters
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default AllResults
