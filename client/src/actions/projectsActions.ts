import type { SupabaseClient } from "@supabase/supabase-js"

export const updateProjectTitle = async (
  supa: SupabaseClient,
  title: string,
  projectId: string,
) => {
  return await supa
    .from("Projects")
    .update({ title })
    .eq("id", parseInt(projectId))
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
    .from("Projects")
    .update({ description })
    .eq("id", parseInt(projectId))
    .throwOnError()
    .then((r) => r.data)
}

export const loadProject = async (supa: SupabaseClient, projectId: string) => {
  const { data, error } = await supa
    .from("Projects")
    .select("title, id, description")
    .eq("id", parseInt(projectId))

  // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
  if (error || !data || !data.length) {
    throw error
  } else {
    return data[0]
  }
}

export const createNewProject = async (supa: SupabaseClient) => {
  try {
    const data = await supa
      .from("Projects")
      .insert([
        {
          title: "",
        },
      ])
      .select()
      .throwOnError()
      .then((r) => r.data)
    if (!data || !data.length) {
      throw new Error("No data returned from insert")
    }
    return data[0].id
  } catch (error) {
    console.error("Error creating project:", error)
  }
}

export const loadProjects = async (supa: SupabaseClient) => {
  return await supa
    .from("Projects")
    .select("title, id, description")
    .throwOnError()
    .then((r) => r.data)
}
