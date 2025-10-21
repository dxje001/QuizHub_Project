import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useAuth } from '@/hooks/useAuth'
import {
  EyeIcon,
  EyeSlashIcon,
  RocketLaunchIcon,
  CheckCircleIcon,
  UserGroupIcon,
  AcademicCapIcon
} from '@heroicons/react/24/outline'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

const registerSchema = z.object({
  firstName: z.string().min(2, 'First name must be at least 2 characters'),
  lastName: z.string().min(2, 'Last name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
})

type RegisterForm = z.infer<typeof registerSchema>

const Register = () => {
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const { register: registerUser, isLoading } = useAuth()
  const navigate = useNavigate()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
  })

  const onSubmit = async (data: RegisterForm) => {
    try {
      const { confirmPassword, ...userData } = data
      await registerUser(userData)
      navigate('/dashboard')
    } catch (error) {
      // Error handling is done in useAuth hook
    }
  }

  const benefits = [
    'Access to 500+ curated quizzes',
    'Track your progress and performance',
    'Compete on global leaderboards',
    'Earn achievements and badges',
    'Join an active learning community'
  ]

  return (
    <div className="min-h-[calc(100vh-5rem)] flex items-center justify-center py-12">
      <div className="w-full max-w-6xl grid lg:grid-cols-2 gap-8 items-center">
        {/* Left Side - Branding */}
        <div className="hidden lg:block space-y-8 animate-fade-in-up">
          <div>
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-accent-100 border border-accent-200 rounded-full text-accent-700 text-sm font-medium mb-6">
              <RocketLaunchIcon className="h-4 w-4" />
              Start Your Journey
            </div>
            <h1 className="text-5xl font-bold text-secondary-900 mb-4">
              Join{' '}
              <span className="text-gradient">10,000+ Learners</span>
            </h1>
            <p className="text-xl text-secondary-600 leading-relaxed">
              Create your free account and unlock access to our comprehensive quiz platform. Start learning, competing, and achieving today.
            </p>
          </div>

          {/* Benefits List */}
          <div className="space-y-3">
            {benefits.map((benefit, index) => (
              <div
                key={benefit}
                className="flex items-center gap-3 animate-fade-in-up"
                style={{ animationDelay: `${(index + 1) * 100}ms` }}
              >
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-accent-100 flex items-center justify-center">
                  <CheckCircleIcon className="h-4 w-4 text-accent-600" />
                </div>
                <span className="text-secondary-700">{benefit}</span>
              </div>
            ))}
          </div>

          {/* Social Proof */}
          <div className="flex items-center gap-6 pt-4">
            <div className="flex -space-x-3">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-600 to-accent-600 border-2 border-white flex items-center justify-center text-white text-sm font-semibold"
                >
                  {String.fromCharCode(64 + i)}
                </div>
              ))}
            </div>
            <div>
              <div className="text-sm font-semibold text-secondary-900">Join our community</div>
              <div className="text-xs text-secondary-600">10,000+ active learners</div>
            </div>
          </div>
        </div>

        {/* Right Side - Register Form */}
        <div className="w-full max-w-md mx-auto lg:mx-0 animate-fade-in-up animation-delay-200">
          <div className="card-premium p-8">
            {/* Header */}
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-primary-600 to-accent-600 rounded-2xl shadow-soft mb-4">
                <RocketLaunchIcon className="h-8 w-8 text-white" />
              </div>
              <h2 className="text-3xl font-bold text-secondary-900 mb-2">Create Account</h2>
              <p className="text-secondary-600">Start your learning journey today</p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              {/* Name Fields */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="firstName" required>First Name</Label>
                  <Input
                    id="firstName"
                    type="text"
                    {...register('firstName')}
                    error={!!errors.firstName}
                    placeholder="John"
                    className="mt-1"
                  />
                  {errors.firstName && (
                    <p className="input-error">{errors.firstName.message}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="lastName" required>Last Name</Label>
                  <Input
                    id="lastName"
                    type="text"
                    {...register('lastName')}
                    error={!!errors.lastName}
                    placeholder="Doe"
                    className="mt-1"
                  />
                  {errors.lastName && (
                    <p className="input-error">{errors.lastName.message}</p>
                  )}
                </div>
              </div>

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
                    placeholder="Minimum 8 characters"
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

              {/* Confirm Password Field */}
              <div>
                <Label htmlFor="confirmPassword" required>Confirm Password</Label>
                <div className="relative mt-1">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    {...register('confirmPassword')}
                    error={!!errors.confirmPassword}
                    placeholder="Re-enter your password"
                    className="pr-12"
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-secondary-400 hover:text-secondary-600 transition-colors"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? (
                      <EyeSlashIcon className="h-5 w-5" />
                    ) : (
                      <EyeIcon className="h-5 w-5" />
                    )}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <p className="input-error">{errors.confirmPassword.message}</p>
                )}
              </div>

              {/* Terms Checkbox */}
              <div className="flex items-start gap-3">
                <input
                  id="terms"
                  type="checkbox"
                  className="mt-1 w-4 h-4 rounded border-secondary-300 text-primary-600 focus:ring-4 focus:ring-primary-100 transition-all"
                  required
                />
                <label htmlFor="terms" className="text-sm text-secondary-600 leading-relaxed">
                  I agree to the{' '}
                  <Link to="/terms" className="link">
                    Terms of Service
                  </Link>{' '}
                  and{' '}
                  <Link to="/privacy" className="link">
                    Privacy Policy
                  </Link>
                </label>
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
                {isLoading ? 'Creating account...' : 'Create Account'}
              </Button>
            </form>

            {/* Divider */}
            <div className="relative my-8">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-secondary-200"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-white text-secondary-500">Already have an account?</span>
              </div>
            </div>

            {/* Sign In Link */}
            <div className="text-center">
              <p className="text-secondary-600 mb-4">
                Sign in to access your dashboard
              </p>
              <Link to="/login">
                <Button variant="secondary" className="w-full" size="lg">
                  Sign In
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Register