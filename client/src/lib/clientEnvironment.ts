export type ClientEnvironment = {
  serverUrl: string
}

const defaultEnv = import.meta.env.DEV ? "dev" : "prod"

export function useEnv(overrideEnv?: "dev" | "prod") {
  const env = overrideEnv ?? defaultEnv
  if (env === "prod") {
    return {
      // todo: change this later
      serverUrl: "https://soupknit.com",
    }
  }
  return {
    serverUrl: "/api",
  }
}
