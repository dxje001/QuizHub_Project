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
  FunnelIcon
} from '@heroicons/react/24/outline'

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

  const getRankColor = (rank: number): string => {
    if (rank === 1) return 'text-yellow-600 bg-yellow-50'
    if (rank === 2) return 'text-gray-600 bg-gray-50'
    if (rank === 3) return 'text-orange-600 bg-orange-50'
    return 'text-gray-700 bg-gray-50'
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
      <div className="max-w-7xl mx-auto">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading leaderboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center">
            <TrophyIcon className="h-8 w-8 text-yellow-500 mr-3" />
            Leaderboard
          </h1>
          <p className="text-gray-600 mt-2">
            {leaderboard?.quiz ? `Rankings for "${leaderboard.quiz.title}"` : 'Global Rankings'} - {getTimeframeName(selectedTimeframe)}
          </p>
        </div>

        <button
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
        >
          <FunnelIcon className="h-5 w-5 mr-2" />
          Filters
        </button>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Timeframe Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <CalendarDaysIcon className="h-4 w-4 inline mr-1" />
                Time Period
              </label>
              <select
                value={selectedTimeframe}
                onChange={(e) => handleTimeframeChange(Number(e.target.value) as LeaderboardTimeframe)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
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
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <ChartBarIcon className="h-4 w-4 inline mr-1" />
                Quiz (Optional)
              </label>
              <select
                value={selectedQuizId}
                onChange={(e) => handleQuizChange(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
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
      {leaderboard && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <UserIcon className="h-8 w-8 text-blue-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Players</p>
                <p className="text-2xl font-bold text-gray-900">{leaderboard.totalCount}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <TrophyIcon className="h-8 w-8 text-yellow-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Top Score</p>
                <p className="text-2xl font-bold text-gray-900">
                  {leaderboard.entries[0]?.percentage.toFixed(1)}%
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <ChartBarIcon className="h-8 w-8 text-green-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Average Score</p>
                <p className="text-2xl font-bold text-gray-900">
                  {leaderboard.entries.length > 0
                    ? (leaderboard.entries.reduce((acc, entry) => acc + entry.percentage, 0) / leaderboard.entries.length).toFixed(1)
                    : 0}%
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <ClockIcon className="h-8 w-8 text-purple-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Timeframe</p>
                <p className="text-2xl font-bold text-gray-900">{getTimeframeName(selectedTimeframe)}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Leaderboard Table */}
      {leaderboard && leaderboard.entries.length > 0 ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Rank
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Player
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Score
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Percentage
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Duration
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Completed
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {leaderboard.entries.map((entry, index) => (
                  <tr
                    key={entry.userId}
                    className={`hover:bg-gray-50 ${
                      entry.rank <= 3 ? 'bg-gradient-to-r from-yellow-50 to-transparent' : ''
                    }`}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className={`inline-flex items-center justify-center w-12 h-12 rounded-full text-sm font-bold ${getRankColor(entry.rank)}`}>
                        {getRankIcon(entry.rank)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center">
                            <span className="text-sm font-medium text-primary-700">
                              {entry.user.firstName[0]}{entry.user.lastName[0]}
                            </span>
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {entry.user.firstName} {entry.user.lastName}
                          </div>
                          <div className="text-sm text-gray-500">
                            {entry.user.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {entry.score} / {entry.totalPoints}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="text-sm font-medium text-gray-900 mr-2">
                          {entry.percentage.toFixed(1)}%
                        </div>
                        <div className="flex-1 bg-gray-200 rounded-full h-2 max-w-20">
                          <div
                            className="bg-primary-600 h-2 rounded-full"
                            style={{ width: `${Math.min(entry.percentage, 100)}%` }}
                          ></div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDuration(entry.duration)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(entry.completedAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {leaderboard.totalPages > 1 && (
            <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
              <div className="flex-1 flex justify-between sm:hidden">
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={!leaderboard.hasPreviousPage}
                  className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <button
                  onClick={() => setCurrentPage(Math.min(leaderboard.totalPages, currentPage + 1))}
                  disabled={!leaderboard.hasNextPage}
                  className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
              <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-gray-700">
                    Showing{' '}
                    <span className="font-medium">
                      {((currentPage - 1) * pageSize) + 1}
                    </span>{' '}
                    to{' '}
                    <span className="font-medium">
                      {Math.min(currentPage * pageSize, leaderboard.totalCount)}
                    </span>{' '}
                    of{' '}
                    <span className="font-medium">{leaderboard.totalCount}</span>{' '}
                    results
                  </p>
                </div>
                <div>
                  <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                    <button
                      onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                      disabled={!leaderboard.hasPreviousPage}
                      className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Previous
                    </button>

                    {/* Page numbers */}
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
                          className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                            pageNum === currentPage
                              ? 'z-10 bg-primary-50 border-primary-500 text-primary-600'
                              : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                          }`}
                        >
                          {pageNum}
                        </button>
                      )
                    })}

                    <button
                      onClick={() => setCurrentPage(Math.min(leaderboard.totalPages, currentPage + 1))}
                      disabled={!leaderboard.hasNextPage}
                      className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Next
                    </button>
                  </nav>
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
          <TrophyIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Rankings Available</h3>
          <p className="text-gray-500 mb-4">
            {selectedQuizId
              ? 'No completed attempts found for this quiz in the selected timeframe.'
              : 'No completed quiz attempts found in the selected timeframe.'
            }
          </p>
          <Link
            to="/quizzes"
            className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
          >
            Browse Quizzes
          </Link>
        </div>
      )}
    </div>
  )
}

export default Leaderboard