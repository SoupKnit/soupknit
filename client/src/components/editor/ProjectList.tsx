import { useMutation, useQuery } from "@tanstack/react-query"
import { Link, useNavigate } from "@tanstack/react-router"

import { Folder, PlusCircle } from "lucide-react"

import { Card } from "../ui/card"
import { withLineBreaks } from "./MultiLineText"
import { createNewProject, loadProjects } from "@/actions/projectsActions"
import { Button } from "@/components/ui/button"
import { useSupa } from "@/lib/supabaseClient"

interface Project {
  id: string
  title: string
  description: string
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
    <div className="mx-auto w-full p-6">
      <div className="flex justify-between">
        <h2 className="mb-6 text-2xl font-bold text-gray-800">Your Projects</h2>
        <Button
          onClick={() => createProject.mutate()}
          className="w-full sm:w-auto"
        >
          <PlusCircle className="mr-2 h-5 w-5" />
          Create New Project
        </Button>
      </div>
      <div className="my-6 space-y-8">
        {!isError &&
          projects.map((project: Project) => (
            <Card
              hoverable
              key={project.id}
              className="p-8 transition-colors duration-200 hover:bg-gray-100"
            >
              <Link to={`/app/${project.id}`}>
                <div className="flex">
                  {/* <Folder className="mr-3 mt-1 h-8 w-8 flex-shrink-0 text-gray-500" /> */}
                  <div>
                    <div className="truncate text-2xl font-semibold text-gray-800">
                      {project.title}
                    </div>
                    <div className="mt-2">
                      <AddLineBreaks text={project.description} />
                    </div>
                  </div>
                </div>
              </Link>
            </Card>
          ))}
      </div>
    </div>
  )
}

function AddLineBreaks({ text }: { text: string }) {
  return (
    <>
      {text.split("\n").map((line) => (
        <div key={line}>{line}</div>
      ))}
    </>
  )
}

export default ProjectList
