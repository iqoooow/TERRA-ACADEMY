import { createClient } from '@supabase/supabase-js';

// Admin client uses service_role key to bypass RLS and create auth users.
// ⚠️ Only used in admin-protected components (role: owner/admin).
// In production, move user creation to a Supabase Edge Function.

const url = import.meta.env.VITE_SUPABASE_URL;
const serviceKey = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

// Lazy singleton — faqat service key mavjud bo'lganda yaratiladi.
// Agar key yo'q bo'lsa, ilovani bloklash emas, faqat admin funksiyalari ishlamaydi.
let _adminClient = null;

export function getSupabaseAdmin() {
    if (!url || !serviceKey) {
        console.warn(
            '⚠️ VITE_SUPABASE_SERVICE_ROLE_KEY is not set in .env.\n' +
            'Admin operations (create user, reset password) will not work.\n' +
            'Add it from: Supabase Dashboard → Project Settings → API → service_role (secret)'
        );
        return null;
    }
    if (!_adminClient) {
        _adminClient = createClient(url, serviceKey, {
            auth: { autoRefreshToken: false, persistSession: false }
        });
    }
    return _adminClient;
}

// Backwards compatibility — komponenlardagi import o'zgarmasin deb
// (null bo'lishi mumkin, ishlatishdan oldin null tekshiruvi kerak)
export const supabaseAdmin = serviceKey
    ? createClient(url, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } })
    : null;
