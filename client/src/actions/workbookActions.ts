import { api } from "./baseApi"

import type { Workbook } from "@soupknit/model/src/workbookSchemas"

export async function runWorkbookQuery(workbook: Workbook) {
  return await api.post(`/workbooks/${workbook.workbookId}/run_query`, workbook)
}
