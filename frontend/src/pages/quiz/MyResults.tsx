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
  ChartBarIcon,
  FireIcon,
  AcademicCapIcon,
  SparklesIcon
} from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Spinner } from '@/components/ui/spinner'

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

  const getScoreColor = (percentage: number) => {
    if (percentage >= 80) return 'text-accent-600'
    if (percentage >= 60) return 'text-warning-600'
    return 'text-danger-600'
  }

  const getScoreBgColor = (percentage: number) => {
    if (percentage >= 80) return 'bg-accent-50 border-accent-200'
    if (percentage >= 60) return 'bg-warning-50 border-warning-200'
    return 'bg-danger-50 border-danger-200'
  }

  const getScoreGradient = (percentage: number) => {
    if (percentage >= 80) return 'from-accent-600 to-accent-500'
    if (percentage >= 60) return 'from-warning-600 to-warning-500'
    return 'from-danger-600 to-danger-500'
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
      <div className="min-h-[calc(100vh-5rem)] flex flex-col items-center justify-center">
        <Spinner size="lg" />
        <p className="mt-4 text-secondary-600 text-lg">Loading your results...</p>
      </div>
    )
  }

  const avgScore = attempts.length > 0
    ? Math.round(attempts.reduce((sum, a) => sum + a.percentage, 0) / attempts.length)
    : 0
  const passedCount = attempts.filter(a => a.percentage >= 70).length
  const uniqueQuizzes = new Set(attempts.map(a => a.quizId)).size
  const bestScore = attempts.length > 0 ? Math.max(...attempts.map(a => a.percentage)) : 0

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Header */}
      <div className="card-premium p-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-4 rounded-2xl bg-gradient-to-br from-primary-600 to-accent-600 shadow-glow">
              <TrophyIcon className="h-10 w-10 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-secondary-900">My Results</h1>
              <p className="text-lg text-secondary-600 mt-1">Track your quiz performance and progress</p>
            </div>
          </div>
          {totalAttempts > 0 && (
            <Badge variant="primary" size="lg" className="gap-2">
              <FireIcon className="h-5 w-5" />
              {totalAttempts} Total Attempts
            </Badge>
          )}
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
                <AcademicCapIcon className="h-6 w-6 text-white" />
              </div>
              <div>
                <div className="text-sm text-secondary-600">Unique Quizzes</div>
                <div className="text-3xl font-bold text-secondary-900">{uniqueQuizzes}</div>
              </div>
            </div>
            <Badge variant="secondary" className="mt-2 gap-1">
              <FireIcon className="h-3 w-3" />
              Best: {bestScore}%
            </Badge>
          </div>
        </div>
      )}

      {/* Search */}
      <div className="card-premium p-6">
        <div className="relative">
          <MagnifyingGlassIcon className="h-5 w-5 absolute left-4 top-1/2 transform -translate-y-1/2 text-secondary-400" />
          <input
            type="text"
            placeholder="Search by quiz name or category..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input-field pl-12"
          />
        </div>
      </div>

      {/* Results List */}
      <div className="card-premium">
        {filteredAttempts.length > 0 ? (
          <>
            {/* Header */}
            <div className="px-8 py-6 border-b border-secondary-200">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-secondary-900">Quiz History</h2>
                <Badge variant="secondary">
                  {filteredAttempts.length} {filteredAttempts.length === 1 ? 'result' : 'results'}
                </Badge>
              </div>
            </div>

            {/* List */}
            <div className="divide-y divide-secondary-200">
              {filteredAttempts.map((attempt, index) => (
                <div
                  key={attempt.id}
                  className="p-6 hover:bg-secondary-50 transition-all animate-fade-in-up"
                  style={{ animationDelay: `${index * 30}ms` }}
                >
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                    {/* Left Section - Quiz Info */}
                    <div className="flex items-start gap-4 flex-1 min-w-0">
                      <div className="text-4xl flex-shrink-0 animate-bounce-subtle">
                        {attempt.quiz.category.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-xl font-bold text-secondary-900 mb-2 truncate">
                          {attempt.quiz.title}
                        </h3>
                        <div className="flex flex-wrap items-center gap-4 text-sm text-secondary-600">
                          <div className="flex items-center gap-1">
                            <CalendarIcon className="h-4 w-4" />
                            <span>{formatDate(attempt.finishedAt || attempt.startedAt)}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <ClockIcon className="h-4 w-4" />
                            <span>{formatDuration(attempt.startedAt, attempt.finishedAt || attempt.startedAt)}</span>
                          </div>
                          <Badge variant="secondary" size="sm">
                            {attempt.quiz.category.name}
                          </Badge>
                        </div>
                      </div>
                    </div>

                    {/* Right Section - Stats and Actions */}
                    <div className="flex items-center gap-6 flex-shrink-0">
                      {/* Score Display */}
                      <div className="text-center">
                        <div className={`inline-flex items-center justify-center w-20 h-20 rounded-2xl border-4 ${getScoreBgColor(attempt.percentage)} ${getScoreColor(attempt.percentage)}`}>
                          <div className="text-center">
                            <div className="text-2xl font-bold">
                              {Math.round(attempt.percentage)}%
                            </div>
                            <div className="text-xs font-semibold">
                              {getScoreGrade(attempt.percentage)}
                            </div>
                          </div>
                        </div>
                        <div className="text-xs text-secondary-600 mt-2">
                          {attempt.score}/{attempt.totalPoints} pts
                        </div>
                      </div>

                      {/* Quick Stats */}
                      <div className="hidden md:flex flex-col gap-2">
                        <div className="flex items-center gap-2">
                          <div className="p-1.5 rounded-lg bg-accent-100">
                            <CheckCircleIcon className="h-4 w-4 text-accent-600" />
                          </div>
                          <span className="text-sm text-secondary-700">
                            {attempt.userAnswers.filter(ua => ua.isCorrect).length} correct
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="p-1.5 rounded-lg bg-danger-100">
                            <XCircleIcon className="h-4 w-4 text-danger-600" />
                          </div>
                          <span className="text-sm text-secondary-700">
                            {attempt.userAnswers.filter(ua => !ua.isCorrect).length} wrong
                          </span>
                        </div>
                      </div>

                      {/* View Button */}
                      <Link to={`/results/${attempt.id}`}>
                        <Button variant="primary" size="md" className="gap-2">
                          <EyeIcon className="h-4 w-4" />
                          View Details
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="px-8 py-6 border-t border-secondary-200">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="text-sm text-secondary-600">
                    Page {currentPage} of {totalPages} • {totalAttempts} total attempts
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="secondary"
                      size="sm"
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
                            className={`w-10 h-10 rounded-xl text-sm font-semibold transition-all ${
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
                      variant="secondary"
                      size="sm"
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
              {searchTerm ? (
                <MagnifyingGlassIcon className="h-16 w-16 text-primary-600" />
              ) : (
                <TrophyIcon className="h-16 w-16 text-primary-600" />
              )}
            </div>
            <h3 className="text-2xl font-bold text-secondary-900 mb-2">
              {searchTerm ? 'No Results Found' : 'No Quiz Attempts Yet'}
            </h3>
            <p className="text-secondary-600 mb-8 max-w-md mx-auto">
              {searchTerm
                ? `No quiz results match "${searchTerm}". Try adjusting your search terms.`
                : 'Start taking quizzes to see your results and track your learning progress here.'
              }
            </p>
            {!searchTerm && (
              <Link to="/quizzes">
                <Button variant="primary" size="lg" className="gap-2">
                  <SparklesIcon className="h-5 w-5" />
                  Browse Quizzes
                </Button>
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default MyResults
