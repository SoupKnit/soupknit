import React, { useState } from "react"
import { Link, useNavigate } from "@tanstack/react-router"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { signIn } from "@/lib/auth"

export function SignInPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const success = await signIn(email, password)
    if (success) {
      navigate({ to: "/app" })
    } else {
      alert("Sign in failed. Please try again.")
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background">
      <form onSubmit={handleSubmit} className="w-full max-w-md">
        <h2 className="mb-6 text-center text-2xl font-bold">Sign In</h2>
        <Input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="mb-4"
        />
        <Input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="mb-6"
        />
        <Button type="submit" className="mb-4 w-full">
          Sign In
        </Button>
        <div className="text-center">
          <Link to="/signup" className="text-blue-500 hover:underline">
            Don't have an account? Sign Up
          </Link>
        </div>
      </form>
    </div>
  )
}
