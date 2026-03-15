import { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';

const DEVSMS_ENDPOINT = 'https://devsms.uz/api/send_sms.php';
const MAX_RETRIES = 3;
const SPAM_WINDOW_MINUTES = 5;
const MAX_SMS_PER_STUDENT_PER_DAY = 5;

function normalizePhone(phone: string): string | null {
  let clean = phone.replace(/\D/g, '');
  if (clean.startsWith('0')) clean = '998' + clean.slice(1);
  if (!clean.startsWith('998')) clean = '998' + clean;
  return clean.length === 12 ? clean : null;
}

export interface SMSResult {
  success: boolean;
  phone: string;
  error?: string;
}

/**
 * Send SMS with full production features:
 * - Phone normalization
 * - Spam prevention (5-min window per phone+event)
 * - Daily limit (max 5 SMS per student per day)
 * - Retry logic (3 attempts with backoff)
 * - Logging to sms_logs table
 */
export async function sendSMSWithLog(
  supabaseClient: SupabaseClient,
  {
    phone,
    message,
    studentId,
    triggerEvent,
  }: {
    phone: string;
    message: string;
    studentId?: string;
    triggerEvent: string;
  }
): Promise<SMSResult> {
  const normalizedPhone = normalizePhone(phone);
  if (!normalizedPhone) {
    return { success: false, phone, error: 'Invalid phone number format' };
  }

  // Spam check: same phone + same event within SPAM_WINDOW_MINUTES
  const spamCutoff = new Date(Date.now() - SPAM_WINDOW_MINUTES * 60 * 1000).toISOString();
  const { data: recentLogs } = await supabaseClient
    .from('sms_logs')
    .select('id')
    .eq('phone', normalizedPhone)
    .eq('trigger_event', triggerEvent)
    .eq('status', 'sent')
    .gte('created_at', spamCutoff)
    .limit(1);

  if (recentLogs && recentLogs.length > 0) {
    return {
      success: false,
      phone: normalizedPhone,
      error: `Spam prevention: same SMS sent within ${SPAM_WINDOW_MINUTES} min`,
    };
  }

  // Daily limit per student
  if (studentId) {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const { count } = await supabaseClient
      .from('sms_logs')
      .select('id', { count: 'exact', head: true })
      .eq('student_id', studentId)
      .gte('created_at', todayStart.toISOString());

    if ((count || 0) >= MAX_SMS_PER_STUDENT_PER_DAY) {
      return {
        success: false,
        phone: normalizedPhone,
        error: `Daily SMS limit reached (max ${MAX_SMS_PER_STUDENT_PER_DAY})`,
      };
    }
  }

  const apiKey = Deno.env.get('DEVSMS_API_KEY');
  if (!apiKey) {
    await supabaseClient.from('sms_logs').insert({
      student_id: studentId || null,
      phone: normalizedPhone,
      message,
      status: 'failed',
      provider: 'devsms',
      trigger_event: triggerEvent,
      error_message: 'DEVSMS_API_KEY not configured',
    });
    return { success: false, phone: normalizedPhone, error: 'DEVSMS_API_KEY not configured' };
  }

  let lastError = '';
  let success = false;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const response = await fetch(DEVSMS_ENDPOINT, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ phone: normalizedPhone, message, sender: 'TERRA' }),
      });

      const result = await response.json().catch(() => ({}));
      console.log(`[DevSMS] attempt ${attempt}:`, response.status, result);

      if (response.ok && result?.success === true) {
        success = true;
        break;
      }

      lastError = result?.message || result?.error || `HTTP ${response.status}`;

      // Don't retry moderation errors — they need manual approval in DevSMS cabinet
      if (
        lastError.includes('модерацию') ||
        lastError.includes('не прошёл') ||
        lastError.includes('moderatsiya')
      ) {
        break;
      }
    } catch (err: any) {
      lastError = err.message || 'Network error';
    }

    if (attempt < MAX_RETRIES) {
      await new Promise((r) => setTimeout(r, attempt * 1000));
    }
  }

  // Log result to sms_logs
  await supabaseClient.from('sms_logs').insert({
    student_id: studentId || null,
    phone: normalizedPhone,
    message,
    status: success ? 'sent' : 'failed',
    provider: 'devsms',
    trigger_event: triggerEvent,
    sent_at: success ? new Date().toISOString() : null,
    error_message: success ? null : lastError,
  });

  return {
    success,
    phone: normalizedPhone,
    error: success ? undefined : lastError,
  };
}

/** Simple sendSMS without DB logging (backward compatibility) */
export async function sendSMS(phone: string, message: string): Promise<boolean> {
  const normalizedPhone = normalizePhone(phone);
  if (!normalizedPhone) return false;

  const apiKey = Deno.env.get('DEVSMS_API_KEY');
  if (!apiKey) return false;

  try {
    const response = await fetch(DEVSMS_ENDPOINT, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ phone: normalizedPhone, message, sender: 'TERRA' }),
    });
    const result = await response.json().catch(() => ({}));
    return response.ok && result?.success === true;
  } catch {
    return false;
  }
}
