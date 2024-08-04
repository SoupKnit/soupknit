import { createFileRoute } from "@tanstack/react-router"

import { LandingPage } from "@/components/auth/LandingPage"

export const Route = createFileRoute("/")({
  component: LandingPage,
})
