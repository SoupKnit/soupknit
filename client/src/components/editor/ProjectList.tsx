import { useMutation, useQuery } from "@tanstack/react-query"
import { Link, useNavigate } from "@tanstack/react-router"
import { useAtom, useSetAtom } from "jotai"
import { toast } from "sonner"

import { PlusCircle } from "lucide-react"

import OnboardingForm from "../onboarding/OnbaordingForm"
import {
  createNewProject,
  loadDatasets,
  loadProjects,
} from "@/actions/projectsActions"
import { HoverCard } from "@/components/HoverCard"
import { Button } from "@/components/ui/button"
import { useEnv } from "@/lib/clientEnvironment"
import { userSettingsStore } from "@/store/userSettingsStore"
import {
  activeFileAtom,
  activeProjectAndWorkbookAtom,
} from "@/store/workbookStore"

export function ProjectList() {
  const { supa } = useEnv()
  const navigate = useNavigate({ from: "/app/$projectId" })
  const setActiveProjectAndWorkbook = useSetAtom(activeProjectAndWorkbookAtom)
  const setActiveFile = useSetAtom(activeFileAtom)

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
      const initialFile = {
        name: "New File",
        file_url: "",
        type: "csv",
      }
      return await createNewProject(supa, initialFile)
    },
    onSuccess: ({ projectId, workbookId, activeFile }) => {
      setActiveProjectAndWorkbook({ projectId, workbookId })
      if (activeFile) {
        setActiveFile(activeFile)
      }
      navigate({ to: "/app/$projectId", params: { projectId } })
    },
    onError: (error) => {
      console.error("Failed to create project:", error)
      toast.error(`Failed to create project: ${error.message}`)
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
      <div className="flex flex-wrap justify-between">
        <h2 className="font-headline text-3xl font-bold text-gray-700">
          Projects
        </h2>
        <div className="flex gap-4">
          <OnboardingForm />
          <Button
            variant={"brutal"}
            onClick={() => createProject.mutate()}
            className="text-md w-full bg-orange-300 font-bold hover:bg-orange-400 sm:w-auto"
          >
            <PlusCircle className="mr-2 h-6 w-6" />
            NEW PROJECT
          </Button>
        </div>
      </div>
      <div className="mx-auto my-8 flex flex-wrap gap-8">
        {!isError &&
          projects
            .filter((p) => !!p)
            .map((project: DBProject) => (
              <HoverCard key={project.id} className="md:w-[360px]">
                <Link to={`/app/${project.id}`}>
                  <div className="flex h-full flex-col">
                    {/* <Folder className="mr-3 mt-1 h-12 w-12 flex-shrink-0 text-gray-500" /> */}
                    <div className="flex-grow text-2xl font-semibold text-gray-800 dark:text-gray-300">
                      {project.title || "Untitled Project"}
                    </div>
                    <div className="mt-2 h-40 flex-grow overflow-hidden">
                      <AddLineBreaks
                        className="text-sm tracking-tighter text-gray-500"
                        text={project.description || ""}
                      />
                    </div>
                    <div className="mt-3 text-sm text-gray-500">
                      Last updated:{" "}
                      {project.updated_at &&
                        new Date(project.updated_at).toLocaleString()}
                    </div>
                  </div>
                </Link>
              </HoverCard>
            ))}
        <HoverCard
          role="button"
          onClick={() => createProject.mutate()}
          className="rounded-md border-dashed border-gray-400 p-6 shadow-gray-300 transition-colors duration-200 hover:border-orange-400 hover:bg-orange-300 hover:shadow-orange-400 md:w-[360px]"
        >
          <div className="flex h-full flex-col justify-center gap-4 text-center text-xl font-bold text-gray-300 hover:text-orange-400">
            <PlusCircle className="mx-auto h-12 w-12" />
            New Project
          </div>
        </HoverCard>
      </div>

      <Datasets />
    </div>
  )
}

function Datasets() {
  const { supa } = useEnv()

  const userId = useAtom(userSettingsStore)[0].userId

  const { data: datasets } = useQuery({
    queryKey: ["datasets", supa, userId],
    queryFn: async () => {
      return await loadDatasets(supa, userId)
    },
    enabled: !!userId,
  })
  return (
    <>
      <div className="mt-20 flex flex-wrap justify-between">
        <h2 className="font-headline text-3xl font-bold text-gray-700">
          Datasets
        </h2>
      </div>
      <div className="mx-auto my-8 flex flex-wrap gap-8">
        {datasets?.map((dataset) => (
          <HoverCard
            className="w-full rounded-md p-6 transition-colors duration-200 hover:bg-gray-100 md:w-80"
            key={dataset.name}
          >
            <Link to={`/app/${dataset.name}`}>
              <div className="flex h-full flex-col">
                {/* <Folder className="mr-3 mt-1 h-12 w-12 flex-shrink-0 text-gray-500" /> */}
                <div className="flex-grow text-2xl font-semibold text-gray-800">
                  {dataset.name}
                </div>
                <div className="mt-3 text-sm text-gray-500">
                  Last updated: {new Date(dataset.updated_at).toLocaleString()}
                </div>
              </div>
            </Link>
          </HoverCard>
        ))}
      </div>
    </>
  )
}

function AddLineBreaks({
  text,
  className,
}: Readonly<{
  text: string
  className: string
}>) {
  return (
    <>
      {text?.split("\n").map((line) => (
        <span className={className} key={line}>
          {line}
          <br />
        </span>
      ))}
    </>
  )
}

export default ProjectList
