type $TS_TODO_ANY = any;

type Workbook = {
  cells: Cell[];
  workbookId: string;
  userId: string;
};

type Cell = UserDefinedCodeCell | SoupCell;

const cell1: Cell = {
  workbookId: "workbook1",
  cellId: "cell1",
  type: "user_defined_code",
  content: "print('Hello, World!')",
};

type UserDefinedCodeCell = BaseCell & {
  type: "user_defined_code";
  content: string;
};

type BaseCell = {
  cellId: string;
  workbookId: string;
};

type SoupCell = BaseCell & {
  type: "soup_cell";
  task:
    | PreprocessingTask
    | ModelCreationTask
    | ModelTrainingTask
    | ModelEvaluationTask
    | ModelDeploymentTask
    | ModelInferenceTask;
};

type DataColumn = {
  name: string;
  type: "numeric" | "categorical" | "text" | "datetime";
};

type PreprocessingTask = {
  task: "preprocessing";
  inputs: {
    columns: DataColumn[];
    method:
      | "impute_mean"
      | "impute_median"
      | "impute_constant"
      | "impute_knn"
      | "scale_standard"
      | "scale_minmax"
      | "scale_robust"
      | "encode_onehot"
      | "encode_label"
      | "encode_ordinal"
      | "bin_quantile"
      | "bin_kmeans"
      | "polynomial_features"
      | "drop";
    global_preprocessing: "drop_missing" | "drop_constant";
    global_params: $TS_TODO_ANY;
  };
};

type ModelCreationTask = {
  type: "model_creation";
  inputs: $TS_TODO_ANY;
};

type ModelTrainingTask = {
  type: "model_training";
  inputs: $TS_TODO_ANY;
};

type ModelEvaluationTask = {
  type: "model_evaluation";
  inputs: $TS_TODO_ANY;
};

type ModelDeploymentTask = {
  type: "model_deployment";
  inputs: $TS_TODO_ANY;
};

type ModelInferenceTask = {
  type: "model_inference";
  inputs: $TS_TODO_ANY;
};

// zod schema for all the above
import { z } from "zod";

const DataColumnSchema = z.object({
  name: z.string(),
  type: z.nativeEnum(["numeric", "categorical", "text", "datetime"]),
});

const PreprocessingTaskSchema = z.object({
  task: z.literal("preprocessing"),
  inputs: z.object({
    columns: z.array(DataColumnSchema),
    method: z.nativeEnum([
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
    global_preprocessing: z.nativeEnum(["drop_missing", "drop_constant"]),
    global_params: z.any(),
  }),
});

const ModelCreationTaskSchema = z.object({
  type: z.literal("model_creation"),
  inputs: z.any(),
});

const ModelTrainingTaskSchema = z.object({
  type: z.literal("model_training"),
  inputs: z.any(),
});

const ModelEvaluationTaskSchema = z.object({
  type: z.literal("model_evaluation"),
  inputs: z.any(),
});

const ModelDeploymentTaskSchema = z.object({
  type: z.literal("model_deployment"),
  inputs: z.any(),
});

const ModelInferenceTaskSchema = z.object({
  type: z.literal("model_inference"),
  inputs: z.any(),
});

const UserDefinedCodeCellSchema = z.object({
  type: z.literal("user_defined_code"),
  content: z.string(),
});

const SoupCellSchema = z.object({
  type: z.literal("soup_cell"),
  task: z.union([
    PreprocessingTaskSchema,
    ModelCreationTaskSchema,
    ModelTrainingTaskSchema,
    ModelEvaluationTaskSchema,
    ModelDeploymentTaskSchema,
    ModelInferenceTaskSchema,
  ]),
});

const CellSchema = z.union([UserDefinedCodeCellSchema, SoupCellSchema]);

export const WorkbookSchema = z.object({
  cells: z.array(CellSchema),
  workbookId: z.string(),
  userId: z.string(),
});

const cell2: SoupCell = {
  workbookId: "workbook1",
  cellId: "cell2",
  type: "soup_cell",
  task: {
    task: "preprocessing",
    inputs: {
      columns: [{ name: "age", type: "numeric" }],
    },
  },
};

const Workbook1: Workbook = {
  cells: [cell1, cell2],
  workbookId: "workbook1",
  userId: "user1",
};
