import { useEffect, useRef, useState } from "react"
import { useMutation } from "@tanstack/react-query"
import { useNavigate } from "@tanstack/react-router"
import { toast } from "sonner"

import { ChevronUp, Trash2 } from "lucide-react"

import { MultiLineTextInput } from "../editor/MultiLineText"
import { Badge } from "../ui/badge"
import { buttonVariants } from "../ui/button"
import {
  updateProjectDescription,
  updateProjectTitle,
} from "@/actions/projectsActions"
import * as workbookActions from "@/actions/workbookActions"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { useEnv } from "@/lib/clientEnvironment"

import type { ActiveProject } from "@soupknit/model/src/workbookSchemas"

export function ProjectHeaderLarge({
  activeProject,
  setActiveProject,
  setCollapsed,
  projectId,
}: Readonly<{
  projectId: string
  activeProject: ActiveProject
  setActiveProject: React.Dispatch<React.SetStateAction<ActiveProject>>
  setCollapsed: React.Dispatch<React.SetStateAction<boolean>>
}>) {
  const descriptionInputRef = useRef<HTMLDivElement>(null)
  const [focusDescription, setFocusDescription] = useState<boolean>(false)
  const navigate = useNavigate({ from: "/app" })

  useEffect(() => {
    if (focusDescription && descriptionInputRef.current) {
      descriptionInputRef.current.focus()
      setFocusDescription(false)
    }
  }, [focusDescription])

  const env = useEnv()

  const titleMutation = useMutation({
    mutationFn: async (title: string) =>
      updateProjectTitle(env.supa, title, projectId),
    onSuccess: () => {
      console.log("Title saved successfully")
    },
    onError: (error) => {
      console.error("Error saving title:", error)
    },
  })

  const descriptionMutation = useMutation({
    mutationFn: async (description: string) =>
      updateProjectDescription(env.supa, description, projectId),
    onSuccess: () => {
      console.log("Description saved successfully")
    },
    onError: (error) => {
      console.error("Error saving description:", error)
    },
  })

  const deleteMutation = useMutation({
    mutationFn: async () => {
      if (!activeProject) {
        throw new Error("No active project")
      }
      return workbookActions.deleteProject(env.supa, activeProject)
    },
    onSuccess: () => {
      toast.success("Project deleted successfully")
      // Redirect to projects list or handle post-deletion navigation
    },
    onError: (error) => {
      console.error("Error deleting project:", error)
      toast.error("Failed to delete project")
    },
  })
  return (
    <div className="mt-2 p-2">
      <input
        type="text"
        className="input-invisible pl-1 text-4xl font-semibold"
        value={activeProject?.projectTitle}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
          if (e.target.value !== activeProject?.projectTitle) {
            console.log("Setting project title to:", e.target.value)
            setActiveProject({
              ...activeProject,
              projectTitle: e.target.value,
            })
            titleMutation.mutate(e.target.value)
          }
        }}
        onKeyDown={(e) => {
          if (
            e.key === "Enter" ||
            e.key === "Escape" ||
            e.key === "Tab" ||
            e.key === "ArrowDown"
          ) {
            e.preventDefault()
            setFocusDescription(true)
          }
        }}
        placeholder="Untitled"
      />
      <div>
        <MultiLineTextInput
          className="input-invisible min-h-12 rounded-md p-2 text-lg text-gray-700 hover:outline-gray-400 focus:outline-2 focus:outline-gray-500 dark:text-gray-300"
          value={activeProject?.description ?? ""}
          onChange={(value) => {
            if (value !== activeProject?.description) {
              console.log("Setting description to:", value)
              descriptionMutation.mutate(value)
              setActiveProject({
                ...activeProject,
                description: value,
              })
            }
          }}
        />
      </div>
      <div className="my-4 flex items-center">
        <DeleteDialog
          onConfirm={() => {
            deleteMutation.mutate()
            navigate({ to: "/app" })
          }}
        >
          <Button
            variant="ghost"
            className="mr-2 h-6 w-8 rounded-full p-0 hover:text-red-500"
          >
            <Trash2 className="h-4" />
          </Button>
        </DeleteDialog>
        <a href="https://supabase.com/dashboard/project/kstcbdcmgvzsitnywtue">
          <Badge className="bg-slate-200 p-1 px-2 text-gray-600 hover:bg-slate-300">
            ProjectID: {projectId}
          </Badge>
          <Badge className="bg-slate-200 p-1 px-2 text-gray-600 hover:bg-slate-300">
            WorkbookId: {activeProject?.workbookId}
          </Badge>
        </a>
        <a href="https://supabase.com/dashboard/project/kstcbdcmgvzsitnywtue">
          <Badge className="ml-4 bg-slate-200 p-1 px-2 text-gray-600 hover:bg-slate-300">
            Status: Draft
          </Badge>
        </a>
      </div>
      <div className="flex justify-center">
        <button
          onClick={() => setCollapsed(true)}
          className="mx-auto w-4 bg-red-400"
        >
          <ChevronUp />
        </button>
      </div>
    </div>
  )
}

export function ProjectHeaderSmall({
  activeProject,
  setCollapsed,
}: Readonly<{
  activeProject: ActiveProject
  setCollapsed: React.Dispatch<React.SetStateAction<boolean>>
}>) {
  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Enter" || event.key === " ") {
      setCollapsed(false)
    }
  }

  return (
    <div
      role="button"
      tabIndex={0}
      className="cursor-pointer rounded-md p-4 transition-colors duration-500 hover:bg-slate-200"
      onClick={() => setCollapsed(false)}
      onKeyDown={handleKeyDown}
    >
      {/* Small variant: Title and Description, no buttons, no edits, smaller font */}

      <h2 className="mb-1 text-xl font-semibold text-gray-800 dark:text-gray-200">
        {activeProject?.projectTitle ?? "Untitled"}
      </h2>
      <p className="text-lg text-gray-500 dark:text-gray-400">
        {activeProject?.description ?? "No description provided"}
      </p>
    </div>
  )
}

export function DeleteDialog({
  children,
  onConfirm,
}: Readonly<{
  children: React.ReactNode
  onConfirm: () => void
}>) {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>{children}</AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. This will permanently delete your
            account and remove your data from our servers.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            className={buttonVariants({ variant: "destructive" })}
            onClick={onConfirm}
          >
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
