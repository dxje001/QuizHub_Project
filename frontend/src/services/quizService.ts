import api from './api'
import {
  CreateQuizRequest,
  UpdateQuizRequest,
  QuizResponse,
  QuizListResponse,
  CategoryResponse,
  CreateCategoryRequest,
  QuizFiltersRequest,
  PaginatedResponse,
  ApiResponse,
  SubmitQuizAttemptRequest,
  QuizAttempt,
  LeaderboardRequest,
  LeaderboardResponse
} from '@/types'

class QuizService {
  async getQuizzes(filters: QuizFiltersRequest): Promise<PaginatedResponse<QuizListResponse>> {
    const params = new URLSearchParams()

    if (filters.search) params.append('search', filters.search)
    if (filters.categoryId) params.append('categoryId', filters.categoryId)
    if (filters.difficulty) params.append('difficulty', filters.difficulty.toString())
    if (filters.isPublic !== undefined) params.append('isPublic', filters.isPublic.toString())
    if (filters.sortBy) params.append('sortBy', filters.sortBy)
    if (filters.sortOrder) params.append('sortOrder', filters.sortOrder)
    if (filters.pageNumber) params.append('pageNumber', filters.pageNumber.toString())
    if (filters.pageSize) params.append('pageSize', filters.pageSize.toString())

    const response = await api.get<ApiResponse<PaginatedResponse<QuizListResponse>>>(
      `/api/quiz?${params.toString()}`
    )
    return response.data.data
  }

  async getQuizById(quizId: string): Promise<QuizResponse> {
    const response = await api.get<ApiResponse<QuizResponse>>(`/api/quiz/${quizId}`)
    return response.data.data
  }

  async getQuizForTaking(quizId: string): Promise<QuizResponse> {
    const response = await api.get<ApiResponse<QuizResponse>>(`/api/quiz/${quizId}/take`)
    return response.data.data
  }

  async createQuiz(quizData: CreateQuizRequest): Promise<QuizResponse> {
    const response = await api.post<ApiResponse<QuizResponse>>('/api/quiz', quizData)
    return response.data.data
  }

  async updateQuiz(quizId: string, quizData: UpdateQuizRequest): Promise<QuizResponse> {
    const response = await api.put<ApiResponse<QuizResponse>>(`/api/quiz/${quizId}`, quizData)
    return response.data.data
  }

  async deleteQuiz(quizId: string): Promise<void> {
    await api.delete(`/api/quiz/${quizId}`)
  }

  async getMyQuizzes(filters: QuizFiltersRequest): Promise<PaginatedResponse<QuizListResponse>> {
    const params = new URLSearchParams()

    if (filters.search) params.append('search', filters.search)
    if (filters.categoryId) params.append('categoryId', filters.categoryId)
    if (filters.difficulty) params.append('difficulty', filters.difficulty.toString())
    if (filters.sortBy) params.append('sortBy', filters.sortBy)
    if (filters.sortOrder) params.append('sortOrder', filters.sortOrder)
    if (filters.pageNumber) params.append('pageNumber', filters.pageNumber.toString())
    if (filters.pageSize) params.append('pageSize', filters.pageSize.toString())

    const response = await api.get<ApiResponse<PaginatedResponse<QuizListResponse>>>(
      `/api/quiz/my?${params.toString()}`
    )
    return response.data.data
  }

  async getCategories(): Promise<CategoryResponse[]> {
    const response = await api.get<ApiResponse<CategoryResponse[]>>('/api/category')
    return response.data.data
  }

  async createCategory(categoryData: CreateCategoryRequest): Promise<CategoryResponse> {
    const response = await api.post<ApiResponse<CategoryResponse>>('/api/category', categoryData)
    return response.data.data
  }

  async submitQuizAttempt(quizId: string, submitData: SubmitQuizAttemptRequest): Promise<QuizAttempt> {
    const response = await api.post<ApiResponse<QuizAttempt>>(`/api/quiz/${quizId}/submit`, submitData)
    return response.data.data
  }

  async getUserAttempts(pageNumber = 1, pageSize = 10): Promise<PaginatedResponse<QuizAttempt>> {
    const params = new URLSearchParams()
    params.append('pageNumber', pageNumber.toString())
    params.append('pageSize', pageSize.toString())

    const response = await api.get<ApiResponse<PaginatedResponse<QuizAttempt>>>(
      `/api/quiz/attempts?${params.toString()}`
    )
    return response.data.data
  }

  async getAllAttempts(pageNumber = 1, pageSize = 15): Promise<PaginatedResponse<QuizAttempt>> {
    const params = new URLSearchParams()
    params.append('pageNumber', pageNumber.toString())
    params.append('pageSize', pageSize.toString())

    const response = await api.get<ApiResponse<PaginatedResponse<QuizAttempt>>>(
      `/api/admin/attempts?${params.toString()}`
    )
    return response.data.data
  }

  async getAttemptDetails(attemptId: string): Promise<QuizAttempt> {
    const response = await api.get<ApiResponse<QuizAttempt>>(`/api/quiz/attempts/${attemptId}`)
    return response.data.data
  }

  async getLeaderboard(request: LeaderboardRequest): Promise<LeaderboardResponse> {
    const params = new URLSearchParams()

    if (request.quizId) params.append('quizId', request.quizId)
    if (request.pageNumber) params.append('pageNumber', request.pageNumber.toString())
    if (request.pageSize) params.append('pageSize', request.pageSize.toString())
    if (request.timeframe !== undefined) params.append('timeframe', request.timeframe.toString())

    const response = await api.get<ApiResponse<LeaderboardResponse>>(
      `/api/quiz/leaderboard?${params.toString()}`
    )
    return response.data.data
  }
}

export default new QuizService()