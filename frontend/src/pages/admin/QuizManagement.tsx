import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useAuthStore } from '@/stores/authStore'
import { Navigate, useNavigate } from 'react-router-dom'
import { QuizListResponse, PaginatedResponse, CategoryResponse } from '@/types'
import quizService from '../../services/quizService'
import { toast } from 'react-hot-toast'
import {
  MagnifyingGlassIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  TrashIcon,
  EyeIcon,
  ArrowLeftIcon,
  BookOpenIcon
} from '@heroicons/react/24/outline'

const QuizManagement = () => {
  const { user } = useAuthStore()
  const navigate = useNavigate()
  const [quizzes, setQuizzes] = useState<QuizListResponse[]>([])
  const [categories, setCategories] = useState<CategoryResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')
  const [sortBy, setSortBy] = useState('createdAt')
  const [sortOrder, setSortOrder] = useState('desc')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalQuizzes, setTotalQuizzes] = useState(0)
  const pageSize = 12

  // Check if user is admin
  if (!user?.roles?.includes('Admin')) {
    return <Navigate to="/dashboard" replace />
  }

  useEffect(() => {
    fetchQuizzes()
    fetchCategories()
  }, [])

  useEffect(() => {
    fetchQuizzes()
  }, [currentPage, searchTerm, selectedCategory, sortBy, sortOrder])

  const fetchQuizzes = async () => {
    setLoading(true)
    try {
      const response = await quizService.getQuizzes({
        search: searchTerm,
        categoryId: selectedCategory || undefined,
        pageNumber: currentPage,
        pageSize: pageSize,
        sortBy: sortBy,
        sortOrder: sortOrder
      })

      setQuizzes(response.data)
      setTotalPages(response.totalPages)
      setTotalQuizzes(response.totalCount)
    } catch (error) {
      console.error('Error fetching quizzes:', error)
      toast.error('Failed to load quizzes')
    } finally {
      setLoading(false)
    }
  }

  const fetchCategories = async () => {
    try {
      const response = await quizService.getCategories()
      setCategories(response)
    } catch (error) {
      console.error('Error fetching categories:', error)
      toast.error('Failed to load categories')
    }
  }

  const handleDeleteQuiz = async (quizId: string, quizTitle: string) => {
    if (!confirm(`Are you sure you want to PERMANENTLY DELETE the quiz "${quizTitle}"? This action cannot be undone and will remove all associated data including attempts and results.`)) {
      return
    }

    try {
      await quizService.deleteQuiz(quizId)
      toast.success(`Quiz "${quizTitle}" deleted successfully`)
      fetchQuizzes() // Refresh the list
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to delete quiz'
      toast.error(message)
    }
  }

  const handleViewQuiz = (quizId: string) => {
    navigate(`/quizzes/${quizId}`)
  }

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value)
    setCurrentPage(1) // Reset to first page when searching
  }

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage)
  }

  const getDifficultyLabel = (difficulty: number): string => {
    switch (difficulty) {
      case 1: return 'Easy'
      case 2: return 'Medium'
      case 3: return 'Hard'
      default: return 'Unknown'
    }
  }

  const getDifficultyColor = (difficulty: number) => {
    switch (difficulty) {
      case 1: return 'bg-green-100 text-green-800'
      case 2: return 'bg-yellow-100 text-yellow-800'
      case 3: return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (loading && quizzes.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="flex items-center justify-center p-8">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p>Loading quizzes...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/admin')}
          >
            <ArrowLeftIcon className="h-4 w-4 mr-2" />
            Back to Admin Dashboard
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Quiz Management</h1>
            <p className="text-gray-600 mt-1">
              Manage all quizzes in the system - view, search, and delete quizzes
            </p>
          </div>
        </div>

        {/* Stats */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <BookOpenIcon className="h-5 w-5 text-blue-600" />
            <span className="text-blue-800 font-medium">
              Total Quizzes: {totalQuizzes}
            </span>
            {searchTerm && (
              <span className="text-blue-600">
                • Showing results for "{searchTerm}"
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Search and Filter Quizzes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Search */}
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="text"
                placeholder="Search by title, description, or creator..."
                value={searchTerm}
                onChange={handleSearchChange}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Filters */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                <select
                  value={selectedCategory}
                  onChange={(e) => {
                    setSelectedCategory(e.target.value)
                    setCurrentPage(1)
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                <label className="block text-sm font-medium text-gray-700 mb-1">Sort By</label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="createdAt">Date Created</option>
                  <option value="title">Title</option>
                  <option value="category">Category</option>
                  <option value="difficulty">Difficulty</option>
                  <option value="questionsCount">Questions Count</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Order</label>
                <select
                  value={sortOrder}
                  onChange={(e) => setSortOrder(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="desc">Descending</option>
                  <option value="asc">Ascending</option>
                </select>
              </div>
            </div>

            {/* Clear Filters */}
            {(selectedCategory || sortBy !== 'createdAt' || sortOrder !== 'desc') && (
              <div className="pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSelectedCategory('')
                    setSortBy('createdAt')
                    setSortOrder('desc')
                    setCurrentPage(1)
                  }}
                >
                  Clear Filters
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Quiz Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
        {quizzes.map((quiz) => (
          <Card key={quiz.id} className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <CardTitle className="text-lg line-clamp-2">{quiz.title}</CardTitle>
                <Badge className={getDifficultyColor(quiz.difficulty)}>
                  {getDifficultyLabel(quiz.difficulty)}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 text-sm mb-4 line-clamp-2">{quiz.description}</p>

              <div className="space-y-2 text-sm text-gray-500 mb-4">
                <div>📝 {quiz.questionsCount} questions</div>
                <div>👤 By {quiz.createdBy.firstName} {quiz.createdBy.lastName}</div>
                <div>📅 {formatDate(quiz.createdAt)}</div>
                <div>🎯 {quiz.category.name} {quiz.category.icon}</div>
                <div className="flex items-center gap-1">
                  <span>{quiz.isPublic ? '🌐' : '🔒'}</span>
                  <span>{quiz.isPublic ? 'Public' : 'Private'}</span>
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleViewQuiz(quiz.id)}
                  className="flex-1"
                >
                  <EyeIcon className="h-4 w-4 mr-1" />
                  View
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleDeleteQuiz(quiz.id, quiz.title)}
                  className="border-red-600 text-red-600 hover:bg-red-50"
                >
                  <TrashIcon className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Empty State */}
      {quizzes.length === 0 && !loading && (
        <Card>
          <CardContent className="text-center py-12">
            <BookOpenIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {searchTerm ? 'No quizzes found' : 'No quizzes available'}
            </h3>
            <p className="text-gray-500">
              {searchTerm
                ? `No quizzes match your search "${searchTerm}"`
                : 'There are no quizzes in the system yet.'
              }
            </p>
          </CardContent>
        </Card>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <Card>
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-500">
                Showing page {currentPage} of {totalPages} ({totalQuizzes} total quizzes)
              </div>

              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage <= 1}
                  className="flex items-center gap-1"
                >
                  <ChevronLeftIcon className="h-4 w-4" />
                  Previous
                </Button>

                <div className="flex gap-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    const page = Math.max(1, Math.min(totalPages - 4, currentPage - 2)) + i;
                    if (page > totalPages) return null;
                    return (
                      <Button
                        key={page}
                        size="sm"
                        variant={currentPage === page ? "default" : "outline"}
                        onClick={() => handlePageChange(page)}
                        className="w-8"
                      >
                        {page}
                      </Button>
                    );
                  })}
                </div>

                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage >= totalPages}
                  className="flex items-center gap-1"
                >
                  Next
                  <ChevronRightIcon className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

export default QuizManagement