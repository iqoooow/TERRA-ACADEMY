import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://erlsayzbvlccjenficsx.supabase.co';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVybHNheXpidmxjY2plbmZpY3N4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2Nzg4Mzg2OSwiZXhwIjoyMDgzNDU5ODY5fQ.ziI23wWMbTPo7IVw_u8ZvtAEuKixpANFkdPN2D817OY';

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function createAdmin() {
  try {
    console.log('📝 Yangi admin user yaratilmoqda: ixlos703@gmail.com');

    // 1. Auth-da user yaratish
    const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
      email: 'ixlosrajabboyev96@gmail.com',
      password: 'ixlosbek123',
      email_confirm: true,
    });

    if (authError) {
      console.error('❌ Auth user yaratirishda xato:', authError);
      return;
    }

    console.log('✅ Auth user yaratildi:', authUser.user.id);

    // 2. Profile-ga owner rolisin o'rnating
    const { error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: authUser.user.id,
        full_name: 'Administrator',
        role: 'owner',
        status: 'approved',
        is_first_login: false,
      })
      .single();

    if (profileError) {
      console.error('❌ Profile yaratirishda xato:', profileError);
      return;
    }

    console.log('✅ Profile yaratildi');
    console.log('\n🎉 Admin foydalanuvchisi muvaffaqiyatli yaratildi!');
    console.log('📧 Email: ixlos703@gmail.com');
    console.log('🔐 Parol: ixlosbek123');
    console.log('\n✨ Endi login qilishingiz mumkin!');

  } catch (error) {
    console.error('❌ Xatolik:', error.message);
  }
}

createAdmin();
