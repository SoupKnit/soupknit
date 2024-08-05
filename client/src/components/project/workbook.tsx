/**
 * input for the title
 * input for description
 *
 * state has project id
 * handlers for save title and save desription for this project id in supabase
 * after entering the title, autofocus on description
 * use tailwind styles
 *
 */

import React, { useEffect, useRef, useState } from "react"
import { createClient, SupabaseClient } from "@supabase/supabase-js"

import { CSVViewer } from "../editor/CSVViewer"
import supa from "@/lib/supabaseClient"

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

  useEffect(() => {
    loadProject()
  }, [projectId])

  useEffect(() => {
    if (focusDescription && descriptionInputRef.current) {
      descriptionInputRef.current.focus()
      setFocusDescription(false)
    }
  }, [focusDescription])

  const handleTitleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault()
      setFocusDescription(true)
      handleSaveTitle()
    }
  }

  const handleSaveTitle = async (): Promise<void> => {
    try {
      const { error } = await supa
        .from("Projects")
        .update({ title })
        .eq("id", parseInt(projectId))

      if (error) throw error
      console.log("Title saved successfully")
    } catch (error) {
      console.error("Error saving title:", (error as Error).message)
      setError("Failed to save title. Please try again.")
    }
  }

  const handleSaveDescription = async (): Promise<void> => {
    try {
      const { error } = await supa
        .from("Projects")
        .update({ description })
        .eq("id", parseInt(projectId))

      if (error) throw error
      console.log("Description saved successfully")
    } catch (error) {
      console.error("Error saving description:", (error as Error).message)
      setError("Failed to save description. Please try again.")
    }
  }

  if (loading) {
    return <div className="mt-8 text-center">Loading project details...</div>
  }

  return (
    <div className="mx-auto mt-8 rounded-lg bg-white p-6 shadow-md">
      <h2 className="mb-4 text-2xl font-bold">Project Details</h2>
      {error && <div className="mb-4 text-red-500">{error}</div>}
      <div className="mb-4">
        <label
          htmlFor="title"
          className="mb-1 block text-sm font-medium text-gray-700"
        >
          Title
        </label>
        <input
          type="text"
          id="title"
          value={title}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            setTitle(e.target.value)
          }
          onKeyDown={handleTitleKeyDown}
          onBlur={handleSaveTitle}
          className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Enter project title and press Enter"
        />
      </div>
      <div className="mb-4">
        <label
          htmlFor="description"
          className="mb-1 block text-sm font-medium text-gray-700"
        >
          Description
        </label>
        <textarea
          id="description"
          ref={descriptionInputRef}
          value={description}
          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
            setDescription(e.target.value)
          }
          onBlur={handleSaveDescription}
          className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Enter project description"
          rows={4}
        />
      </div>
      <CSVViewer projectId={projectId} />
    </div>
  )
}

export default Workbook
