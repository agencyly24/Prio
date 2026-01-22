
import { createClient } from "@supabase/supabase-js";

// Supabase config
const supabaseUrl = "https://gsojiwgfswtuhfbrldui.supabase.co";
const supabaseKey = "sb_publishable_PjxCZBLI4DXIJ3MBryHvaw_V_3rJZIS";

export const supabase = createClient(supabaseUrl, supabaseKey);
