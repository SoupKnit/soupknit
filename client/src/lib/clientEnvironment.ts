export type ClientEnvironment = {
  serverUrl: string
}

export function clientEnvironment(env: "dev" | "prod") {
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
