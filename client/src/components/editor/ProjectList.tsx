import { useMutation, useQuery } from "@tanstack/react-query"
import { Link, useNavigate } from "@tanstack/react-router"

import { Folder, PlusCircle } from "lucide-react"

import { createNewProject, loadProjects } from "@/actions/projectsActions"
import { Button } from "@/components/ui/button"
import { useSupa } from "@/lib/supabaseClient"

interface Project {
  id: string
  title: string
}

export function ProjectList() {
  const supa = useSupa()
  const navigate = useNavigate({ from: "/app/$projectId" })

  const {
    isPending,
    data: projects,
    isError,
  } = useQuery({
    queryKey: ["projects", supa],
    queryFn: async () => {
      return await loadProjects(supa)
    },
  })

  const createProject = useMutation({
    mutationFn: async () => {
      return await createNewProject(supa)
    },
    onSuccess: (projectId) => {
      navigate({ to: "/app/$projectId", params: { projectId } })
    },
  })

  if (isPending || !projects) {
    return <div>Loading...</div>
  }

  if (isError || !projects) {
    return <div>Error loading projects</div>
  }

  return (
    <div className="w-full bg-white shadow-md">
      <div className="mx-auto max-w-7xl p-6">
        <h2 className="mb-6 text-2xl font-bold text-gray-800">Your Projects</h2>
        <div className="mb-6 space-y-3">
          {!isError &&
            projects.map((project: Project) => (
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
        <Button
          onClick={() => createProject.mutate()}
          className="w-full sm:w-auto"
        >
          <PlusCircle className="mr-2 h-5 w-5" />
          Create New Project
        </Button>
      </div>
    </div>
  )
}

export default ProjectList
