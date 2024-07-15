import { createFileRoute } from "@tanstack/react-router"

import { Editor } from "@/components/editor/Canvas"

// import { Seo } from "@/components/layout/seo"

export const Route = createFileRoute("/app/_editor/")({
  component: Editor,
})
