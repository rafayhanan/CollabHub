import { jwtDecode } from "jwt-decode"

const API_BASE_URL = "http://localhost:3000/api"

export interface User {
  id: string
  email: string
  name?: string
  avatarUrl?: string
}

interface AuthResponse {
  message: string
  accessToken: string
  user: User
}

interface DecodedToken {
  userId: string
  email: string
  exp: number
}

// Token management
export const getAccessToken = (): string | null => {
  if (typeof window === "undefined") return null
  return localStorage.getItem("accessToken")
}

export const setAccessToken = (token: string): void => {
  if (typeof window === "undefined") return
  localStorage.setItem("accessToken", token)
}

export const removeAccessToken = (): void => {
  if (typeof window === "undefined") return
  localStorage.removeItem("accessToken")
}

export const isTokenExpired = (token: string): boolean => {
  try {
    const decoded = jwtDecode<DecodedToken>(token)
    return decoded.exp * 1000 < Date.now()
  } catch {
    return true
  }
}

export const getCurrentUser = (): User | null => {
  const token = getAccessToken()
  if (!token || isTokenExpired(token)) return null

  try {
    const decoded = jwtDecode<DecodedToken>(token)
    return {
      id: decoded.userId,
      email: decoded.email,
    }
  } catch {
    return null
  }
}

// API calls
export const register = async (email: string, password: string): Promise<AuthResponse> => {
  const response = await fetch(`${API_BASE_URL}/auth/register`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email, password }),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.message || "Registration failed")
  }

  return response.json()
}

export const login = async (email: string, password: string): Promise<AuthResponse> => {
  const response = await fetch(`${API_BASE_URL}/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include", // Include cookies for refresh token
    body: JSON.stringify({ email, password }),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.message || "Login failed")
  }

  return response.json()
}

export const logout = async (): Promise<void> => {
  const token = getAccessToken()
  if (!token) return

  try {
    await fetch(`${API_BASE_URL}/auth/logout`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      credentials: "include",
    })
  } catch (error) {
    console.error("Logout error:", error)
  } finally {
    removeAccessToken()
  }
}

export const refreshToken = async (): Promise<string | null> => {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/refresh-token`, {
      method: "POST",
      credentials: "include",
    })

    if (!response.ok) {
      throw new Error("Token refresh failed")
    }

    const data = await response.json()
    setAccessToken(data.accessToken)
    return data.accessToken
  } catch (error) {
    console.error("Token refresh error:", error)
    removeAccessToken()
    return null
  }
}

export const getToken = getAccessToken

// Authenticated fetch wrapper
export const authenticatedFetch = async (url: string, options: RequestInit = {}): Promise<Response> => {
  let token = getAccessToken()

  // Try to refresh token if expired
  if (!token || isTokenExpired(token)) {
    token = await refreshToken()
    if (!token) {
      throw new Error("Authentication required")
    }
  }

  const response = await fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    credentials: "include",
  })

  // If token is invalid, try to refresh once
  if (response.status === 401) {
    token = await refreshToken()
    if (token) {
      return fetch(url, {
        ...options,
        headers: {
          ...options.headers,
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        credentials: "include",
      })
    }
  }

  return response
}
