import { createClient } from "@supabase/supabase-js";

require("dotenv").config();

const supabaseUrl = process.env.SUPABASE_CLIENT_URL;
const supabaseAnonKey = process.env.SUPABASE_API_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Missing env vars");
}

export const getSupabaseClient = () =>
  createClient(supabaseUrl, supabaseAnonKey);
