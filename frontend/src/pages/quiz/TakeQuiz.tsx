import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate, Navigate } from 'react-router-dom'
import { useQuiz } from '@/hooks/useQuiz'
import { useAuthStore } from '@/stores/authStore'
import { QuizResponse, QuestionResponse, QuestionType, SubmitQuizAttemptRequest } from '@/types'
import {
  ClockIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  CheckIcon,
  FlagIcon,
  SparklesIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Spinner } from '@/components/ui/spinner'

interface QuizAnswer {
  questionId: string
  selectedAnswerIds: string[]
  textAnswer?: string
  timeSpent: number
}

const TakeQuiz = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const { getQuizForTaking, submitQuizAttempt, loading } = useQuiz()

  // Check if user is admin - redirect to quiz detail instead
  if (user?.roles?.includes('Admin')) {
    return <Navigate to={`/quizzes/${id}`} replace />
  }

  const [quiz, setQuiz] = useState<QuizResponse | null>(null)
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [answers, setAnswers] = useState<QuizAnswer[]>([])
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null)
  const [questionStartTime, setQuestionStartTime] = useState<number>(Date.now())
  const [quizStartTime, setQuizStartTime] = useState<number>(Date.now())
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    loadQuiz()
  }, [id])

  useEffect(() => {
    if (quiz?.timeLimit) {
      setTimeRemaining(quiz.timeLimit * 60) // Convert minutes to seconds
    }
  }, [quiz])

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null
    if (timeRemaining !== null && timeRemaining > 0) {
      interval = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev === null || prev <= 1) {
            handleSubmitQuiz()
            return 0
          }
          return prev - 1
        })
      }, 1000)
    }
    return () => {
      if (interval) clearInterval(interval)
    }
  }, [timeRemaining])

  const loadQuiz = async () => {
    if (!id) return

    const result = await getQuizForTaking(id)
    if (result) {
      setQuiz(result)
      setQuizStartTime(Date.now())
      setQuestionStartTime(Date.now())

      // Initialize answers array
      const initialAnswers: QuizAnswer[] = result.questions?.map(q => ({
        questionId: q.id,
        selectedAnswerIds: [],
        textAnswer: q.type === QuestionType.SHORT_ANSWER ? '' : undefined,
        timeSpent: 0
      })) || []
      setAnswers(initialAnswers)
    }
  }

  const getCurrentQuestion = (): QuestionResponse | null => {
    if (!quiz?.questions || currentQuestionIndex >= quiz.questions.length) {
      return null
    }
    return quiz.questions[currentQuestionIndex]
  }

  const getCurrentAnswer = (): QuizAnswer | undefined => {
    const currentQuestion = getCurrentQuestion()
    if (!currentQuestion) return undefined
    return answers.find(a => a.questionId === currentQuestion.id)
  }

  const updateAnswer = useCallback((questionId: string, selectedAnswerIds: string[]) => {
    setAnswers(prev => prev.map(answer =>
      answer.questionId === questionId
        ? { ...answer, selectedAnswerIds }
        : answer
    ))
  }, [])

  const handleAnswerSelect = (answerId: string) => {
    const currentQuestion = getCurrentQuestion()
    if (!currentQuestion) return

    const currentAnswer = getCurrentAnswer()
    if (!currentAnswer) return

    if (currentQuestion.type === QuestionType.MULTIPLE_CHOICE || currentQuestion.type === QuestionType.TRUE_FALSE) {
      updateAnswer(currentQuestion.id, [answerId])
    } else if (currentQuestion.type === QuestionType.MULTIPLE_SELECT) {
      const newSelectedIds = currentAnswer.selectedAnswerIds.includes(answerId)
        ? currentAnswer.selectedAnswerIds.filter(id => id !== answerId)
        : [...currentAnswer.selectedAnswerIds, answerId]
      updateAnswer(currentQuestion.id, newSelectedIds)
    }
  }

  const handleTextAnswerChange = (text: string) => {
    const currentQuestion = getCurrentQuestion()
    if (!currentQuestion) return

    setAnswers(prev => prev.map(answer =>
      answer.questionId === currentQuestion.id
        ? { ...answer, textAnswer: text }
        : answer
    ))
  }

  const updateQuestionTime = useCallback(() => {
    const currentQuestion = getCurrentQuestion()
    if (!currentQuestion) return

    const timeSpent = Date.now() - questionStartTime
    setAnswers(prev => prev.map(answer =>
      answer.questionId === currentQuestion.id
        ? { ...answer, timeSpent: answer.timeSpent + timeSpent }
        : answer
    ))
  }, [currentQuestionIndex, questionStartTime])

  const goToQuestion = (index: number) => {
    if (index < 0 || !quiz?.questions || index >= quiz.questions.length) return

    updateQuestionTime()
    setCurrentQuestionIndex(index)
    setQuestionStartTime(Date.now())
  }

  const goToPrevious = () => goToQuestion(currentQuestionIndex - 1)
  const goToNext = () => goToQuestion(currentQuestionIndex + 1)

  const handleSubmitQuiz = async () => {
    if (isSubmitting || !quiz || !id) return

    setIsSubmitting(true)
    updateQuestionTime()

    try {
      const submitData: SubmitQuizAttemptRequest = {
        answers: answers.map(answer => {
          const question = quiz.questions?.find(q => q.id === answer.questionId)

          if (question?.type === QuestionType.SHORT_ANSWER) {
            // For text answers, we need to match against the correct answer
            const correctAnswer = question.answers[0] // Assuming first answer is the correct one
            const selectedIds = answer.textAnswer?.trim() === correctAnswer?.answerText?.trim()
              ? [correctAnswer.id]
              : []

            return {
              questionId: answer.questionId,
              selectedAnswerIds: selectedIds,
              timeSpent: answer.timeSpent
            }
          }

          return {
            questionId: answer.questionId,
            selectedAnswerIds: answer.selectedAnswerIds,
            timeSpent: answer.timeSpent
          }
        }),
        startedAt: new Date(quizStartTime).toISOString(),
        finishedAt: new Date().toISOString()
      }

      const result = await submitQuizAttempt(id, submitData)
      if (result) {
        // Navigate to results page with the actual attempt ID
        navigate(`/results/${result.id}`)
      } else {
        setIsSubmitting(false)
      }
    } catch (error) {
      console.error('Error submitting quiz:', error)
      setIsSubmitting(false)
    }
  }

  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
  }

  const getQuestionTypeLabel = (type: QuestionType): string => {
    switch (type) {
      case QuestionType.MULTIPLE_CHOICE:
        return 'Single Choice'
      case QuestionType.TRUE_FALSE:
        return 'True/False'
      case QuestionType.MULTIPLE_SELECT:
        return 'Multiple Choice'
      case QuestionType.SHORT_ANSWER:
        return 'Short Answer'
      default:
        return 'Unknown'
    }
  }

  const getQuestionTypeIcon = (type: QuestionType) => {
    switch (type) {
      case QuestionType.MULTIPLE_SELECT:
        return <CheckIcon className="h-4 w-4" />
      case QuestionType.SHORT_ANSWER:
        return <SparklesIcon className="h-4 w-4" />
      default:
        return null
    }
  }

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-5rem)] flex flex-col items-center justify-center">
        <Spinner size="lg" />
        <p className="mt-4 text-secondary-600 text-lg">Loading quiz...</p>
      </div>
    )
  }

  if (!quiz) {
    return (
      <div className="min-h-[calc(100vh-5rem)] flex items-center justify-center">
        <div className="text-center">
          <div className="inline-flex p-6 rounded-full bg-danger-100 mb-6">
            <ExclamationTriangleIcon className="h-16 w-16 text-danger-600" />
          </div>
          <h2 className="text-2xl font-bold text-secondary-900 mb-2">Quiz Not Found</h2>
          <p className="text-secondary-600 mb-8">The quiz failed to load or doesn't exist.</p>
          <Button variant="primary" onClick={() => navigate('/quizzes')}>
            Back to Quizzes
          </Button>
        </div>
      </div>
    )
  }

  const currentQuestion = getCurrentQuestion()
  const currentAnswer = getCurrentAnswer()
  const progress = quiz.questions ? ((currentQuestionIndex + 1) / quiz.questions.length) * 100 : 0
  const answeredCount = answers.filter(a =>
    a.selectedAnswerIds.length > 0 || (a.textAnswer?.trim() || '').length > 0
  ).length
  const isTimeWarning = timeRemaining !== null && timeRemaining < 300 // Less than 5 minutes

  return (
    <div className="min-h-[calc(100vh-5rem)] bg-gradient-to-br from-secondary-50 via-white to-primary-50 -m-8 p-8">
      <div className="max-w-5xl mx-auto space-y-4">
        {/* Compact Header Bar */}
        <div className="card-premium p-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4 flex-1 min-w-0">
              <div className="text-3xl flex-shrink-0">{quiz.category.icon}</div>
              <div className="min-w-0 flex-1">
                <h1 className="text-xl font-bold text-secondary-900 truncate">{quiz.title}</h1>
                <div className="flex items-center gap-2 text-sm text-secondary-600">
                  <span>Question {currentQuestionIndex + 1} of {quiz.questions?.length || 0}</span>
                  <span className="text-secondary-400">•</span>
                  <span>{answeredCount} answered</span>
                </div>
              </div>
            </div>

            {/* Timer */}
            {timeRemaining !== null && (
              <div className={`flex items-center gap-2 px-4 py-2 rounded-xl font-semibold text-lg ${
                isTimeWarning
                  ? 'bg-danger-100 border-2 border-danger-300 text-danger-700 animate-pulse'
                  : 'bg-accent-50 border border-accent-200 text-accent-700'
              }`}>
                <ClockIcon className="h-5 w-5" />
                <span>{formatTime(timeRemaining)}</span>
              </div>
            )}
          </div>

          {/* Progress Bar */}
          <div className="mt-4 relative">
            <div className="w-full h-3 bg-secondary-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-primary-600 to-accent-600 transition-all duration-500 ease-out rounded-full shadow-soft"
                style={{ width: `${progress}%` }}
              />
            </div>
            <div className="absolute right-0 -top-6 text-xs font-semibold text-primary-600">
              {Math.round(progress)}%
            </div>
          </div>
        </div>

        {/* Question Card */}
        {currentQuestion && (
          <div className="card-premium p-8 animate-fade-in-up">
            {/* Question Header */}
            <div className="flex items-start justify-between mb-6">
              <div className="flex items-start gap-4">
                <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-primary-600 to-accent-600 text-white text-xl font-bold shadow-soft flex-shrink-0">
                  {currentQuestionIndex + 1}
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="primary" size="sm" className="gap-1">
                      {getQuestionTypeIcon(currentQuestion.type)}
                      {getQuestionTypeLabel(currentQuestion.type)}
                    </Badge>
                    <Badge variant="accent" size="sm">
                      {currentQuestion.points} {currentQuestion.points !== 1 ? 'points' : 'point'}
                    </Badge>
                  </div>
                </div>
              </div>
            </div>

            {/* Question Text */}
            <h2 className="text-2xl font-bold text-secondary-900 mb-8 leading-relaxed">
              {currentQuestion.questionText}
            </h2>

            {/* Answer Options */}
            {currentQuestion.type === QuestionType.SHORT_ANSWER ? (
              <div className="space-y-4">
                <div className="relative">
                  <input
                    type="text"
                    value={currentAnswer?.textAnswer || ''}
                    onChange={(e) => handleTextAnswerChange(e.target.value)}
                    className="input-field text-lg py-4 px-5"
                    placeholder="Type your answer here..."
                    autoFocus
                  />
                </div>
                <div className="flex items-start gap-2 p-4 bg-accent-50 border border-accent-200 rounded-xl">
                  <SparklesIcon className="h-5 w-5 text-accent-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-accent-800">
                    Enter your answer carefully. Spelling and capitalization may matter.
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {currentQuestion.answers.map((answer, index) => {
                  const isSelected = currentAnswer?.selectedAnswerIds.includes(answer.id) || false
                  const isMultiSelect = currentQuestion.type === QuestionType.MULTIPLE_SELECT
                  const isTrueFalse = currentQuestion.type === QuestionType.TRUE_FALSE

                  return (
                    <div
                      key={answer.id}
                      onClick={() => handleAnswerSelect(answer.id)}
                      className={`group flex items-center gap-4 p-5 rounded-xl border-2 cursor-pointer transition-all duration-200 ${
                        isSelected
                          ? 'bg-gradient-to-r from-primary-50 to-accent-50 border-primary-400 shadow-soft scale-[1.01]'
                          : 'bg-white/80 border-secondary-200 hover:border-primary-300 hover:bg-secondary-50 hover:shadow-soft'
                      }`}
                    >
                      {/* Selection Indicator */}
                      <div className="relative flex items-center justify-center flex-shrink-0">
                        <div className={`w-6 h-6 ${isMultiSelect ? 'rounded-lg' : 'rounded-full'} border-2 flex items-center justify-center transition-all ${
                          isSelected
                            ? 'border-primary-600 bg-primary-600 shadow-soft'
                            : 'border-secondary-300 group-hover:border-primary-400 bg-white'
                        }`}>
                          {isSelected && (
                            <CheckIcon className="h-4 w-4 text-white" strokeWidth={3} />
                          )}
                        </div>
                      </div>

                      {/* Answer Letter/Number */}
                      <div className={`flex items-center justify-center w-8 h-8 rounded-lg font-bold text-sm flex-shrink-0 ${
                        isSelected
                          ? 'bg-primary-600 text-white'
                          : 'bg-secondary-100 text-secondary-600 group-hover:bg-primary-100 group-hover:text-primary-700'
                      }`}>
                        {isTrueFalse
                          ? (index === 0 ? 'T' : 'F')
                          : String.fromCharCode(65 + index)
                        }
                      </div>

                      {/* Answer Text */}
                      <span className={`flex-1 text-lg ${
                        isSelected
                          ? 'text-secondary-900 font-semibold'
                          : 'text-secondary-700 group-hover:text-secondary-900'
                      }`}>
                        {answer.answerText}
                      </span>
                    </div>
                  )
                })}

                {/* Helper Text */}
                {currentQuestion.type === QuestionType.MULTIPLE_SELECT && (
                  <div className="flex items-start gap-2 p-4 bg-primary-50 border border-primary-200 rounded-xl mt-4">
                    <CheckIcon className="h-5 w-5 text-primary-600 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-primary-800">
                      Multiple answers are correct. Select all that apply.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Navigation Footer */}
        <div className="card-premium p-4">
          <div className="flex items-center justify-between gap-4">
            {/* Previous Button */}
            <Button
              variant="secondary"
              size="md"
              onClick={goToPrevious}
              disabled={currentQuestionIndex === 0}
              className="gap-2"
            >
              <ChevronLeftIcon className="h-5 w-5" />
              Previous
            </Button>

            {/* Question Dots Navigation */}
            <div className="flex flex-wrap justify-center gap-2 max-w-md">
              {quiz.questions?.map((question, index) => {
                const answer = answers[index]
                const isAnswered = question.type === QuestionType.SHORT_ANSWER
                  ? (answer?.textAnswer?.trim() || '').length > 0
                  : (answer?.selectedAnswerIds.length || 0) > 0

                return (
                  <button
                    key={index}
                    onClick={() => goToQuestion(index)}
                    className={`w-10 h-10 rounded-xl text-sm font-bold transition-all duration-200 ${
                      index === currentQuestionIndex
                        ? 'bg-gradient-to-br from-primary-600 to-accent-600 text-white shadow-soft scale-110'
                        : isAnswered
                        ? 'bg-accent-100 text-accent-700 border-2 border-accent-300 hover:scale-105'
                        : 'bg-secondary-100 text-secondary-600 border border-secondary-300 hover:bg-secondary-200 hover:scale-105'
                    }`}
                    title={`Question ${index + 1}${isAnswered ? ' (answered)' : ''}`}
                  >
                    {index + 1}
                  </button>
                )
              })}
            </div>

            {/* Next/Submit Button */}
            {currentQuestionIndex === (quiz.questions?.length || 0) - 1 ? (
              <Button
                variant="accent"
                size="md"
                onClick={handleSubmitQuiz}
                disabled={isSubmitting}
                isLoading={isSubmitting}
                className="gap-2 min-w-[140px]"
              >
                <FlagIcon className="h-5 w-5" />
                Submit Quiz
              </Button>
            ) : (
              <Button
                variant="primary"
                size="md"
                onClick={goToNext}
                className="gap-2 min-w-[140px]"
              >
                Next
                <ChevronRightIcon className="h-5 w-5" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default TakeQuiz
