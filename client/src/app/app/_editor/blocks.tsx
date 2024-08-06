import { createFileRoute } from "@tanstack/react-router"

import { DatasetPreview } from "@/components/editor/DatasetPreview"

export const Route = createFileRoute("/app/_editor/blocks")({
  component: BaseLayout,
})

function BaseLayout() {
  return <DatasetPreview />
}
