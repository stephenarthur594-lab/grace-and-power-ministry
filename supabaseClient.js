// supabaseClient.js
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

export const SUPABASE_URL = "https://gjcdruglqyhvkpndjxwd.supabase.co";
export const SUPABASE_ANON_KEY = "sb_publishable_UlyEizF5CR00WeI270Lgjw_0ZYSGykv";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);