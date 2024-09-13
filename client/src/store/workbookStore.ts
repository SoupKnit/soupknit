import { DataColumn, TaskTypes } from "@soupknit/model/src/workbookSchemas"
import { atom } from "jotai"

import { isNonEmptyArray } from "@/lib/utils"

import type {
  GlobalPreprocessingOption,
  PreProcessingColumnConfig,
} from "@soupknit/model/src/preprocessing"
import type {
  ActiveProject,
  Cell,
  Workbook,
  WorkbookConfig,
  WorkbookDataFile,
} from "@soupknit/model/src/workbookSchemas"

// atom to store the active workbook ID
export const activeProjectAndWorkbook = atom<ActiveProject>({
  projectId: "",
  workbookId: undefined,
  projectTitle: "",
  description: "",
})

// atom to store all the loaded projects, their titles, and descriptions
type ProjectDetails = {
  id: string
  title: string
  description: string
}
export const projectDetailsStore = atom<ProjectDetails[]>([])

/**
 * @deprecated use ${@link WorkbookConfig} instead
 * @see DataColumn
 */
export type _WorkbookConfig = {
  featureColumns: any
  modelResults: any
  targetColumn: string | null
  taskType?: "Regression" | "Clustering" | "Classification" | "TimeSeries"
  preProcessingConfig: {
    columns?: Array<PreProcessingColumnConfig>
    global_params?: Record<string, any>
    global_preprocessing: GlobalPreprocessingOption[]
  }
}
export const workbookConfigStore = atom<WorkbookConfig>({
  featureColumns: {},
  modelResults: {},
  modelParams: {},
  taskType: null,
  targetColumn: null,
  preProcessingConfig: {
    columns: [],
    global_params: {},
    global_preprocessing: [],
  },
})

// TODO: maybe merge this into activeProjectAndWorkbook, and keep things in one place
export const filesStore = atom((get) => {
  const files = get(activeProjectAndWorkbook)?.files
  return files ?? []
})

type DataFilePreview = {
  headers: string[]
  data: Record<string, any>[]
}

type DataPreviewRaw = Record<string, any>[]

const dataPreviewStore = atom<DataFilePreview | null>(null)
export const getDataPreviewAtom = atom((get) => get(dataPreviewStore))
export const setDataPreviewAtom = atom(
  null,
  (_get, set, data: DataPreviewRaw) => {
    if (!isNonEmptyArray(data)) return
    const headers = Object.keys(data[0])
    set(dataPreviewStore, {
      headers,
      data: data.slice(0, 15),
    })
  },
)

export const setActiveFileWithPreviewAtom = atom(
  null,
  (get, set, data: { preview: DataPreviewRaw } & WorkbookDataFile) => {
    const activeWorkbook = get(activeProjectAndWorkbook)
    set(activeProjectAndWorkbook, {
      ...activeWorkbook,
      files: [
        ...(activeWorkbook?.files ? activeWorkbook.files : []),
        {
          name: data.name,
          file_url: data.file_url,
          file_type: data.file_type,
        },
      ],
    })
    set(setDataPreviewAtom, data.preview)
  },
)

// **************************************** DEPRECATED ****************************************

// atom to store the array of cells in the active workbook
// key: Workbook["workbookId"]: Workbook["cells"]
export const cellsStore = atom<Cell[]>([])

/**
 * @deprecated use ${@link workbookConfigStore} instead
 * The concept of a  cell is being deprecated in favor of a more structured workbook configuration
 */
export const workbookStore = atom<Workbook | null>((get) => {
  const id = get(activeProjectAndWorkbook)?.workbookId
  if (!id) return null
  const cells = get(cellsStore)
  return { workbookId: id, cells }
})

/**
 * @deprecated use ${@link workbookConfigStore} instead
 * The concept of a  cell is being deprecated in favor of a more structured workbook configuration
 */
export const addCellAtom = atom(null, (get, set, cell: Cell) => {
  const cells = get(cellsStore)
  set(cellsStore, [...cells, cell])
})
