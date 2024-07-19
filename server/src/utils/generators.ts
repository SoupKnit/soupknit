import { SklearnGenerator, PyTorchGenerator, TensorFlowGenerator } from './modelGenerators';

export interface Config {
  framework?: string;
  task: string;
  model_type: string;
  data_path: string;
  target_column: string;
  model_params?: Record<string, any>;
  [key: string]: any;
}

export interface GeneratedCode {
  imports: string;
  data_loading: string;
  model_creation: string;
  model_training: string;
  evaluation: string;
}

export abstract class BaseGenerator {
  protected config: Config;

  constructor(config: Config) {
    this.config = config;
  }

  abstract generateImports(): string;
  abstract generateDataLoading(): string;
  abstract generateModelCreation(): string;
  abstract generateModelTraining(): string;
  abstract generateEvaluation(): string;

  generateCode(): GeneratedCode {
    return {
      imports: this.generateImports(),
      data_loading: this.generateDataLoading(),
      model_creation: this.generateModelCreation(),
      model_training: this.generateModelTraining(),
      evaluation: this.generateEvaluation()
    };
  }
}

export function getGenerator(config: Config): BaseGenerator {
  const framework = config.framework || 'sklearn';
  switch (framework) {
    case 'sklearn':
      return new SklearnGenerator(config);
    case 'pytorch':
      return new PyTorchGenerator(config);
    case 'tensorflow':
      return new TensorFlowGenerator(config);
    default:
      throw new Error(`Unsupported framework: ${framework}`);
  }
}