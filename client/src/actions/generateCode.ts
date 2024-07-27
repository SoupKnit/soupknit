import type { ClientEnvironment } from "@/lib/clientEnvironment"
import type {
  Config,
  GeneratedCode,
  ModelConfig,
} from "@soupknit/model/src/codeGeneratorSchemas"

export async function generateCode(
  config: ModelConfig,
  clientEnvironment: ClientEnvironment,
) {
  const url = `${clientEnvironment.serverUrl}/app/code_gen`
  const request: Config = {
    framework: config.framework,
    payload: {
      task: config.task,
      model_type: config.model_type,
      data_path: config.data_path,
      target_column: config.y_column,
      model_params: config.model_params,
    },
  }
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(request),
    })
    const data = (await response.json()) as GeneratedCode
    return data
  } catch (error) {
    console.error("generateCode error", error)
    return null
  }
}
