import { useState, useEffect } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useQuiz } from '@/hooks/useQuiz'
import { QuizListResponse, CategoryResponse, QuizFilters } from '@/types'
import {
  MagnifyingGlassIcon,
  FunnelIcon,
  PlayIcon,
  EyeIcon,
  ClockIcon,
  AcademicCapIcon
} from '@heroicons/react/24/outline'

const QuizList = () => {
  const [searchParams, setSearchParams] = useSearchParams()
  const { getQuizzes, getCategories, loading } = useQuiz()

  const [quizzes, setQuizzes] = useState<QuizListResponse[]>([])
  const [categories, setCategories] = useState<CategoryResponse[]>([])
  const [filters, setFilters] = useState<QuizFilters>({
    search: searchParams.get('search') || '',
    categoryId: searchParams.get('category') || '',
    difficulty: searchParams.get('difficulty') as any || undefined,
    sortBy: 'createdAt',
    sortOrder: 'desc',
    pageSize: 12
  })
  const [showFilters, setShowFilters] = useState(false)

  useEffect(() => {
    loadQuizzes()
    loadCategories()
  }, [filters])

  const loadQuizzes = async () => {
    const result = await getQuizzes(filters)
    if (result) {
      setQuizzes(result.data)
    }
  }

  const loadCategories = async () => {
    const result = await getCategories()
    if (result) {
      setCategories(result)
    }
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    updateFilters({ search: filters.search })
  }

  const updateFilters = (newFilters: Partial<QuizFilters>) => {
    const updatedFilters = { ...filters, ...newFilters }
    setFilters(updatedFilters)

    // Update URL params
    const params = new URLSearchParams()
    if (updatedFilters.search) params.set('search', updatedFilters.search)
    if (updatedFilters.categoryId) params.set('category', updatedFilters.categoryId)
    if (updatedFilters.difficulty) params.set('difficulty', updatedFilters.difficulty)
    setSearchParams(params)
  }

  const clearFilters = () => {
    setFilters({
      search: '',
      categoryId: '',
      difficulty: undefined,
      sortBy: 'createdAt',
      sortOrder: 'desc',
      pageSize: 12
    })
    setSearchParams({})
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
      <div className="mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Available Quizzes</h1>
          <p className="text-gray-600 mt-2">Discover and take quizzes on various topics</p>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
        <form onSubmit={handleSearch} className="flex gap-4 mb-4">
          <div className="flex-1">
            <div className="relative">
              <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search quizzes..."
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                className="pl-10 input-field"
              />
            </div>
          </div>
          <button
            type="submit"
            className="btn-primary"
          >
            Search
          </button>
          <button
            type="button"
            onClick={() => setShowFilters(!showFilters)}
            className="btn-secondary flex items-center"
          >
            <FunnelIcon className="h-5 w-5 mr-2" />
            Filters
          </button>
        </form>

        {/* Filter Panel */}
        {showFilters && (
          <div className="border-t border-gray-200 pt-4 grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
              <select
                value={filters.categoryId}
                onChange={(e) => updateFilters({ categoryId: e.target.value })}
                className="input-field"
              >
                <option value="">All Categories</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.icon} {category.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Difficulty</label>
              <select
                value={filters.difficulty || ''}
                onChange={(e) => updateFilters({ difficulty: e.target.value as any })}
                className="input-field"
              >
                <option value="">All Levels</option>
                <option value="Easy">Easy</option>
                <option value="Medium">Medium</option>
                <option value="Hard">Hard</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Sort By</label>
              <select
                value={filters.sortBy}
                onChange={(e) => updateFilters({ sortBy: e.target.value as any })}
                className="input-field"
              >
                <option value="createdAt">Latest</option>
                <option value="title">Title</option>
                <option value="difficulty">Difficulty</option>
                <option value="questionsCount">Questions</option>
              </select>
            </div>

            <div className="flex items-end">
              <button
                onClick={clearFilters}
                className="w-full btn-secondary"
              >
                Clear Filters
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Quiz Grid */}
      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading quizzes...</p>
        </div>
      ) : quizzes.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {quizzes.map((quiz) => (
            <div key={quiz.id} className="bg-white rounded-lg shadow-sm border border-gray-200 hover:border-gray-300 transition-colors">
              {/* Quiz Header */}
              <div className="p-6 pb-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center">
                    <span className="text-2xl mr-3">{quiz.category.icon}</span>
                    <span className="text-sm font-medium text-gray-600">{quiz.category.name}</span>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${getDifficultyColor(quiz.difficulty)}`}>
                    {getDifficultyLabel(quiz.difficulty)}
                  </span>
                </div>

                <h3 className="text-lg font-semibold text-gray-900 mb-2">{quiz.title}</h3>
                <p className="text-gray-600 text-sm mb-4 line-clamp-2">{quiz.description}</p>

                {/* Quiz Stats */}
                <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                  <div className="flex items-center">
                    <AcademicCapIcon className="h-4 w-4 mr-1" />
                    {quiz.questionsCount} questions
                  </div>
                  {quiz.timeLimit && (
                    <div className="flex items-center">
                      <ClockIcon className="h-4 w-4 mr-1" />
                      {quiz.timeLimit} min
                    </div>
                  )}
                </div>

                {/* Author */}
                <div className="text-xs text-gray-500 mb-4">
                  By {quiz.createdBy.fullName} • {formatDate(quiz.createdAt)}
                </div>
              </div>

              {/* Actions */}
              <div className="px-6 pb-6 flex space-x-3">
                <Link
                  to={`/quizzes/${quiz.id}`}
                  className="flex-1 flex items-center justify-center px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <EyeIcon className="h-4 w-4 mr-2" />
                  View
                </Link>
                <Link
                  to={`/quizzes/${quiz.id}/take`}
                  className="flex-1 flex items-center justify-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                >
                  <PlayIcon className="h-4 w-4 mr-2" />
                  Take Quiz
                </Link>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <AcademicCapIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No quizzes found</h3>
          <p className="text-gray-600">
            {filters.search || filters.categoryId || filters.difficulty
              ? 'Try adjusting your search criteria or filters.'
              : 'No quizzes are available at the moment.'}
          </p>
        </div>
      )}
    </div>
  )
}

export default QuizList