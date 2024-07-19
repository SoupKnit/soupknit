const API_BASE_URL = 'http://localhost:3001/api';

interface Config {
  task: string;
  model_type: string;
  data_path: string;
  target_column: string;
  model_params?: Record<string, any>;
  [key: string]: any;
}

interface GeneratedCode {
  imports: string;
  data_loading: string;
  model_creation: string;
  model_training: string;
  evaluation: string;
}

export async function generateCode(framework: string, config: Config): Promise<GeneratedCode> {
  const response = await fetch(`${API_BASE_URL}/generate-${framework}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(config),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Failed to generate code');
  }

  return data.generated_code;
}