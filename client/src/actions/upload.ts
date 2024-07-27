import type { ClientEnvironment } from "@/lib/clientEnvironment"

export async function upload(
  clientEnvironment: ClientEnvironment,
  payload: any,
) {
  const url = `${clientEnvironment.serverUrl}/upload`
  const response = await fetch(url, {
    method: "POST",
    body: payload,
  })
  return response.json()
}

export async function uploadFile(
  clientEnvironment: ClientEnvironment,
  file: any,
) {
  // upload to supabase storage
}
