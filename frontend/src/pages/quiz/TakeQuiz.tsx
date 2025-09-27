import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate, Navigate } from 'react-router-dom'
import { useQuiz } from '@/hooks/useQuiz'
import { useAuthStore } from '@/stores/authStore'
import { QuizResponse, QuestionResponse, QuestionType, SubmitQuizAttemptRequest } from '@/types'
import { ClockIcon, ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline'

interface QuizAnswer {
  questionId: string
  selectedAnswerIds: string[]
  textAnswer?: string // For fill-in-the-blank questions
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
        return 'Single Correct Answer'
      case QuestionType.TRUE_FALSE:
        return 'True/False'
      case QuestionType.MULTIPLE_SELECT:
        return 'Multiple Correct Answers'
      case QuestionType.SHORT_ANSWER:
        return 'Fill in the Blank'
      default:
        return 'Unknown'
    }
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading quiz...</p>
        </div>
      </div>
    )
  }

  if (!quiz) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="text-center py-12">
          <p className="text-red-600">Quiz not found or failed to load.</p>
        </div>
      </div>
    )
  }

  const currentQuestion = getCurrentQuestion()
  const currentAnswer = getCurrentAnswer()
  const progress = quiz.questions ? ((currentQuestionIndex + 1) / quiz.questions.length) * 100 : 0

  return (
    <div className="max-w-4xl mx-auto">
      {/* Quiz Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{quiz.title}</h1>
            <p className="text-gray-600 mt-1">{quiz.description}</p>
          </div>
          {timeRemaining !== null && (
            <div className="flex items-center text-lg font-semibold">
              <ClockIcon className="h-5 w-5 mr-2 text-gray-500" />
              <span className={timeRemaining < 300 ? 'text-red-600' : 'text-gray-900'}>
                {formatTime(timeRemaining)}
              </span>
            </div>
          )}
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-primary-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          ></div>
        </div>
        <p className="text-sm text-gray-600 mt-2">
          Question {currentQuestionIndex + 1} of {quiz.questions?.length || 0}
        </p>
      </div>

      {/* Question Content */}
      {currentQuestion && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-500">
                {getQuestionTypeLabel(currentQuestion.type)}
              </span>
              <span className="text-sm text-gray-500">
                {currentQuestion.points} point{currentQuestion.points !== 1 ? 's' : ''}
              </span>
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              {currentQuestion.questionText}
            </h2>
          </div>

          {/* Answer Options */}
          {currentQuestion.type === QuestionType.SHORT_ANSWER ? (
            /* Fill in the Blank */
            <div>
              <input
                type="text"
                value={currentAnswer?.textAnswer || ''}
                onChange={(e) => handleTextAnswerChange(e.target.value)}
                className="w-full p-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                placeholder="Type your answer here..."
              />
              <p className="text-sm text-gray-500 mt-2">
                Enter your answer exactly as you think it should be (case-sensitive).
              </p>
            </div>
          ) : (
            /* Multiple Choice, Multiple Select, True/False */
            <div>
              <div className="space-y-3">
                {currentQuestion.answers.map((answer) => {
                  const isSelected = currentAnswer?.selectedAnswerIds.includes(answer.id) || false
                  const isMultiSelect = currentQuestion.type === QuestionType.MULTIPLE_SELECT

                  return (
                    <div
                      key={answer.id}
                      onClick={() => handleAnswerSelect(answer.id)}
                      className={`flex items-center p-4 border rounded-lg cursor-pointer transition-all duration-200 ${
                        isSelected
                          ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200'
                          : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      <div className={`h-4 w-4 ${isMultiSelect ? 'rounded' : 'rounded-full'} border-2 flex items-center justify-center ${
                        isSelected
                          ? 'border-blue-500 bg-blue-500'
                          : 'border-gray-300'
                      }`}>
                        {isSelected && (
                          <div className={`h-2 w-2 ${isMultiSelect ? 'rounded-sm' : 'rounded-full'} bg-white`}></div>
                        )}
                      </div>
                      <span className={`ml-3 ${isSelected ? 'text-blue-900 font-medium' : 'text-gray-900'}`}>
                        {answer.answerText}
                      </span>
                    </div>
                  )
                })}
              </div>

              {/* Helper text for different question types */}
              {currentQuestion.type === QuestionType.MULTIPLE_SELECT && (
                <p className="text-sm text-gray-500 mt-3">
                  Select all answers that apply.
                </p>
              )}
              {currentQuestion.type === QuestionType.MULTIPLE_CHOICE && (
                <p className="text-sm text-gray-500 mt-3">
                  Select one answer.
                </p>
              )}
            </div>
          )}
        </div>
      )}

      {/* Navigation */}
      <div className="flex justify-between items-center">
        <button
          onClick={goToPrevious}
          disabled={currentQuestionIndex === 0}
          className="flex items-center px-4 py-2 text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <ChevronLeftIcon className="h-4 w-4 mr-2" />
          Previous
        </button>

        <div className="flex space-x-2">
          {quiz.questions?.map((question, index) => {
            const answer = answers[index]
            const isAnswered = question.type === QuestionType.SHORT_ANSWER
              ? (answer?.textAnswer?.trim() || '').length > 0
              : (answer?.selectedAnswerIds.length || 0) > 0

            return (
              <button
                key={index}
                onClick={() => goToQuestion(index)}
                className={`w-8 h-8 rounded-full text-sm font-medium ${
                  index === currentQuestionIndex
                    ? 'bg-primary-600 text-white'
                    : isAnswered
                    ? 'bg-green-100 text-green-800 border border-green-300'
                    : 'bg-gray-100 text-gray-600 border border-gray-300'
                }`}
              >
                {index + 1}
              </button>
            )
          })}
        </div>

        {currentQuestionIndex === (quiz.questions?.length || 0) - 1 ? (
          <button
            onClick={handleSubmitQuiz}
            disabled={isSubmitting}
            className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Submitting...' : 'Submit Quiz'}
          </button>
        ) : (
          <button
            onClick={goToNext}
            className="flex items-center px-4 py-2 text-white bg-primary-600 rounded-lg hover:bg-primary-700"
          >
            Next
            <ChevronRightIcon className="h-4 w-4 ml-2" />
          </button>
        )}
      </div>
    </div>
  )
}

export default TakeQuiz