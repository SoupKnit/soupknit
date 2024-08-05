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
  console.log(projectId)
  const [title, setTitle] = useState<string>("")
  const [description, setDescription] = useState<string>("")
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const descriptionInputRef = useRef<HTMLTextAreaElement>(null)
  const [focusDescription, setFocusDescription] = useState<boolean>(false)

  const loadProject = async () => {
    setLoading(true)
    setError(null)
    try {
      const { data, error } = await supa
        .from("Projects")
        .select("title, id, description")
        .eq("id", parseInt(projectId))
        .single()

      if (error) throw error

      if (data) {
        setTitle(data.title || "")
        setDescription(data.description || "")
      } else {
        throw new Error("Project not found")
      }
    } catch (error) {
      console.error("Error loading project:", error)
      setError("Failed to load project details. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const supa = useSupa()

  const { isLoading, data: project = null } = useQuery({
    queryKey: ["project", projectId, supa],
    queryFn: async () => loadProject(supa, projectId),
  })

  useEffect(() => {
    if (isLoading === false && project) {
      setTitle(project.title)
      setDescription(project.description)
    }
  }, [project, isLoading])

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

  if (loading) {
    return <div className="mt-8 text-center">Loading project details...</div>
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
      <CSVViewer projectId={projectId} />
    </div>
  )
}

export default Workbook
