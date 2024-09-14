import { useMemo } from "react"

import { withClientContext } from "./actionRegistry"
import { createNewWorkbook } from "./workbookActions"
import { useEnv } from "@/lib/clientEnvironment"

import type { ClientActionRegistry } from "./actionRegistry"
import type { ClientEnvironment } from "@/lib/clientEnvironment"
import type { ProjectDetails } from "@/store/workbookStore"
import type {
  ActiveProject,
  WorkbookDataFile,
} from "@soupknit/model/src/workbookSchemas"

const updateProjectTitle = async (
  env: ClientEnvironment,
  title: string,
  projectId: string,
) => {
  return await env.supa
    .from("projects")
    .update({ title })
    .eq("id", projectId)
    .select("title")
    .throwOnError()
    .then((r) => r.data)
}

const updateProjectDescription = async (
  env: ClientEnvironment,
  description: string,
  projectId: string,
) => {
  return await env.supa
    .from("projects")
    .update({ description })
    .eq("id", projectId)
    .throwOnError()
    .then((r) => r.data)
}

const loadProject = async (env: ClientEnvironment, projectId: string) => {
  const { data, error } = await env.supa
    .from("projects")
    .select(
      `
      title,
      id,
      description,
      updated_at,
      workbook_data(
        id
      )
    `,
    )
    .eq("id", projectId)
    .single()

  if (error) {
    throw error
  }

  return data as ProjectDetails
}

const createNewProject = async (
  env: ClientEnvironment,
  initialFile?: WorkbookDataFile,
) => {
  try {
    const { data: projectData, error: projectError } = await env.supa
      .from("projects")
      .insert([{ title: "New Project" }])
      .select()
      .single()

    if (projectError ?? !projectData) {
      throw new Error(projectError?.message || "Failed to create project")
    }

    const projectId = projectData.id

    if (initialFile) {
      const workbookData = await createNewWorkbook(env, projectId, initialFile)
      return { projectId, workbookId: workbookData.id }
    }

    return { projectId }
  } catch (error) {
    console.error("Error creating project:", error)
    throw error
  }
}

const loadProjects = async (env: ClientEnvironment) => {
  const loadProjectsQuery = env.supa
    .from("projects")
    // .select("title, id, description, updated_at")
    .select(
      `
      title,
      id,
      description,
      updated_at,
      workbook_data(
        id
      )
    `,
    )
  const { data, error } = await loadProjectsQuery
  if (error) {
    throw error
  }
  return data as ProjectDetails[]
}

const loadDatasets = async (env: ClientEnvironment, userId: string | null) => {
  if (!userId) {
    return []
  }
  const { data, error } = await env.supa.storage
    .from("workbook-files")
    .list(userId)
  if (error) {
    throw error
  }
  return data
}

// TODO: fix this it doesn't work
async function deleteProject(env: ClientEnvironment, workbook: ActiveProject) {
  console.log(`Starting deletion process for project: ${workbook}`)
  // //1. Fetch the workbooks associated with this project
  // const { data: workbooks, error: workbooksError } = await supa
  //   .from("workbooks")
  //   .select("id, file_url")
  //   .eq("project_id", projectId)
  // if (workbooksError) throw workbooksError

  // 2. Delete files from storage

  if (workbook.files?.length && workbook.files[0]?.file_url) {
    const filePathMatch = workbook.files[0]?.file_url.match(
      /\/storage\/v1\/object\/public\/workbook-files\/(.+)/,
    )
    if (filePathMatch) {
      const filePath = filePathMatch[1]
      if (!filePath) {
        throw new Error("Failed to extract file path from URL")
      }
      const { error: deleteFileError } = await env.supa.storage
        .from("workbook-files")
        .remove([filePath])
      if (deleteFileError) {
        console.error(
          `Failed to delete file for workbook ${workbook.projectId}:`,
          deleteFileError,
        )
      } else {
        console.log(`Deleted file for workbook ${workbook.projectId}`)
      }
    }
  }

  // // 3. Delete workbook data
  // await supa
  //   .from("workbook_data")
  //   .delete()
  //   .in(
  //     "workbook_id",
  //     workbooks.map((w) => w.id),
  //   )
  //   .throwOnError()

  // 5. Delete the project
  const { error: projectDeleteError } = await env.supa
    .from("projects")
    .delete()
    .eq("id", workbook.projectId)
    .throwOnError()
  if (projectDeleteError) throw projectDeleteError
  console.log(
    `Successfully deleted project ${workbook.projectId} and all associated data`,
  )
}

const allProjectActions = {
  updateProjectTitle,
  updateProjectDescription,
  loadProject,
  createNewProject,
  loadProjects,
  loadDatasets,
  deleteProject,
} as const satisfies ClientActionRegistry

export function useProjectActions() {
  const env = useEnv()
  return withClientContext(allProjectActions, env)
}
