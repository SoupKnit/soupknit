import { createFileRoute } from "@tanstack/react-router"

import { CSVViewer } from "@/components/editor/CSVViewer"

export const Route = createFileRoute("/app/_editor/blocks")({
  component: BaseLayout,
})

function BaseLayout() {
  return <CSVViewer />
}
