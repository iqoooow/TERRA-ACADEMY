import { supabase } from './supabase';

/**
 * Production SMS service — wraps Supabase Edge Functions
 * All functions return { sent: number } or throw on error
 */
export const smsService = {
  /**
   * Send absence notifications to absent students and their parents.
   * Triggered after teacher saves attendance.
   */
  async sendAttendanceSMS(absentStudentIds, groupId, date) {
    if (!absentStudentIds?.length) return { sent: 0 };
    const { data, error } = await supabase.functions.invoke('send-absence-sms', {
      body: { absent_student_ids: absentStudentIds, group_id: groupId, date },
    });
    if (error) throw error;
    return data;
  },

  /**
   * Send payment reminder SMS to a specific student and their parents.
   * Use when manually triggering reminder from admin panel.
   */
  async sendPaymentReminder(studentIds) {
    const ids = Array.isArray(studentIds) ? studentIds : [studentIds];
    const { data, error } = await supabase.functions.invoke('send-payment-reminder', {
      body: { student_ids: ids, event_type: 'reminder' },
    });
    if (error) throw error;
    return data;
  },

  /**
   * Send overdue payment SMS to students who have missed their due date.
   * Can pass specific studentIds or omit to auto-query overdue payments.
   */
  async sendPaymentOverdue(studentIds) {
    const ids = studentIds?.length ? studentIds : undefined;
    const { data, error } = await supabase.functions.invoke('send-payment-reminder', {
      body: { student_ids: ids, event_type: 'overdue' },
    });
    if (error) throw error;
    return data;
  },

  /**
   * Send payment confirmation SMS after a payment is successfully recorded.
   */
  async sendPaymentConfirmed(studentId) {
    const { data, error } = await supabase.functions.invoke('send-payment-reminder', {
      body: { student_ids: [studentId], event_type: 'confirmed' },
    });
    if (error) throw error;
    return data;
  },
};
