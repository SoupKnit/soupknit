import { useState } from "react"
import { useRouter } from "@tanstack/react-router"

import { Trash2 } from "lucide-react"

import { deleteProject } from "@/actions/workbookActions"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useEnv } from "@/lib/clientEnvironment"

export function WTFIsOther({ projectId }: { projectId: string }) {
  const { supa } = useEnv()
  const [isDeleting, setIsDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const { history } = useRouter()
  const handleDelete = async () => {
    if (
      window.confirm(
        "Are you sure you want to delete this project? This action cannot be undone.",
      )
    ) {
      setIsDeleting(true)
      setDeleteError(null)
      try {
        await deleteProject(supa, projectId)
        history.go(-1)
      } catch (err: any) {
        console.error("Error deleting project:", err)
        setDeleteError(`Failed to delete project: ${err.message}`)
      } finally {
        setIsDeleting(false)
      }
    }
  }
  return (
    <Card>
      <CardHeader>
        <CardTitle>Account</CardTitle>
        <CardDescription>
          Make changes to your account here. Click save when you&apm;re done.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="space-y-1">
          <Label htmlFor="name">Name</Label>
          <Input id="name" defaultValue="Pedro Duarte" />
        </div>
        <div className="space-y-1">
          <Label htmlFor="username">Username</Label>
          <Input id="username" defaultValue="@peduarte" />
        </div>
      </CardContent>
      <CardFooter>
        <Button
          onClick={handleDelete}
          disabled={isDeleting}
          variant="destructive"
        >
          {isDeleting ? "Deleting..." : "Delete Project"}
          <Trash2 className="ml-2 h-4 w-4" />
        </Button>
        {deleteError && <div className="mb-4 text-red-500">{deleteError}</div>}
      </CardFooter>
    </Card>
  )
}
