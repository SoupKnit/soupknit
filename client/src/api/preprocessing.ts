import { SupabaseClient } from "@supabase/supabase-js"

import { useSupa } from "@/lib/supabaseClient"
import { PreprocessingConfig } from "@/types/preprocessing"

export const fetchPreprocessingConfig =
  async (): Promise<PreprocessingConfig> => {
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
