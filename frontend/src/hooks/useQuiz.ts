import { useState } from 'react'
import quizService from '@/services/quizService'
import {
  CreateQuizRequest,
  UpdateQuizRequest,
  QuizResponse,
  QuizListResponse,
  CategoryResponse,
  CreateCategoryRequest,
  QuizFiltersRequest,
  PaginatedResponse,
  SubmitQuizAttemptRequest,
  QuizAttempt,
  LeaderboardRequest,
  LeaderboardResponse
} from '@/types'
import toast from 'react-hot-toast'

export const useQuiz = () => {
  const [loading, setLoading] = useState(false)

  const getQuizzes = async (filters: QuizFiltersRequest): Promise<PaginatedResponse<QuizListResponse> | null> => {
    try {
      setLoading(true)
      const result = await quizService.getQuizzes(filters)
      return result
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to fetch quizzes'
      toast.error(message)
      return null
    } finally {
      setLoading(false)
    }
  }

  const getQuizById = async (quizId: string): Promise<QuizResponse | null> => {
    try {
      setLoading(true)
      const result = await quizService.getQuizById(quizId)
      return result
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to fetch quiz'
      toast.error(message)
      return null
    } finally {
      setLoading(false)
    }
  }

  const getQuizForTaking = async (quizId: string): Promise<QuizResponse | null> => {
    try {
      setLoading(true)
      const result = await quizService.getQuizForTaking(quizId)
      return result
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to fetch quiz for taking'
      toast.error(message)
      return null
    } finally {
      setLoading(false)
    }
  }

  const createQuiz = async (quizData: CreateQuizRequest): Promise<QuizResponse | null> => {
    try {
      setLoading(true)
      const result = await quizService.createQuiz(quizData)
      toast.success('Quiz created successfully!')
      return result
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to create quiz'
      toast.error(message)
      return null
    } finally {
      setLoading(false)
    }
  }

  const updateQuiz = async (quizId: string, quizData: UpdateQuizRequest): Promise<QuizResponse | null> => {
    try {
      setLoading(true)
      const result = await quizService.updateQuiz(quizId, quizData)
      toast.success('Quiz updated successfully!')
      return result
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to update quiz'
      toast.error(message)
      return null
    } finally {
      setLoading(false)
    }
  }

  const deleteQuiz = async (quizId: string): Promise<boolean> => {
    try {
      setLoading(true)
      await quizService.deleteQuiz(quizId)
      toast.success('Quiz deleted successfully!')
      return true
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to delete quiz'
      toast.error(message)
      return false
    } finally {
      setLoading(false)
    }
  }

  const getMyQuizzes = async (filters: QuizFiltersRequest): Promise<PaginatedResponse<QuizListResponse> | null> => {
    try {
      setLoading(true)
      const result = await quizService.getMyQuizzes(filters)
      return result
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to fetch your quizzes'
      toast.error(message)
      return null
    } finally {
      setLoading(false)
    }
  }

  const getCategories = async (): Promise<CategoryResponse[] | null> => {
    try {
      setLoading(true)
      const result = await quizService.getCategories()
      return result
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to fetch categories'
      toast.error(message)
      return null
    } finally {
      setLoading(false)
    }
  }

  const createCategory = async (categoryData: CreateCategoryRequest): Promise<CategoryResponse | null> => {
    try {
      setLoading(true)
      const result = await quizService.createCategory(categoryData)
      toast.success('Category created successfully!')
      return result
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to create category'
      toast.error(message)
      return null
    } finally {
      setLoading(false)
    }
  }

  const submitQuizAttempt = async (quizId: string, submitData: SubmitQuizAttemptRequest): Promise<QuizAttempt | null> => {
    try {
      setLoading(true)
      const result = await quizService.submitQuizAttempt(quizId, submitData)
      toast.success('Quiz submitted successfully!')
      return result
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to submit quiz'
      toast.error(message)
      return null
    } finally {
      setLoading(false)
    }
  }

  const getUserAttempts = async (pageNumber = 1, pageSize = 10): Promise<PaginatedResponse<QuizAttempt> | null> => {
    try {
      setLoading(true)
      const result = await quizService.getUserAttempts(pageNumber, pageSize)
      return result
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to fetch quiz attempts'
      toast.error(message)
      return null
    } finally {
      setLoading(false)
    }
  }

  const getAttemptDetails = async (attemptId: string): Promise<QuizAttempt | null> => {
    try {
      setLoading(true)
      const result = await quizService.getAttemptDetails(attemptId)
      return result
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to fetch attempt details'
      toast.error(message)
      return null
    } finally {
      setLoading(false)
    }
  }

  const getLeaderboard = async (request: LeaderboardRequest): Promise<LeaderboardResponse | null> => {
    try {
      setLoading(true)
      const result = await quizService.getLeaderboard(request)
      return result
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to fetch leaderboard'
      toast.error(message)
      return null
    } finally {
      setLoading(false)
    }
  }

  return {
    loading,
    getQuizzes,
    getQuizById,
    getQuizForTaking,
    createQuiz,
    updateQuiz,
    deleteQuiz,
    getMyQuizzes,
    getCategories,
    createCategory,
    submitQuizAttempt,
    getUserAttempts,
    getAttemptDetails,
    getLeaderboard,
  }
}