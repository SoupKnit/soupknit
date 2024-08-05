import { createFileRoute, Link } from "@tanstack/react-router"

import { SiGithub } from "@icons-pack/react-simple-icons"

import { Seo } from "@/components/layout/seo"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export const Route = createFileRoute("/home/_front/")({
  component: HomePage,
})

function HomePage() {
  return <h1>Home</h1>
}
