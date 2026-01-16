import axios from "axios"

type ErrorResponse = {
  message?: string
  error?: string
  errors?: Array<{ message?: string }>
}

export const getApiErrorMessage = (error: unknown, fallback: string) => {
  if (axios.isAxiosError(error)) {
    if (error.message === "Network Error") {
      return "Unable to reach the server. Check your connection and try again."
    }

    const data = error.response?.data as ErrorResponse | undefined
    if (data?.message) return data.message
    if (data?.error) return data.error
    if (data?.errors?.length) {
      return data.errors.map((item) => item.message).filter(Boolean).join(", ")
    }
  }

  if (error instanceof Error && error.message) {
    return error.message
  }

  return fallback
}
