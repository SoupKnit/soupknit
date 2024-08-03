import supabase from "@/lib/supabaseClient"

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

// TODO: format for the filePath
// data input: org/data/fileName
// model output: org/models/workbookId/modelName
export async function uploadFile(
  clientEnvironment: ClientEnvironment,
  filePath: string,
  file: File,
) {
  console.log("uploadFile", filePath, file)
  const { data, error } = await supabase.storage
    .from("avatars")
    .upload(filePath, file, {
      cacheControl: "3600",
      upsert: false,
    })
  // upload to supabase storage
  return { data, error }
}
