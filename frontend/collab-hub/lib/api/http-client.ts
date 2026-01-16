import axios, { AxiosError, type AxiosRequestConfig, type AxiosRequestHeaders } from "axios"
import { getAccessToken, isTokenExpired, removeAccessToken, setAccessToken } from "./token"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api"

export interface AuthResponse {
    message: string
    accessToken: string
}

interface RetryableRequestConfig extends AxiosRequestConfig {
    _retry?: boolean
    skipAuth?: boolean
}

export const publicClient = axios.create({
    baseURL: API_BASE_URL,
    withCredentials: true,
    headers: {
        "Content-Type": "application/json",
    },
})

export const apiClient = axios.create({
    baseURL: API_BASE_URL,
    withCredentials: true,
    headers: {
        "Content-Type": "application/json",
    },
})

let refreshPromise: Promise<string | null> | null = null

export const refreshAccessToken = async (): Promise<string | null> => {
    if (!refreshPromise) {
        refreshPromise = publicClient
            .post<AuthResponse>("/auth/refresh-token")
            .then((response) => {
                const token = response.data.accessToken
                setAccessToken(token)
                return token
            })
            .catch(() => {
                removeAccessToken()
                return null
            })
            .finally(() => {
                refreshPromise = null
            })
    }

    return refreshPromise
}

apiClient.interceptors.request.use(async (config) => {
    const requestConfig = config as RetryableRequestConfig
    if (requestConfig.skipAuth) return config

    let token = getAccessToken()
    if (!token || isTokenExpired(token)) {
        token = await refreshAccessToken()
    }

    if (token) {
        config.headers = {
            ...(config.headers || {}),
            Authorization: `Bearer ${token}`,
        } as AxiosRequestHeaders
    }

    return config
})

apiClient.interceptors.response.use(
    (response) => response,
    async (error: AxiosError) => {
        const config = error.config as RetryableRequestConfig | undefined

        if (!config || config.skipAuth) {
            return Promise.reject(error)
        }

        if (error.response?.status === 401 && !config._retry) {
            config._retry = true
            const token = await refreshAccessToken()
            if (token) {
                config.headers = {
                    ...(config.headers || {}),
                    Authorization: `Bearer ${token}`,
                } as AxiosRequestHeaders
                return apiClient(config)
            }
        }

        return Promise.reject(error)
    },
)
