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
  CalendarIcon,
  SparklesIcon,
  FireIcon,
  ArrowPathIcon,
  EyeIcon,
  CheckIcon,
  XMarkIcon
} from '@heroicons/react/24/outline'
import { getDifficultyLabel } from '@/utils/difficulty'
import quizService from '@/services/quizService'
import ProgressChart from '@/components/ProgressChart'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Spinner } from '@/components/ui/spinner'

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
      const response = await quizService.getUserAttempts(1, 100)
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
    if (percentage >= 80) return 'text-accent-600'
    if (percentage >= 60) return 'text-warning-600'
    return 'text-danger-600'
  }

  const getScoreBgColor = (percentage: number): string => {
    if (percentage >= 80) return 'bg-accent-50 border-accent-200'
    if (percentage >= 60) return 'bg-warning-50 border-warning-200'
    return 'bg-danger-50 border-danger-200'
  }

  const getScoreGradient = (percentage: number): string => {
    if (percentage >= 80) return 'from-accent-600 to-accent-500'
    if (percentage >= 60) return 'from-warning-600 to-warning-500'
    return 'from-danger-600 to-danger-500'
  }

  const getScoreGrade = (percentage: number): string => {
    if (percentage >= 90) return 'A'
    if (percentage >= 80) return 'B'
    if (percentage >= 70) return 'C'
    if (percentage >= 60) return 'D'
    return 'F'
  }

  const getPerformanceMessage = (percentage: number): string => {
    if (percentage >= 90) return 'Outstanding Performance!'
    if (percentage >= 80) return 'Great Job!'
    if (percentage >= 70) return 'Good Work!'
    if (percentage >= 60) return 'Not Bad!'
    return 'Keep Practicing!'
  }

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-5rem)] flex flex-col items-center justify-center">
        <Spinner size="lg" />
        <p className="mt-4 text-secondary-600 text-lg">Loading results...</p>
      </div>
    )
  }

  if (!attempt) {
    return (
      <div className="min-h-[calc(100vh-5rem)] flex items-center justify-center">
        <div className="text-center">
          <div className="inline-flex p-6 rounded-full bg-danger-100 mb-6">
            <XCircleIcon className="h-16 w-16 text-danger-600" />
          </div>
          <h2 className="text-2xl font-bold text-secondary-900 mb-2">Results Not Found</h2>
          <p className="text-secondary-600 mb-8">We couldn't find the results you're looking for.</p>
          <Button variant="primary" onClick={() => navigate('/my-results')}>
            View All Results
          </Button>
        </div>
      </div>
    )
  }

  const correctAnswers = attempt.userAnswers.filter(a => a.isCorrect).length
  const totalQuestions = attempt.userAnswers.length

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Hero Section - Big Score Reveal */}
      <div className="relative overflow-hidden">
        <div className={`card-premium p-12 text-center ${getScoreBgColor(attempt.percentage)} border-2`}>
          {/* Confetti/Celebration Effect for High Scores */}
          {attempt.percentage >= 80 && (
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              <div className="absolute top-0 left-1/4 w-2 h-2 bg-accent-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
              <div className="absolute top-0 left-1/2 w-2 h-2 bg-primary-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
              <div className="absolute top-0 right-1/4 w-2 h-2 bg-warning-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
            </div>
          )}

          {/* Trophy Icon */}
          <div className="relative inline-flex mb-6">
            <div className={`p-6 rounded-2xl bg-gradient-to-br ${getScoreGradient(attempt.percentage)} shadow-glow animate-scale-in`}>
              <TrophyIcon className="h-20 w-20 text-white" strokeWidth={2} />
            </div>
            {attempt.percentage >= 80 && (
              <div className="absolute -top-2 -right-2 animate-bounce-subtle">
                <SparklesIcon className="h-8 w-8 text-accent-500" />
              </div>
            )}
          </div>

          <h1 className="text-4xl md:text-5xl font-bold text-secondary-900 mb-2">
            {getPerformanceMessage(attempt.percentage)}
          </h1>
          <p className="text-xl text-secondary-600 mb-8">{attempt.quiz.title}</p>

          {/* Large Score Display */}
          <div className="inline-flex items-center justify-center gap-4 mb-6">
            <div className={`text-7xl md:text-8xl font-bold ${getScoreColor(attempt.percentage)} animate-scale-in`}>
              {Math.round(attempt.percentage)}%
            </div>
            <div className={`text-5xl font-bold ${getScoreColor(attempt.percentage)} px-6 py-3 rounded-2xl border-4 ${getScoreBgColor(attempt.percentage)}`}>
              {getScoreGrade(attempt.percentage)}
            </div>
          </div>

          {/* Quick Stats Row */}
          <div className="flex items-center justify-center gap-8 text-secondary-700 flex-wrap">
            <div className="flex items-center gap-2">
              <CheckIcon className="h-6 w-6 text-accent-600" />
              <span className="text-lg font-semibold">{correctAnswers}/{totalQuestions} Correct</span>
            </div>
            <div className="flex items-center gap-2">
              <ClockIcon className="h-6 w-6 text-primary-600" />
              <span className="text-lg font-semibold">{formatDuration(attempt.startedAt, attempt.finishedAt || attempt.startedAt)}</span>
            </div>
            <div className="flex items-center gap-2">
              <TrophyIcon className="h-6 w-6 text-warning-600" />
              <span className="text-lg font-semibold">{attempt.score}/{attempt.totalPoints} Points</span>
            </div>
          </div>
        </div>
      </div>

      {/* Detailed Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card-premium p-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 rounded-xl bg-gradient-to-br from-accent-600 to-accent-500 shadow-soft">
              <CheckCircleIcon className="h-6 w-6 text-white" />
            </div>
            <div>
              <div className="text-sm text-secondary-600">Correct Answers</div>
              <div className="text-3xl font-bold text-secondary-900">{correctAnswers}</div>
            </div>
          </div>
          <div className="w-full bg-secondary-200 rounded-full h-2">
            <div
              className="h-2 bg-gradient-to-r from-accent-600 to-accent-500 rounded-full transition-all duration-500"
              style={{ width: `${(correctAnswers / totalQuestions) * 100}%` }}
            />
          </div>
        </div>

        <div className="card-premium p-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 rounded-xl bg-gradient-to-br from-danger-600 to-danger-500 shadow-soft">
              <XCircleIcon className="h-6 w-6 text-white" />
            </div>
            <div>
              <div className="text-sm text-secondary-600">Incorrect Answers</div>
              <div className="text-3xl font-bold text-secondary-900">{totalQuestions - correctAnswers}</div>
            </div>
          </div>
          <div className="w-full bg-secondary-200 rounded-full h-2">
            <div
              className="h-2 bg-gradient-to-r from-danger-600 to-danger-500 rounded-full transition-all duration-500"
              style={{ width: `${((totalQuestions - correctAnswers) / totalQuestions) * 100}%` }}
            />
          </div>
        </div>

        <div className="card-premium p-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 rounded-xl bg-gradient-to-br from-primary-600 to-primary-500 shadow-soft">
              <ClockIcon className="h-6 w-6 text-white" />
            </div>
            <div>
              <div className="text-sm text-secondary-600">Avg. Time/Question</div>
              <div className="text-3xl font-bold text-secondary-900">
                {formatTime(attempt.userAnswers.reduce((acc, a) => acc + a.timeSpent, 0) / attempt.userAnswers.length / 1000)}
              </div>
            </div>
          </div>
          <Badge variant="secondary" className="mt-2">
            {getDifficultyLabel(attempt.quiz.difficulty)} Difficulty
          </Badge>
        </div>
      </div>

      {/* Progress Tracking */}
      {previousAttempts.length > 1 && !loadingProgress && (
        <div className="card-premium p-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-gradient-to-br from-primary-600 to-accent-600 shadow-soft">
                <ChartBarIcon className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-secondary-900">Progress Tracking</h3>
                <p className="text-secondary-600">You've taken this quiz {previousAttempts.length} times</p>
              </div>
            </div>
            <Badge variant="primary" size="lg" className="gap-2">
              <FireIcon className="h-4 w-4" />
              Best: {Math.max(...previousAttempts.map(a => a.percentage))}%
            </Badge>
          </div>

          {/* Progress Chart */}
          <div className="mb-6">
            <ProgressChart attempts={previousAttempts} currentAttemptId={attemptId} />
          </div>

          {/* Attempts History */}
          <div className="space-y-3 mt-6">
            {previousAttempts.slice().reverse().slice(0, 5).map((att, index) => {
              const isCurrentAttempt = att.id === attemptId
              const date = new Date(att.finishedAt || att.startedAt)
              const actualIndex = previousAttempts.length - index

              return (
                <div
                  key={att.id}
                  className={`flex items-center justify-between p-4 rounded-xl border-2 transition-all ${
                    isCurrentAttempt
                      ? 'bg-gradient-to-r from-primary-50 to-accent-50 border-primary-300 shadow-soft'
                      : 'bg-white/80 border-secondary-200 hover:border-primary-200 hover:shadow-soft'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className={`flex items-center justify-center w-12 h-12 rounded-xl font-bold text-lg ${
                      isCurrentAttempt
                        ? 'bg-gradient-to-br from-primary-600 to-accent-600 text-white shadow-soft'
                        : 'bg-secondary-100 text-secondary-600'
                    }`}>
                      {actualIndex}
                    </div>
                    <div>
                      <div className="font-semibold text-secondary-900 flex items-center gap-2">
                        Attempt {actualIndex}
                        {isCurrentAttempt && (
                          <Badge variant="primary" size="sm">Current</Badge>
                        )}
                      </div>
                      <div className="text-sm text-secondary-600 flex items-center gap-1">
                        <CalendarIcon className="h-4 w-4" />
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

                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className={`text-2xl font-bold ${
                        att.percentage >= 80 ? 'text-accent-600' :
                        att.percentage >= 60 ? 'text-warning-600' : 'text-danger-600'
                      }`}>
                        {Math.round(att.percentage)}%
                      </div>
                      <div className="text-sm text-secondary-600">
                        {att.score}/{att.totalPoints} pts
                      </div>
                    </div>

                    {!isCurrentAttempt && (
                      <Link to={`/results/${att.id}`}>
                        <Button variant="secondary" size="sm" className="gap-2">
                          <EyeIcon className="h-4 w-4" />
                          View
                        </Button>
                      </Link>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Question Review */}
      <div className="card-premium p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 rounded-xl bg-gradient-to-br from-secondary-700 to-secondary-600 shadow-soft">
            <CheckCircleIcon className="h-6 w-6 text-white" />
          </div>
          <div>
            <h3 className="text-2xl font-bold text-secondary-900">Question by Question Review</h3>
            <p className="text-secondary-600">Detailed breakdown of your answers</p>
          </div>
        </div>

        <div className="space-y-5">
          {attempt.userAnswers.map((userAnswer, index) => (
            <div
              key={userAnswer.id}
              className={`card-interactive p-6 border-2 ${
                userAnswer.isCorrect
                  ? 'bg-accent-50/50 border-accent-200'
                  : 'bg-danger-50/50 border-danger-200'
              }`}
            >
              {/* Question Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={`flex items-center justify-center w-10 h-10 rounded-xl font-bold text-white shadow-soft ${
                    userAnswer.isCorrect
                      ? 'bg-gradient-to-br from-accent-600 to-accent-500'
                      : 'bg-gradient-to-br from-danger-600 to-danger-500'
                  }`}>
                    {index + 1}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      {userAnswer.isCorrect ? (
                        <CheckCircleIcon className="h-6 w-6 text-accent-600" />
                      ) : (
                        <XCircleIcon className="h-6 w-6 text-danger-600" />
                      )}
                      <span className={`font-bold ${
                        userAnswer.isCorrect ? 'text-accent-700' : 'text-danger-700'
                      }`}>
                        {userAnswer.isCorrect ? 'Correct' : 'Incorrect'}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <Badge variant={userAnswer.isCorrect ? 'success' : 'danger'}>
                    {userAnswer.pointsEarned}/{userAnswer.question.points} points
                  </Badge>
                  <div className="text-xs text-secondary-600 mt-1 flex items-center gap-1 justify-end">
                    <ClockIcon className="h-3 w-3" />
                    {formatTime(userAnswer.timeSpent / 1000)}
                  </div>
                </div>
              </div>

              {/* Question Text */}
              <p className="text-lg font-semibold text-secondary-900 mb-4">
                {userAnswer.question.questionText}
              </p>

              {/* Answers Display */}
              {userAnswer.question.type === 4 ? (
                // SHORT_ANSWER
                <div className="space-y-3">
                  <div className={`p-4 rounded-xl border-2 ${
                    userAnswer.isCorrect
                      ? 'bg-accent-50 border-accent-300'
                      : 'bg-danger-50 border-danger-300'
                  }`}>
                    <div className="text-sm font-medium text-secondary-600 mb-1">Your Answer:</div>
                    <div className={`font-semibold ${
                      userAnswer.isCorrect ? 'text-accent-800' : 'text-danger-800'
                    }`}>
                      {userAnswer.isCorrect ? userAnswer.question.answers[0]?.answerText : '(No answer provided)'}
                    </div>
                  </div>

                  {!userAnswer.isCorrect && (
                    <div className="p-4 rounded-xl border-2 bg-primary-50 border-primary-300">
                      <div className="text-sm font-medium text-secondary-600 mb-1">Correct Answer:</div>
                      <div className="font-semibold text-primary-800">
                        {userAnswer.question.answers[0]?.answerText}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                // MULTIPLE_CHOICE, MULTIPLE_SELECT, TRUE_FALSE
                <div className="space-y-2">
                  {userAnswer.question.answers.map((answer, ansIdx) => {
                    const isSelected = userAnswer.selectedAnswerIds.includes(answer.id)
                    const isCorrect = answer.isCorrect

                    let bgClass = 'bg-white/80 border-secondary-200'
                    let textClass = 'text-secondary-700'
                    let iconColor = 'text-secondary-400'

                    if (isSelected && isCorrect) {
                      bgClass = 'bg-accent-50 border-accent-300 shadow-soft'
                      textClass = 'text-accent-900'
                      iconColor = 'text-accent-600'
                    } else if (isSelected && !isCorrect) {
                      bgClass = 'bg-danger-50 border-danger-300'
                      textClass = 'text-danger-900'
                      iconColor = 'text-danger-600'
                    } else if (!isSelected && isCorrect) {
                      bgClass = 'bg-primary-50 border-primary-300'
                      textClass = 'text-primary-900'
                      iconColor = 'text-primary-600'
                    }

                    return (
                      <div
                        key={answer.id}
                        className={`flex items-center gap-3 p-4 rounded-xl border-2 ${bgClass}`}
                      >
                        <div className={`flex items-center justify-center w-8 h-8 rounded-lg font-bold text-sm ${
                          isSelected || isCorrect ? `${bgClass.includes('accent') ? 'bg-accent-600' : bgClass.includes('danger') ? 'bg-danger-600' : 'bg-primary-600'} text-white` : 'bg-secondary-100 text-secondary-600'
                        }`}>
                          {String.fromCharCode(65 + ansIdx)}
                        </div>
                        <span className={`flex-1 font-medium ${textClass}`}>
                          {answer.answerText}
                        </span>
                        <div className="flex items-center gap-2">
                          {isSelected && (
                            <Badge variant={isCorrect ? 'success' : 'danger'} size="sm">
                              Your choice
                            </Badge>
                          )}
                          {isCorrect && !isSelected && (
                            <Badge variant="primary" size="sm">
                              Correct
                            </Badge>
                          )}
                          {isSelected && isCorrect && (
                            <CheckIcon className={`h-5 w-5 ${iconColor}`} strokeWidth={3} />
                          )}
                          {isSelected && !isCorrect && (
                            <XMarkIcon className={`h-5 w-5 ${iconColor}`} strokeWidth={3} />
                          )}
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

      {/* Action Buttons */}
      <div className="card-premium p-6">
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Button
            variant="accent"
            size="lg"
            onClick={() => navigate(`/quizzes/${attempt.quizId}/take`)}
            className="gap-2 w-full sm:w-auto"
          >
            <ArrowPathIcon className="h-5 w-5" />
            Retake Quiz
          </Button>
          <Button
            variant="primary"
            size="lg"
            onClick={() => navigate(`/quizzes/${attempt.quizId}`)}
            className="gap-2 w-full sm:w-auto"
          >
            <EyeIcon className="h-5 w-5" />
            View Quiz Details
          </Button>
          <Button
            variant="secondary"
            size="lg"
            onClick={() => navigate('/my-results')}
            className="gap-2 w-full sm:w-auto"
          >
            <ChartBarIcon className="h-5 w-5" />
            All My Results
          </Button>
          <Button
            variant="secondary"
            size="lg"
            onClick={() => navigate('/dashboard')}
            className="gap-2 w-full sm:w-auto"
          >
            <HomeIcon className="h-5 w-5" />
            Dashboard
          </Button>
        </div>
      </div>
    </div>
  )
}

export default Results
