import { useSupa } from "./supabaseClient"

import type { SupabaseClient } from "@supabase/supabase-js"

export type ClientEnvironment = {
  serverUrl: string
  supa: SupabaseClient
}

const defaultEnv = import.meta.env.DEV ? "dev" : "prod"

export function useEnv(overrideEnv?: "dev" | "prod"): ClientEnvironment {
  const supa = useSupa()
  const env = overrideEnv ?? defaultEnv
  return {
    serverUrl: env === "prod" ? "https://soupknit.com" : "/api",
    supa,
  }
}
