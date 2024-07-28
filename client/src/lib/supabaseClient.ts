import { createClient } from "@supabase/supabase-js"

const supabaseUrl = import.meta.env.VITE_SUPABASE_CLIENT_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_API_KEY
const supa = createClient(supabaseUrl, supabaseAnonKey)

export default supa

export async function getSupabaseAccessToken() {
  const session = await supa.auth.getSession()
  // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
  if (!session || session.error || !session.data.session) {
    throw new Error("No session")
  }
  return session.data.session.access_token
}
