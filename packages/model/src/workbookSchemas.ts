import { z } from "zod";
type $TS_TODO_ANY = any;
import * as SupabaseGenTypes from "./dbTables";
import {
  GlobalPreprocessingOption,
  GlobalPreprocessingOptionSchema,
  PreProcessingColumnConfig,
  PreProcessingColumnConfigSchema,
} from "./preprocessing";

type IfEquals<T, U, Y = unknown, N = never> =
  (<G>() => G extends T ? 1 : 2) extends <G>() => G extends U ? 1 : 2 ? Y : N;

type AssertEqual<T, U> = T extends U ? (U extends T ? true : never) : never;

/**
 * ******************************************************************
 * NEW SCHEMA DEFINITIONS
 * These schemas are supposed to match the supabase generated types
 * {@link SupabaseGenTypes}}
 * ******************************************************************
 */

const zod_any_FIX_ME = z.any();

const WorkbookDataFileSchema = z.object({
  name: z.string(),
  file_url: z.string(),
  file_type: z.string(),
});

export type WorkbookDataFile = z.infer<typeof WorkbookDataFileSchema>;

/*************************************************
 * WorkbookConfig - Schema for Config column in WorkbookData table
 * ************************************************/
/**
 * @see DataColumn
 * TODO (later): unify types and schemas
 */
export const TaskTypesSchema = z.enum([
  "Regression",
  "Clustering",
  "Classification",
  "TimeSeries",
]);

export const TaskTypes = TaskTypesSchema.Enum;

const preProcessingConfig = z.object({
  columns: z.array(PreProcessingColumnConfigSchema),
  global_params: z.record(z.string(), zod_any_FIX_ME),
  global_preprocessing: z.array(GlobalPreprocessingOptionSchema),
});

const workbookConfigSchema = z.object({
  // TODO: define this type properly
  featureColumns: z.array(z.string()),
  // TODO: define this type properly
  // Maybe this should be a separate table in the database
  modelParams: z.optional(z.object({})),
  modelResults: z.optional(z.object({})),
  targetColumn: z.string().nullable(),
  taskType: z.nullable(TaskTypesSchema),
  preProcessingConfig,
});

export type WorkbookConfig = z.infer<typeof workbookConfigSchema>;

export const CSVFileSchema = z.array(z.record(z.string(), zod_any_FIX_ME));

/**
 * WorkbookDataSchema matches {@link SupabaseGenTypes.DBWorkbookData}
 */
export const WorkbookDataSchema = z.object({
  id: z.string(),
  config: workbookConfigSchema,
  project_id: z.string(),
  files: z.nullable(z.array(WorkbookDataFileSchema)),
  // TODO: maybe this should be a separate table in the database (data preview)
  preview_data: CSVFileSchema,
  preview_data_preprocessed: CSVFileSchema.nullable(),
  created_at: z.string(),
  created_by: z.string(),
  updated_at: z.string(),
});

export type WorkbookData = z.infer<typeof WorkbookDataSchema>;

export const preprocessFileResponseSchema = z.object({
  preprocessedFileUrl: z.string(),
  previewDataPreprocessed: CSVFileSchema,
  preProcessingConfig: z.optional(preProcessingConfig),
});

export const ProjectSchema = z.object({
  workbookVersions: z.array(z.string()),
  projectId: z.string().nullable(),
  userId: z.string().nullable(),
  files: z.array(
    z.object({
      name: z.string(),
      url: z.string(),
    }),
  ),
});

export type Project = z.infer<typeof ProjectSchema>;

export type ActiveProject = {
  workbookId?: Workbook["workbookId"];
  projectId: string;
  projectTitle?: string;
  description?: string;
  files?: WorkbookDataFile[];
};

/**
 * ******************************************************************
 * OLD SCHEMA DEFINITIONS - DO NOT USE/MODIFY for now
 * ******************************************************************
 */

export const BaseTaskSchema = z.object({
  taskName: z.string(),
  runner: z.enum(["pyodide", "sandbox"]),
});

export type BaseTask = z.infer<typeof BaseTaskSchema>;

const DataColumnSchema = z.object({
  name: z.string(),
  type: z.enum(["numeric", "categorical", "text", "datetime"]),
  method: z.string(),
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
      global_params: zod_any_FIX_ME,
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
    global_params: zod_any_FIX_ME,
  }),
});

export type PreprocessingTask = z.infer<typeof PreprocessingTaskSchema>;

const ModelCreationTaskSchema = z.object({
  type: z.literal("model_creation"),
  inputs: zod_any_FIX_ME,
});

export type ModelCreationTask = z.infer<typeof ModelCreationTaskSchema>;

const ModelTrainingTaskSchema = z.object({
  type: z.literal("model_training"),
  inputs: zod_any_FIX_ME,
});

export type ModelTrainingTask = z.infer<typeof ModelTrainingTaskSchema>;

const ModelEvaluationTaskSchema = z.object({
  type: z.literal("model_evaluation"),
  inputs: zod_any_FIX_ME,
});

export type ModelEvaluationTask = z.infer<typeof ModelEvaluationTaskSchema>;

const ModelDeploymentTaskSchema = z.object({
  type: z.literal("model_deployment"),
  inputs: zod_any_FIX_ME,
});

export type ModelDeploymentTask = z.infer<typeof ModelDeploymentTaskSchema>;

const ModelInferenceTaskSchema = z.object({
  type: z.literal("model_inference"),
  inputs: zod_any_FIX_ME,
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
    inputs: zod_any_FIX_ME,
    outputs: zod_any_FIX_ME,
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
