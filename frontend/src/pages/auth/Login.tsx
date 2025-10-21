import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useAuth } from '@/hooks/useAuth'
import { EyeIcon, EyeSlashIcon, SparklesIcon, ShieldCheckIcon, BoltIcon } from '@heroicons/react/24/outline'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
})

type LoginForm = z.infer<typeof loginSchema>

const Login = () => {
  const [showPassword, setShowPassword] = useState(false)
  const { login, isLoading } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const from = location.state?.from?.pathname || '/dashboard'

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  })

  const onSubmit = async (data: LoginForm) => {
    try {
      const authData = await login(data)

      // Check if user is admin and redirect accordingly
      const isAdmin = authData.user?.roles?.includes('Admin')
      const redirectPath = isAdmin ? '/admin' : (from !== '/dashboard' ? from : '/dashboard')

      navigate(redirectPath, { replace: true })
    } catch (error) {
      // Error handling is done in useAuth hook
    }
  }

  const features = [
    {
      icon: SparklesIcon,
      title: 'Smart Learning',
      description: 'Personalized quiz recommendations'
    },
    {
      icon: ShieldCheckIcon,
      title: 'Secure & Private',
      description: 'Your data is always protected'
    },
    {
      icon: BoltIcon,
      title: 'Instant Results',
      description: 'Get feedback immediately'
    }
  ]

  return (
    <div className="min-h-[calc(100vh-5rem)] flex items-center justify-center py-12">
      <div className="w-full max-w-6xl grid lg:grid-cols-2 gap-8 items-center">
        {/* Left Side - Branding */}
        <div className="hidden lg:block space-y-8 animate-fade-in-up">
          <div>
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary-100 border border-primary-200 rounded-full text-primary-700 text-sm font-medium mb-6">
              <SparklesIcon className="h-4 w-4" />
              Welcome Back
            </div>
            <h1 className="text-5xl font-bold text-secondary-900 mb-4">
              Continue Your{' '}
              <span className="text-gradient">Learning Journey</span>
            </h1>
            <p className="text-xl text-secondary-600 leading-relaxed">
              Sign in to access your personalized dashboard, track your progress, and compete with learners worldwide.
            </p>
          </div>

          {/* Features */}
          <div className="space-y-4">
            {features.map((feature, index) => {
              const Icon = feature.icon
              return (
                <div
                  key={feature.title}
                  className="flex items-start gap-4 p-4 rounded-xl bg-white/50 backdrop-blur-sm border border-secondary-200/50 animate-fade-in-up"
                  style={{ animationDelay: `${(index + 1) * 100}ms` }}
                >
                  <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-gradient-to-br from-primary-600 to-accent-600 flex items-center justify-center">
                    <Icon className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-secondary-900 mb-1">{feature.title}</h3>
                    <p className="text-sm text-secondary-600">{feature.description}</p>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Stats */}
          <div className="flex items-center gap-8 pt-4">
            <div>
              <div className="text-3xl font-bold text-primary-600">10k+</div>
              <div className="text-sm text-secondary-600">Active Users</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-accent-600">500+</div>
              <div className="text-sm text-secondary-600">Quizzes</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-secondary-900">4.9★</div>
              <div className="text-sm text-secondary-600">User Rating</div>
            </div>
          </div>
        </div>

        {/* Right Side - Login Form */}
        <div className="w-full max-w-md mx-auto lg:mx-0 animate-fade-in-up animation-delay-200">
          <div className="card-premium p-8">
            {/* Header */}
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-primary-600 to-accent-600 rounded-2xl shadow-soft mb-4">
                <SparklesIcon className="h-8 w-8 text-white" />
              </div>
              <h2 className="text-3xl font-bold text-secondary-900 mb-2">Sign In</h2>
              <p className="text-secondary-600">Enter your credentials to continue</p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              {/* Email Field */}
              <div>
                <Label htmlFor="email" required>Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  {...register('email')}
                  error={!!errors.email}
                  placeholder="you@example.com"
                  className="mt-1"
                />
                {errors.email && (
                  <p className="input-error">{errors.email.message}</p>
                )}
              </div>

              {/* Password Field */}
              <div>
                <Label htmlFor="password" required>Password</Label>
                <div className="relative mt-1">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    {...register('password')}
                    error={!!errors.password}
                    placeholder="Enter your password"
                    className="pr-12"
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-secondary-400 hover:text-secondary-600 transition-colors"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeSlashIcon className="h-5 w-5" />
                    ) : (
                      <EyeIcon className="h-5 w-5" />
                    )}
                  </button>
                </div>
                {errors.password && (
                  <p className="input-error">{errors.password.message}</p>
                )}
              </div>

              {/* Remember & Forgot */}
              <div className="flex items-center justify-between text-sm">
                <label className="flex items-center gap-2 cursor-pointer group">
                  <input
                    type="checkbox"
                    className="w-4 h-4 rounded border-secondary-300 text-primary-600 focus:ring-4 focus:ring-primary-100 transition-all"
                  />
                  <span className="text-secondary-600 group-hover:text-secondary-900 transition-colors">
                    Remember me
                  </span>
                </label>
                <Link
                  to="/forgot-password"
                  className="link text-sm"
                >
                  Forgot password?
                </Link>
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                variant="primary"
                className="w-full"
                size="lg"
                isLoading={isLoading}
                disabled={isLoading}
              >
                {isLoading ? 'Signing in...' : 'Sign In'}
              </Button>
            </form>

            {/* Divider */}
            <div className="relative my-8">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-secondary-200"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-white text-secondary-500">New to KvizHub?</span>
              </div>
            </div>

            {/* Sign Up Link */}
            <div className="text-center">
              <p className="text-secondary-600 mb-4">
                Create an account and start learning today
              </p>
              <Link to="/register">
                <Button variant="secondary" className="w-full" size="lg">
                  Create Free Account
                </Button>
              </Link>
            </div>
          </div>

          {/* Test Credentials Info */}
          <div className="mt-6 p-4 bg-primary-50 border border-primary-200 rounded-xl">
            <p className="text-sm text-primary-800 font-medium mb-2">Test Credentials:</p>
            <div className="space-y-1 text-sm text-primary-700">
              <p><strong>Admin:</strong> admin@kvizhub.com / Admin123!</p>
              <p><strong>User:</strong> john.doe@example.com / Test123!</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Login