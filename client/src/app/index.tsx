import { useEffect, useState } from "react"
import { createClient } from "@supabase/supabase-js"
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router"

// import { loadPyodide } from "pyodide"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

import type { AuthError, Session } from "@supabase/supabase-js"

const supabaseUrl = import.meta.env.VITE_SUPABASE_CLIENT_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_API_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Supabase environment variables are missing")
}

const supabase = createClient(supabaseUrl, supabaseAnonKey)

export const Route = createFileRoute("/")({
  component: Dashboard,
})

export function Dashboard() {
  const [session, setSession] = useState<Session | null>(null)

  useEffect(() => {
    // console.log("Loading Pyodide...")
    // loadPyodide({
    //   indexURL: "https://cdn.jsdelivr.net/pyodide/v0.23.2/full",
    // }).then((pyodide) => {
    //   pyodide.runPython('print("Hello from Python!")')
    // })
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })

    return () => subscription.unsubscribe()
  }, [])

  const nav = useNavigate()

  if (!session) {
    return <Login />
  } else {
    nav({ to: "/home" })
    return
  }
}

function Login() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const handleLogin = async () => {
    setLoading(true)
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      if (error) throw error
    } catch (error: any) {
      console.error("Error logging in:", error.message)
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="w-full lg:grid lg:min-h-screen lg:grid-cols-2">
      <div className="flex items-center justify-center py-12">
        <div className="mx-auto grid w-[350px] gap-6">
          <div className="grid gap-2 text-center">
            <h1 className="text-3xl font-bold">Login</h1>
            <p className="text-balance text-muted-foreground">
              Enter your email below to login to your account
            </p>
          </div>
          {error}
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="m@example.com"
                value={email}
                onChange={(e) => setEmail(e.currentTarget.value)}
                required
              />
            </div>
            <div className="grid gap-2">
              <div className="flex items-center">
                <Label htmlFor="password">Password</Label>
                <Link
                  href="/forgot-password"
                  className="ml-auto inline-block text-sm underline"
                >
                  Forgot your password?
                </Link>
              </div>
              <Input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.currentTarget.value)}
              />
            </div>
            {/* <Link to="/home"> */}
            <Button className="w-full" onClick={handleLogin}>
              Login
            </Button>
            {/* </Link> */}
            <Button variant="outline" className="w-full">
              Login with Google
            </Button>
          </div>
          <div className="mt-4 text-center text-sm">
            Don&apos;t have an account?{" "}
            <Link to="/signup" className="underline">
              Sign up
            </Link>
          </div>
        </div>
      </div>
      <div className="hidden bg-muted lg:block">
        <img
          src="/placeholder.svg"
          alt="app background"
          width="1920"
          height="1080"
          className="h-full w-full object-cover dark:brightness-[0.2] dark:grayscale"
        />
      </div>
    </div>
  )
}
