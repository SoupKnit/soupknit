import { createClient } from "@supabase/supabase-js"
import { useAtom } from "jotai"

import { userSettingsStore } from "@/store/userSettingsStore"

const supabaseUrl = import.meta.env.VITE_SUPABASE_CLIENT_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_API_KEY
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Supabase environment variables are missing")
}

const supabase = createClient(supabaseUrl, supabaseAnonKey)

export async function signIn(
  email: string,
  password: string,
): Promise<boolean> {
  const { error } = await supabase.auth.signInWithPassword({ email, password })
  return !error
}

export async function signOut(): Promise<void> {
  await supabase.auth.signOut()
}

export async function isAuthenticated(): Promise<boolean> {
  const {
    data: { session },
  } = await supabase.auth.getSession()
  return !!session
}

export async function signUp(
  email: string,
  password: string,
): Promise<boolean> {
  const { error } = await supabase.auth.signUp({ email, password })
  return !error
}
