import { createClient } from '@supabase/supabase-js';

// Admin client uses service_role key to bypass RLS and create auth users.
// ⚠️ Only import this file in admin-protected components (role: owner/admin).
// In production, move user creation to a Supabase Edge Function.
export const supabaseAdmin = createClient(
    import.meta.env.VITE_SUPABASE_URL,
    import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY,
    { auth: { autoRefreshToken: false, persistSession: false } }
);
