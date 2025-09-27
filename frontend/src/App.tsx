import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import Layout from '@/components/Layout'
import Home from '@/pages/Home'
import Login from '@/pages/auth/Login'
import Register from '@/pages/auth/Register'
import Dashboard from '@/pages/Dashboard'
import QuizList from '@/pages/quiz/QuizList'
import QuizDetail from '@/pages/quiz/QuizDetail'
import CreateQuiz from '@/pages/quiz/CreateQuiz'
import EditQuiz from '@/pages/quiz/EditQuiz'
import TakeQuiz from '@/pages/quiz/TakeQuiz'
import Results from '@/pages/quiz/Results'
import MyResults from '@/pages/quiz/MyResults'
import Leaderboard from '@/pages/Leaderboard'
import Profile from '@/pages/Profile'
import AdminDashboard from '@/pages/admin/AdminDashboard'
import QuizManagement from '@/pages/admin/QuizManagement'
import AllResults from '@/pages/admin/AllResults'
import ProtectedRoute from '@/components/ProtectedRoute'

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#363636',
              color: '#fff',
            },
          }}
        />
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Home />} />
            <Route path="login" element={<Login />} />
            <Route path="register" element={<Register />} />

            {/* Protected Routes */}
            <Route path="dashboard" element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } />
            <Route path="quizzes" element={
              <ProtectedRoute>
                <QuizList />
              </ProtectedRoute>
            } />
            <Route path="quizzes/create" element={
              <ProtectedRoute>
                <CreateQuiz />
              </ProtectedRoute>
            } />
            <Route path="quizzes/:id" element={
              <ProtectedRoute>
                <QuizDetail />
              </ProtectedRoute>
            } />
            <Route path="quizzes/:id/edit" element={
              <ProtectedRoute>
                <EditQuiz />
              </ProtectedRoute>
            } />
            <Route path="quizzes/:id/take" element={
              <ProtectedRoute>
                <TakeQuiz />
              </ProtectedRoute>
            } />
            <Route path="results/:attemptId" element={
              <ProtectedRoute>
                <Results />
              </ProtectedRoute>
            } />
            <Route path="my-results" element={
              <ProtectedRoute>
                <MyResults />
              </ProtectedRoute>
            } />
            <Route path="leaderboard" element={
              <ProtectedRoute>
                <Leaderboard />
              </ProtectedRoute>
            } />
            <Route path="profile" element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            } />
            <Route path="admin" element={
              <ProtectedRoute>
                <AdminDashboard />
              </ProtectedRoute>
            } />
            <Route path="admin/quizzes" element={
              <ProtectedRoute>
                <QuizManagement />
              </ProtectedRoute>
            } />
            <Route path="admin/results" element={
              <ProtectedRoute>
                <AllResults />
              </ProtectedRoute>
            } />
          </Route>
        </Routes>
      </div>
    </Router>
  )
}

export default App