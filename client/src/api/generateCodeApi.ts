import { api } from "./baseApi"

import type { ClientEnvironment } from "@/lib/clientEnvironment"
import type { CodeGenerationRequestConfig } from "@soupknit/model/src/codeGeneratorSchemas"

export async function generateCodeApi(
  env: ClientEnvironment,
  payload: CodeGenerationRequestConfig,
) {
  return api.post(`${env.serverUrl}/app/code_gen`, payload)
}
