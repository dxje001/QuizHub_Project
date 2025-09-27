import React from 'react'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js'
import { Line } from 'react-chartjs-2'
import { QuizAttempt } from '@/types'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
)

interface ProgressChartProps {
  attempts: QuizAttempt[]
  currentAttemptId?: string
}

const ProgressChart: React.FC<ProgressChartProps> = ({ attempts, currentAttemptId }) => {
  if (attempts.length < 2) {
    return null
  }

  // Sort attempts by date to ensure proper order
  const sortedAttempts = [...attempts].sort(
    (a, b) => new Date(a.finishedAt || a.startedAt).getTime() - new Date(b.finishedAt || b.startedAt).getTime()
  )

  const data = {
    labels: sortedAttempts.map((_, index) => `Attempt ${index + 1}`),
    datasets: [
      {
        label: 'Score Progress (%)',
        data: sortedAttempts.map(attempt => Math.round(attempt.percentage)),
        borderColor: 'rgb(59, 130, 246)', // blue-500
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        pointBackgroundColor: sortedAttempts.map(attempt =>
          attempt.id === currentAttemptId ? 'rgb(16, 185, 129)' : 'rgb(59, 130, 246)'
        ),
        pointBorderColor: sortedAttempts.map(attempt =>
          attempt.id === currentAttemptId ? 'rgb(16, 185, 129)' : 'rgb(59, 130, 246)'
        ),
        pointRadius: sortedAttempts.map(attempt =>
          attempt.id === currentAttemptId ? 8 : 6
        ),
        pointHoverRadius: sortedAttempts.map(attempt =>
          attempt.id === currentAttemptId ? 10 : 8
        ),
        tension: 0.3,
        fill: true
      }
    ]
  }

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
      },
      title: {
        display: true,
        text: 'Score Progress Over Time',
        font: {
          size: 16,
          weight: 'bold' as const
        },
        color: 'rgb(31, 41, 55)' // gray-800
      },
      tooltip: {
        callbacks: {
          afterLabel: function(context: any) {
            const attemptIndex = context.dataIndex
            const attempt = sortedAttempts[attemptIndex]
            const date = new Date(attempt.finishedAt || attempt.startedAt)
            const isCurrentAttempt = attempt.id === currentAttemptId

            return [
              `Score: ${attempt.score}/${attempt.totalPoints} points`,
              `Date: ${date.toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}`,
              isCurrentAttempt ? '(Current Attempt)' : ''
            ].filter(Boolean)
          }
        },
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: 'white',
        bodyColor: 'white',
        borderColor: 'rgba(59, 130, 246, 0.8)',
        borderWidth: 1
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        max: 100,
        grid: {
          color: 'rgba(156, 163, 175, 0.3)' // gray-400 with opacity
        },
        ticks: {
          callback: function(value: any) {
            return value + '%'
          },
          color: 'rgb(107, 114, 128)' // gray-500
        },
        title: {
          display: true,
          text: 'Score (%)',
          color: 'rgb(107, 114, 128)' // gray-500
        }
      },
      x: {
        grid: {
          color: 'rgba(156, 163, 175, 0.3)' // gray-400 with opacity
        },
        ticks: {
          color: 'rgb(107, 114, 128)' // gray-500
        }
      }
    }
  }

  // Calculate improvement metrics
  const improvement = sortedAttempts.length > 1 ?
    sortedAttempts[sortedAttempts.length - 1].percentage - sortedAttempts[0].percentage : 0
  const bestScore = Math.max(...sortedAttempts.map(a => a.percentage))
  const averageScore = sortedAttempts.reduce((sum, a) => sum + a.percentage, 0) / sortedAttempts.length

  return (
    <div className="space-y-4">
      {/* Chart */}
      <div className="h-64 w-full">
        <Line data={data} options={options} />
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
        <div className="p-3 bg-gray-50 rounded-lg">
          <div className={`text-xl font-bold ${improvement >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {improvement >= 0 ? '+' : ''}{Math.round(improvement * 10) / 10}%
          </div>
          <div className="text-sm text-gray-600">Overall Improvement</div>
        </div>
        <div className="p-3 bg-gray-50 rounded-lg">
          <div className="text-xl font-bold text-blue-600">
            {Math.round(averageScore * 10) / 10}%
          </div>
          <div className="text-sm text-gray-600">Average Score</div>
        </div>
        <div className="p-3 bg-gray-50 rounded-lg">
          <div className="text-xl font-bold text-purple-600">
            {Math.round(bestScore)}%
          </div>
          <div className="text-sm text-gray-600">Best Score</div>
        </div>
      </div>

      {/* Trend Analysis */}
      <div className="p-4 bg-blue-50 rounded-lg">
        <h4 className="font-medium text-blue-900 mb-2">Performance Analysis</h4>
        <p className="text-sm text-blue-800">
          {sortedAttempts.length > 1 && (
            <>
              {improvement > 10 && "Excellent progress! Your scores are consistently improving. Keep up the great work!"}
              {improvement >= 0 && improvement <= 10 && "Good steady improvement. You're on the right track!"}
              {improvement < 0 && improvement >= -10 && "Minor fluctuation in scores is normal. Focus on areas where you struggled."}
              {improvement < -10 && "Consider reviewing the material more thoroughly before your next attempt."}
            </>
          )}
        </p>
      </div>
    </div>
  )
}

export default ProgressChart