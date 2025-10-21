import { Link } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'
import {
  SparklesIcon,
  TrophyIcon,
  ChartBarIcon,
  AcademicCapIcon,
  UsersIcon,
  ClockIcon,
  ShieldCheckIcon,
  RocketLaunchIcon,
  ArrowRightIcon,
} from '@heroicons/react/24/outline'
import { Button } from '@/components/ui/button'

const Home = () => {
  const { isAuthenticated, user } = useAuthStore()

  const features = [
    {
      name: 'Interactive Quizzes',
      description: 'Engage with dynamic quizzes featuring multiple question types and instant feedback.',
      icon: AcademicCapIcon,
      gradient: 'from-blue-500 to-cyan-500',
    },
    {
      name: 'Global Leaderboards',
      description: 'Compete globally and track your ranking against thousands of quiz takers.',
      icon: TrophyIcon,
      gradient: 'from-amber-500 to-orange-500',
    },
    {
      name: 'Advanced Analytics',
      description: 'Gain deep insights into your performance with comprehensive statistics.',
      icon: ChartBarIcon,
      gradient: 'from-emerald-500 to-teal-500',
    },
    {
      name: 'Real-time Progress',
      description: 'Monitor your improvement with live progress tracking and personalized recommendations.',
      icon: ClockIcon,
      gradient: 'from-violet-500 to-purple-500',
    },
  ]

  const benefits = [
    {
      icon: RocketLaunchIcon,
      title: 'Instant Start',
      description: 'Jump right in and start taking quizzes within seconds of signing up.',
    },
    {
      icon: ShieldCheckIcon,
      title: 'Verified Content',
      description: 'All quizzes are carefully curated to ensure accuracy and quality.',
    },
    {
      icon: UsersIcon,
      title: 'Active Community',
      description: 'Join a thriving community of learners and knowledge enthusiasts.',
    },
  ]

  return (
    <div className="min-h-screen">
      {/* Hero Section with Gradient Background */}
      <div className="relative overflow-hidden bg-gradient-to-br from-secondary-900 via-secondary-800 to-primary-900">
        {/* Decorative Background Pattern */}
        <div className="absolute inset-0 bg-pattern-dots opacity-10"></div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-32">
          <div className="text-center">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-md border border-white/20 rounded-full text-white mb-8 animate-fade-in-down">
              <SparklesIcon className="h-5 w-5" />
              <span className="text-sm font-medium">The Ultimate Quiz Platform</span>
            </div>

            {/* Main Heading */}
            <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 animate-fade-in-up animation-delay-100">
              Master Any Subject with{' '}
              <span className="bg-gradient-to-r from-primary-400 to-accent-400 bg-clip-text text-transparent">
                KvizHub
              </span>
            </h1>

            {/* Subtitle */}
            <p className="text-xl md:text-2xl text-secondary-200 mb-10 max-w-3xl mx-auto animate-fade-in-up animation-delay-200">
              Challenge yourself, compete with others, and track your progress in our comprehensive learning platform built for curious minds.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center animate-fade-in-up animation-delay-300">
              {isAuthenticated ? (
                <>
                  {user?.roles?.includes('Admin') ? (
                    <>
                      <Link to="/admin/quizzes">
                        <Button size="lg" variant="primary" className="group">
                          Manage Quizzes
                          <ArrowRightIcon className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                        </Button>
                      </Link>
                      <Link to="/admin">
                        <Button size="lg" variant="secondary">
                          Admin Dashboard
                        </Button>
                      </Link>
                    </>
                  ) : (
                    <>
                      <Link to="/quizzes">
                        <Button size="lg" variant="primary" className="group">
                          Browse Quizzes
                          <ArrowRightIcon className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                        </Button>
                      </Link>
                      <Link to="/dashboard">
                        <Button size="lg" variant="secondary">
                          My Dashboard
                        </Button>
                      </Link>
                    </>
                  )}
                </>
              ) : (
                <>
                  <Link to="/register">
                    <Button size="lg" variant="primary" className="group">
                      Get Started Free
                      <ArrowRightIcon className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                    </Button>
                  </Link>
                  <Link to="/login">
                    <Button size="lg" variant="secondary">
                      Sign In
                    </Button>
                  </Link>
                </>
              )}
            </div>

            {/* Trust Indicators */}
            <div className="mt-12 flex flex-col sm:flex-row items-center justify-center gap-8 text-secondary-300 text-sm">
              <div className="flex items-center gap-2">
                <UsersIcon className="h-5 w-5" />
                <span>10,000+ Active Learners</span>
              </div>
              <div className="flex items-center gap-2">
                <AcademicCapIcon className="h-5 w-5" />
                <span>500+ Quizzes</span>
              </div>
              <div className="flex items-center gap-2">
                <TrophyIcon className="h-5 w-5" />
                <span>100,000+ Completions</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-32">
        <div className="text-center mb-16">
          <h2 className="section-heading animate-fade-in-up">
            Everything You Need to Excel
          </h2>
          <p className="section-subheading mx-auto animate-fade-in-up animation-delay-100">
            Powerful features designed to accelerate your learning journey and help you achieve your goals.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => (
            <div
              key={feature.name}
              className="group card-premium hover:shadow-hard transition-all duration-300 animate-fade-in-up"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className={`inline-flex p-3 rounded-xl bg-gradient-to-br ${feature.gradient} mb-4 group-hover:scale-110 transition-transform duration-300`}>
                <feature.icon className="h-7 w-7 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-secondary-900 mb-2">
                {feature.name}
              </h3>
              <p className="text-secondary-600 leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Benefits Section */}
      <div className="bg-gradient-to-br from-primary-50 to-accent-50 py-20 md:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="section-heading">Why Learners Choose KvizHub</h2>
            <p className="section-subheading mx-auto">
              Join thousands of successful learners who trust KvizHub for their education.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {benefits.map((benefit, index) => (
              <div
                key={benefit.title}
                className="flex flex-col items-center text-center p-8 animate-scale-in"
                style={{ animationDelay: `${index * 150}ms` }}
              >
                <div className="inline-flex p-4 rounded-2xl bg-white shadow-soft mb-6">
                  <benefit.icon className="h-10 w-10 text-primary-600" />
                </div>
                <h3 className="text-xl font-semibold text-secondary-900 mb-3">
                  {benefit.title}
                </h3>
                <p className="text-secondary-600">
                  {benefit.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-32">
        <div className="relative overflow-hidden bg-gradient-to-br from-primary-600 via-primary-700 to-accent-600 rounded-3xl p-12 md:p-16 shadow-hard">
          {/* Decorative Elements */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-32 translate-x-32 blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-accent-400/20 rounded-full translate-y-32 -translate-x-32 blur-3xl"></div>

          <div className="relative text-center text-white">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              Join Our Thriving Community
            </h2>
            <p className="text-xl text-primary-100 mb-12 max-w-2xl mx-auto">
              Be part of a global network of learners pushing boundaries every day.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
              <div className="animate-fade-in-up">
                <div className="text-5xl md:text-6xl font-bold mb-3 bg-gradient-to-br from-white to-primary-100 bg-clip-text text-transparent">
                  10,000+
                </div>
                <div className="text-lg text-primary-100 font-medium">Active Users</div>
              </div>
              <div className="animate-fade-in-up animation-delay-100">
                <div className="text-5xl md:text-6xl font-bold mb-3 bg-gradient-to-br from-white to-primary-100 bg-clip-text text-transparent">
                  500+
                </div>
                <div className="text-lg text-primary-100 font-medium">Expert-Curated Quizzes</div>
              </div>
              <div className="animate-fade-in-up animation-delay-200">
                <div className="text-5xl md:text-6xl font-bold mb-3 bg-gradient-to-br from-white to-primary-100 bg-clip-text text-transparent">
                  100k+
                </div>
                <div className="text-lg text-primary-100 font-medium">Questions Answered</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Final CTA Section */}
      {!isAuthenticated && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-32">
          <div className="card-premium text-center p-12 md:p-16">
            <h2 className="text-4xl md:text-5xl font-bold text-secondary-900 mb-4">
              Ready to Begin Your Journey?
            </h2>
            <p className="text-xl text-secondary-600 mb-10 max-w-2xl mx-auto">
              Join thousands of learners who are already mastering new skills with KvizHub. Start your first quiz today!
            </p>
            <Link to="/register">
              <Button size="lg" variant="primary" className="group">
                Create Free Account
                <ArrowRightIcon className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
            <p className="text-sm text-secondary-500 mt-6">
              No credit card required • Free forever • Cancel anytime
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

export default Home