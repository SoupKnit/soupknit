import { useMutation, useQuery } from "@tanstack/react-query"
import { Link, useNavigate } from "@tanstack/react-router"
import { useAtom } from "jotai"

import { Folder, PlusCircle } from "lucide-react"

import { Card } from "../ui/card"
import { withLineBreaks } from "./MultiLineText"
import { createNewProject, loadProjects } from "@/actions/projectsActions"
import { Button } from "@/components/ui/button"
import { useSupa } from "@/lib/supabaseClient"
import { activeProject } from "@/store/workbookStore"

interface Project {
  id: string
  title: string
  description: string
  updated_at: string
}

export function ProjectList() {
  const supa = useSupa()
  const navigate = useNavigate({ from: "/app/$projectId" })
  const [project, setProject] = useAtom(activeProject)

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
      setProject({ projectId: projectId })
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
    <div className="mx-auto mt-12 w-full p-6">
      <div className="flex justify-between">
        <h2 className="font-headline text-3xl font-bold text-gray-700">
          Your Projects
        </h2>
        <Button
          variant={"brutal"}
          onClick={() => createProject.mutate()}
          className="text-md w-full bg-orange-300 font-bold hover:bg-orange-400 sm:w-auto"
        >
          <PlusCircle className="mr-2 h-6 w-6" />
          NEW PROJECT
        </Button>
      </div>
      <div className="my-8 flex gap-8">
        {!isError &&
          projects.map((project: Project) => (
            <Card
              hoverable
              key={project.id}
              className="w-1/3 rounded-md p-8 transition-colors duration-200 hover:bg-gray-100"
            >
              <Link to={`/app/${project.id}`}>
                <div className="flex h-full flex-col">
                  {/* <Folder className="mr-3 mt-1 h-12 w-12 flex-shrink-0 text-gray-500" /> */}
                  <div className="text-2xl font-semibold text-gray-800">
                    {project.title}
                  </div>
                  <div className="mt-2 h-full flex-grow">
                    <AddLineBreaks text={project.description} />
                  </div>
                  <div className="mt-3 text-sm text-gray-500">
                    Last updated:{" "}
                    {new Date(project.updated_at).toLocaleString()}
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
