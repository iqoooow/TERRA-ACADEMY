import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { sendSMSWithLog } from '../_shared/devsms.ts';

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });

  try {
    const { absent_student_ids, group_id, date } = await req.json();

    if (!absent_student_ids?.length) {
      return new Response(JSON.stringify({ success: true, sent: 0 }), {
        headers: { ...cors, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Check SMS settings
    const { data: settings } = await supabase
      .from('sms_settings')
      .select('attendance_sms_enabled, late_warning_count')
      .limit(1)
      .maybeSingle();

    if (settings?.attendance_sms_enabled === false) {
      return new Response(
        JSON.stringify({ success: true, sent: 0, reason: 'Attendance SMS disabled in settings' }),
        { headers: { ...cors, 'Content-Type': 'application/json' } }
      );
    }

    const lateThreshold = settings?.late_warning_count ?? 3;

    // Get group name
    const { data: group } = await supabase
      .from('groups')
      .select('name')
      .eq('id', group_id)
      .single();

    const groupName = group?.name || 'guruh';
    const formattedDate = new Date(date).toLocaleDateString('uz-UZ', {
      day: 'numeric',
      month: 'long',
    });

    let totalSent = 0;

    for (const studentId of absent_student_ids) {
      const { data: student } = await supabase
        .from('profiles')
        .select('full_name, first_name, last_name, phone')
        .eq('id', studentId)
        .single();

      if (!student) continue;

      const studentName =
        student.full_name ||
        [student.first_name, student.last_name].filter(Boolean).join(' ') ||
        "O'quvchi";

      const absenceMsg =
        `Terra Academy: ${studentName} bugun (${formattedDate}) ${groupName} darsiga kelmadi. ` +
        `Iltimos farzandingizga e'tibor bering.`;

      // Collect all recipient phones
      const recipients: Array<{ phone: string }> = [];
      if (student.phone) recipients.push({ phone: student.phone });

      const { data: parentLinks } = await supabase
        .from('parent_student')
        .select('parent_id')
        .eq('student_id', studentId)
        .eq('status', 'approved');

      if (parentLinks?.length) {
        const { data: parentProfiles } = await supabase
          .from('profiles')
          .select('phone')
          .in('id', parentLinks.map((p: any) => p.parent_id));

        (parentProfiles || []).forEach((p: any) => {
          if (p.phone) recipients.push({ phone: p.phone });
        });
      }

      // Send absence SMS
      for (const { phone } of recipients) {
        const result = await sendSMSWithLog(supabase, {
          phone,
          message: absenceMsg,
          studentId,
          triggerEvent: 'absence',
        });
        if (result.success) totalSent++;
      }

      // Late warning: if student has been late >= lateThreshold times this month
      const monthStart = new Date(date);
      monthStart.setDate(1);
      monthStart.setHours(0, 0, 0, 0);

      const { count: lateCount } = await supabase
        .from('attendance')
        .select('id', { count: 'exact', head: true })
        .eq('student_id', studentId)
        .eq('status', 'late')
        .gte('date', monthStart.toISOString().split('T')[0]);

      if ((lateCount || 0) >= lateThreshold) {
        const lateMsg =
          `Terra Academy: ${studentName} bu oy ${lateCount} marta darsga kech qoldi. ` +
          `Iltimos farzandingizga e'tibor bering.`;

        for (const { phone } of recipients) {
          await sendSMSWithLog(supabase, {
            phone,
            message: lateMsg,
            studentId,
            triggerEvent: 'late_warning',
          });
        }
      }
    }

    return new Response(JSON.stringify({ success: true, sent: totalSent }), {
      headers: { ...cors, 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    console.error('[send-absence-sms]', err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...cors, 'Content-Type': 'application/json' },
    });
  }
});
