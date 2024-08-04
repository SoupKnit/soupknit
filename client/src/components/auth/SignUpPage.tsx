import React, { useState } from "react"
import { Link, useNavigate } from "@tanstack/react-router"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { signUp } from "@/lib/auth"

export function SignUpPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const success = await signUp(email, password)
    if (success) {
      alert(
        "Sign up successful! Please check your email to verify your account.",
      )
      navigate({ to: "/signin" })
    } else {
      alert("Sign up failed. Please try again.")
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background">
      <form onSubmit={handleSubmit} className="w-full max-w-md">
        <h2 className="mb-6 text-center text-2xl font-bold">Sign Up</h2>
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
          Sign Up
        </Button>
        <div className="text-center">
          <Link to="/signin" className="text-blue-500 hover:underline">
            Already have an account? Sign In
          </Link>
        </div>
      </form>
    </div>
  )
}
