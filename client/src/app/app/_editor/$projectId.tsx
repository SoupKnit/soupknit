import { createFileRoute } from "@tanstack/react-router"

import Workbook from "@/components/project/workbook"

export const Route = createFileRoute("/app/_editor/$projectId")({
  component: WorkbookProject,
})

function WorkbookProject() {
  const { projectId } = Route.useParams()
  return <Workbook projectId={projectId} />
}
