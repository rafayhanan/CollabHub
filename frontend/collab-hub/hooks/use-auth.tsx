"use client"

import { useState, useEffect, useContext, createContext, type ReactNode } from "react"
import { getCurrentUser, logout as logoutUser, type User } from "@/lib/auth"

interface AuthContextType {
  user: User | null
  isLoading: boolean
  login: (user: User) => void
  logout: () => Promise<void>
  isAuthenticated: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [hasMounted, setHasMounted] = useState(false)

  useEffect(() => {
    // Set mounted flag first to avoid hydration mismatch
    setHasMounted(true)
    
    // Check for existing authentication on mount
    const currentUser = getCurrentUser()
    setUser(currentUser)
    setIsLoading(false)
  }, [])

  // Prevent hydration mismatch by not rendering auth-dependent content until mounted
  if (!hasMounted) {
    return (
      <AuthContext.Provider 
        value={{
          user: null,
          isLoading: true,
          login: () => {},
          logout: async () => {},
          isAuthenticated: false,
        }}
      >
        {children}
      </AuthContext.Provider>
    )
  }

  const login = (userData: User) => {
    setUser(userData)
  }

  const logout = async () => {
    await logoutUser()
    setUser(null)
  }

  const value = {
    user,
    isLoading,
    login,
    logout,
    isAuthenticated: !!user,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
