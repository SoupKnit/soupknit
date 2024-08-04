import { createFileRoute } from "@tanstack/react-router"

import { SignInPage } from "@/components/auth/SignInPage"

export const Route = createFileRoute("/signin")({
  component: SignInPage,
})
