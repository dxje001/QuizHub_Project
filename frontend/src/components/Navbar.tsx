import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'
import { Menu, Transition } from '@headlessui/react'
import { Fragment, useState } from 'react'
import {
  UserIcon,
  ArrowRightOnRectangleIcon,
  ChartBarIcon,
  TrophyIcon,
  CogIcon,
  Bars3Icon,
  XMarkIcon,
  SparklesIcon,
  HomeIcon,
  AcademicCapIcon,
} from '@heroicons/react/24/outline'
import { cn } from '@/lib/utils'
import authService from '@/services/authService'
import toast from 'react-hot-toast'
import { Button } from '@/components/ui/button'

const Navbar = () => {
  const { isAuthenticated, user, logout } = useAuthStore()
  const navigate = useNavigate()
  const location = useLocation()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const handleLogout = async () => {
    try {
      await authService.logout()
      logout()
      navigate('/')
      toast.success('Logged out successfully')
    } catch (error) {
      logout()
      navigate('/')
    }
  }

  const isActive = (path: string) => location.pathname === path

  const adminNavItems = [
    { to: '/admin', label: 'Dashboard', icon: CogIcon },
    { to: '/admin/quizzes', label: 'Quizzes', icon: AcademicCapIcon },
    { to: '/admin/results', label: 'Results', icon: ChartBarIcon },
  ]

  const userNavItems = [
    { to: '/dashboard', label: 'Dashboard', icon: HomeIcon },
    { to: '/quizzes', label: 'Quizzes', icon: AcademicCapIcon },
    { to: '/my-results', label: 'My Results', icon: ChartBarIcon },
    { to: '/leaderboard', label: 'Leaderboard', icon: TrophyIcon },
  ]

  const navItems = user?.roles?.includes('Admin') ? adminNavItems : userNavItems

  return (
    <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-secondary-200/50 shadow-soft">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-20">
          {/* Logo & Brand */}
          <div className="flex items-center">
            <Link to="/" className="flex items-center gap-3 group">
              <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-br from-primary-600 to-accent-600 rounded-xl shadow-soft group-hover:shadow-glow transition-all duration-300 group-hover:scale-110">
                <SparklesIcon className="h-6 w-6 text-white" />
              </div>
              <span className="text-2xl font-bold bg-gradient-to-r from-primary-600 to-accent-600 bg-clip-text text-transparent">
                KvizHub
              </span>
            </Link>

            {/* Desktop Navigation */}
            {isAuthenticated && (
              <div className="hidden lg:ml-10 lg:flex lg:space-x-2">
                {navItems.map((item) => {
                  const Icon = item.icon
                  const active = isActive(item.to)
                  return (
                    <Link
                      key={item.to}
                      to={item.to}
                      className={cn(
                        'flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200',
                        active
                          ? 'bg-primary-600 text-white shadow-soft'
                          : 'text-secondary-700 hover:bg-secondary-100 hover:text-secondary-900'
                      )}
                    >
                      <Icon className="h-4 w-4" />
                      {item.label}
                    </Link>
                  )
                })}
              </div>
            )}
          </div>

          {/* Right Side Actions */}
          <div className="flex items-center gap-4">
            {isAuthenticated ? (
              <>
                {/* User Menu */}
                <Menu as="div" className="relative">
                  <Menu.Button className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-secondary-100 transition-all duration-200 group">
                    <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary-600 to-accent-600 flex items-center justify-center shadow-soft group-hover:shadow-medium transition-all">
                      <span className="text-white text-sm font-semibold">
                        {user?.firstName?.[0]}{user?.lastName?.[0]}
                      </span>
                    </div>
                    <div className="hidden md:block text-left">
                      <div className="text-sm font-medium text-secondary-900">
                        {user?.firstName} {user?.lastName}
                      </div>
                      <div className="text-xs text-secondary-500">{user?.email}</div>
                    </div>
                  </Menu.Button>

                  <Transition
                    as={Fragment}
                    enter="transition ease-out duration-200"
                    enterFrom="transform opacity-0 scale-95"
                    enterTo="transform opacity-100 scale-100"
                    leave="transition ease-in duration-150"
                    leaveFrom="transform opacity-100 scale-100"
                    leaveTo="transform opacity-0 scale-95"
                  >
                    <Menu.Items className="absolute right-0 mt-3 w-64 origin-top-right bg-white/95 backdrop-blur-md rounded-2xl shadow-hard border border-secondary-200/50 focus:outline-none overflow-hidden">
                      {/* User Info Header */}
                      <div className="px-4 py-4 bg-gradient-to-br from-primary-50 to-accent-50 border-b border-secondary-200/50">
                        <div className="font-semibold text-secondary-900">{user?.firstName} {user?.lastName}</div>
                        <div className="text-sm text-secondary-600">{user?.email}</div>
                        {user?.roles && (
                          <div className="mt-2">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-700 border border-primary-200">
                              {user.roles[0]}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Menu Items */}
                      <div className="py-2">
                        <Menu.Item>
                          {({ active }) => (
                            <Link
                              to="/profile"
                              className={cn(
                                'flex items-center gap-3 px-4 py-3 text-sm transition-colors',
                                active ? 'bg-secondary-100 text-secondary-900' : 'text-secondary-700'
                              )}
                            >
                              <UserIcon className="h-5 w-5" />
                              <span className="font-medium">Profile Settings</span>
                            </Link>
                          )}
                        </Menu.Item>

                        {user?.roles?.includes('Admin') ? (
                          <Menu.Item>
                            {({ active }) => (
                              <Link
                                to="/admin"
                                className={cn(
                                  'flex items-center gap-3 px-4 py-3 text-sm transition-colors',
                                  active ? 'bg-secondary-100 text-secondary-900' : 'text-secondary-700'
                                )}
                              >
                                <CogIcon className="h-5 w-5" />
                                <span className="font-medium">Admin Dashboard</span>
                              </Link>
                            )}
                          </Menu.Item>
                        ) : (
                          <Menu.Item>
                            {({ active }) => (
                              <Link
                                to="/dashboard"
                                className={cn(
                                  'flex items-center gap-3 px-4 py-3 text-sm transition-colors',
                                  active ? 'bg-secondary-100 text-secondary-900' : 'text-secondary-700'
                                )}
                              >
                                <ChartBarIcon className="h-5 w-5" />
                                <span className="font-medium">Dashboard</span>
                              </Link>
                            )}
                          </Menu.Item>
                        )}
                      </div>

                      {/* Logout */}
                      <div className="border-t border-secondary-200/50 py-2">
                        <Menu.Item>
                          {({ active }) => (
                            <button
                              onClick={handleLogout}
                              className={cn(
                                'flex items-center gap-3 w-full px-4 py-3 text-sm transition-colors',
                                active ? 'bg-danger-50 text-danger-700' : 'text-danger-600'
                              )}
                            >
                              <ArrowRightOnRectangleIcon className="h-5 w-5" />
                              <span className="font-medium">Sign Out</span>
                            </button>
                          )}
                        </Menu.Item>
                      </div>
                    </Menu.Items>
                  </Transition>
                </Menu>

                {/* Mobile Menu Button */}
                <button
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                  className="lg:hidden p-2 rounded-xl hover:bg-secondary-100 transition-colors"
                >
                  {mobileMenuOpen ? (
                    <XMarkIcon className="h-6 w-6 text-secondary-700" />
                  ) : (
                    <Bars3Icon className="h-6 w-6 text-secondary-700" />
                  )}
                </button>
              </>
            ) : (
              <div className="flex items-center gap-3">
                <Link to="/login">
                  <Button variant="ghost" size="sm">
                    Sign In
                  </Button>
                </Link>
                <Link to="/register">
                  <Button variant="primary" size="sm">
                    Get Started
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Mobile Menu */}
        {isAuthenticated && mobileMenuOpen && (
          <div className="lg:hidden pb-4 pt-2 border-t border-secondary-200/50 animate-slide-down">
            <div className="flex flex-col space-y-2">
              {navItems.map((item) => {
                const Icon = item.icon
                const active = isActive(item.to)
                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    onClick={() => setMobileMenuOpen(false)}
                    className={cn(
                      'flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200',
                      active
                        ? 'bg-primary-600 text-white shadow-soft'
                        : 'text-secondary-700 hover:bg-secondary-100'
                    )}
                  >
                    <Icon className="h-5 w-5" />
                    {item.label}
                  </Link>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}

export default Navbar