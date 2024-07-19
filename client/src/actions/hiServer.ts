import { helloMessageSchema } from "@soupknit/model/src/helloMessage"
import { validate } from "@soupknit/model/src/validate"

import type { ClientEnvironment } from "../lib/clientEnvironment"

export async function hiServer(clientEnvironment: ClientEnvironment) {
  const url = `${clientEnvironment.serverUrl}/your_mom`
  try {
    // TODO @chaitb: eventually use '@tanstack/react-query' instead of fetch
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    })

    const data = await response.json()
    const validatedData = validate(helloMessageSchema, data)
    return validatedData.message
  } catch (error) {
    console.error("hiServer error", error)
    return null
  }
}
