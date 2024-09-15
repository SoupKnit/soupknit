import { createFileRoute } from "@tanstack/react-router"

import ProjectWorkbook from "@/components/project/ProjectWorkbook"

export const Route = createFileRoute("/app/_editor/$projectId")({
  component: WorkbookProject,
})

function WorkbookProject() {
  const { projectId } = Route.useParams()
  return <ProjectWorkbook projectId={projectId} />
}
