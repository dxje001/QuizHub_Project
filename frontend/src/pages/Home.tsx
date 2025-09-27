import { Link } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'
import {
  PlayIcon,
  TrophyIcon,
  ChartBarIcon,
  AcademicCapIcon,
} from '@heroicons/react/24/outline'

const Home = () => {
  const { isAuthenticated, user } = useAuthStore()

  const features = [
    {
      name: 'Interactive Quizzes',
      description: 'Take engaging quizzes on various topics with multiple question types.',
      icon: AcademicCapIcon,
    },
    {
      name: 'Global Leaderboards',
      description: 'Track your progress and see how you rank against other quiz takers.',
      icon: TrophyIcon,
    },
    {
      name: 'Detailed Analytics',
      description: 'Get insights into your performance with detailed statistics and progress tracking.',
      icon: ChartBarIcon,
    },
  ]

  return (
    <div className="max-w-7xl mx-auto">
      {/* Hero Section */}
      <div className="text-center py-12 md:py-20">
        <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
          Welcome to{' '}
          <span className="text-primary-600">KvizHub</span>
        </h1>
        <p className="text-xl md:text-2xl text-gray-600 mb-8 max-w-3xl mx-auto">
          Test your knowledge, compete with others, and track your progress in our comprehensive quiz platform.
        </p>

        {isAuthenticated ? (
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {user?.roles?.includes('Admin') ? (
              <>
                <Link
                  to="/admin/quizzes"
                  className="btn-primary px-8 py-3 text-lg"
                >
                  Browse Quizzes
                </Link>
                <Link
                  to="/admin"
                  className="btn-secondary px-8 py-3 text-lg"
                >
                  Go to Dashboard
                </Link>
              </>
            ) : (
              <>
                <Link
                  to="/quizzes"
                  className="btn-primary px-8 py-3 text-lg"
                >
                  Browse Quizzes
                </Link>
                <Link
                  to="/dashboard"
                  className="btn-secondary px-8 py-3 text-lg"
                >
                  Go to Dashboard
                </Link>
              </>
            )}
          </div>
        ) : (
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/register"
              className="btn-primary px-8 py-3 text-lg"
            >
              Get Started
            </Link>
            <Link
              to="/login"
              className="btn-secondary px-8 py-3 text-lg"
            >
              Sign In
            </Link>
          </div>
        )}
      </div>

      {/* Features Section */}
      <div className="py-12 md:py-20">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Why Choose KvizHub?
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Our platform offers everything you need to enhance your learning experience and compete with others.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature) => (
            <div key={feature.name} className="card text-center">
              <div className="flex justify-center mb-4">
                <feature.icon className="h-12 w-12 text-primary-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                {feature.name}
              </h3>
              <p className="text-gray-600">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Stats Section */}
      <div className="bg-primary-600 rounded-2xl py-12 md:py-16 px-6 md:px-12 text-center text-white">
        <h2 className="text-3xl md:text-4xl font-bold mb-8">
          Join Our Growing Community
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <div className="text-4xl md:text-5xl font-bold mb-2">10,000+</div>
            <div className="text-lg opacity-90">Active Users</div>
          </div>
          <div>
            <div className="text-4xl md:text-5xl font-bold mb-2">500+</div>
            <div className="text-lg opacity-90">Quizzes Available</div>
          </div>
          <div>
            <div className="text-4xl md:text-5xl font-bold mb-2">100,000+</div>
            <div className="text-lg opacity-90">Questions Answered</div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      {!isAuthenticated && (
        <div className="text-center py-12 md:py-20">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Ready to Test Your Knowledge?
          </h2>
          <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
            Join thousands of learners who are already improving their skills with KvizHub.
          </p>
          <Link
            to="/register"
            className="btn-primary px-8 py-3 text-lg"
          >
            Sign Up Now
          </Link>
        </div>
      )}
    </div>
  )
}

export default Home