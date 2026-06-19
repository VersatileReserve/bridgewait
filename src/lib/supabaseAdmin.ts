import { createClient } from '@supabase/supabase-js';

// ---------------------------------------------------------------------------
// SERVER-ONLY Supabase client. Uses the service role key, which bypasses RLS.
// NEVER import this into a client component or anything that ships to the
// browser. It exists so trusted server routes (the FL511 ingest cron) can write
// bridges.live_* without loosening RLS on the bridges table.
// ---------------------------------------------------------------------------

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});
