import { createContext, useContext, useState, useEffect } from 'react'
import { getUserById } from '../lib/supabase'

const AuthContext = createContext(null)

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const savedUserId = localStorage.getItem('mundial_user_id')
    if (savedUserId) {
      getUserById(parseInt(savedUserId)).then(userData => {
        if (userData) setUser(userData)
        setLoading(false)
      })
    } else {
      setLoading(false)
    }
  }, [])

  const login = (userData) => {
    setUser(userData)
    localStorage.setItem('mundial_user_id', userData.id.toString())
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem('mundial_user_id')
  }

  const refreshUser = async () => {
    if (user) {
      const updated = await getUserById(user.id)
      if (updated) setUser(updated)
    }
  }

  return (
    <AuthContext.Provider value={{ user, login, logout, loading, refreshUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within AuthProvider')
  return context
}