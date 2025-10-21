import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useQuiz } from '@/hooks/useQuiz'
import { LeaderboardResponse, LeaderboardTimeframe, CategoryResponse, QuizListResponse } from '@/types'
import {
  TrophyIcon,
  ClockIcon,
  UserIcon,
  ChartBarIcon,
  CalendarDaysIcon,
  FunnelIcon,
  FireIcon,
  SparklesIcon,
  ChevronLeftIcon,
  ChevronRightIcon
} from '@heroicons/react/24/outline'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Spinner } from '@/components/ui/spinner'

const Leaderboard = () => {
  const { getLeaderboard, getCategories, getQuizzes, loading } = useQuiz()

  const [leaderboard, setLeaderboard] = useState<LeaderboardResponse | null>(null)
  const [categories, setCategories] = useState<CategoryResponse[]>([])
  const [quizzes, setQuizzes] = useState<QuizListResponse[]>([])
  const [selectedTimeframe, setSelectedTimeframe] = useState<LeaderboardTimeframe>(LeaderboardTimeframe.ALL_TIME)
  const [selectedQuizId, setSelectedQuizId] = useState<string>('')
  const [currentPage, setCurrentPage] = useState(1)
  const [showFilters, setShowFilters] = useState(false)

  const pageSize = 20

  useEffect(() => {
    loadInitialData()
  }, [])

  useEffect(() => {
    loadLeaderboard()
  }, [selectedTimeframe, selectedQuizId, currentPage])

  const loadInitialData = async () => {
    try {
      const [categoriesResult, quizzesResult] = await Promise.all([
        getCategories(),
        getQuizzes({ pageSize: 100, sortBy: 'title', sortOrder: 'asc' })
      ])

      if (categoriesResult) setCategories(categoriesResult)
      if (quizzesResult) setQuizzes(quizzesResult.data)
    } catch (error) {
      console.error('Failed to load initial data:', error)
    }
  }

  const loadLeaderboard = async () => {
    const result = await getLeaderboard({
      quizId: selectedQuizId || undefined,
      timeframe: selectedTimeframe,
      pageNumber: currentPage,
      pageSize
    })

    if (result) {
      setLeaderboard(result)
    }
  }

  const handleTimeframeChange = (timeframe: LeaderboardTimeframe) => {
    setSelectedTimeframe(timeframe)
    setCurrentPage(1)
  }

  const handleQuizChange = (quizId: string) => {
    setSelectedQuizId(quizId)
    setCurrentPage(1)
  }

  const getTimeframeName = (timeframe: LeaderboardTimeframe): string => {
    switch (timeframe) {
      case LeaderboardTimeframe.ALL_TIME:
        return 'All Time'
      case LeaderboardTimeframe.TODAY:
        return 'Today'
      case LeaderboardTimeframe.THIS_WEEK:
        return 'This Week'
      case LeaderboardTimeframe.THIS_MONTH:
        return 'This Month'
      case LeaderboardTimeframe.THIS_YEAR:
        return 'This Year'
      default:
        return 'All Time'
    }
  }

  const getRankIcon = (rank: number) => {
    if (rank === 1) return '🥇'
    if (rank === 2) return '🥈'
    if (rank === 3) return '🥉'
    return `#${rank}`
  }

  const getRankGradient = (rank: number): string => {
    if (rank === 1) return 'from-warning-600 to-warning-500'
    if (rank === 2) return 'from-secondary-500 to-secondary-400'
    if (rank === 3) return 'from-orange-600 to-orange-500'
    return 'from-secondary-200 to-secondary-100'
  }

  const getRankTextColor = (rank: number): string => {
    if (rank <= 3) return 'text-white'
    return 'text-secondary-700'
  }

  const formatDuration = (duration: string): string => {
    try {
      const match = duration.match(/(\d+):(\d+):(\d+)/)
      if (!match) return duration

      const [, hours, minutes, seconds] = match
      const h = parseInt(hours)
      const m = parseInt(minutes)
      const s = parseInt(seconds)

      if (h > 0) return `${h}h ${m}m`
      if (m > 0) return `${m}m ${s}s`
      return `${s}s`
    } catch {
      return duration
    }
  }

  if (loading && !leaderboard) {
    return (
      <div className="min-h-[calc(100vh-5rem)] flex flex-col items-center justify-center">
        <Spinner size="lg" />
        <p className="mt-4 text-secondary-600 text-lg">Loading leaderboard...</p>
      </div>
    )
  }

  const avgScore = leaderboard?.entries.length
    ? (leaderboard.entries.reduce((acc, entry) => acc + entry.percentage, 0) / leaderboard.entries.length).toFixed(1)
    : '0'

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Header */}
      <div className="card-premium p-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="p-4 rounded-2xl bg-gradient-to-br from-warning-600 to-warning-500 shadow-glow">
              <TrophyIcon className="h-10 w-10 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-secondary-900">Leaderboard</h1>
              <p className="text-lg text-secondary-600 mt-1">
                {leaderboard?.quiz ? `Rankings for "${leaderboard.quiz.title}"` : 'Global Rankings'} • {getTimeframeName(selectedTimeframe)}
              </p>
            </div>
          </div>

          <Button
            variant={showFilters ? 'primary' : 'secondary'}
            size="md"
            onClick={() => setShowFilters(!showFilters)}
            className="gap-2"
          >
            <FunnelIcon className="h-5 w-5" />
            {showFilters ? 'Hide Filters' : 'Show Filters'}
          </Button>
        </div>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div className="card-premium p-6 animate-fade-in-down">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Timeframe Filter */}
            <div>
              <label className="block text-sm font-semibold text-secondary-700 mb-3">
                <CalendarDaysIcon className="h-4 w-4 inline mr-1" />
                Time Period
              </label>
              <select
                value={selectedTimeframe}
                onChange={(e) => handleTimeframeChange(Number(e.target.value) as LeaderboardTimeframe)}
                className="select-field"
              >
                <option value={LeaderboardTimeframe.ALL_TIME}>All Time</option>
                <option value={LeaderboardTimeframe.TODAY}>Today</option>
                <option value={LeaderboardTimeframe.THIS_WEEK}>This Week</option>
                <option value={LeaderboardTimeframe.THIS_MONTH}>This Month</option>
                <option value={LeaderboardTimeframe.THIS_YEAR}>This Year</option>
              </select>
            </div>

            {/* Quiz Filter */}
            <div>
              <label className="block text-sm font-semibold text-secondary-700 mb-3">
                <ChartBarIcon className="h-4 w-4 inline mr-1" />
                Quiz (Optional)
              </label>
              <select
                value={selectedQuizId}
                onChange={(e) => handleQuizChange(e.target.value)}
                className="select-field"
              >
                <option value="">All Quizzes (Global Ranking)</option>
                {quizzes.map((quiz) => (
                  <option key={quiz.id} value={quiz.id}>
                    {quiz.title}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Stats Summary */}
      {leaderboard && leaderboard.entries.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="card-premium p-6 animate-scale-in">
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 rounded-xl bg-gradient-to-br from-primary-600 to-primary-500 shadow-soft">
                <UserIcon className="h-6 w-6 text-white" />
              </div>
              <div>
                <div className="text-sm text-secondary-600">Total Players</div>
                <div className="text-3xl font-bold text-secondary-900">{leaderboard.totalCount}</div>
              </div>
            </div>
          </div>

          <div className="card-premium p-6 animate-scale-in" style={{ animationDelay: '50ms' }}>
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 rounded-xl bg-gradient-to-br from-warning-600 to-warning-500 shadow-soft">
                <TrophyIcon className="h-6 w-6 text-white" />
              </div>
              <div>
                <div className="text-sm text-secondary-600">Top Score</div>
                <div className="text-3xl font-bold text-secondary-900">
                  {leaderboard.entries[0]?.percentage.toFixed(1)}%
                </div>
              </div>
            </div>
          </div>

          <div className="card-premium p-6 animate-scale-in" style={{ animationDelay: '100ms' }}>
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 rounded-xl bg-gradient-to-br from-accent-600 to-accent-500 shadow-soft">
                <ChartBarIcon className="h-6 w-6 text-white" />
              </div>
              <div>
                <div className="text-sm text-secondary-600">Average Score</div>
                <div className="text-3xl font-bold text-secondary-900">{avgScore}%</div>
              </div>
            </div>
          </div>

          <div className="card-premium p-6 animate-scale-in" style={{ animationDelay: '150ms' }}>
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 rounded-xl bg-gradient-to-br from-secondary-700 to-secondary-600 shadow-soft">
                <ClockIcon className="h-6 w-6 text-white" />
              </div>
              <div>
                <div className="text-sm text-secondary-600">Timeframe</div>
                <div className="text-xl font-bold text-secondary-900">{getTimeframeName(selectedTimeframe)}</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Leaderboard Table */}
      {leaderboard && leaderboard.entries.length > 0 ? (
        <div className="card-premium overflow-hidden">
          {/* Table Header */}
          <div className="px-8 py-6 bg-gradient-to-r from-secondary-50 to-primary-50 border-b border-secondary-200">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-secondary-900 flex items-center gap-2">
                <FireIcon className="h-6 w-6 text-primary-600" />
                Top Performers
              </h2>
              <Badge variant="primary" size="lg">
                {leaderboard.totalCount} Players
              </Badge>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-secondary-50 border-b-2 border-secondary-200">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-bold text-secondary-700 uppercase tracking-wider">
                    Rank
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-secondary-700 uppercase tracking-wider">
                    Player
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-secondary-700 uppercase tracking-wider">
                    Score
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-secondary-700 uppercase tracking-wider">
                    Percentage
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-secondary-700 uppercase tracking-wider">
                    Duration
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-secondary-700 uppercase tracking-wider">
                    Completed
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-secondary-200">
                {leaderboard.entries.map((entry, index) => (
                  <tr
                    key={entry.userId}
                    className={`hover:bg-secondary-50 transition-colors animate-fade-in-up ${
                      entry.rank <= 3 ? 'bg-gradient-to-r from-primary-50/30 to-transparent' : ''
                    }`}
                    style={{ animationDelay: `${index * 30}ms` }}
                  >
                    <td className="px-6 py-5 whitespace-nowrap">
                      <div className={`inline-flex items-center justify-center w-14 h-14 rounded-xl text-lg font-bold bg-gradient-to-br ${getRankGradient(entry.rank)} ${getRankTextColor(entry.rank)} shadow-soft`}>
                        {getRankIcon(entry.rank)}
                      </div>
                    </td>
                    <td className="px-6 py-5 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className="flex-shrink-0">
                          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-600 to-accent-600 flex items-center justify-center text-white font-bold shadow-soft">
                            {entry.user.firstName[0]}{entry.user.lastName[0]}
                          </div>
                        </div>
                        <div>
                          <div className="text-sm font-bold text-secondary-900">
                            {entry.user.firstName} {entry.user.lastName}
                            {entry.rank === 1 && (
                              <SparklesIcon className="inline h-4 w-4 ml-1 text-warning-600" />
                            )}
                          </div>
                          <div className="text-sm text-secondary-600">
                            {entry.user.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5 whitespace-nowrap">
                      <div className="text-sm font-bold text-secondary-900">
                        {entry.score} <span className="text-secondary-500">/ {entry.totalPoints}</span>
                      </div>
                    </td>
                    <td className="px-6 py-5 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className="text-lg font-bold text-secondary-900">
                          {entry.percentage.toFixed(1)}%
                        </div>
                        <div className="flex-1 bg-secondary-200 rounded-full h-2.5 w-20">
                          <div
                            className={`h-2.5 rounded-full bg-gradient-to-r ${
                              entry.percentage >= 80
                                ? 'from-accent-600 to-accent-500'
                                : entry.percentage >= 60
                                ? 'from-warning-600 to-warning-500'
                                : 'from-danger-600 to-danger-500'
                            }`}
                            style={{ width: `${Math.min(entry.percentage, 100)}%` }}
                          ></div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5 whitespace-nowrap">
                      <div className="flex items-center gap-1 text-sm text-secondary-700">
                        <ClockIcon className="h-4 w-4 text-secondary-500" />
                        {formatDuration(entry.duration)}
                      </div>
                    </td>
                    <td className="px-6 py-5 whitespace-nowrap text-sm text-secondary-600">
                      {new Date(entry.completedAt).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {leaderboard.totalPages > 1 && (
            <div className="px-8 py-6 border-t border-secondary-200 bg-secondary-50">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="text-sm text-secondary-600">
                  Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, leaderboard.totalCount)} of {leaderboard.totalCount} results
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={!leaderboard.hasPreviousPage}
                    className="gap-1"
                  >
                    <ChevronLeftIcon className="h-4 w-4" />
                    Previous
                  </Button>

                  <div className="flex gap-1">
                    {Array.from({ length: Math.min(5, leaderboard.totalPages) }, (_, i) => {
                      let pageNum = i + 1
                      if (leaderboard.totalPages > 5) {
                        if (currentPage > 3) {
                          pageNum = currentPage - 2 + i
                          if (pageNum > leaderboard.totalPages) {
                            pageNum = leaderboard.totalPages - 4 + i
                          }
                        }
                      }

                      return (
                        <button
                          key={pageNum}
                          onClick={() => setCurrentPage(pageNum)}
                          className={`w-10 h-10 rounded-xl text-sm font-bold transition-all ${
                            pageNum === currentPage
                              ? 'bg-gradient-to-br from-primary-600 to-accent-600 text-white shadow-soft'
                              : 'bg-white border border-secondary-300 text-secondary-700 hover:bg-secondary-50'
                          }`}
                        >
                          {pageNum}
                        </button>
                      )
                    })}
                  </div>

                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setCurrentPage(Math.min(leaderboard.totalPages, currentPage + 1))}
                    disabled={!leaderboard.hasNextPage}
                    className="gap-1"
                  >
                    Next
                    <ChevronRightIcon className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="card-premium p-20 text-center">
          <div className="inline-flex p-6 rounded-2xl bg-gradient-to-br from-primary-50 to-accent-50 mb-6">
            <TrophyIcon className="h-16 w-16 text-primary-600" />
          </div>
          <h3 className="text-2xl font-bold text-secondary-900 mb-2">No Rankings Available</h3>
          <p className="text-secondary-600 mb-8 max-w-md mx-auto">
            {selectedQuizId
              ? 'No completed attempts found for this quiz in the selected timeframe.'
              : 'No completed quiz attempts found in the selected timeframe.'
            }
          </p>
          <Link to="/quizzes">
            <Button variant="primary" size="lg" className="gap-2">
              <SparklesIcon className="h-5 w-5" />
              Browse Quizzes
            </Button>
          </Link>
        </div>
      )}
    </div>
  )
}

export default Leaderboard
