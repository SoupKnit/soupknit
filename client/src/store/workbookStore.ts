import { atom } from "jotai"

import type { Cell, Workbook } from "@soupknit/model/src/workbookSchemas"

// atom to store the active workbook ID
export const activeProject = atom<{
  workbookId: Workbook["workbookId"] | null
  projectId: string | null
  projectTitle: string | null
} | null>(null)

// atom to store all the loaded projects, their titles, and descriptions
type ProjectDetails = {
  id: string
  title: string
  description: string
}
export const projectDetailsStore = atom<ProjectDetails[]>([])

// atom to store the array of cells in the active workbook
// key: Workbook["workbookId"]: Workbook["cells"]
export const cellsStore = atom<Cell[]>([])

// atom to store the workbook, and its cells
export const workbookStore = atom<Workbook | null>((get) => {
  const id = get(activeProject)?.projectId
  if (!id) return null
  const cells = get(cellsStore)
  return { workbookId: id, cells }
})

// cell actions

// add cell to workbook
export const addCellAtom = atom(null, (get, set, cell: Cell) => {
  const cells = get(cellsStore)
  set(cellsStore, [...cells, cell])
})

export const updateCellAtom = atom(null, (get, set, cell: Cell) => {
  const cells = get(cellsStore)
  const index = cells.findIndex((c) => c.cellId === cell.cellId)
  if (index === -1) return
  cells[index] = cell
  set(cellsStore, cells)
})

export const deleteCellAtom = atom(null, (get, set, cellId: string) => {
  const cells = get(cellsStore)
  set(
    cellsStore,
    cells.filter((c) => c.cellId !== cellId),
  )
})
