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
  CheckCircleIcon
} from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'

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
      // Fallback to user attempts if admin endpoint doesn't exist yet
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
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
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

  const getScoreColor = (percentage: number) => {
    if (percentage >= 80) return 'text-green-600 bg-green-100'
    if (percentage >= 60) return 'text-yellow-600 bg-yellow-100'
    return 'text-red-600 bg-red-100'
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
      <div className="max-w-7xl mx-auto p-6">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading all results...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">All Quiz Results</h1>
        <p className="text-gray-600 mt-2">
          View and analyze quiz attempts from all users across the platform
        </p>
      </div>

      {/* Stats Overview */}
      {totalAttempts > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <ChartBarIcon className="h-8 w-8 text-blue-600 mr-3" />
              <div>
                <div className="text-2xl font-bold text-gray-900">{totalAttempts}</div>
                <div className="text-sm text-gray-600">Total Attempts</div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <TrophyIcon className="h-8 w-8 text-yellow-600 mr-3" />
              <div>
                <div className="text-2xl font-bold text-gray-900">
                  {Math.round(attempts.reduce((sum, a) => sum + a.percentage, 0) / attempts.length)}%
                </div>
                <div className="text-sm text-gray-600">Average Score</div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <CheckCircleIcon className="h-8 w-8 text-green-600 mr-3" />
              <div>
                <div className="text-2xl font-bold text-gray-900">
                  {attempts.filter(a => a.percentage >= 70).length}
                </div>
                <div className="text-sm text-gray-600">Passed (≥70%)</div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <UserIcon className="h-8 w-8 text-purple-600 mr-3" />
              <div>
                <div className="text-2xl font-bold text-gray-900">
                  {new Set(attempts.map(a => a.userId)).size}
                </div>
                <div className="text-sm text-gray-600">Unique Users</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Search and Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search by quiz, category, or user..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>

          <div className="relative">
            <FunnelIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <select
              value={selectedQuiz}
              onChange={(e) => setSelectedQuiz(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
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
            <UserIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <select
              value={selectedUser}
              onChange={(e) => setSelectedUser(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
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
      </div>

      {/* Results List */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        {filteredAttempts.length > 0 ? (
          <>
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">
                Quiz Results ({filteredAttempts.length} {filteredAttempts.length === 1 ? 'result' : 'results'})
              </h2>
            </div>

            {/* List */}
            <div className="divide-y divide-gray-200">
              {filteredAttempts.map((attempt) => (
                <div key={attempt.id} className="p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-4">
                        <div className="text-2xl">{attempt.quiz.category.icon}</div>
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-1">
                            <h3 className="text-lg font-semibold text-gray-900">
                              {attempt.quiz.title}
                            </h3>
                            <span className="text-sm px-2 py-1 bg-gray-100 text-gray-700 rounded-full">
                              {attempt.quiz.category.name}
                            </span>
                          </div>
                          <div className="flex items-center space-x-4 text-sm text-gray-600">
                            <div className="flex items-center">
                              <UserIcon className="h-4 w-4 mr-1" />
                              {attempt.user?.firstName && attempt.user?.lastName
                                ? `${attempt.user.firstName} ${attempt.user.lastName}`
                                : attempt.user?.email || 'Unknown User'
                              }
                            </div>
                            <div className="flex items-center">
                              <CalendarIcon className="h-4 w-4 mr-1" />
                              {formatDate(attempt.finishedAt || attempt.startedAt)}
                            </div>
                            <div className="flex items-center">
                              <ClockIcon className="h-4 w-4 mr-1" />
                              {formatDuration(attempt.startedAt, attempt.finishedAt || attempt.startedAt)}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-6">
                      {/* Score Display */}
                      <div className="text-center">
                        <div className={`text-2xl font-bold px-4 py-2 rounded-lg ${getScoreColor(attempt.percentage)}`}>
                          {Math.round(attempt.percentage)}%
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          Grade: {getScoreGrade(attempt.percentage)}
                        </div>
                        <div className="text-xs text-gray-500">
                          {attempt.score}/{attempt.totalPoints} pts
                        </div>
                      </div>

                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="px-6 py-4 border-t border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-500">
                    Showing page {currentPage} of {totalPages} ({totalAttempts} total attempts)
                  </div>

                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage <= 1}
                      className="flex items-center px-3 py-2 text-sm border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                    >
                      <ChevronLeftIcon className="h-4 w-4 mr-1" />
                      Previous
                    </button>

                    <div className="flex space-x-1">
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        const page = Math.max(1, Math.min(totalPages - 4, currentPage - 2)) + i
                        if (page > totalPages) return null
                        return (
                          <button
                            key={page}
                            onClick={() => handlePageChange(page)}
                            className={`px-3 py-2 text-sm rounded-lg ${
                              currentPage === page
                                ? 'bg-primary-600 text-white'
                                : 'border border-gray-300 hover:bg-gray-50'
                            }`}
                          >
                            {page}
                          </button>
                        )
                      })}
                    </div>

                    <button
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage >= totalPages}
                      className="flex items-center px-3 py-2 text-sm border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                    >
                      Next
                      <ChevronRightIcon className="h-4 w-4 ml-1" />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-12">
            <TrophyIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {searchTerm || selectedQuiz || selectedUser ? 'No results found' : 'No quiz attempts yet'}
            </h3>
            <p className="text-gray-600 mb-6">
              {searchTerm || selectedQuiz || selectedUser
                ? 'No quiz results match your current filters. Try adjusting your search or filters.'
                : 'No users have taken any quizzes yet.'
              }
            </p>
            {(searchTerm || selectedQuiz || selectedUser) && (
              <button
                onClick={() => {
                  setSearchTerm('')
                  setSelectedQuiz('')
                  setSelectedUser('')
                }}
                className="inline-flex items-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                Clear Filters
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default AllResults