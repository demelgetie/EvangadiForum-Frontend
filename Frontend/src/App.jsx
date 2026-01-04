import React, { useEffect, useMemo, useState } from 'react'
import axios from 'axios'
import { Route, Routes, Navigate, Outlet, useNavigate } from 'react-router-dom'
import Header from './components/Header/Header'
import Footer from './components/Footer/Footer'
import Home from './pages/Home/Home'
import Login from './pages/Login/Login'
import Signup from './pages/Signup/Signup'
import Question from './pages/Question/Question'
import Ask from './pages/Ask/Ask'
import About from './pages/About/About'
import Profile from './pages/Profile/Profile'
import Notifications from './pages/Notifications/Notifications'
import Reset from './pages/Reset/Reset'
import ResetConfirm from './pages/ResetConfirm/ResetConfirm'
import Admin from './pages/Admin/Admin'

export const AuthContext = React.createContext(null)

export default function App() {
  const [token, setToken] = useState(localStorage.getItem('token') || '')
  const [username, setUsername] = useState(localStorage.getItem('username') || '')
  const [role, setRole] = useState(localStorage.getItem('role') || 'user')
  const navigate = useNavigate()

  useEffect(() => {
    if (token) {
      localStorage.setItem('token', token)
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
    } else {
      localStorage.removeItem('token')
      delete axios.defaults.headers.common['Authorization']
    }
  }, [token])

  useEffect(() => {
    if (username) {
      localStorage.setItem('username', username)
    } else {
      localStorage.removeItem('username')
    }
  }, [username])
  useEffect(() => {
    if (role) {
      localStorage.setItem('role', role)
    } else {
      localStorage.removeItem('role')
    }
  }, [role])

  const logout = () => {
    setToken('')
    setUsername('')
    navigate('/login')
  }

  useEffect(() => {
    const id = axios.interceptors.response.use(
      r => r,
      err => {
        if (err?.response?.status === 401) {
          logout()
        }
        return Promise.reject(err)
      }
    )
    return () => axios.interceptors.response.eject(id)
  }, [logout])

  const value = useMemo(() => ({ token, setToken, username, setUsername, role, setRole, logout }), [token, username, role])

  const RequireAuth = () => {
    if (!token) return <Navigate to="/login" replace />
    return <Outlet />
  }

  const Layout = () => (
    <div className="layout">
      <Header />
      <main className="content">
        <Outlet />
      </main>
      <Footer />
    </div>
  )

  return (
    <AuthContext.Provider value={value}>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/about" element={<About />} />
          <Route path="/profile/:username" element={<Profile />} />
          <Route path="/notifications" element={<Notifications />} />
          <Route path="/reset" element={<Reset />} />
          <Route path="/reset/confirm" element={<ResetConfirm />} />
          <Route path="/question/:questionid" element={<Question />} />
          <Route element={<RequireAuth />}>
            <Route path="/ask" element={<Ask />} />
            <Route path="/admin" element={<Admin />} />
          </Route>
        </Route>
      </Routes>
    </AuthContext.Provider>
  )
}
