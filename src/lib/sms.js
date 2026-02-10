import { supabase } from './supabase';

export const SMSService = {
  // Mock sending SMS for now, later integrate with Edge Functions
  async sendSMS(studentId, message, type = 'notification') {
    try {
      // 1. Log the attempt
      const { data: log, error: logError } = await supabase
        .from('sms_logs')
        .insert([{
          student_id: studentId,
          message,
          trigger_event: type,
          status: 'pending',
          provider: 'mock'
        }])
        .select()
        .single();

      if (logError) throw logError;

      // 2. Simulate Sending (In production, call Edge Function here)
      console.log(`[SMS-MOCK] Sending to Student ${studentId}: ${message}`);

      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 800));

      // 3. Update Log Status
      await supabase
        .from('sms_logs')
        .update({ status: 'sent', sent_at: new Date() })
        .eq('id', log.id);

      return { success: true, message: 'SMS Sent Successfully (Mock)' };

    } catch (error) {
      console.error('SMS Send Error:', error);
      return { success: false, error: error.message };
    }
  },

  async getSettings() {
    const { data, error } = await supabase
      .from('sms_settings')
      .select('*')
      .single();
    if (error) throw error;
    return data;
  },

  async updateSettings(settings) {
    const { data, error } = await supabase
      .from('sms_settings')
      .update(settings)
      .eq('id', settings.id);
    if (error) throw error;
    return data;
  }
};
