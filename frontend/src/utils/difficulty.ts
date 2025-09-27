export const getDifficultyLabel = (difficulty: number | string): string => {
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

export const getDifficultyColor = (difficulty: number | string) => {
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

export const getQuestionTypeLabel = (type: number | string): string => {
  if (typeof type === 'number') {
    switch (type) {
      case 1:
        return 'Multiple Choice'
      case 2:
        return 'True/False'
      case 3:
        return 'Multiple Select'
      case 4:
        return 'Short Answer'
      default:
        return 'Unknown'
    }
  }
  return type
}