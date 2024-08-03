import { getSupabaseClient } from "../../lib/supabase";

export async function createOrg(org: string) {
  // create buckets
  const supabase = getSupabaseClient();
  const { data, error } = await supabase.storage.createBucket(`${org}`, {
    public: false,
    allowedMimeTypes: ["file/csv"],
    fileSizeLimit: 1024,
  });

  console.log("createBuckets", data, error);
  if (error) {
    return { data: null, error };
  }

  // more stuff ?
  return { data, error: null };
}
