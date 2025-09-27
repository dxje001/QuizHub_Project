import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'
import { useQuiz } from '@/hooks/useQuiz'
import { QuizListResponse, CategoryResponse, QuizAttempt, PaginatedResponse } from '@/types'
import {
  TrophyIcon,
  ClockIcon,
  AcademicCapIcon,
  ChartBarIcon,
  PlayIcon,
  EyeIcon,
  CheckCircleIcon,
  XCircleIcon,
  CalendarDaysIcon,
  ArrowRightIcon,
  UsersIcon
} from '@heroicons/react/24/outline'

interface DashboardStats {
  quizzesTaken: number
  averageScore: number
  bestScore: number
  rank: number
}

const Dashboard = () => {
  const { user } = useAuthStore()
  const { getQuizzes, getCategories, getUserAttempts, loading } = useQuiz()

  const [stats, setStats] = useState<DashboardStats>({
    quizzesTaken: 0,
    averageScore: 0,
    bestScore: 0,
    rank: 0
  })
  const [recentQuizzes, setRecentQuizzes] = useState<QuizListResponse[]>([])
  const [popularQuizzes, setPopularQuizzes] = useState<QuizListResponse[]>([])
  const [categories, setCategories] = useState<CategoryResponse[]>([])
  const [recentAttempts, setRecentAttempts] = useState<QuizAttempt[]>([])
  const [userAttemptsData, setUserAttemptsData] = useState<PaginatedResponse<QuizAttempt> | null>(null)

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    try {
      // Load all dashboard data in parallel for better performance
      const [categoriesResult, quizzesResult, userAttemptsResult] = await Promise.all([
        getCategories(),
        getQuizzes({
          pageSize: 10,
          sortBy: 'createdAt',
          sortOrder: 'desc'
        }),
        getUserAttempts(1, 20) // Get more attempts for better statistics
      ])

      // Set categories
      if (categoriesResult) {
        setCategories(categoriesResult)
      }

      // Set quizzes
      if (quizzesResult) {
        setRecentQuizzes(quizzesResult.data.slice(0, 5))
        setPopularQuizzes(quizzesResult.data.slice(0, 3))
      }

      // Process user attempts data
      if (userAttemptsResult) {
        setUserAttemptsData(userAttemptsResult)
        setRecentAttempts(userAttemptsResult.data.slice(0, 5))

        // Calculate real statistics from user attempts
        const attempts = userAttemptsResult.data
        if (attempts.length > 0) {
          const totalAttempts = attempts.length
          const completedAttempts = attempts.filter(a => a.status === 1) // Completed status

          const averageScore = completedAttempts.length > 0
            ? Math.round(completedAttempts.reduce((sum, attempt) => sum + attempt.percentage, 0) / completedAttempts.length)
            : 0

          const bestScore = completedAttempts.length > 0
            ? Math.round(Math.max(...completedAttempts.map(attempt => attempt.percentage)))
            : 0

          // TODO: Calculate rank from leaderboard data (for now use mock)
          const estimatedRank = bestScore > 90 ? Math.floor(Math.random() * 10) + 1
                              : bestScore > 75 ? Math.floor(Math.random() * 50) + 10
                              : Math.floor(Math.random() * 200) + 50

          setStats({
            quizzesTaken: totalAttempts,
            averageScore,
            bestScore,
            rank: estimatedRank
          })
        } else {
          // No attempts yet - show zeros
          setStats({
            quizzesTaken: 0,
            averageScore: 0,
            bestScore: 0,
            rank: 0
          })
        }
      }
    } catch (error) {
      console.error('Error loading dashboard data:', error)
      // Fallback to default values on error
      setStats({
        quizzesTaken: 0,
        averageScore: 0,
        bestScore: 0,
        rank: 0
      })
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
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Welcome back, {user?.firstName}!
          </h1>
          <p className="text-gray-600 mt-2">
            Here's an overview of your quiz activity and progress.
          </p>
        </div>
        <div className="flex space-x-3">
          <Link
            to="/quizzes"
            className="btn-primary flex items-center"
          >
            <EyeIcon className="h-5 w-5 mr-2" />
            Browse Quizzes
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="card">
          <div className="flex items-center">
            <AcademicCapIcon className="h-8 w-8 text-primary-600 mr-3" />
            <div>
              <h3 className="text-sm font-medium text-gray-500">Quizzes Taken</h3>
              <p className="text-2xl font-bold text-gray-900">{stats.quizzesTaken}</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <ChartBarIcon className="h-8 w-8 text-green-600 mr-3" />
            <div>
              <h3 className="text-sm font-medium text-gray-500">Average Score</h3>
              <p className="text-2xl font-bold text-gray-900">{stats.averageScore}%</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <TrophyIcon className="h-8 w-8 text-yellow-600 mr-3" />
            <div>
              <h3 className="text-sm font-medium text-gray-500">Best Score</h3>
              <p className="text-2xl font-bold text-gray-900">{stats.bestScore}%</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <ClockIcon className="h-8 w-8 text-purple-600 mr-3" />
            <div>
              <h3 className="text-sm font-medium text-gray-500">Global Rank</h3>
              <p className="text-2xl font-bold text-gray-900">#{stats.rank}</p>
            </div>
          </div>
        </div>

      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
        {/* Recent Quizzes */}
        <div className="lg:col-span-2">
          <div className="card">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-900">Recent Quizzes</h2>
              <Link to="/quizzes" className="text-primary-600 hover:text-primary-800 text-sm font-medium">
                View all
              </Link>
            </div>

            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
                <p className="mt-2 text-gray-600">Loading quizzes...</p>
              </div>
            ) : recentQuizzes.length > 0 ? (
              <div className="space-y-4">
                {recentQuizzes.map((quiz) => (
                  <div key={quiz.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors">
                    <div className="flex items-center space-x-4">
                      <div className="text-2xl">{quiz.category.icon}</div>
                      <div>
                        <h3 className="font-medium text-gray-900">{quiz.title}</h3>
                        <p className="text-sm text-gray-600">{quiz.description}</p>
                        <div className="flex items-center space-x-3 mt-2">
                          <span className={`text-xs px-2 py-1 rounded-full font-medium ${getDifficultyColor(quiz.difficulty)}`}>
                            {getDifficultyLabel(quiz.difficulty)}
                          </span>
                          <span className="text-xs text-gray-500">{quiz.questionsCount} questions</span>
                          <span className="text-xs text-gray-500">By {quiz.createdBy.fullName}</span>
                        </div>
                      </div>
                    </div>
                    {user?.roles?.includes('Admin') ? (
                      <Link
                        to={`/quizzes/${quiz.id}`}
                        className="flex items-center px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
                      >
                        <EyeIcon className="h-4 w-4 mr-2" />
                        Manage Quiz
                      </Link>
                    ) : (
                      <Link
                        to={`/quizzes/${quiz.id}/take`}
                        className="flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                      >
                        <PlayIcon className="h-4 w-4 mr-2" />
                        Take Quiz
                      </Link>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                No quizzes available yet.
              </div>
            )}
          </div>
        </div>

        {/* Categories & Quick Actions */}
        <div className="space-y-6">
          {/* Categories */}
          <div className="card">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Categories</h2>
            {categories.length > 0 ? (
              <div className="grid grid-cols-2 gap-3">
                {categories.slice(0, 6).map((category) => (
                  <Link
                    key={category.id}
                    to={`/quizzes?category=${category.id}`}
                    className="flex items-center p-3 border border-gray-200 rounded-lg hover:border-primary-300 hover:bg-primary-50 transition-colors"
                  >
                    <span className="text-xl mr-2">{category.icon}</span>
                    <span className="text-sm font-medium text-gray-700">{category.name}</span>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-sm">No categories available</p>
            )}
          </div>

          {/* Quick Actions */}
          <div className="card">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Quick Actions</h2>
            <div className="space-y-3">
              <Link
                to="/leaderboard"
                className="flex items-center p-3 bg-yellow-50 border border-yellow-200 rounded-lg hover:bg-yellow-100 transition-colors"
              >
                <TrophyIcon className="h-5 w-5 text-yellow-600 mr-3" />
                <span className="text-yellow-700 font-medium">View Leaderboard</span>
              </Link>

              <Link
                to="/profile"
                className="flex items-center p-3 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <AcademicCapIcon className="h-5 w-5 text-gray-600 mr-3" />
                <span className="text-gray-700 font-medium">My Profile</span>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Quiz Attempts */}
      <div className="card">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-gray-900">Recent Quiz Attempts</h2>
          {recentAttempts.length > 0 && (
            <Link
              to="/profile?tab=attempts"
              className="flex items-center text-primary-600 hover:text-primary-700 text-sm font-medium"
            >
              View All
              <ArrowRightIcon className="h-4 w-4 ml-1" />
            </Link>
          )}
        </div>

        {recentAttempts.length > 0 ? (
          <div className="space-y-4">
            {recentAttempts.map((attempt) => (
              <div
                key={attempt.id}
                className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors"
              >
                <div className="flex items-center flex-1 min-w-0">
                  <div className="flex-shrink-0 mr-4">
                    {attempt.status === 1 ? ( // Completed
                      <div className={`flex items-center justify-center w-10 h-10 rounded-full ${
                        attempt.percentage >= 80 ? 'bg-green-100 text-green-600' :
                        attempt.percentage >= 60 ? 'bg-yellow-100 text-yellow-600' :
                        'bg-red-100 text-red-600'
                      }`}>
                        <CheckCircleIcon className="h-5 w-5" />
                      </div>
                    ) : (
                      <div className="flex items-center justify-center w-10 h-10 rounded-full bg-gray-100 text-gray-400">
                        <XCircleIcon className="h-5 w-5" />
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="text-sm font-medium text-gray-900 truncate">
                        {attempt.quiz.title}
                      </h3>
                      <div className="flex items-center ml-4">
                        {attempt.status === 1 && (
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            attempt.percentage >= 80 ? 'bg-green-100 text-green-800' :
                            attempt.percentage >= 60 ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {Math.round(attempt.percentage)}%
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center text-sm text-gray-500">
                      <CalendarDaysIcon className="h-4 w-4 mr-1" />
                      <span>{new Date(attempt.startedAt).toLocaleDateString()}</span>
                      {attempt.status === 1 && (
                        <>
                          <span className="mx-2">•</span>
                          <span>{attempt.score}/{attempt.totalPoints} points</span>
                        </>
                      )}
                      <span className="mx-2">•</span>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getDifficultyColor(attempt.quiz.difficulty)}`}>
                        {getDifficultyLabel(attempt.quiz.difficulty)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center ml-4">
                  {attempt.status === 1 ? (
                    <Link
                      to={`/results/${attempt.id}`}
                      className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-primary-700 bg-primary-100 hover:bg-primary-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                    >
                      <EyeIcon className="h-4 w-4 mr-1" />
                      View Results
                    </Link>
                  ) : (
                    <Link
                      to={`/quizzes/${attempt.quizId}/take`}
                      className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-gray-700 bg-gray-100 hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                    >
                      <PlayIcon className="h-4 w-4 mr-1" />
                      Resume
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <TrophyIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Quiz Attempts Yet</h3>
            <p className="text-gray-500 mb-6">Start taking quizzes to track your progress and performance!</p>
            <Link
              to="/quizzes"
              className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
            >
              <PlayIcon className="h-5 w-5 mr-2" />
              Browse Quizzes
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}

export default Dashboard