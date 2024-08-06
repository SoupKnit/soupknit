import React, { useEffect, useRef, useState } from "react"
import { useMutation, useQuery } from "@tanstack/react-query"
import { useAtom } from "jotai"

import { CSVViewer } from "../editor/CSVViewer"
import { DatasetPreview } from "../editor/DatasetPreview"
import { MultiLineTextInput } from "../editor/MultiLineText"
import {
  loadProject,
  updateProjectDescription,
  updateProjectTitle,
} from "@/actions/projectsActions"
import { Button } from "@/components/ui/button"
import { useSupa } from "@/lib/supabaseClient"
import { projectDetailsStore } from "@/store/workbookStore"

interface WorkbookProps {
  projectId: string
}

interface Project {
  id: string
  title: string
  description: string
}

const Workbook: React.FC<WorkbookProps> = ({ projectId }) => {
  const supa = useSupa()

  const { isLoading, data: project = null } = useQuery({
    queryKey: ["project", projectId, supa],
    queryFn: async () => loadProject(supa, projectId),
  })

  const [title, setTitle] = useState<string>(project?.title)
  const [description, setDescription] = useState<string>(project?.description)

  useEffect(() => {
    if (isLoading === false && project) {
      setTitle(project.title)
      setDescription(project.description)
    }
  }, [project, isLoading])

  const descriptionInputRef = useRef<HTMLDivElement>(null)
  const [focusDescription, setFocusDescription] = useState<boolean>(false)

  useEffect(() => {
    if (focusDescription && descriptionInputRef.current) {
      descriptionInputRef.current.focus()
      setFocusDescription(false)
    }
  }, [focusDescription])

  const titleMutation = useMutation({
    mutationFn: async (title: string) =>
      updateProjectTitle(supa, title, projectId),
    onSuccess: () => {
      console.log("Title saved successfully")
    },
    onError: (error) => {
      console.error("Error saving title:", error)
    },
  })

  const descriptionMutation = useMutation({
    mutationFn: async (description: string) =>
      updateProjectDescription(supa, description, projectId),
    onSuccess: () => {
      console.log("Description saved successfully")
    },
    onError: (error) => {
      console.error("Error saving description:", error)
    },
  })

  if (isLoading || !project) {
    return <div>Loading...</div>
  }

  return (
    <div className="container mx-auto my-24">
      {/* <h2 className="mb-4 text-2xl font-bold">Project Details</h2> */}
      <input
        type="text"
        className="input-invisible text-5xl font-semibold"
        value={title}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
          setTitle(e.target.value)
        }
        onKeyDown={(e) => {
          if (
            e.key === "Enter" ||
            e.key === "Escape" ||
            e.key === "Tab" ||
            e.key === "ArrowDown"
          ) {
            e.preventDefault()
            setFocusDescription(true)
            titleMutation.mutate(title)
          }
        }}
        onBlur={() => titleMutation.mutate(title)}
        placeholder="Untitled"
      />
      <div className="my-4">
        <MultiLineTextInput
          className="input-invisible min-h-12 rounded-md p-2 text-lg text-gray-700 focus:outline-2 focus:outline-gray-200"
          value={description}
          onChange={(value) => {
            console.log("Setting description to:", value)
            descriptionMutation.mutate(value)
            setDescription(value)
          }}
        />
      </div>
      {/* TODO: Fix this, both have uploads */}
      {/* <DatasetPreview /> */}
      <CSVViewer projectId={projectId} />
      <div className="mt-4 flex justify-end">
        <Button
          variant={"brutal"}
          className="bg-purple-300 font-mono hover:bg-purple-400"
        >
          RUN WORKBOOK
        </Button>
      </div>
    </div>
  )
}

export default Workbook
