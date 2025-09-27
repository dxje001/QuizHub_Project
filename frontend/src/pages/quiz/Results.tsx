import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useQuiz } from '@/hooks/useQuiz'
import { QuizAttempt } from '@/types'
import {
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  TrophyIcon,
  ChartBarIcon,
  HomeIcon,
  ArrowLeftIcon,
  CalendarIcon
} from '@heroicons/react/24/outline'
import { getDifficultyLabel } from '@/utils/difficulty'
import quizService from '@/services/quizService'
import ProgressChart from '@/components/ProgressChart'

const Results = () => {
  const { attemptId } = useParams<{ attemptId: string }>()
  const navigate = useNavigate()
  const { getAttemptDetails, loading } = useQuiz()

  const [attempt, setAttempt] = useState<QuizAttempt | null>(null)
  const [previousAttempts, setPreviousAttempts] = useState<QuizAttempt[]>([])
  const [loadingProgress, setLoadingProgress] = useState(false)

  useEffect(() => {
    loadResults()
  }, [attemptId])

  const loadResults = async () => {
    if (!attemptId) return

    const result = await getAttemptDetails(attemptId)
    if (result) {
      setAttempt(result)
      await loadProgressData(result.quizId)
    }
  }

  const loadProgressData = async (quizId: string) => {
    setLoadingProgress(true)
    try {
      // Get all user attempts to find attempts for this quiz
      const response = await quizService.getUserAttempts(1, 100) // Get more to find all attempts
      const quizAttempts = response.data
        .filter(a => a.quizId === quizId)
        .sort((a, b) => new Date(a.finishedAt || a.startedAt).getTime() - new Date(b.finishedAt || b.startedAt).getTime())

      setPreviousAttempts(quizAttempts)
    } catch (error) {
      console.error('Error loading progress data:', error)
    } finally {
      setLoadingProgress(false)
    }
  }

  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
  }

  const formatDuration = (startTime: string, endTime: string): string => {
    const start = new Date(startTime).getTime()
    const end = new Date(endTime).getTime()
    const durationSeconds = Math.floor((end - start) / 1000)
    return formatTime(durationSeconds)
  }

  const getScoreColor = (percentage: number): string => {
    if (percentage >= 80) return 'text-green-600'
    if (percentage >= 60) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getScoreGrade = (percentage: number): string => {
    if (percentage >= 90) return 'A'
    if (percentage >= 80) return 'B'
    if (percentage >= 70) return 'C'
    if (percentage >= 60) return 'D'
    return 'F'
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading results...</p>
        </div>
      </div>
    )
  }

  if (!attempt) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="text-center py-12">
          <p className="text-red-600">Results not found.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <div className="text-center">
          <div className="flex justify-center mb-4">
            <TrophyIcon className={`h-16 w-16 ${getScoreColor(attempt.percentage)}`} />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Quiz Completed!</h1>
          <h2 className="text-xl text-gray-600 mb-4">{attempt.quiz.title}</h2>

          {/* Score Display */}
          <div className="bg-gray-50 rounded-lg p-6 mb-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className={`text-4xl font-bold ${getScoreColor(attempt.percentage)}`}>
                  {attempt.percentage}%
                </div>
                <div className="text-gray-600">Overall Score</div>
                <div className={`text-2xl font-bold ${getScoreColor(attempt.percentage)} mt-1`}>
                  Grade: {getScoreGrade(attempt.percentage)}
                </div>
              </div>

              <div className="text-center">
                <div className="text-4xl font-bold text-gray-900">
                  {attempt.score}/{attempt.totalPoints}
                </div>
                <div className="text-gray-600">Points Earned</div>
              </div>

              <div className="text-center">
                <div className="text-4xl font-bold text-gray-900">
                  {formatDuration(attempt.startedAt, attempt.finishedAt || attempt.startedAt)}
                </div>
                <div className="text-gray-600">Time Taken</div>
              </div>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div className="flex items-center justify-center text-green-600">
              <CheckCircleIcon className="h-5 w-5 mr-2" />
              {attempt.userAnswers.filter(a => a.isCorrect).length} Correct
            </div>
            <div className="flex items-center justify-center text-red-600">
              <XCircleIcon className="h-5 w-5 mr-2" />
              {attempt.userAnswers.filter(a => !a.isCorrect).length} Incorrect
            </div>
            <div className="flex items-center justify-center text-gray-600">
              <ClockIcon className="h-5 w-5 mr-2" />
              Avg. {formatTime(attempt.userAnswers.reduce((acc, a) => acc + a.timeSpent, 0) / attempt.userAnswers.length / 1000)}
            </div>
            <div className="flex items-center justify-center text-gray-600">
              <ChartBarIcon className="h-5 w-5 mr-2" />
              {getDifficultyLabel(attempt.quiz.difficulty)}
            </div>
          </div>
        </div>
      </div>

      {/* Progress Tracking */}
      {previousAttempts.length > 1 && !loadingProgress && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <h3 className="text-xl font-bold text-gray-900 mb-6">Progress Tracking</h3>
          <div className="space-y-6">
            <div className="flex items-center justify-between text-sm text-gray-600 mb-4">
              <span>You have taken this quiz {previousAttempts.length} times</span>
              <span>
                Best Score: {Math.max(...previousAttempts.map(a => a.percentage))}%
              </span>
            </div>

            {/* Progress Chart */}
            <div className="mb-6">
              <ProgressChart attempts={previousAttempts} currentAttemptId={attemptId} />
            </div>

            <div className="space-y-3 mt-4">
              {previousAttempts.map((attempt, index) => {
                const isCurrentAttempt = attempt.id === attemptId
                const date = new Date(attempt.finishedAt || attempt.startedAt)

                return (
                  <div
                    key={attempt.id}
                    className={`flex items-center justify-between p-3 rounded-lg ${
                      isCurrentAttempt ? 'bg-primary-50 border border-primary-200' : 'bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center space-x-4">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                        isCurrentAttempt ? 'bg-primary-600 text-white' : 'bg-gray-400 text-white'
                      }`}>
                        {index + 1}
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">
                          Attempt {index + 1} {isCurrentAttempt && '(Current)'}
                        </div>
                        <div className="text-sm text-gray-600 flex items-center">
                          <CalendarIcon className="h-4 w-4 mr-1" />
                          {date.toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <div className={`text-lg font-bold ${
                          attempt.percentage >= 80 ? 'text-green-600' :
                          attempt.percentage >= 60 ? 'text-yellow-600' : 'text-red-600'
                        }`}>
                          {Math.round(attempt.percentage)}%
                        </div>
                        <div className="text-sm text-gray-600">
                          {attempt.score}/{attempt.totalPoints} pts
                        </div>
                      </div>

                      {!isCurrentAttempt && (
                        <Link
                          to={`/results/${attempt.id}`}
                          className="text-primary-600 hover:text-primary-800 text-sm font-medium"
                        >
                          View
                        </Link>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>

          </div>
        </div>
      )}

      {/* Detailed Results */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <h3 className="text-xl font-bold text-gray-900 mb-6">Question by Question Review</h3>

        <div className="space-y-6">
          {attempt.userAnswers.map((userAnswer, index) => (
            <div key={userAnswer.id} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center">
                  <span className="text-lg font-semibold text-gray-900 mr-3">
                    Question {index + 1}
                  </span>
                  {userAnswer.isCorrect ? (
                    <CheckCircleIcon className="h-6 w-6 text-green-600" />
                  ) : (
                    <XCircleIcon className="h-6 w-6 text-red-600" />
                  )}
                </div>
                <div className="text-right text-sm text-gray-600">
                  <div>{userAnswer.pointsEarned}/{userAnswer.question.points} points</div>
                  <div>{formatTime(userAnswer.timeSpent / 1000)} spent</div>
                </div>
              </div>

              <p className="text-gray-900 mb-4">{userAnswer.question.questionText}</p>

              {userAnswer.question.type === 4 ? ( // SHORT_ANSWER
                /* Fill in the Blank Display */
                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium text-gray-700">Your Answer:</label>
                    <div className={`mt-1 p-3 rounded border ${
                      userAnswer.isCorrect
                        ? 'bg-green-50 border-green-200 text-green-800'
                        : 'bg-red-50 border-red-200 text-red-800'
                    }`}>
                      {/* We need to reconstruct the user's text answer since it's not stored directly */}
                      {userAnswer.isCorrect ? userAnswer.question.answers[0]?.answerText : '(No answer provided)'}
                    </div>
                  </div>

                  {!userAnswer.isCorrect && (
                    <div>
                      <label className="text-sm font-medium text-gray-700">Correct Answer:</label>
                      <div className="mt-1 p-3 rounded border bg-blue-50 border-blue-200 text-blue-800">
                        {userAnswer.question.answers[0]?.answerText}
                      </div>
                    </div>
                  )}

                  {userAnswer.isCorrect && (
                    <div className="text-sm text-green-600 font-medium">
                      ✓ Correct! Your answer matches exactly.
                    </div>
                  )}
                </div>
              ) : (
                /* Multiple Choice, Multiple Select, True/False Display */
                <div className="space-y-2">
                  {userAnswer.question.answers.map((answer) => {
                    const isSelected = userAnswer.selectedAnswerIds.includes(answer.id)
                    const isCorrect = answer.isCorrect

                    let className = "p-3 rounded border "
                    if (isSelected && isCorrect) {
                      className += "bg-green-50 border-green-200 text-green-800"
                    } else if (isSelected && !isCorrect) {
                      className += "bg-red-50 border-red-200 text-red-800"
                    } else if (!isSelected && isCorrect) {
                      className += "bg-blue-50 border-blue-200 text-blue-800"
                    } else {
                      className += "bg-gray-50 border-gray-200 text-gray-600"
                    }

                    return (
                      <div key={answer.id} className={className}>
                        <div className="flex items-center justify-between">
                          <span>{answer.answerText}</span>
                          <div className="flex items-center space-x-2">
                            {isSelected && <span className="text-xs font-medium">Your choice</span>}
                            {isCorrect && <span className="text-xs font-medium">Correct</span>}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Navigation */}
      <div className="mb-6">
        <Link
          to="/my-results"
          className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
        >
          <ArrowLeftIcon className="h-5 w-5 mr-2" />
          Back to My Results
        </Link>
      </div>

      {/* Actions */}
      <div className="flex flex-wrap justify-center gap-4">
        <Link
          to="/my-results"
          className="flex items-center px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
        >
          <ChartBarIcon className="h-5 w-5 mr-2" />
          View All Results
        </Link>
        <Link
          to="/dashboard"
          className="flex items-center px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
        >
          <HomeIcon className="h-5 w-5 mr-2" />
          Dashboard
        </Link>
        <Link
          to={`/quizzes/${attempt.quizId}`}
          className="flex items-center px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
        >
          View Quiz Details
        </Link>
        <button
          onClick={() => navigate(`/quizzes/${attempt.quizId}/take`)}
          className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center"
        >
          <TrophyIcon className="h-5 w-5 mr-2" />
          Retake Quiz
        </button>
      </div>
    </div>
  )
}

export default Results