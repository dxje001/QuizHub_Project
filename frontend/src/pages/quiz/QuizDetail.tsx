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
  CheckCircleIcon
} from '@heroicons/react/24/outline'

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
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
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
          <p className="text-red-600">Quiz not found.</p>
          <Link to="/quizzes" className="text-primary-600 hover:underline mt-4 inline-block">
            Back to Quizzes
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Back Button */}
      <div className="mb-6">
        <Link
          to="/quizzes"
          className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
        >
          <ChevronLeftIcon className="h-5 w-5 mr-2" />
          Back to Quizzes
        </Link>
      </div>

      {/* Quiz Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 mb-6">
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center">
            <div className="text-4xl mr-4">{quiz.category.icon}</div>
            <div>
              <span className="text-sm font-medium text-gray-600">{quiz.category.name}</span>
              <h1 className="text-3xl font-bold text-gray-900 mt-1">{quiz.title}</h1>
            </div>
          </div>
          <span className={`text-sm px-3 py-1 rounded-full font-medium ${getDifficultyColor(quiz.difficulty)}`}>
            {getDifficultyLabel(quiz.difficulty)}
          </span>
        </div>

        <p className="text-gray-600 text-lg mb-6">{quiz.description}</p>

        {/* Quiz Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
          <div className="flex items-center">
            <AcademicCapIcon className="h-6 w-6 text-gray-400 mr-3" />
            <div>
              <div className="text-2xl font-bold text-gray-900">{quiz.questionsCount}</div>
              <div className="text-sm text-gray-600">Questions</div>
            </div>
          </div>

          {quiz.timeLimit && (
            <div className="flex items-center">
              <ClockIcon className="h-6 w-6 text-gray-400 mr-3" />
              <div>
                <div className="text-2xl font-bold text-gray-900">{quiz.timeLimit}</div>
                <div className="text-sm text-gray-600">Minutes</div>
              </div>
            </div>
          )}

          <div className="flex items-center">
            <UserIcon className="h-6 w-6 text-gray-400 mr-3" />
            <div>
              <div className="text-sm font-medium text-gray-900">{quiz.createdBy.fullName}</div>
              <div className="text-sm text-gray-600">Author</div>
            </div>
          </div>

          <div className="flex items-center">
            <CalendarIcon className="h-6 w-6 text-gray-400 mr-3" />
            <div>
              <div className="text-sm font-medium text-gray-900">{formatDate(quiz.createdAt).split(',')[0]}</div>
              <div className="text-sm text-gray-600">Created</div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex space-x-4">
          {user?.roles?.includes('Admin') ? (
            <Link
              to={`/quizzes/${quiz.id}/edit`}
              className="flex items-center px-6 py-3 border border-primary-600 text-primary-600 rounded-lg hover:bg-primary-50 transition-colors"
            >
              <CogIcon className="h-5 w-5 mr-2" />
              Manage Quiz
            </Link>
          ) : (
            <>
              <Link
                to={`/quizzes/${quiz.id}/take`}
                className="flex items-center px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
              >
                <PlayIcon className="h-5 w-5 mr-2" />
                Take Quiz
              </Link>
              <Link
                to="/leaderboard"
                className="flex items-center px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <TrophyIcon className="h-5 w-5 mr-2" />
                View Leaderboard
              </Link>
            </>
          )}
        </div>
      </div>

      {/* All Questions - Only for Admins */}
      {user?.roles?.includes('Admin') && quiz.questions && quiz.questions.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-6">All Questions ({quiz.questions.length})</h2>

          <div className="space-y-6">
            {quiz.questions.map((question, index) => (
              <div key={question.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <span className="text-lg font-semibold text-gray-900">
                      Question {index + 1}
                    </span>
                    <span className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded-full">
                      {getQuestionTypeLabel(question.type)}
                    </span>
                  </div>
                  <div className="text-sm text-gray-600">
                    {question.points} point{question.points !== 1 ? 's' : ''}
                  </div>
                </div>

                <p className="text-gray-900 mb-4">{question.questionText}</p>

                {question.type === QuestionType.SHORT_ANSWER ? (
                  /* Fill in the Blank - Show correct answer */
                  <div className="p-3 bg-green-50 border border-green-200 rounded">
                    <div className="flex items-center">
                      <CheckCircleIcon className="h-5 w-5 text-green-600 mr-2" />
                      <span className="text-green-800 font-medium">Correct Answer:</span>
                      <span className="ml-2 text-gray-900">{question.answers[0]?.answerText}</span>
                    </div>
                  </div>
                ) : (
                  /* Multiple Choice, Multiple Select, True/False - Show all options */
                  <div className="space-y-2">
                    {question.answers.map((answer, answerIndex) => (
                      <div
                        key={answer.id}
                        className={`flex items-center p-3 rounded border ${
                          answer.isCorrect
                            ? 'bg-green-50 border-green-200'
                            : 'bg-gray-50 border-gray-200'
                        }`}
                      >
                        <div className={`w-6 h-6 border rounded mr-3 flex items-center justify-center text-xs font-medium ${
                          answer.isCorrect
                            ? 'border-green-300 bg-green-100 text-green-800'
                            : 'border-gray-300 text-gray-600'
                        }`}>
                          {question.type === QuestionType.TRUE_FALSE
                            ? (answerIndex === 0 ? 'T' : 'F')
                            : String.fromCharCode(65 + answerIndex)
                          }
                        </div>
                        <span className={answer.isCorrect ? 'text-green-900 font-medium' : 'text-gray-700'}>
                          {answer.answerText}
                        </span>
                        {answer.isCorrect && (
                          <CheckCircleIcon className="h-4 w-4 text-green-600 ml-auto" />
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {question.type === QuestionType.MULTIPLE_SELECT && (
                  <p className="text-sm text-blue-600 mt-2 italic">
                    ℹ️ Multiple answers are correct for this question
                  </p>
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