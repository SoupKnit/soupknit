import { generateCodeApi } from "./generateCodeApi"

import type { ClientEnvironment } from "@/lib/clientEnvironment"
import type { ModelConfig } from "@soupknit/model/src/codeGeneratorSchemas"

export async function generateCode(
  config: ModelConfig,
  env: ClientEnvironment,
) {
  const request = {
    framework: config.framework,
    payload: {
      task: config.task,
      model_type: config.model_type,
      data_path: config.data_path,
      target_column: config.y_column,
      model_params: config.model_params,
    },
  }
  return generateCodeApi(env, request)
}
