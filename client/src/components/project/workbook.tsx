import React, { useEffect, useRef, useState } from "react"
import { createClient } from "@supabase/supabase-js"
import { useMutation, useQuery } from "@tanstack/react-query"

import { CSVViewer } from "../editor/CSVViewer"
import {
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

const loadProject = async (
  supa: ReturnType<typeof createClient>,
  projectId: string | number,
): Promise<Project> => {
  console.log("loadProject called with projectId:", projectId)
  try {
    console.log("Fetching project from Supabase...")
    const { data, error: supaError } = await supa
      .from("Projects")
      .select("title, id, description")
      .eq("id", typeof projectId === "string" ? parseInt(projectId) : projectId)
      .single()

    console.log("Supabase response:", { data, supaError })

    if (supaError) throw supaError

    if (data) {
      console.log("Project data found:", data)
      return {
        title: data.title || "",
        description: data.description || "",
        id: data.id,
      }
    } else {
      console.log("Project not found")
      throw new Error("Project not found")
    }
  } catch (error) {
    console.error("Error loading project:", error)
    throw error
  }
}

const Workbook: React.FC<ProjectDetailsFormProps> = ({ projectId }) => {
  const [title, setTitle] = useState<string>("")
  const [description, setDescription] = useState<string>("")
  const descriptionInputRef = useRef<HTMLTextAreaElement>(null)
  const [focusDescription, setFocusDescription] = useState<boolean>(false)

  const supa = useSupa()

  const {
    isLoading,
    isError,
    data: project,
    error,
  } = useQuery({
    queryKey: ["project", projectId, supa],
    queryFn: () => loadProject(supa, projectId),
    retry: false,
  })

  useEffect(() => {
    if (project) {
      setTitle(project.title)
      setDescription(project.description)
    }
  }, [project])

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

  if (isLoading) {
    return <div className="mt-8 text-center">Loading project details...</div>
  }

  if (isError) {
    return (
      <div className="mt-8 text-center">
        Error: {error?.message || "An error occurred"}
      </div>
    )
  }

  if (!project) {
    return <div className="mt-8 text-center">No project found</div>
  }

  return (
    <div className="container mx-auto my-24">
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
