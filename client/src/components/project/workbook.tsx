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
  const descriptionInputRef = useRef<HTMLTextAreaElement>(null)
  const [focusDescription, setFocusDescription] = useState<boolean>(false)

  const loadProject = async () => {
    let { data, error } = await supa
      .from("Projects")
      .select("title, id, description")
      .eq("id", parseInt(projectId))

    if (error || !data || !data.length) {
      throw error
    } else {
      console.log(data)
      const p = data[0]
      if (p && p.title) {
        setTitle(p.title)
      }
      if (p && p.description) {
        setDescription(p.description)
      }
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
    console.log({ title })
    try {
      const { error, data } = await supa
        .from("Projects")
        .update({ title })
        .eq("id", parseInt(projectId))
        .select()

      if (error) throw error
      console.log("Title saved successfully", data)
    } catch (error) {
      console.error("Error saving title:", (error as Error).message)
    }
  }

  const handleSaveDescription = async (): Promise<void> => {
    console.log({ description })
    try {
      const { error } = await supa
        .from("Projects")
        .update({ description })
        .eq("id", parseInt(projectId))

      if (error) throw error
      console.log("Description saved successfully")
    } catch (error) {
      console.error("Error saving description:", (error as Error).message)
    }
  }

  return (
    <div className="mx-auto mt-8 rounded-lg bg-white p-6 shadow-md">
      <h2 className="mb-4 text-2xl font-bold">Project Details</h2>
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
      <CSVViewer />
    </div>
  )
}

export default Workbook
