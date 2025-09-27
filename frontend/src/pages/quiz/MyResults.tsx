import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { QuizAttempt } from '@/types'
import quizService from '@/services/quizService'
import {
  MagnifyingGlassIcon,
  EyeIcon,
  TrophyIcon,
  ClockIcon,
  CalendarIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  CheckCircleIcon,
  XCircleIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'

const MyResults = () => {
  const [attempts, setAttempts] = useState<QuizAttempt[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalAttempts, setTotalAttempts] = useState(0)
  const pageSize = 10

  useEffect(() => {
    fetchAttempts()
  }, [currentPage])

  const fetchAttempts = async () => {
    setLoading(true)
    try {
      const response = await quizService.getUserAttempts(currentPage, pageSize)
      setAttempts(response.data)
      setTotalPages(response.totalPages)
      setTotalAttempts(response.totalCount)
    } catch (error) {
      console.error('Error fetching attempts:', error)
      toast.error('Failed to load quiz results')
    } finally {
      setLoading(false)
    }
  }

  const filteredAttempts = attempts.filter(attempt =>
    attempt.quiz.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    attempt.quiz.category.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

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

  if (loading && attempts.length === 0) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your results...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">My Results</h1>
        <p className="text-gray-600 mt-2">
          View your quiz attempts and track your learning progress
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
              <ClockIcon className="h-8 w-8 text-purple-600 mr-3" />
              <div>
                <div className="text-2xl font-bold text-gray-900">
                  {new Set(attempts.map(a => a.quizId)).size}
                </div>
                <div className="text-sm text-gray-600">Unique Quizzes</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Search */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <div className="relative">
          <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search by quiz name or category..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          />
        </div>
      </div>

      {/* Results List */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        {filteredAttempts.length > 0 ? (
          <>
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Quiz History</h2>
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
                          <h3 className="text-lg font-semibold text-gray-900 mb-1">
                            {attempt.quiz.title}
                          </h3>
                          <div className="flex items-center space-x-4 text-sm text-gray-600">
                            <div className="flex items-center">
                              <CalendarIcon className="h-4 w-4 mr-1" />
                              {formatDate(attempt.finishedAt || attempt.startedAt)}
                            </div>
                            <div className="flex items-center">
                              <ClockIcon className="h-4 w-4 mr-1" />
                              {formatDuration(attempt.startedAt, attempt.finishedAt || attempt.startedAt)}
                            </div>
                            <div className="flex items-center">
                              <span className="text-gray-500">Category:</span>
                              <span className="ml-1 font-medium">{attempt.quiz.category.name}</span>
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

                      {/* Quick Stats */}
                      <div className="text-center text-sm text-gray-600">
                        <div className="flex items-center mb-1">
                          <CheckCircleIcon className="h-4 w-4 text-green-600 mr-1" />
                          {attempt.userAnswers.filter(ua => ua.isCorrect).length} correct
                        </div>
                        <div className="flex items-center">
                          <XCircleIcon className="h-4 w-4 text-red-600 mr-1" />
                          {attempt.userAnswers.filter(ua => !ua.isCorrect).length} wrong
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex space-x-2">
                        <Link
                          to={`/results/${attempt.id}`}
                          className="flex items-center px-4 py-2 text-primary-600 border border-primary-600 rounded-lg hover:bg-primary-50 transition-colors"
                        >
                          <EyeIcon className="h-4 w-4 mr-2" />
                          View Details
                        </Link>
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
              {searchTerm ? 'No results found' : 'No quiz attempts yet'}
            </h3>
            <p className="text-gray-600 mb-6">
              {searchTerm
                ? `No quiz results match "${searchTerm}". Try adjusting your search.`
                : 'Start taking quizzes to see your results and track your progress here.'
              }
            </p>
            {!searchTerm && (
              <Link
                to="/quizzes"
                className="inline-flex items-center px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
              >
                Browse Quizzes
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default MyResults