import { api } from "./baseApi"

import type { ClientEnvironment } from "@/lib/clientEnvironment"

export async function hiServerApi(env: ClientEnvironment, token: string) {
  const url = `${env.serverUrl}/your_mom`
  return await api.get(url, {
    token: token,
  })
}
