import { helloMessageSchema } from "@soupknit/model/src/helloMessage"
import { validate } from "@soupknit/model/src/validate"

import { api } from "./baseApi"
import { hiServerApi } from "@/actions/hiServerApi"
import { getSupabaseAccessToken } from "@/lib/supabaseClient"

import type { ClientEnvironment } from "../lib/clientEnvironment"

// import type { Session, User } from "@supabase/supabase-js"

export async function hiServer(env: ClientEnvironment) {
  try {
    const url = `${env.serverUrl}/your_mom`
    const data = await api.get(url, {
      token: await getSupabaseAccessToken(),
    })
    const validatedData = validate(helloMessageSchema, data)
    return validatedData.message
  } catch (error) {
    console.error("hiServer error", error)
    return null
  }
}
