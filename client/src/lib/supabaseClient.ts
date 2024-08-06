import { useMemo } from "react"
import { createClient } from "@supabase/supabase-js"

const supabaseUrl = import.meta.env.VITE_SUPABASE_CLIENT_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_API_KEY

export const getSupabaseClient = () => {
  return createClient(supabaseUrl, supabaseAnonKey)
}

// useMemo to prevent re-creating the client on every render
export const useSupa = () => useMemo(getSupabaseClient, [])

export async function getSupabaseAccessToken() {
  const supabase = getSupabaseClient()
  const {
    data: { session },
    error,
  } = await supabase.auth.getSession()
  if (error || !session) {
    throw new Error("No session")
  }
  return session.access_token
}

export default getSupabaseClient
