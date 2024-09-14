import { useEffect, useRef, useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useNavigate } from "@tanstack/react-router"
import { useAtom, useAtomValue, useSetAtom } from "jotai"
import { toast } from "sonner"

import { ChevronUp, Trash2 } from "lucide-react"

import { MultiLineTextInput } from "../editor/MultiLineText"
import { Badge } from "../ui/badge"
import { buttonVariants } from "../ui/button"
import { Skeleton } from "../ui/skeleton"
import { useProjectActions } from "@/actions/projectsActions"
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
import { projectDetailsStore } from "@/store/workbookStore"

import type { ProjectDetails } from "@/store/workbookStore"
import type { Atom } from "jotai"

export function ProjectHeaderLarge({
  activeProject,
  setCollapsed,
}: Readonly<{
  activeProject: ProjectDetails
  setCollapsed: React.Dispatch<React.SetStateAction<boolean>>
}>) {
  const descriptionInputRef = useRef<HTMLDivElement>(null)
  const [focusDescription, setFocusDescription] = useState<boolean>(false)
  // const [title, setTitle] = useState<string>(activeProject.title)
  const [projectDetails, setProjectDetails] = useAtom(projectDetailsStore)
  const navigate = useNavigate({ from: "/app" })
  const queryClient = useQueryClient()

  useEffect(() => {
    if (focusDescription && descriptionInputRef.current) {
      descriptionInputRef.current.focus()
      setFocusDescription(false)
    }
  }, [focusDescription])

  const { updateProjectTitle, updateProjectDescription, deleteProject } =
    useProjectActions()

  // debounce the mutation, so it doesn't fire on every keystroke
  // also keep the previous values in the mutation, so it can update the previous values
  const projectDetailsMutation = useMutation({
    mutationFn: async ({
      title,
      description,
    }: {
      title?: string
      description?: string
    }) => {
      if (!activeProject) {
        throw new Error("No active project")
      }
      if (title && title !== activeProject.title) {
        return await updateProjectTitle(title, activeProject.id)
      }
      if (description && description !== activeProject.description) {
        return await updateProjectDescription(description, activeProject.id)
      }
      return activeProject
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project", activeProject.id] })
      toast.success("Project details saved successfully")
    },
    onError: (error) => {
      console.error("Error saving title:", error)
      toast.error("Error saving project details")
    },
  })

  // const descriptionMutation = useMutation({
  //   mutationFn: async (description: string) =>
  //     updateProjectDescription(description, activeProject.id),
  //   onSuccess: () => {
  //     console.log("Description saved successfully")
  //   },
  //   onError: (error) => {
  //     console.error("Error saving description:", error)
  //   },
  // })

  const deleteMutation = useMutation({
    mutationFn: async () => {
      if (!activeProject) {
        throw new Error("No active project")
      }
      // return deleteProject(project/workbook)
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
        value={projectDetails?.title ?? ""}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
          if (!projectDetails) {
            return
          }
          setProjectDetails({
            ...projectDetails,
            title: e.target.value,
          })
        }}
        onBlur={() => {
          // debounce the mutation
          projectDetailsMutation.mutate({
            title: projectDetails?.title,
          })
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
          value={projectDetails?.description ?? ""}
          onChange={(value) => {
            if (value !== activeProject?.description) {
              projectDetailsMutation.mutate({
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
            ProjectID: {activeProject?.id}
          </Badge>
          <Badge className="bg-slate-200 p-1 px-2 text-gray-600 hover:bg-slate-300">
            WorkbookId: {activeProject?.workbook_data[0]?.id}
          </Badge>
        </a>
        <a href="https://supabase.com/dashboard/project/kstcbdcmgvzsitnywtue">
          <Badge className="ml-4 bg-slate-200 p-1 px-2 text-gray-600 hover:bg-slate-300">
            Status: Draft
          </Badge>
        </a>
      </div>
      <div className="flex justify-center">
        <button onClick={() => setCollapsed(true)} className="mx-auto w-4">
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
  activeProject: ProjectDetails
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
        {activeProject?.title || (
          <span className="italic text-gray-500">Untitled</span>
        )}
      </h2>
      <p className="text-lg text-gray-500 dark:text-gray-400">
        {activeProject?.description}
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

export function ProjectHeader({ projectId }: { projectId: string }) {
  const [collapsed, setCollapsed] = useState(true)
  const [projectDetails, setProjectDetails] = useAtom(projectDetailsStore)
  const { loadProject } = useProjectActions()

  const projectQuery = useQuery({
    queryKey: ["project", projectId],
    queryFn: async () => {
      return await loadProject(projectId)
    },
    placeholderData: () => {
      if (!projectDetails) {
        return undefined
      }
      if (projectDetails.id === projectId) {
        return projectDetails
      }
      return undefined
    },
  })

  useEffect(() => {
    if (projectQuery.data) {
      setProjectDetails(projectQuery.data)
    }
  }, [projectQuery.data, setProjectDetails])

  if (!projectDetails) {
    return (
      <div className="mt-10 flex flex-col gap-2">
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-6 w-96" />
      </div>
    )
  }

  return (
    <div className="relative py-4">
      <div className="app-container mx-auto">
        {collapsed ? (
          <ProjectHeaderSmall
            activeProject={projectDetails}
            setCollapsed={setCollapsed}
          />
        ) : (
          <ProjectHeaderLarge
            activeProject={projectDetails}
            setCollapsed={setCollapsed}
          />
        )}
      </div>
    </div>
  )
}
