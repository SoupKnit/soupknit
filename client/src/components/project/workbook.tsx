import React, { useEffect, useRef, useState } from "react"
import { useMutation, useQuery } from "@tanstack/react-query"

import { CSVViewer } from "../editor/CSVViewer"
import {
  loadProject,
  updateProjectDescription,
  updateProjectTitle,
} from "@/actions/projectsActions"
import { useSupa } from "@/lib/supabaseClient"

interface ProjectDetailsFormProps {
  projectId: string
}

interface Project {
  id: string
  title: string
  description: string
}

const Workbook: React.FC<ProjectDetailsFormProps> = ({ projectId }) => {
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

  const descriptionInputRef = useRef<HTMLTextAreaElement>(null)
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
      <div className="">
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
      </div>
      <div className="mt-4">
        <textarea
          ref={descriptionInputRef}
          value={description}
          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
            setDescription(e.target.value)
          }
          onBlur={() => descriptionMutation.mutate(description)}
          className="input-invisible resize-none text-xl"
          placeholder="Description"
          rows={4}
        />
      </div>
      <CSVViewer />
    </div>
  )
}

export default Workbook
