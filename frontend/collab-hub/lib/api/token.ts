import { jwtDecode } from "jwt-decode"
import type { User } from "./types"

interface DecodedToken {
    userId: string
    email: string
    exp: number
}

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
