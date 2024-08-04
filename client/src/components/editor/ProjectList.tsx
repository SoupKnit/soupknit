import React, { useEffect, useState } from "react"
import { Link, useNavigate } from "@tanstack/react-router"

import { Folder, PlusCircle } from "lucide-react"

import { Button } from "@/components/ui/button"
import supa from "@/lib/supabaseClient"

interface Project {
  id: string
  title: string
}

export function ProjectList() {
  const [projects, setProjects] = useState<any>([])
  const navigate = useNavigate({ from: "/app/$projectId" })
  const createNewProject = async () => {
    const { data, error } = await supa
      .from("Projects")
      .insert([
        {
          title: "",
        },
      ])
      .select()
    if (error) {
      console.log(error)
    } else {
      navigate({ to: "/app/$projectId", params: { projectId: data[0].id } })
    }
  }
  const loadProjects = async () => {
    let { data, error } = await supa.from("Projects").select("title, id")
    if (!data) {
      setProjects([])
    } else {
      setProjects(data)
    }
  }
  useEffect(() => {
    loadProjects()
  })
  return (
    <div className="w-full bg-white shadow-md">
      <div className="mx-auto max-w-7xl p-6">
        <h2 className="mb-6 text-2xl font-bold text-gray-800">Your Projects</h2>
        <div className="mb-6 space-y-3">
          {projects.map((project: Project) => (
            <Link
              key={project.id}
              to={`/app/${project.id}`}
              className="flex items-center rounded-md bg-gray-50 p-4 transition-colors duration-200 hover:bg-gray-100"
            >
              <Folder className="mr-3 h-5 w-5 flex-shrink-0 text-blue-500" />
              <span className="truncate font-medium text-gray-700">
                {project.title}
              </span>
            </Link>
          ))}
        </div>
        <Button onClick={createNewProject} className="w-full sm:w-auto">
          <PlusCircle className="mr-2 h-5 w-5" />
          Create New Project
        </Button>
      </div>
    </div>
  )
}

export default ProjectList
