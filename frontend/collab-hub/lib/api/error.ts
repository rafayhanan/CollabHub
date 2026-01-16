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

    const status = error.response?.status
    const data = error.response?.data as ErrorResponse | undefined
    const rawMessage = data?.message || data?.error

    if (rawMessage) {
      const normalized = rawMessage.toLowerCase()
      if (normalized.includes("invalid input")) {
        return "Please check your details and try again."
      }
      if (normalized.includes("already a member")) {
        return "This user is already a member of the project."
      }
      if (normalized.includes("already exists") || normalized.includes("already invited")) {
        return "An invitation is already pending for this user."
      }
      if (normalized.includes("invalid credentials") || normalized.includes("unauthorized")) {
        return "Incorrect email or password."
      }
      return rawMessage
    }

    if (data?.errors?.length) {
      return data.errors.map((item) => item.message).filter(Boolean).join(", ")
    }

    switch (status) {
      case 400:
      case 422:
        return "Please check your input and try again."
      case 401:
        return "Incorrect email or password."
      case 403:
        return "You do not have permission to perform this action."
      case 404:
        return "We could not find what you were looking for."
      case 409:
        return "This request conflicts with existing data."
      case 500:
      case 502:
      case 503:
        return "Server error. Please try again later."
      default:
        break
    }
  }

  if (error instanceof Error && error.message) {
    const lower = error.message.toLowerCase()
    if (lower.includes("request failed with status code")) {
      return fallback
    }
    if (lower.includes("invalid input")) {
      return "Please check your details and try again."
    }
    return error.message
  }

  return fallback
}
