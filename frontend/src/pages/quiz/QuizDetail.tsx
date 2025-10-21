import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useQuiz } from '@/hooks/useQuiz'
import { useAuthStore } from '@/stores/authStore'
import { QuizResponse, QuestionType } from '@/types'
import {
  PlayIcon,
  ClockIcon,
  AcademicCapIcon,
  UserIcon,
  CalendarIcon,
  ChevronLeftIcon,
  TrophyIcon,
  CogIcon,
  CheckCircleIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Spinner } from '@/components/ui/spinner'

const QuizDetail = () => {
  const { id } = useParams<{ id: string }>()
  const { getQuizById, loading } = useQuiz()
  const { user } = useAuthStore()

  const [quiz, setQuiz] = useState<QuizResponse | null>(null)

  useEffect(() => {
    loadQuiz()
  }, [id])

  const loadQuiz = async () => {
    if (!id) return

    const result = await getQuizById(id)
    if (result) {
      setQuiz(result)
    }
  }

  const getDifficultyBadgeVariant = (difficulty: number | string) => {
    const label = typeof difficulty === 'number'
      ? ['', 'Easy', 'Medium', 'Hard'][difficulty]
      : difficulty

    switch (label?.toLowerCase()) {
      case 'easy':
        return 'success'
      case 'medium':
        return 'warning'
      case 'hard':
        return 'danger'
      default:
        return 'secondary'
    }
  }

  const getDifficultyLabel = (difficulty: number | string): string => {
    if (typeof difficulty === 'number') {
      return ['Unknown', 'Easy', 'Medium', 'Hard'][difficulty] || 'Unknown'
    }
    return difficulty
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
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

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Spinner size="lg" />
        <p className="mt-4 text-secondary-600 text-lg">Loading quiz details...</p>
      </div>
    )
  }

  if (!quiz) {
    return (
      <div className="text-center py-20">
        <div className="inline-flex p-6 rounded-full bg-danger-100 mb-6">
          <SparklesIcon className="h-16 w-16 text-danger-600" />
        </div>
        <h2 className="text-2xl font-bold text-secondary-900 mb-2">Quiz Not Found</h2>
        <p className="text-secondary-600 mb-8">The quiz you're looking for doesn't exist or has been removed.</p>
        <Link to="/quizzes">
          <Button variant="primary" className="gap-2">
            <ChevronLeftIcon className="h-5 w-5" />
            Back to Quizzes
          </Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-8 animate-fade-in-up">
      {/* Back Button */}
      <Link to="/quizzes">
        <button className="flex items-center gap-2 text-secondary-600 hover:text-secondary-900 transition-colors group">
          <ChevronLeftIcon className="h-5 w-5 group-hover:-translate-x-1 transition-transform" />
          <span className="font-medium">Back to Quizzes</span>
        </button>
      </Link>

      {/* Quiz Header Card */}
      <div className="card-premium p-8">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6 mb-6">
          <div className="flex items-start gap-5">
            <div className="text-5xl animate-bounce-subtle">{quiz.category.icon}</div>
            <div>
              <div className="flex items-center gap-3 mb-2">
                <span className="text-sm font-medium text-secondary-600">{quiz.category.name}</span>
                <Badge variant={getDifficultyBadgeVariant(quiz.difficulty)}>
                  {getDifficultyLabel(quiz.difficulty)}
                </Badge>
              </div>
              <h1 className="text-4xl font-bold text-secondary-900 mb-3">{quiz.title}</h1>
              <p className="text-lg text-secondary-600 leading-relaxed">{quiz.description}</p>
            </div>
          </div>
        </div>

        {/* Quiz Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8 p-6 bg-gradient-to-br from-primary-50 to-accent-50 rounded-xl border border-primary-200">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-white shadow-soft">
              <AcademicCapIcon className="h-6 w-6 text-primary-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-secondary-900">{quiz.questionsCount}</div>
              <div className="text-sm text-secondary-600">Questions</div>
            </div>
          </div>

          {quiz.timeLimit && (
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-white shadow-soft">
                <ClockIcon className="h-6 w-6 text-accent-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-secondary-900">{quiz.timeLimit}</div>
                <div className="text-sm text-secondary-600">Minutes</div>
              </div>
            </div>
          )}

          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-white shadow-soft">
              <UserIcon className="h-6 w-6 text-secondary-600" />
            </div>
            <div>
              <div className="text-sm font-semibold text-secondary-900">{quiz.createdBy.fullName}</div>
              <div className="text-xs text-secondary-600">Author</div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-white shadow-soft">
              <CalendarIcon className="h-6 w-6 text-warning-600" />
            </div>
            <div>
              <div className="text-sm font-semibold text-secondary-900">{formatDate(quiz.createdAt).split(',')[0]}</div>
              <div className="text-xs text-secondary-600">Created</div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4">
          {user?.roles?.includes('Admin') ? (
            <>
              <Link to={`/quizzes/${quiz.id}/edit`} className="flex-1">
                <Button variant="primary" size="lg" className="w-full gap-2">
                  <CogIcon className="h-5 w-5" />
                  Manage Quiz
                </Button>
              </Link>
              <Link to="/quizzes" className="flex-1">
                <Button variant="secondary" size="lg" className="w-full gap-2">
                  <ChevronLeftIcon className="h-5 w-5" />
                  Back to List
                </Button>
              </Link>
            </>
          ) : (
            <>
              <Link to={`/quizzes/${quiz.id}/take`} className="flex-1">
                <Button variant="primary" size="lg" className="w-full gap-2">
                  <PlayIcon className="h-5 w-5" />
                  Start Quiz
                </Button>
              </Link>
              <Link to="/leaderboard" className="flex-1">
                <Button variant="secondary" size="lg" className="w-full gap-2">
                  <TrophyIcon className="h-5 w-5" />
                  View Leaderboard
                </Button>
              </Link>
            </>
          )}
        </div>
      </div>

      {/* All Questions - Only for Admins */}
      {user?.roles?.includes('Admin') && quiz.questions && quiz.questions.length > 0 && (
        <div className="card p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-secondary-900">
              Questions Preview <span className="text-primary-600">({quiz.questions.length})</span>
            </h2>
            <Badge variant="primary" size="lg">Admin View</Badge>
          </div>

          <div className="space-y-5">
            {quiz.questions.map((question, index) => (
              <div
                key={question.id}
                className="card-interactive p-6 animate-fade-in-up"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-primary-600 to-accent-600 text-white font-bold shadow-soft">
                      {index + 1}
                    </div>
                    <div>
                      <div className="font-semibold text-secondary-900 text-lg">
                        Question {index + 1}
                      </div>
                      <Badge variant="primary" size="sm">
                        {getQuestionTypeLabel(question.type)}
                      </Badge>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-semibold text-accent-600">
                      {question.points} {question.points !== 1 ? 'points' : 'point'}
                    </div>
                    {question.timeLimit && (
                      <div className="text-xs text-secondary-500 flex items-center gap-1 justify-end mt-1">
                        <ClockIcon className="h-3 w-3" />
                        {question.timeLimit}s
                      </div>
                    )}
                  </div>
                </div>

                <p className="text-secondary-900 font-medium mb-4 text-lg">{question.questionText}</p>

                {question.type === QuestionType.SHORT_ANSWER ? (
                  <div className="p-4 bg-accent-50 border-2 border-accent-200 rounded-xl">
                    <div className="flex items-center gap-2">
                      <CheckCircleIcon className="h-5 w-5 text-accent-600 flex-shrink-0" />
                      <span className="text-accent-800 font-semibold">Correct Answer:</span>
                      <span className="text-secondary-900 font-medium">{question.answers[0]?.answerText}</span>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {question.answers.map((answer, answerIndex) => (
                      <div
                        key={answer.id}
                        className={`flex items-center gap-3 p-4 rounded-xl border-2 transition-all ${
                          answer.isCorrect
                            ? 'bg-accent-50 border-accent-300 shadow-soft'
                            : 'bg-secondary-50 border-secondary-200'
                        }`}
                      >
                        <div className={`flex items-center justify-center w-8 h-8 rounded-lg font-bold text-sm ${
                          answer.isCorrect
                            ? 'bg-accent-600 text-white'
                            : 'bg-secondary-300 text-secondary-700'
                        }`}>
                          {question.type === QuestionType.TRUE_FALSE
                            ? (answerIndex === 0 ? 'T' : 'F')
                            : String.fromCharCode(65 + answerIndex)
                          }
                        </div>
                        <span className={`flex-1 ${answer.isCorrect ? 'text-secondary-900 font-semibold' : 'text-secondary-700'}`}>
                          {answer.answerText}
                        </span>
                        {answer.isCorrect && (
                          <CheckCircleIcon className="h-5 w-5 text-accent-600 flex-shrink-0" />
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {question.type === QuestionType.MULTIPLE_SELECT && (
                  <div className="mt-4 p-3 bg-primary-50 border border-primary-200 rounded-lg">
                    <p className="text-sm text-primary-700 flex items-center gap-2">
                      <SparklesIcon className="h-4 w-4" />
                      Multiple answers are correct for this question
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default QuizDetail
