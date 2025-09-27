// User types
export interface User {
  id: string
  email: string
  firstName: string
  lastName: string
  avatar?: string
  roles?: string[]
  createdAt: string
  updatedAt: string
}

export interface LoginRequest {
  email: string
  password: string
}

export interface RegisterRequest {
  email: string
  password: string
  firstName: string
  lastName: string
}

export interface AuthResponse {
  user: User
  token: string
  refreshToken: string
}

// Quiz Management Types
export interface CreateQuizRequest {
  title: string
  description: string
  categoryId: string
  difficulty: QuizDifficulty
  timeLimit?: number
  isPublic: boolean
  questions: CreateQuestionRequest[]
}

export interface UpdateQuizRequest {
  title: string
  description: string
  categoryId: string
  difficulty: QuizDifficulty
  timeLimit?: number
  isPublic: boolean
}

export interface QuizResponse {
  id: string
  title: string
  description: string
  categoryId: string
  category: CategoryResponse
  difficulty: QuizDifficulty
  timeLimit?: number
  questionsCount: number
  isPublic: boolean
  createdById: string
  createdBy: UserResponse
  createdAt: string
  updatedAt: string
  questions?: QuestionResponse[]
}

export interface QuizListResponse {
  id: string
  title: string
  description: string
  category: CategoryResponse
  difficulty: QuizDifficulty
  timeLimit?: number
  questionsCount: number
  isPublic: boolean
  createdBy: UserResponse
  createdAt: string
}

export interface CreateQuestionRequest {
  type: QuestionType
  questionText: string
  points: number
  timeLimit?: number
  order: number
  answers: CreateAnswerRequest[]
}

export interface QuestionResponse {
  id: string
  quizId: string
  type: QuestionType
  questionText: string
  points: number
  timeLimit?: number
  order: number
  answers: AnswerResponse[]
  createdAt: string
  updatedAt: string
}

export interface CreateAnswerRequest {
  answerText: string
  isCorrect: boolean
  order: number
}

export interface AnswerResponse {
  id: string
  questionId: string
  answerText: string
  isCorrect: boolean
  order: number
}

export interface CategoryResponse {
  id: string
  name: string
  description?: string
  icon?: string
}

export interface CreateCategoryRequest {
  name: string
  description?: string
  icon?: string
}

export interface UserResponse {
  id: string
  email: string
  firstName: string
  lastName: string
  avatar?: string
  fullName: string
}

export interface QuizFiltersRequest {
  search?: string
  categoryId?: string
  difficulty?: QuizDifficulty
  isPublic?: boolean
  createdById?: string
  sortBy?: string
  sortOrder?: string
  pageNumber?: number
  pageSize?: number
}

// Quiz types
export interface Quiz {
  id: string
  title: string
  description: string
  categoryId: string
  category: Category
  difficulty: QuizDifficulty
  timeLimit?: number
  questionsCount: number
  isPublic: boolean
  createdById: string
  createdBy: User
  createdAt: string
  updatedAt: string
}

export interface Question {
  id: string
  quizId: string
  type: QuestionType
  questionText: string
  points: number
  timeLimit?: number
  order: number
  answers: Answer[]
  createdAt: string
  updatedAt: string
}

export interface Answer {
  id: string
  questionId: string
  answerText: string
  isCorrect: boolean
  order: number
}

export interface Category {
  id: string
  name: string
  description?: string
  icon?: string
  createdAt: string
  updatedAt: string
}

// Quiz attempt types
export interface QuizAttempt {
  id: string
  quizId: string
  quiz: Quiz
  userId: string
  user: User
  startedAt: string
  finishedAt?: string
  score: number
  totalPoints: number
  percentage: number
  status: AttemptStatus
  userAnswers: UserAnswer[]
}

export interface UserAnswer {
  id: string
  attemptId: string
  questionId: string
  question: Question
  selectedAnswerIds: string[]
  isCorrect: boolean
  pointsEarned: number
  timeSpent: number
  answeredAt: string
}

export interface SubmitQuizAttemptRequest {
  answers: UserAnswerRequest[]
  startedAt: string
  finishedAt: string
}

export interface UserAnswerRequest {
  questionId: string
  selectedAnswerIds: string[]
  timeSpent: number
}

// Leaderboard types
export interface LeaderboardRequest {
  quizId?: string
  pageNumber?: number
  pageSize?: number
  timeframe?: LeaderboardTimeframe
}

export interface LeaderboardEntry {
  userId: string
  user: User
  score: number
  totalPoints: number
  percentage: number
  completedAt: string
  rank: number
  duration: string
  attemptId: string
}

export interface LeaderboardResponse {
  quizId?: string
  quiz?: Quiz
  entries: LeaderboardEntry[]
  totalCount: number
  pageNumber: number
  pageSize: number
  totalPages: number
  hasPreviousPage: boolean
  hasNextPage: boolean
  timeframe: LeaderboardTimeframe
}

export enum LeaderboardTimeframe {
  ALL_TIME = 0,
  TODAY = 1,
  THIS_WEEK = 2,
  THIS_MONTH = 3,
  THIS_YEAR = 4
}

// Enums
export enum QuizDifficulty {
  EASY = 1,
  MEDIUM = 2,
  HARD = 3
}

export enum QuestionType {
  MULTIPLE_CHOICE = 1,
  TRUE_FALSE = 2,
  MULTIPLE_SELECT = 3,
  SHORT_ANSWER = 4
}

export enum AttemptStatus {
  IN_PROGRESS = 1,
  COMPLETED = 2,
  ABANDONED = 3,
  TIME_OUT = 4
}

// API Response types
export interface ApiResponse<T> {
  data: T
  message: string
  success: boolean
}

export interface PaginatedResponse<T> {
  data: T[]
  totalCount: number
  pageNumber: number
  pageSize: number
  totalPages: number
  hasPreviousPage: boolean
  hasNextPage: boolean
}

// Form types
export interface QuizFilters {
  search?: string
  categoryId?: string
  difficulty?: QuizDifficulty
  sortBy?: 'title' | 'createdAt' | 'difficulty' | 'questionsCount'
  sortOrder?: 'asc' | 'desc'
  pageNumber?: number
  pageSize?: number
}

