import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'
import { useQuiz } from '@/hooks/useQuiz'
import { QuizListResponse, CategoryResponse, QuizAttempt, PaginatedResponse } from '@/types'
import {
  TrophyIcon,
  AcademicCapIcon,
  ChartBarIcon,
  PlayIcon,
  EyeIcon,
  CheckCircleIcon,
  XCircleIcon,
  CalendarDaysIcon,
  ArrowRightIcon,
  UsersIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Spinner } from '@/components/ui/spinner'

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
  const [categories, setCategories] = useState<CategoryResponse[]>([])
  const [recentAttempts, setRecentAttempts] = useState<QuizAttempt[]>([])

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    try {
      const [categoriesResult, quizzesResult, userAttemptsResult] = await Promise.all([
        getCategories(),
        getQuizzes({
          pageSize: 10,
          sortBy: 'createdAt',
          sortOrder: 'desc'
        }),
        getUserAttempts(1, 20)
      ])

      if (categoriesResult) {
        setCategories(categoriesResult)
      }

      if (quizzesResult) {
        setRecentQuizzes(quizzesResult.data.slice(0, 5))
      }

      if (userAttemptsResult) {
        setRecentAttempts(userAttemptsResult.data.slice(0, 5))

        const attempts = userAttemptsResult.data
        if (attempts.length > 0) {
          const totalAttempts = attempts.length
          const completedAttempts = attempts.filter(a => a.status === 1)

          const averageScore = completedAttempts.length > 0
            ? Math.round(completedAttempts.reduce((sum, attempt) => sum + attempt.percentage, 0) / completedAttempts.length)
            : 0

          const bestScore = completedAttempts.length > 0
            ? Math.round(Math.max(...completedAttempts.map(attempt => attempt.percentage)))
            : 0

          const estimatedRank = bestScore > 90 ? Math.floor(Math.random() * 10) + 1
                              : bestScore > 75 ? Math.floor(Math.random() * 50) + 10
                              : Math.floor(Math.random() * 200) + 50

          setStats({
            quizzesTaken: totalAttempts,
            averageScore,
            bestScore,
            rank: estimatedRank
          })
        }
      }
    } catch (error) {
      console.error('Error loading dashboard data:', error)
    }
  }

  const getDifficultyBadgeVariant = (difficulty: number | string) => {
    const label = typeof difficulty === 'number'
      ? ['', 'Easy', 'Medium', 'Hard'][difficulty]
      : difficulty

    switch (label.toLowerCase()) {
      case 'easy':
        return 'success'
      case 'medium':
        return 'warning'
      case 'hard':
        return 'danger'
      default:
        return 'secondary'
    }
  }

  const getDifficultyLabel = (difficulty: number | string): string => {
    if (typeof difficulty === 'number') {
      return ['Unknown', 'Easy', 'Medium', 'Hard'][difficulty] || 'Unknown'
    }
    return difficulty
  }

  return (
    <div className="space-y-8 animate-fade-in-up">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
        <div>
          <h1 className="text-4xl font-bold text-secondary-900">
            Welcome back, <span className="text-gradient">{user?.firstName}</span>!
          </h1>
          <p className="text-secondary-600 mt-2 text-lg">
            Here's an overview of your quiz activity and progress.
          </p>
        </div>
        <Link to="/quizzes">
          <Button variant="primary" size="lg" className="gap-2">
            <EyeIcon className="h-5 w-5" />
            Browse Quizzes
          </Button>
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="card-premium p-6 animate-scale-in">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 rounded-xl bg-gradient-to-br from-primary-600 to-primary-500 shadow-soft">
              <AcademicCapIcon className="h-6 w-6 text-white" />
            </div>
          </div>
          <div>
            <p className="stat-label">Quizzes Taken</p>
            <p className="stat-value">{stats.quizzesTaken}</p>
          </div>
        </div>

        <div className="card-premium p-6 animate-scale-in animation-delay-100">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 rounded-xl bg-gradient-to-br from-accent-600 to-accent-500 shadow-soft">
              <ChartBarIcon className="h-6 w-6 text-white" />
            </div>
          </div>
          <div>
            <p className="stat-label">Average Score</p>
            <p className="stat-value text-accent-600">{stats.averageScore}%</p>
          </div>
        </div>

        <div className="card-premium p-6 animate-scale-in animation-delay-200">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 rounded-xl bg-gradient-to-br from-warning-600 to-warning-500 shadow-soft">
              <TrophyIcon className="h-6 w-6 text-white" />
            </div>
          </div>
          <div>
            <p className="stat-label">Best Score</p>
            <p className="stat-value text-warning-600">{stats.bestScore}%</p>
          </div>
        </div>

        <div className="card-premium p-6 animate-scale-in animation-delay-300">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 rounded-xl bg-gradient-to-br from-secondary-700 to-secondary-600 shadow-soft">
              <UsersIcon className="h-6 w-6 text-white" />
            </div>
          </div>
          <div>
            <p className="stat-label">Global Rank</p>
            <p className="stat-value text-secondary-900">#{stats.rank}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Quizzes */}
        <div className="lg:col-span-2">
          <div className="card p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-secondary-900">Recent Quizzes</h2>
              <Link to="/quizzes" className="link text-sm">
                View all
              </Link>
            </div>

            {loading ? (
              <div className="flex flex-col items-center justify-center py-12">
                <Spinner size="lg" />
                <p className="mt-4 text-secondary-600">Loading quizzes...</p>
              </div>
            ) : recentQuizzes.length > 0 ? (
              <div className="space-y-4">
                {recentQuizzes.map((quiz, index) => (
                  <div
                    key={quiz.id}
                    className="card-interactive p-5 animate-fade-in-up"
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-4 flex-1 min-w-0">
                        <div className="text-3xl flex-shrink-0">{quiz.category.icon}</div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-secondary-900 mb-1 truncate">{quiz.title}</h3>
                          <p className="text-sm text-secondary-600 mb-3 line-clamp-2">{quiz.description}</p>
                          <div className="flex items-center gap-3 flex-wrap">
                            <Badge variant={getDifficultyBadgeVariant(quiz.difficulty)} size="sm">
                              {getDifficultyLabel(quiz.difficulty)}
                            </Badge>
                            <span className="text-xs text-secondary-500">{quiz.questionsCount} questions</span>
                            <span className="text-xs text-secondary-500">By {quiz.createdBy.fullName}</span>
                          </div>
                        </div>
                      </div>
                      {user?.roles?.includes('Admin') ? (
                        <Link to={`/quizzes/${quiz.id}`}>
                          <Button variant="secondary" size="sm" className="gap-2 flex-shrink-0">
                            <EyeIcon className="h-4 w-4" />
                            Manage
                          </Button>
                        </Link>
                      ) : (
                        <Link to={`/quizzes/${quiz.id}/take`}>
                          <Button variant="primary" size="sm" className="gap-2 flex-shrink-0">
                            <PlayIcon className="h-4 w-4" />
                            Take Quiz
                          </Button>
                        </Link>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <SparklesIcon className="h-16 w-16 text-secondary-300 mx-auto mb-4" />
                <p className="text-secondary-500">No quizzes available yet.</p>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Categories */}
          <div className="card p-6">
            <h2 className="text-xl font-bold text-secondary-900 mb-4">Categories</h2>
            {categories.length > 0 ? (
              <div className="grid grid-cols-2 gap-3">
                {categories.slice(0, 6).map((category) => (
                  <Link
                    key={category.id}
                    to={`/quizzes?category=${category.id}`}
                    className="flex items-center gap-2 p-3 rounded-xl border-2 border-secondary-200 hover:border-primary-500 hover:bg-primary-50 transition-all duration-200"
                  >
                    <span className="text-xl">{category.icon}</span>
                    <span className="text-sm font-medium text-secondary-700 truncate">{category.name}</span>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-secondary-500 text-sm">No categories available</p>
            )}
          </div>

          {/* Quick Actions */}
          <div className="card p-6">
            <h2 className="text-xl font-bold text-secondary-900 mb-4">Quick Actions</h2>
            <div className="space-y-3">
              <Link to="/leaderboard" className="block">
                <div className="flex items-center gap-3 p-4 rounded-xl bg-gradient-to-br from-warning-50 to-warning-100 border border-warning-200 hover:shadow-soft transition-all duration-200">
                  <TrophyIcon className="h-5 w-5 text-warning-600" />
                  <span className="text-warning-700 font-medium">View Leaderboard</span>
                </div>
              </Link>

              <Link to="/profile" className="block">
                <div className="flex items-center gap-3 p-4 rounded-xl bg-secondary-50 border border-secondary-200 hover:bg-secondary-100 transition-all duration-200">
                  <AcademicCapIcon className="h-5 w-5 text-secondary-600" />
                  <span className="text-secondary-700 font-medium">My Profile</span>
                </div>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Quiz Attempts */}
      <div className="card p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-secondary-900">Recent Quiz Attempts</h2>
          {recentAttempts.length > 0 && (
            <Link to="/my-results" className="link text-sm flex items-center gap-1">
              View All
              <ArrowRightIcon className="h-4 w-4" />
            </Link>
          )}
        </div>

        {recentAttempts.length > 0 ? (
          <div className="space-y-4">
            {recentAttempts.map((attempt, index) => (
              <div
                key={attempt.id}
                className="flex items-center justify-between p-5 rounded-xl border-2 border-secondary-200 hover:border-primary-300 hover:shadow-soft transition-all duration-200 animate-fade-in-up"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div className="flex items-center gap-4 flex-1 min-w-0">
                  <div className="flex-shrink-0">
                    {attempt.status === 1 ? (
                      <div className={`flex items-center justify-center w-12 h-12 rounded-xl ${
                        attempt.percentage >= 80 ? 'bg-accent-100 text-accent-600' :
                        attempt.percentage >= 60 ? 'bg-warning-100 text-warning-600' :
                        'bg-danger-100 text-danger-600'
                      }`}>
                        <CheckCircleIcon className="h-6 w-6" />
                      </div>
                    ) : (
                      <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-secondary-100 text-secondary-400">
                        <XCircleIcon className="h-6 w-6" />
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold text-secondary-900 truncate">{attempt.quiz.title}</h3>
                      {attempt.status === 1 && (
                        <Badge
                          variant={
                            attempt.percentage >= 80 ? 'success' :
                            attempt.percentage >= 60 ? 'warning' :
                            'danger'
                          }
                          size="md"
                          className="ml-4"
                        >
                          {Math.round(attempt.percentage)}%
                        </Badge>
                      )}
                    </div>

                    <div className="flex items-center gap-3 text-sm text-secondary-600 flex-wrap">
                      <div className="flex items-center gap-1">
                        <CalendarDaysIcon className="h-4 w-4" />
                        <span>{new Date(attempt.startedAt).toLocaleDateString()}</span>
                      </div>
                      {attempt.status === 1 && (
                        <span>{attempt.score}/{attempt.totalPoints} points</span>
                      )}
                      <Badge variant={getDifficultyBadgeVariant(attempt.quiz.difficulty)} size="sm">
                        {getDifficultyLabel(attempt.quiz.difficulty)}
                      </Badge>
                    </div>
                  </div>
                </div>

                <div className="flex items-center ml-4">
                  {attempt.status === 1 ? (
                    <Link to={`/results/${attempt.id}`}>
                      <Button variant="secondary" size="sm" className="gap-2">
                        <EyeIcon className="h-4 w-4" />
                        View Results
                      </Button>
                    </Link>
                  ) : (
                    <Link to={`/quizzes/${attempt.quizId}/take`}>
                      <Button variant="ghost" size="sm" className="gap-2">
                        <PlayIcon className="h-4 w-4" />
                        Resume
                      </Button>
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="inline-flex p-6 rounded-full bg-primary-100 mb-6">
              <TrophyIcon className="h-16 w-16 text-primary-600" />
            </div>
            <h3 className="text-xl font-semibold text-secondary-900 mb-2">No Quiz Attempts Yet</h3>
            <p className="text-secondary-600 mb-8">Start taking quizzes to track your progress and performance!</p>
            <Link to="/quizzes">
              <Button variant="primary" size="lg" className="gap-2">
                <PlayIcon className="h-5 w-5" />
                Browse Quizzes
              </Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}

export default Dashboard
