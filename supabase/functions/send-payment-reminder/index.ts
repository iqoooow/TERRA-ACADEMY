import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { sendSMSWithLog } from '../_shared/devsms.ts';

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const MONTH_NAMES = ['', 'Yanvar', 'Fevral', 'Mart', 'Aprel', 'May', 'Iyun',
  'Iyul', 'Avgust', 'Sentabr', 'Oktabr', 'Noyabr', 'Dekabr'];

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });

  try {
    const body = await req.json().catch(() => ({}));
    // event_type: 'reminder' | 'overdue' | 'confirmed'
    const { student_ids, event_type = 'reminder' } = body;

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Check SMS settings
    const { data: settings } = await supabase
      .from('sms_settings')
      .select('payment_sms_enabled')
      .limit(1)
      .maybeSingle();

    if (settings?.payment_sms_enabled === false) {
      return new Response(
        JSON.stringify({ success: true, sent: 0, reason: 'Payment SMS disabled in settings' }),
        { headers: { ...cors, 'Content-Type': 'application/json' } }
      );
    }

    const now = new Date();
    const month = now.getMonth() + 1;
    const year = now.getFullYear();
    const monthName = MONTH_NAMES[month];

    let targetStudentIds: string[] = student_ids?.length ? student_ids : [];

    // If no specific students, find by payment status
    if (!targetStudentIds.length) {
      const statusFilter =
        event_type === 'overdue' ? ['overdue'] : ['pending', 'overdue'];

      const { data: unpaid } = await supabase
        .from('monthly_payments')
        .select('student_id')
        .in('status', statusFilter)
        .eq('payment_month', month)
        .eq('payment_year', year);

      targetStudentIds = [...new Set((unpaid || []).map((p: any) => p.student_id))];
    }

    if (!targetStudentIds.length) {
      return new Response(JSON.stringify({ success: true, sent: 0 }), {
        headers: { ...cors, 'Content-Type': 'application/json' },
      });
    }

    let totalSent = 0;

    for (const studentId of targetStudentIds) {
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

      // Build message based on event type
      let message = '';
      let triggerEvent = event_type;

      if (event_type === 'confirmed') {
        message =
          `Terra Academy: Hurmatli ${studentName}, ${monthName} oyi uchun ` +
          `to'lovingiz qabul qilindi. Rahmat!`;
      } else if (event_type === 'overdue') {
        message =
          `Terra Academy: Farzandingiz uchun ${monthName} oyi to'lovi muddati o'tib ketdi. ` +
          `Iltimos to'lovni tezroq amalga oshiring.`;
      } else {
        // reminder — include amount if available
        const { data: payment } = await supabase
          .from('monthly_payments')
          .select('final_amount, base_amount')
          .eq('student_id', studentId)
          .eq('payment_month', month)
          .eq('payment_year', year)
          .maybeSingle();

        const amount = payment?.final_amount || payment?.base_amount;
        const amountText = amount
          ? ` (${Number(amount).toLocaleString('uz-UZ')} so'm)`
          : '';

        message =
          `Terra Academy: Hurmatli ota-ona, farzandingizning ${monthName} oyi uchun ` +
          `kurs to'lovi${amountText} muddati yaqinlashdi. Iltimos to'lovni amalga oshiring.`;
      }

      // Collect recipients
      const recipients: string[] = [];
      if (student.phone) recipients.push(student.phone);

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
          if (p.phone) recipients.push(p.phone);
        });
      }

      for (const phone of recipients) {
        const result = await sendSMSWithLog(supabase, {
          phone,
          message,
          studentId,
          triggerEvent,
        });
        if (result.success) totalSent++;
      }
    }

    return new Response(JSON.stringify({ success: true, sent: totalSent }), {
      headers: { ...cors, 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    console.error('[send-payment-reminder]', err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...cors, 'Content-Type': 'application/json' },
    });
  }
});
