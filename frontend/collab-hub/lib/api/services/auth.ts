import type { User } from "../types"
import { apiClient, publicClient, refreshAccessToken } from "../http-client"
import { removeAccessToken, setAccessToken } from "../token"

export interface AuthResponse {
    message: string
    accessToken: string
    user: User
}

export const register = async (email: string, password: string): Promise<AuthResponse> => {
    const response = await publicClient.post<AuthResponse>("/auth/register", { email, password })
    return response.data
}

export const login = async (email: string, password: string): Promise<AuthResponse> => {
    const response = await publicClient.post<AuthResponse>("/auth/login", { email, password })
    return response.data
}

export const logout = async (): Promise<void> => {
    try {
        await apiClient.post("/auth/logout")
    } finally {
        removeAccessToken()
    }
}

export const refreshToken = async (): Promise<string | null> => {
    const token = await refreshAccessToken()
    if (!token) {
        removeAccessToken()
        return null
    }
    setAccessToken(token)
    return token
}
