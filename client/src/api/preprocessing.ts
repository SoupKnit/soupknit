import type { PreprocessingConfig } from "@soupknit/model/src/preprocessing"
import type { SupabaseClient } from "@supabase/supabase-js"

export const fetchPreprocessingConfig = async (
  supabase: SupabaseClient,
): Promise<PreprocessingConfig> => {
  // This is our hardcoded JSON for now
  // In a real application, this would be an API call
  return {
    global_preprocessing: ["drop_missing", "pca"],
    global_params: {
      n_components: 0.95,
    },
    columns: [
      {
        name: "Column1",
        type: "numeric",
        imputation: "mean",
        scaling: "standard",
        params: {},
      },
      {
        name: "Column2",
        type: "categorical",
        encoding: "onehot",
        params: {},
      },
      // Add more columns as needed
    ],
  }
}
