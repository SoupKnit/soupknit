import { useMemo } from "react"
import { createClient } from "@supabase/supabase-js"

const supabaseUrl = import.meta.env.VITE_SUPABASE_CLIENT_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_API_KEY
let supa: ReturnType<typeof createClient>

export const getSupabaseClient = () => {
  if (supa) {
    return supa
  } else {
    supa = createClient(supabaseUrl, supabaseAnonKey)
  }

  return supa
}

// useMemo to prevent re-creating the client on every render
export const useSupa = () => useMemo(getSupabaseClient, [])

export async function getSupabaseAccessToken() {
  const session = await supa.auth.getSession()
  // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
  if (!session || session.error || !session.data.session) {
    throw new Error("No session")
  }
  return session.data.session.access_token
}
