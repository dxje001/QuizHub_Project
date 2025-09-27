import { Link, useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'
import { Menu, Transition } from '@headlessui/react'
import { Fragment } from 'react'
import {
  UserIcon,
  ArrowRightOnRectangleIcon,
  ChartBarIcon,
  TrophyIcon,
  CogIcon,
} from '@heroicons/react/24/outline'
import clsx from 'clsx'
import authService from '@/services/authService'
import toast from 'react-hot-toast'

const Navbar = () => {
  const { isAuthenticated, user, logout } = useAuthStore()
  const navigate = useNavigate()

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

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200">
      <div className="container mx-auto px-4">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="flex-shrink-0">
              <h1 className="text-2xl font-bold text-primary-600">KvizHub</h1>
            </Link>

            {isAuthenticated && (
              <div className="hidden md:ml-6 md:flex md:space-x-8">
                {user?.roles?.includes('Admin') ? (
                  <>
                    <Link
                      to="/admin"
                      className="text-gray-900 hover:text-primary-600 px-3 py-2 rounded-md text-sm font-medium transition-colors"
                    >
                      <CogIcon className="w-4 h-4 inline mr-1" />
                      Admin Dashboard
                    </Link>
                    <Link
                      to="/admin/quizzes"
                      className="text-gray-900 hover:text-primary-600 px-3 py-2 rounded-md text-sm font-medium transition-colors"
                    >
                      Manage Quizzes
                    </Link>
                    <Link
                      to="/admin/results"
                      className="text-gray-900 hover:text-primary-600 px-3 py-2 rounded-md text-sm font-medium transition-colors"
                    >
                      <ChartBarIcon className="w-4 h-4 inline mr-1" />
                      All Results
                    </Link>
                  </>
                ) : (
                  <>
                    <Link
                      to="/dashboard"
                      className="text-gray-900 hover:text-primary-600 px-3 py-2 rounded-md text-sm font-medium transition-colors"
                    >
                      Dashboard
                    </Link>
                    <Link
                      to="/quizzes"
                      className="text-gray-900 hover:text-primary-600 px-3 py-2 rounded-md text-sm font-medium transition-colors"
                    >
                      Quizzes
                    </Link>
                    <Link
                      to="/my-results"
                      className="text-gray-900 hover:text-primary-600 px-3 py-2 rounded-md text-sm font-medium transition-colors"
                    >
                      <ChartBarIcon className="w-4 h-4 inline mr-1" />
                      My Results
                    </Link>
                    <Link
                      to="/leaderboard"
                      className="text-gray-900 hover:text-primary-600 px-3 py-2 rounded-md text-sm font-medium transition-colors"
                    >
                      <TrophyIcon className="w-4 h-4 inline mr-1" />
                      Leaderboard
                    </Link>
                  </>
                )}
              </div>
            )}
          </div>

          <div className="flex items-center">
            {isAuthenticated ? (
              <Menu as="div" className="relative ml-3">
                <div>
                  <Menu.Button className="bg-white rounded-full flex text-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500">
                    <span className="sr-only">Open user menu</span>
                    <div className="h-8 w-8 rounded-full bg-primary-600 flex items-center justify-center">
                      <span className="text-white text-sm font-medium">
                        {user?.firstName?.[0]}{user?.lastName?.[0]}
                      </span>
                    </div>
                  </Menu.Button>
                </div>
                <Transition
                  as={Fragment}
                  enter="transition ease-out duration-100"
                  enterFrom="transform opacity-0 scale-95"
                  enterTo="transform opacity-100 scale-100"
                  leave="transition ease-in duration-75"
                  leaveFrom="transform opacity-100 scale-100"
                  leaveTo="transform opacity-0 scale-95"
                >
                  <Menu.Items className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg py-1 bg-white ring-1 ring-black ring-opacity-5 focus:outline-none z-50">
                    <div className="px-4 py-2 text-sm text-gray-700 border-b border-gray-200">
                      <div className="font-medium">{user?.firstName} {user?.lastName}</div>
                      <div className="text-gray-500">{user?.email}</div>
                    </div>

                    <Menu.Item>
                      {({ active }) => (
                        <Link
                          to="/profile"
                          className={clsx(
                            active ? 'bg-gray-100' : '',
                            'flex px-4 py-2 text-sm text-gray-700'
                          )}
                        >
                          <UserIcon className="mr-3 h-4 w-4" />
                          Profile
                        </Link>
                      )}
                    </Menu.Item>

                    {user?.roles?.includes('Admin') ? (
                      <Menu.Item>
                        {({ active }) => (
                          <Link
                            to="/admin"
                            className={clsx(
                              active ? 'bg-gray-100' : '',
                              'flex px-4 py-2 text-sm text-gray-700'
                            )}
                          >
                            <CogIcon className="mr-3 h-4 w-4" />
                            Admin Dashboard
                          </Link>
                        )}
                      </Menu.Item>
                    ) : (
                      <Menu.Item>
                        {({ active }) => (
                          <Link
                            to="/dashboard"
                            className={clsx(
                              active ? 'bg-gray-100' : '',
                              'flex px-4 py-2 text-sm text-gray-700'
                            )}
                          >
                            <ChartBarIcon className="mr-3 h-4 w-4" />
                            Dashboard
                          </Link>
                        )}
                      </Menu.Item>
                    )}

                    <Menu.Item>
                      {({ active }) => (
                        <button
                          onClick={handleLogout}
                          className={clsx(
                            active ? 'bg-gray-100' : '',
                            'flex w-full px-4 py-2 text-sm text-gray-700'
                          )}
                        >
                          <ArrowRightOnRectangleIcon className="mr-3 h-4 w-4" />
                          Sign out
                        </button>
                      )}
                    </Menu.Item>
                  </Menu.Items>
                </Transition>
              </Menu>
            ) : (
              <div className="flex space-x-4">
                <Link
                  to="/login"
                  className="text-gray-900 hover:text-primary-600 px-3 py-2 rounded-md text-sm font-medium transition-colors"
                >
                  Sign in
                </Link>
                <Link
                  to="/register"
                  className="btn-primary"
                >
                  Sign up
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}

export default Navbar