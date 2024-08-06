import { z } from "zod";
type $TS_TODO_ANY = any;

export const BaseTaskSchema = z.object({
  taskName: z.string(),
  runner: z.enum(["pyodide", "sandbox"]),
});

export type BaseTask = z.infer<typeof BaseTaskSchema>;

const DataColumnSchema = z.object({
  name: z.string(),
  type: z.enum(["numeric", "categorical", "text", "datetime"]),
  method: z.enum([
    "impute_mean",
    "impute_median",
    "impute_constant",
    "impute_knn",
    "scale_standard",
    "scale_minmax",
    "scale_robust",
    "encode_onehot",
    "encode_label",
    "encode_ordinal",
    "bin_quantile",
    "bin_kmeans",
    "polynomial_features",
    "drop",
  ]),
});

export type DataColumn = z.infer<typeof DataColumnSchema>;

export const ClientPreprocessingTaskSchema = BaseTaskSchema.extend({
  taskName: z.literal("client_preprocessing"),
  inputs: z.object({
    file: z.string(),
  }),
  outputs: z.object({
    preprocessingTaskInputs: z.object({
      file: z.string(),
      columns: z.array(DataColumnSchema),
      global_preprocessing: z.enum(["drop_missing", "drop_constant"]),
      global_params: z.any(),
    }),
  }),
});

export type ClientPreprocessingTask = z.infer<
  typeof ClientPreprocessingTaskSchema
>;

type PreProcessingTaskInputs = {
  file: string;
  columns: DataColumn[];
  global_preprocessing: "drop_missing" | "drop_constant";
  global_params: $TS_TODO_ANY;
};

const PreprocessingTaskSchema = z.object({
  task: z.literal("preprocessing"),
  inputs: z.object({
    columns: z.array(DataColumnSchema),
    global_preprocessing: z.enum(["drop_missing", "drop_constant"]),
    global_params: z.any(),
  }),
});

export type PreprocessingTask = z.infer<typeof PreprocessingTaskSchema>;

const ModelCreationTaskSchema = z.object({
  type: z.literal("model_creation"),
  inputs: z.any(),
});

export type ModelCreationTask = z.infer<typeof ModelCreationTaskSchema>;

const ModelTrainingTaskSchema = z.object({
  type: z.literal("model_training"),
  inputs: z.any(),
});

export type ModelTrainingTask = z.infer<typeof ModelTrainingTaskSchema>;

const ModelEvaluationTaskSchema = z.object({
  type: z.literal("model_evaluation"),
  inputs: z.any(),
});

export type ModelEvaluationTask = z.infer<typeof ModelEvaluationTaskSchema>;

const ModelDeploymentTaskSchema = z.object({
  type: z.literal("model_deployment"),
  inputs: z.any(),
});

export type ModelDeploymentTask = z.infer<typeof ModelDeploymentTaskSchema>;

const ModelInferenceTaskSchema = z.object({
  type: z.literal("model_inference"),
  inputs: z.any(),
});

export type ModelInferenceTask = z.infer<typeof ModelInferenceTaskSchema>;

const UserDefinedCodeCellSchema = z.object({
  type: z.literal("user_defined_code"),
  content: z.string(),
});

export type UserDefinedCodeCell = z.infer<typeof UserDefinedCodeCellSchema>;

export const BaseCellSchema = z.object({
  cellId: z.string(),
  workbookId: z.string(),
});

const SoupCellSchema = BaseCellSchema.extend({
  type: z.literal("soup_cell"),
  task: BaseTaskSchema.extend({
    taskName: z.union([
      z.literal("client_preprocessing"),
      z.literal("preprocessing"),
      z.literal("model_creation"),
      z.literal("model_training"),
      z.literal("model_evaluation"),
      z.literal("model_deployment"),
      z.literal("model_inference"),
    ]),
    inputs: z.any(),
    outputs: z.any(),
  }),
});

export type SoupCell = z.infer<typeof SoupCellSchema>;
export type BaseCell = z.infer<typeof BaseCellSchema>;

// Cell schema extends BaseCellSchema
const CellSchema = BaseCellSchema.extend({
  type: z.union([z.literal("user_defined_code"), z.literal("soup_cell")]),
  content: z.union([z.string(), SoupCellSchema]),
});

export type Cell = z.infer<typeof CellSchema>;

export const WorkbookSchema = z.object({
  cells: z.array(CellSchema),
  workbookId: z.string(),
});

export type Workbook = z.infer<typeof WorkbookSchema>;

export const ProjectSchema = z.object({
  workbookVersions: z.array(z.string()),
  projectId: z.string().nullable(),
  userId: z.string().nullable(),
});

export type Project = z.infer<typeof ProjectSchema>;

/** *********************************
 *            EXAMPLES
 * **********************************/

const cell1: Cell = {
  workbookId: "workbook1",
  cellId: "cell1",
  type: "user_defined_code",
  content: "print('Hello, World!')",
};

const examplePreprocessingTaskCell: SoupCell = {
  workbookId: "workbook1",
  cellId: "cell2",
  type: "soup_cell",
  task: {
    taskName: "client_preprocessing",
    runner: "pyodide",
    inputs: {
      file: "data.csv",
    },
    outputs: {
      preprocessingTaskInputs: {
        file: "data.csv",
        columns: [
          {
            name: "age",
            type: "numeric",
            method: "impute_mean",
          },
        ],
        global_preprocessing: "drop_missing",
        global_params: {},
      },
    },
  },
};

const Workbook1: Workbook = {
  cells: [cell1, examplePreprocessingTaskCell],
  workbookId: "workbook1",
};
