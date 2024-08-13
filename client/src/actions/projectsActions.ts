import { createNewWorkbook } from "@/actions/workbookActions"

import type { DBProject } from "@soupknit/model/src/dbTables"
import type { WorkbookDataFile } from "@soupknit/model/src/workbookSchemas"
import type { SupabaseClient } from "@supabase/supabase-js"

export const updateProjectTitle = async (
  supa: SupabaseClient,
  title: string,
  projectId: string,
) => {
  return await supa
    .from("projects")
    .update({ title })
    .eq("id", projectId)
    .select("title")
    .throwOnError()
    .then((r) => r.data)
}

export const updateProjectDescription = async (
  supa: SupabaseClient,
  description: string,
  projectId: string,
) => {
  return await supa
    .from("projects")
    .update({ description })
    .eq("id", projectId)
    .throwOnError()
    .then((r) => r.data)
}

export const loadProject = async (supa: SupabaseClient, projectId: string) => {
  const { data, error } = await supa
    .from("projects")
    .select("title, id, description")
    .eq("id", projectId)

  // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
  if (error || !data || !data.length) {
    throw error
  } else {
    return data[0]
  }
}

export const createNewProject = async (
  supa: SupabaseClient,
  initialFile?: WorkbookDataFile,
) => {
  try {
    const { data: projectData, error: projectError } = await supa
      .from("projects")
      .insert([{ title: "New Project" }])
      .select()
      .single()

    if (projectError || !projectData) {
      throw new Error(projectError?.message ?? "Failed to create project")
    }

    const projectId = projectData.id

    if (initialFile) {
      const workbookData = await createNewWorkbook(supa, projectId, initialFile)
      return { projectId, workbookId: workbookData.id, activeFile: initialFile }
    }

    return { projectId }
  } catch (error) {
    console.error("Error creating project:", error)
    throw error
  }
}

export const loadProjects = async (supa: SupabaseClient) => {
  return (await supa
    .from("projects")
    .select("title, id, description, updated_at")
    .throwOnError()
    .then((r) => r.data)) as Partial<DBProject[]>
}

export const loadDatasets = async (
  supa: SupabaseClient,
  userId: string | null,
) => {
  if (!userId) {
    return []
  }
  const { data, error } = await supa.storage.from("workbook-files").list(userId)
  if (error) {
    throw error
  }
  return data
}
