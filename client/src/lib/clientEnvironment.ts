import { useSupa } from "./supabaseClient"

export type ClientEnvironment = {
  serverUrl: string
}

const defaultEnv = import.meta.env.DEV ? "dev" : "prod"

export function useEnv(overrideEnv?: "dev" | "prod") {
  const supa = useSupa()
  const env = overrideEnv ?? defaultEnv
  return {
    serverUrl: env === "prod" ? "https://soupknit.com" : "/api",
    supa,
  }
}
