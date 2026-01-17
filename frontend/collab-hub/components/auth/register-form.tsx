"use client"

import type React from "react"

import { useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { register } from "@/lib/api/services/auth"
import { setAccessToken } from "@/lib/api/token"
import { getApiErrorMessage } from "@/lib/api/error"
import { useAuth } from "@/hooks/use-auth"
import { Loader2 } from "lucide-react"

export function RegisterForm() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const { login: setUser } = useAuth()
  const router = useRouter()

  const passwordChecks = useMemo(() => {
    return [
      { label: "At least 8 characters", valid: password.length >= 8 },
      { label: "Uppercase letter", valid: /[A-Z]/.test(password) },
      { label: "Lowercase letter", valid: /[a-z]/.test(password) },
      { label: "Number", valid: /\d/.test(password) },
      { label: "Special character", valid: /[^A-Za-z0-9]/.test(password) },
    ]
  }, [password])
  const passedChecks = passwordChecks.filter((check) => check.valid).length
  const strengthLabel =
    passedChecks >= 5 ? "Strong" : passedChecks >= 3 ? "Medium" : password.length ? "Weak" : "Use a strong password"
  const strengthColor =
    passedChecks >= 5
      ? "bg-emerald-500"
      : passedChecks >= 3
        ? "bg-amber-500"
        : password.length
          ? "bg-rose-500"
          : "bg-muted"

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (password !== confirmPassword) {
      setError("Passwords do not match")
      return
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters long")
      return
    }

    setIsLoading(true)

    try {
      const response = await register(email, password)
      setAccessToken(response.accessToken)
      setUser(response.user)
      router.push("/dashboard")
    } catch (err) {
      setError(getApiErrorMessage(err, "Registration failed"))
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl font-bold text-balance">Join CollabHub</CardTitle>
        <CardDescription className="text-muted-foreground">Create your account to get started</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              required
              disabled={isLoading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Create a password"
              required
              disabled={isLoading}
            />
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Password strength</span>
                <span>{strengthLabel}</span>
              </div>
              <div className="h-2 w-full rounded-full bg-muted">
                <div
                  className={`h-2 rounded-full transition-all ${strengthColor}`}
                  style={{ width: `${(passedChecks / passwordChecks.length) * 100}%` }}
                />
              </div>
              <div className="grid gap-1 text-xs text-muted-foreground">
                {passwordChecks.map((check) => (
                  <div key={check.label} className="flex items-center gap-2">
                    <span className={check.valid ? "text-emerald-600" : "text-muted-foreground"}>
                      {check.valid ? "●" : "○"}
                    </span>
                    <span className={check.valid ? "text-foreground" : "text-muted-foreground"}>{check.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm Password</Label>
            <Input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm your password"
              required
              disabled={isLoading}
            />
          </div>

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating account...
              </>
            ) : (
              "Create Account"
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
