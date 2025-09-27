import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm, useFieldArray } from 'react-hook-form'
// Removed Zod validation to use custom validation logic
import { useQuiz } from '@/hooks/useQuiz'
import { useAuthStore } from '@/stores/authStore'
import { CategoryResponse, QuizDifficulty, QuestionType } from '@/types'
import { PlusIcon, MinusIcon } from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'

// Removed Zod schemas - now using simpler validation approach

interface QuizForm {
  title: string
  description: string
  categoryId: string
  difficulty: QuizDifficulty
  timeLimit?: number
  isPublic: boolean
  questions: {
    type: QuestionType
    questionText: string
    points: number
    timeLimit?: number
    order: number
    answers: {
      answerText: string
      isCorrect: boolean
      order: number
    }[]
    trueFalseAnswer?: string // For True/False radio group
  }[]
}

const CreateQuiz = () => {
  const [categories, setCategories] = useState<CategoryResponse[]>([])
  const [currentStep, setCurrentStep] = useState(1)
  const { createQuiz, getCategories, loading } = useQuiz()
  const navigate = useNavigate()


  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    trigger,
    formState: { errors },
  } = useForm<QuizForm>({
    // Removed zodResolver to rely on custom validation
    mode: 'onChange',
    defaultValues: {
      title: '',
      description: '',
      categoryId: '',
      difficulty: QuizDifficulty.EASY,
      timeLimit: undefined,
      isPublic: true,
      questions: [
        {
          type: QuestionType.MULTIPLE_CHOICE,
          questionText: '',
          points: 1,
          timeLimit: undefined,
          order: 1,
          answers: [
            { answerText: '', isCorrect: false, order: 1 },
            { answerText: '', isCorrect: false, order: 2 },
          ],
        },
      ],
    },
  })

  const {
    fields: questionFields,
    append: appendQuestion,
    remove: removeQuestion,
  } = useFieldArray({
    control,
    name: 'questions',
  })

  useEffect(() => {
    loadCategories()
  }, [])

  const loadCategories = async () => {
    const result = await getCategories()
    if (result) {
      setCategories(result)
    }
  }

  const onSubmit = async (data: QuizForm) => {
    const quizData = {
      ...data,
      questions: data.questions.map((q, index) => ({
        ...q,
        order: index + 1,
        answers: q.answers.map((a, answerIndex) => ({
          ...a,
          order: answerIndex + 1,
        })),
      })),
    }

    const result = await createQuiz(quizData)
    if (result) {
      navigate('/admin/quizzes')
    }
  }

  const addQuestion = () => {
    appendQuestion({
      type: QuestionType.MULTIPLE_CHOICE,
      questionText: '',
      points: 1,
      timeLimit: undefined,
      order: questionFields.length + 1,
      answers: [
        { answerText: '', isCorrect: false, order: 1 },
        { answerText: '', isCorrect: false, order: 2 },
      ],
    })
  }

  // Update answers when question type changes
  const handleQuestionTypeChange = (questionIndex: number, newType: QuestionType) => {
    if (newType === QuestionType.TRUE_FALSE) {
      setValue(`questions.${questionIndex}.answers`, [
        { answerText: 'True', isCorrect: false, order: 1 },
        { answerText: 'False', isCorrect: false, order: 2 },
      ])
      // Clear the trueFalseAnswer field to force user to select
      setValue(`questions.${questionIndex}.trueFalseAnswer`, '')
    } else if (newType === QuestionType.SHORT_ANSWER) {
      setValue(`questions.${questionIndex}.answers`, [
        { answerText: '', isCorrect: true, order: 1 },
      ])
    } else {
      // Multiple choice or multiple select - ensure at least 2 answers
      const currentAnswers = watch(`questions.${questionIndex}.answers`)
      if (currentAnswers.length < 2) {
        setValue(`questions.${questionIndex}.answers`, [
          { answerText: '', isCorrect: false, order: 1 },
          { answerText: '', isCorrect: false, order: 2 },
        ])
      }
    }
  }

  const addAnswer = (questionIndex: number) => {
    const currentAnswers = watch(`questions.${questionIndex}.answers`)
    setValue(`questions.${questionIndex}.answers`, [
      ...currentAnswers,
      {
        answerText: '',
        isCorrect: false,
        order: currentAnswers.length + 1,
      },
    ])
  }

  const removeAnswer = (questionIndex: number, answerIndex: number) => {
    const currentAnswers = watch(`questions.${questionIndex}.answers`)
    if (currentAnswers.length > 2) {
      const newAnswers = currentAnswers.filter((_, index) => index !== answerIndex)
      setValue(`questions.${questionIndex}.answers`, newAnswers)
    }
  }

  const validateStep1 = async () => {
    const fields = ['title', 'description', 'categoryId', 'difficulty', 'isPublic']
    const isValid = await trigger(fields)

    if (!isValid) {
      // Show specific toast messages for each field error
      if (errors.title) {
        toast.error('Title must be at least 3 characters')
      }
      if (errors.description) {
        toast.error('Description must be at least 10 characters')
      }
      if (errors.categoryId) {
        toast.error('Please select a category')
      }
    }

    return isValid
  }

  const validateStep2 = async () => {
    const isValid = await trigger('questions')

    if (!isValid) {
      const values = watch()

      // Show specific toast messages for question validation errors
      if (!values.questions || values.questions.length === 0) {
        toast.error('At least one question is required')
        return false
      }

      let hasErrors = false
      values.questions.forEach((question, index) => {
        if (!question.questionText || question.questionText.length < 5) {
          toast.error(`Question ${index + 1}: Question text must be at least 5 characters`)
          hasErrors = true
        }

        // Different validation based on question type
        if (question.type === QuestionType.SHORT_ANSWER) {
          // Fill in the Blank validation
          if (!question.answers?.[0]?.answerText?.trim()) {
            toast.error(`Question ${index + 1}: Fill in the blank answer cannot be empty`)
            hasErrors = true
          }
        } else if (question.type === QuestionType.TRUE_FALSE) {
          // True/False validation - exactly one must be correct
          if (!question.answers || question.answers.length < 2) {
            toast.error(`Question ${index + 1}: True/False questions must have both True and False options`)
            hasErrors = true
          } else {
            const correctCount = question.answers.filter(answer => answer.isCorrect).length
            if (correctCount === 0) {
              toast.error(`Question ${index + 1}: Please select either True or False as the correct answer`)
              hasErrors = true
            } else if (correctCount > 1) {
              toast.error(`Question ${index + 1}: True/False questions can only have one correct answer`)
              hasErrors = true
            }
          }
        } else {
          // Multiple Choice and Multiple Select validation
          if (!question.answers || question.answers.length < 2) {
            toast.error(`Question ${index + 1}: At least 2 answers are required`)
            hasErrors = true
          } else {
            if (!question.answers.some(answer => answer.isCorrect)) {
              toast.error(`Question ${index + 1}: At least one answer must be marked as correct`)
              hasErrors = true
            }

            // Single correct answer validation for multiple choice
            if (question.type === QuestionType.MULTIPLE_CHOICE) {
              const correctCount = question.answers.filter(answer => answer.isCorrect).length
              if (correctCount > 1) {
                toast.error(`Question ${index + 1}: Single correct answer questions can only have one correct answer`)
                hasErrors = true
              }
            }

            question.answers.forEach((answer, answerIndex) => {
              if (!answer.answerText || answer.answerText.trim() === '') {
                toast.error(`Question ${index + 1}, Answer ${answerIndex + 1}: Answer text is required`)
                hasErrors = true
              }
            })
          }
        }
      })

      return !hasErrors
    }

    return true
  }

  const nextStep = async () => {
    let isValid = true

    if (currentStep === 1) {
      isValid = await validateStep1()
    } else if (currentStep === 2) {
      isValid = await validateStep2()
    }

    if (!isValid) {
      return
    }

    if (currentStep < 3) setCurrentStep(currentStep + 1)
  }

  const prevStep = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1)
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Create New Quiz</h1>
        <p className="text-gray-600 mt-2">Build an engaging quiz for your audience</p>
      </div>

      {/* Progress Steps */}
      <div className="flex items-center justify-center mb-8">
        {[1, 2, 3].map((step) => (
          <div key={step} className="flex items-center">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center ${
                currentStep >= step
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-200 text-gray-600'
              }`}
            >
              {step}
            </div>
            {step < 3 && (
              <div
                className={`w-16 h-1 ${
                  currentStep > step ? 'bg-primary-600' : 'bg-gray-200'
                }`}
              />
            )}
          </div>
        ))}
      </div>

      <form onSubmit={handleSubmit(onSubmit, () => {
        toast.error('Please fix the validation errors before submitting')
      })} className="space-y-8">
        {/* Step 1: Basic Information */}
        {currentStep === 1 && (
          <div className="card">
            <h2 className="text-xl font-semibold mb-6">Basic Information</h2>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Quiz Title <span className="text-red-500">*</span>
                </label>
                <input
                  {...register('title', {
                    required: 'Title is required',
                    minLength: { value: 3, message: 'Title must be at least 3 characters' }
                  })}
                  className={`input-field ${errors.title ? 'border-red-500 bg-red-50' : ''}`}
                  placeholder="Enter quiz title (minimum 3 characters)"
                />
                {errors.title && (
                  <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description <span className="text-red-500">*</span>
                </label>
                <textarea
                  {...register('description', {
                    required: 'Description is required',
                    minLength: { value: 10, message: 'Description must be at least 10 characters' }
                  })}
                  rows={4}
                  className={`input-field ${errors.description ? 'border-red-500 bg-red-50' : ''}`}
                  placeholder="Describe what this quiz is about (minimum 10 characters)"
                />
                {errors.description && (
                  <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Category <span className="text-red-500">*</span>
                  </label>
                  <select
                    {...register('categoryId', {
                      required: 'Category is required'
                    })}
                    className={`input-field ${errors.categoryId ? 'border-red-500 bg-red-50' : ''}`}
                  >
                    <option value="">Select a category</option>
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.icon} {category.name}
                      </option>
                    ))}
                  </select>
                  {errors.categoryId && (
                    <p className="mt-1 text-sm text-red-600">{errors.categoryId.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Difficulty
                  </label>
                  <select {...register('difficulty', { valueAsNumber: true })} className="input-field">
                    <option value={QuizDifficulty.EASY}>Easy</option>
                    <option value={QuizDifficulty.MEDIUM}>Medium</option>
                    <option value={QuizDifficulty.HARD}>Hard</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Time Limit (minutes, optional)
                  </label>
                  <input
                    {...register('timeLimit', {
                      setValueAs: (value) => value === '' ? undefined : Number(value)
                    })}
                    type="number"
                    min="1"
                    className="input-field"
                    placeholder="No time limit"
                  />
                </div>

                <div className="flex items-center mt-8">
                  <input
                    {...register('isPublic')}
                    type="checkbox"
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                  />
                  <label className="ml-2 block text-sm text-gray-700">
                    Make this quiz public
                  </label>
                </div>
              </div>
            </div>

            <div className="flex justify-end mt-8">
              <button
                type="button"
                onClick={nextStep}
                className="btn-primary"
              >
                Next: Add Questions
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Questions */}
        {currentStep === 2 && (
          <div className="card">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold">Quiz Questions</h2>
              <button
                type="button"
                onClick={addQuestion}
                className="btn-secondary flex items-center"
              >
                <PlusIcon className="h-4 w-4 mr-2" />
                Add Question
              </button>
            </div>

            <div className="space-y-8">
              {questionFields.map((field, questionIndex) => (
                <div key={field.id} className="border border-gray-200 rounded-lg p-6">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-medium">Question {questionIndex + 1}</h3>
                    {questionFields.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeQuestion(questionIndex)}
                        className="text-red-600 hover:text-red-800"
                      >
                        <MinusIcon className="h-5 w-5" />
                      </button>
                    )}
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Question Text <span className="text-red-500">*</span>
                      </label>
                      <textarea
                        {...register(`questions.${questionIndex}.questionText`, {
                          required: 'Question text is required',
                          minLength: { value: 5, message: 'Question text must be at least 5 characters' }
                        })}
                        rows={3}
                        className={`input-field ${
                          errors.questions?.[questionIndex]?.questionText ? 'border-red-500 bg-red-50' : ''
                        }`}
                        placeholder="Enter your question (minimum 5 characters)"
                      />
                      {errors.questions?.[questionIndex]?.questionText && (
                        <p className="mt-1 text-sm text-red-600">
                          {errors.questions[questionIndex]?.questionText?.message}
                        </p>
                      )}
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Question Type
                        </label>
                        <select
                          {...register(`questions.${questionIndex}.type`, {
                            valueAsNumber: true,
                            onChange: (e) => handleQuestionTypeChange(questionIndex, parseInt(e.target.value))
                          })}
                          className="input-field"
                        >
                          <option value={QuestionType.MULTIPLE_CHOICE}>Single Correct Answer</option>
                          <option value={QuestionType.MULTIPLE_SELECT}>Multiple Correct Answers</option>
                          <option value={QuestionType.TRUE_FALSE}>True/False</option>
                          <option value={QuestionType.SHORT_ANSWER}>Fill in the Blank</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Points
                        </label>
                        <input
                          {...register(`questions.${questionIndex}.points`, { valueAsNumber: true })}
                          type="number"
                          min="1"
                          className="input-field"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Time Limit (seconds, optional)
                        </label>
                        <input
                          {...register(`questions.${questionIndex}.timeLimit`, {
                            setValueAs: (value) => value === '' ? undefined : Number(value)
                          })}
                          type="number"
                          min="1"
                          className="input-field"
                          placeholder="No limit"
                        />
                      </div>
                    </div>

                    {/* Answers */}
                    <div>
                      {watch(`questions.${questionIndex}.type`) === QuestionType.SHORT_ANSWER ? (
                        /* Fill in the Blank - Single text input */
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Correct Answer <span className="text-red-500">*</span>
                          </label>

                          {/* Warning if answer is empty */}
                          {!watch(`questions.${questionIndex}.answers.0.answerText`)?.trim() && (
                            <div className="mb-3 p-2 bg-yellow-50 border border-yellow-200 rounded-lg">
                              <p className="text-sm text-yellow-700">
                                ⚠️ Please enter the correct answer - this field cannot be blank
                              </p>
                            </div>
                          )}

                          <input
                            {...register(`questions.${questionIndex}.answers.0.answerText`, {
                              required: "Answer text is required",
                              validate: (value) => {
                                if (!value?.trim()) {
                                  return "Fill in the blank answer cannot be empty"
                                }
                                return true
                              }
                            })}
                            className={`w-full input-field ${
                              errors.questions?.[questionIndex]?.answers?.[0]?.answerText ? 'border-red-500 bg-red-50' : ''
                            }`}
                            placeholder="Enter the correct answer (case-sensitive)"
                          />
                          {errors.questions?.[questionIndex]?.answers?.[0]?.answerText && (
                            <p className="text-sm text-red-600 mt-1">
                              {errors.questions[questionIndex]?.answers?.[0]?.answerText?.message}
                            </p>
                          )}
                          <p className="text-sm text-gray-500 mt-1">
                            Users will need to type this exact text to get the answer correct.
                          </p>
                        </div>
                      ) : watch(`questions.${questionIndex}.type`) === QuestionType.TRUE_FALSE ? (
                        /* True/False - Two fixed options */
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-4">
                            Select the Correct Answer <span className="text-red-500">*</span>
                          </label>

                          {/* Warning if no correct answer selected */}
                          {!watch(`questions.${questionIndex}.answers.0.isCorrect`) &&
                           !watch(`questions.${questionIndex}.answers.1.isCorrect`) && (
                            <div className="mb-3 p-2 bg-yellow-50 border border-yellow-200 rounded-lg">
                              <p className="text-sm text-yellow-700">
                                ⚠️ Please select either True or False as the correct answer
                              </p>
                            </div>
                          )}

                          <div className="space-y-3">
                            <div className="flex items-center space-x-3">
                              <input
                                {...register(`questions.${questionIndex}.trueFalseAnswer`, {
                                  onChange: (e) => {
                                    if (e.target.value === 'true') {
                                      setValue(`questions.${questionIndex}.answers.0.isCorrect`, true)
                                      setValue(`questions.${questionIndex}.answers.1.isCorrect`, false)
                                    } else {
                                      setValue(`questions.${questionIndex}.answers.0.isCorrect`, false)
                                      setValue(`questions.${questionIndex}.answers.1.isCorrect`, true)
                                    }
                                  }
                                })}
                                type="radio"
                                value="true"
                                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300"
                              />
                              <span className="text-gray-900">True</span>
                            </div>
                            <div className="flex items-center space-x-3">
                              <input
                                {...register(`questions.${questionIndex}.trueFalseAnswer`, {
                                  onChange: (e) => {
                                    if (e.target.value === 'false') {
                                      setValue(`questions.${questionIndex}.answers.0.isCorrect`, false)
                                      setValue(`questions.${questionIndex}.answers.1.isCorrect`, true)
                                    } else {
                                      setValue(`questions.${questionIndex}.answers.0.isCorrect`, true)
                                      setValue(`questions.${questionIndex}.answers.1.isCorrect`, false)
                                    }
                                  }
                                })}
                                type="radio"
                                value="false"
                                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300"
                              />
                              <span className="text-gray-900">False</span>
                            </div>
                          </div>
                        </div>
                      ) : (
                        /* Multiple Choice and Multiple Select */
                        <div>
                          <div className="flex justify-between items-center mb-4">
                            <label className="block text-sm font-medium text-gray-700">
                              Answer Options <span className="text-red-500">*</span>
                              {watch(`questions.${questionIndex}.type`) === QuestionType.MULTIPLE_SELECT && (
                                <span className="text-sm font-normal text-gray-500 ml-2">
                                  (Multiple answers can be correct)
                                </span>
                              )}
                            </label>
                            <button
                              type="button"
                              onClick={() => addAnswer(questionIndex)}
                              className="text-primary-600 hover:text-primary-800 text-sm"
                            >
                              + Add Answer
                            </button>
                          </div>

                          {/* Warning if no correct answer selected */}
                          {watch(`questions.${questionIndex}.answers`) &&
                           !watch(`questions.${questionIndex}.answers`).some(answer => answer.isCorrect) && (
                            <div className="mb-3 p-2 bg-yellow-50 border border-yellow-200 rounded-lg">
                              <p className="text-sm text-yellow-700">
                                ⚠️ Please mark at least one answer as correct
                                {watch(`questions.${questionIndex}.type`) === QuestionType.MULTIPLE_CHOICE
                                  ? " (exactly one for single correct answer)"
                                  : " (one or more for multiple correct answers)"
                                }
                              </p>
                            </div>
                          )}

                          {watch(`questions.${questionIndex}.answers`).map((_, answerIndex) => (
                            <div key={answerIndex} className="flex items-center space-x-3 mb-3">
                              <input
                                {...register(`questions.${questionIndex}.answers.${answerIndex}.isCorrect`)}
                                type="checkbox"
                                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                              />
                              <input
                                {...register(`questions.${questionIndex}.answers.${answerIndex}.answerText`)}
                                className={`flex-1 input-field ${
                                  errors.questions?.[questionIndex]?.answers?.[answerIndex]?.answerText ? 'border-red-500 bg-red-50' : ''
                                }`}
                                placeholder={`Answer ${answerIndex + 1}`}
                              />
                              {watch(`questions.${questionIndex}.answers`).length > 2 && (
                                <button
                                  type="button"
                                  onClick={() => removeAnswer(questionIndex, answerIndex)}
                                  className="text-red-600 hover:text-red-800"
                                >
                                  <MinusIcon className="h-4 w-4" />
                                </button>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-between mt-8">
              <button
                type="button"
                onClick={prevStep}
                className="btn-secondary"
              >
                Previous
              </button>
              <button
                type="button"
                onClick={nextStep}
                className="btn-primary"
              >
                Next: Review
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Review and Submit */}
        {currentStep === 3 && (
          <div className="card">
            <h2 className="text-xl font-semibold mb-6">Review Your Quiz</h2>

            <div className="space-y-6">
              <div>
                <h3 className="font-medium text-gray-900">Quiz Information</h3>
                <p className="text-gray-600">Title: {watch('title')}</p>
                <p className="text-gray-600">Description: {watch('description')}</p>
                <p className="text-gray-600">
                  Category: {categories.find(c => c.id === watch('categoryId'))?.name}
                </p>
                <p className="text-gray-600">
                  Difficulty: {watch('difficulty') === QuizDifficulty.EASY ? 'Easy' :
                              watch('difficulty') === QuizDifficulty.MEDIUM ? 'Medium' : 'Hard'}
                </p>
                <p className="text-gray-600">
                  Questions: {watch('questions').length}
                </p>
              </div>

              <div>
                <h3 className="font-medium text-gray-900 mb-4">Questions Preview</h3>
                {watch('questions').map((question, index) => (
                  <div key={index} className="border border-gray-200 rounded p-4 mb-4">
                    <p className="font-medium">Q{index + 1}: {question.questionText}</p>
                    <p className="text-sm text-gray-600">
                      Type: {question.type === QuestionType.MULTIPLE_CHOICE ? 'Multiple Choice' :
                             question.type === QuestionType.TRUE_FALSE ? 'True/False' :
                             question.type === QuestionType.MULTIPLE_SELECT ? 'Multiple Select' : 'Short Answer'} | Points: {question.points}
                    </p>
                    <div className="mt-2">
                      {question.answers.map((answer, answerIndex) => (
                        <p key={answerIndex} className={`text-sm ${answer.isCorrect ? 'text-green-600 font-medium' : 'text-gray-600'}`}>
                          {answerIndex + 1}. {answer.answerText} {answer.isCorrect && '✓'}
                        </p>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-between mt-8">
              <button
                type="button"
                onClick={prevStep}
                className="btn-secondary"
              >
                Previous
              </button>
              <button
                type="submit"
                disabled={loading}
                className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Creating Quiz...' : 'Create Quiz'}
              </button>
            </div>
          </div>
        )}
      </form>
    </div>
  )
}

export default CreateQuiz