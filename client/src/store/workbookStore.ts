import { atom } from "jotai"

// create an atom to store the active workbook
export const workbookStore = atom({
  isActive: false,
  workbook: null,
  workbookId: null,
})
