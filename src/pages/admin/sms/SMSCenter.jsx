import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../../lib/supabase';
import { smsService } from '../../../lib/smsService';
import { motion, AnimatePresence } from 'framer-motion';
import {
    MessageSquare, Settings, Search, Filter, RefreshCw,
    CheckCircle2, XCircle, Clock, Users, Bell, Calendar,
    CreditCard, Loader2, ChevronDown, Send, ToggleLeft, ToggleRight,
    AlertCircle, PhoneCall, Info
} from 'lucide-react';
import toast from 'react-hot-toast';
import { cn } from '../../../utils/cn';
import { format } from 'date-fns';
import { uz } from 'date-fns/locale';

const TRIGGER_LABELS = {
    absence:     { label: 'Davomat - Yo\'q', color: 'bg-rose-100 text-rose-700' },
    late_warning:{ label: 'Kech kelish (3x)', color: 'bg-amber-100 text-amber-700' },
    reminder:    { label: 'To\'lov eslatmasi', color: 'bg-blue-100 text-blue-700' },
    overdue:     { label: 'To\'lov muddati', color: 'bg-orange-100 text-orange-700' },
    confirmed:   { label: 'To\'lov qabul', color: 'bg-emerald-100 text-emerald-700' },
};

const STATUS_CONFIG = {
    sent:    { label: 'Yuborildi', icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    failed:  { label: 'Xatolik', icon: XCircle, color: 'text-rose-600', bg: 'bg-rose-50' },
    pending: { label: 'Kutilmoqda', icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50' },
};

const SMSCenter = () => {
    const [activeTab, setActiveTab] = useState('logs');
    const [logs, setLogs] = useState([]);
    const [loadingLogs, setLoadingLogs] = useState(true);
    const [settings, setSettings] = useState(null);
    const [savingSettings, setSavingSettings] = useState(false);

    // Filters
    const [searchQuery, setSearchQuery] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');
    const [filterEvent, setFilterEvent] = useState('all');
    const [filterDate, setFilterDate] = useState('');

    // Bulk send state
    const [sendingOverdue, setSendingOverdue] = useState(false);

    const fetchLogs = useCallback(async () => {
        setLoadingLogs(true);
        try {
            let query = supabase
                .from('sms_logs')
                .select(`
                    id, phone, message, status,
                    trigger_event, error_message, created_at,
                    student:student_id (full_name, first_name, last_name)
                `)
                .order('created_at', { ascending: false })
                .limit(50);

            if (filterStatus !== 'all') query = query.eq('status', filterStatus);
            if (filterEvent !== 'all') query = query.eq('trigger_event', filterEvent);
            if (filterDate) {
                const start = filterDate + 'T00:00:00';
                const end = filterDate + 'T23:59:59';
                query = query.gte('created_at', start).lte('created_at', end);
            }

            const { data, error } = await query;
            if (error) throw error;
            setLogs(data || []);
        } catch (err) {
            toast.error('SMS loglarni yuklashda xatolik');
        } finally {
            setLoadingLogs(false);
        }
    }, [filterStatus, filterEvent, filterDate]);

    const fetchSettings = useCallback(async () => {
        const { data } = await supabase
            .from('sms_settings')
            .select('*')
            .limit(1)
            .maybeSingle();
        if (data) setSettings(data);
    }, []);

    useEffect(() => {
        fetchLogs();
    }, [fetchLogs]);

    useEffect(() => {
        if (activeTab === 'settings') fetchSettings();
    }, [activeTab, fetchSettings]);

    const saveSettings = async (updates) => {
        setSavingSettings(true);
        try {
            const { data: existing } = await supabase
                .from('sms_settings')
                .select('id')
                .limit(1)
                .maybeSingle();

            let error;
            if (existing?.id) {
                ({ error } = await supabase
                    .from('sms_settings')
                    .update({ ...updates, updated_at: new Date().toISOString() })
                    .eq('id', existing.id));
            } else {
                ({ error } = await supabase
                    .from('sms_settings')
                    .insert({ ...updates }));
            }
            if (error) throw error;
            setSettings(prev => ({ ...prev, ...updates }));
            toast.success('Sozlamalar saqlandi');
        } catch {
            toast.error('Saqlashda xatolik');
        } finally {
            setSavingSettings(false);
        }
    };

    const handleSendOverdue = async () => {
        setSendingOverdue(true);
        const tid = toast.loading('Muddati o\'tgan to\'lovlar uchun SMS yuborilmoqda...');
        try {
            const result = await smsService.sendPaymentOverdue();
            if (result?.sent > 0) {
                toast.success(`${result.sent} ta SMS yuborildi`, { id: tid });
                fetchLogs();
            } else {
                toast.error('Hech qanday SMS yuborilmadi (telefon raqami topilmadi yoki SMS blokda)', { id: tid });
            }
        } catch (err) {
            toast.error(err.message || 'Xatolik yuz berdi', { id: tid });
        } finally {
            setSendingOverdue(false);
        }
    };

    const filteredLogs = logs.filter(log => {
        if (!searchQuery) return true;
        const q = searchQuery.toLowerCase();
        const profile = log.student;
        const name = profile?.full_name ||
            [profile?.first_name, profile?.last_name].filter(Boolean).join(' ') || '';
        return (
            name.toLowerCase().includes(q) ||
            log.phone?.includes(q) ||
            log.message?.toLowerCase().includes(q)
        );
    });

    const stats = {
        total: logs.length,
        sent: logs.filter(l => l.status === 'sent').length,
        failed: logs.filter(l => l.status === 'failed').length,
    };

    return (
        <div className="space-y-6 animate-fade-in max-w-[1400px] mx-auto pb-10">
            {/* Header */}
            <div className="relative overflow-hidden rounded-[2.5rem] bg-slate-900 shadow-2xl">
                <div className="absolute inset-0 bg-gradient-to-br from-violet-900 via-indigo-900 to-slate-900 opacity-95" />
                <div className="absolute -top-20 -right-20 w-80 h-80 bg-violet-500/20 rounded-full blur-[80px]" />
                <div className="relative z-10 p-8 sm:p-10">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                        <div>
                            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 rounded-full text-[10px] font-black uppercase tracking-widest mb-4 border border-white/10 text-violet-300">
                                <MessageSquare size={12} /> SMS Boshqaruvi
                            </div>
                            <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
                                SMS Markaz
                            </h1>
                            <p className="text-slate-400 mt-1 font-medium">
                                Yuborilgan xabarlar tarixi va sozlamalar
                            </p>
                        </div>

                        <div className="flex gap-3 flex-wrap">
                            <div className="bg-white/10 border border-white/10 rounded-2xl px-5 py-3 text-center">
                                <p className="text-2xl font-black text-white">{stats.sent}</p>
                                <p className="text-[10px] font-bold text-emerald-300 uppercase tracking-widest">Yuborildi</p>
                            </div>
                            <div className="bg-white/10 border border-white/10 rounded-2xl px-5 py-3 text-center">
                                <p className="text-2xl font-black text-white">{stats.failed}</p>
                                <p className="text-[10px] font-bold text-rose-300 uppercase tracking-widest">Xatolik</p>
                            </div>
                            <div className="bg-white/10 border border-white/10 rounded-2xl px-5 py-3 text-center">
                                <p className="text-2xl font-black text-white">{stats.total}</p>
                                <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">Jami</p>
                            </div>
                        </div>
                    </div>

                    {/* Tabs */}
                    <div className="flex gap-2 mt-8 border-t border-white/10 pt-4">
                        {[
                            { id: 'logs', label: 'SMS Tarixi', icon: MessageSquare },
                            { id: 'settings', label: 'Sozlamalar', icon: Settings },
                        ].map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={cn(
                                    'flex items-center gap-2 px-5 py-2.5 rounded-xl font-black text-xs uppercase tracking-widest transition-all',
                                    activeTab === tab.id
                                        ? 'bg-white text-slate-900'
                                        : 'text-slate-400 hover:text-white hover:bg-white/10'
                                )}
                            >
                                <tab.icon size={14} />
                                {tab.label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* LOGS TAB */}
            {activeTab === 'logs' && (
                <div className="space-y-4">
                    {/* Filter Bar */}
                    <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm p-4 flex flex-wrap gap-3 items-center">
                        <div className="relative flex-1 min-w-[200px]">
                            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Ism, telefon, xabar..."
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                                className="w-full pl-9 pr-4 py-2.5 bg-slate-50 rounded-xl text-sm font-medium text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                            />
                        </div>

                        <select
                            value={filterStatus}
                            onChange={e => setFilterStatus(e.target.value)}
                            className="px-4 py-2.5 bg-slate-50 rounded-xl text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                        >
                            <option value="all">Barcha status</option>
                            <option value="sent">Yuborildi</option>
                            <option value="failed">Xatolik</option>
                            <option value="pending">Kutilmoqda</option>
                        </select>

                        <select
                            value={filterEvent}
                            onChange={e => setFilterEvent(e.target.value)}
                            className="px-4 py-2.5 bg-slate-50 rounded-xl text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                        >
                            <option value="all">Barcha tur</option>
                            <option value="absence">Davomat</option>
                            <option value="late_warning">Kech kelish</option>
                            <option value="reminder">To'lov eslatma</option>
                            <option value="overdue">Muddati o'tgan</option>
                            <option value="confirmed">To'lov tasdiqlash</option>
                        </select>

                        <input
                            type="date"
                            value={filterDate}
                            onChange={e => setFilterDate(e.target.value)}
                            className="px-4 py-2.5 bg-slate-50 rounded-xl text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                        />

                        <button
                            onClick={fetchLogs}
                            className="p-2.5 bg-slate-50 rounded-xl text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                            title="Yangilash"
                        >
                            <RefreshCw size={16} />
                        </button>

                        <button
                            onClick={handleSendOverdue}
                            disabled={sendingOverdue}
                            className="flex items-center gap-2 px-4 py-2.5 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white rounded-xl text-xs font-black uppercase tracking-widest transition-all"
                        >
                            {sendingOverdue
                                ? <Loader2 size={14} className="animate-spin" />
                                : <Send size={14} />
                            }
                            Muddati o'tganlarga yuborish
                        </button>
                    </div>

                    {/* Logs */}
                    <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden">
                        {loadingLogs ? (
                            <div className="flex items-center justify-center py-20">
                                <Loader2 size={32} className="animate-spin text-indigo-500" />
                            </div>
                        ) : filteredLogs.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-20 gap-3">
                                <MessageSquare size={40} className="text-slate-200" />
                                <p className="text-slate-400 font-bold text-sm uppercase tracking-widest">SMS tarixi topilmadi</p>
                            </div>
                        ) : (
                            <>
                                {/* ── Mobile Cards (< md) ── */}
                                <div className="md:hidden divide-y divide-slate-50">
                                    {filteredLogs.map((log, idx) => {
                                        const profile = log.student;
                                        const studentName = profile?.full_name ||
                                            [profile?.first_name, profile?.last_name].filter(Boolean).join(' ') || '—';
                                        const eventInfo = TRIGGER_LABELS[log.trigger_event] || { label: log.trigger_event || '—', color: 'bg-slate-100 text-slate-600' };
                                        const statusInfo = STATUS_CONFIG[log.status] || STATUS_CONFIG.pending;
                                        const StatusIcon = statusInfo.icon;
                                        return (
                                            <motion.div
                                                key={log.id}
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                transition={{ delay: idx * 0.02 }}
                                                className="p-4 space-y-2"
                                            >
                                                {/* Row 1: avatar + name + status */}
                                                <div className="flex items-center gap-3">
                                                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white font-black text-xs shrink-0">
                                                        {studentName[0]?.toUpperCase() || '?'}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="font-bold text-slate-800 text-sm truncate">{studentName}</p>
                                                        <p className="font-mono text-[10px] text-slate-400">{log.phone || '—'}</p>
                                                    </div>
                                                    <div className={cn('inline-flex items-center gap-1 px-2 py-1 rounded-lg shrink-0', statusInfo.bg)}>
                                                        <StatusIcon size={11} className={statusInfo.color} />
                                                        <span className={cn('text-[9px] font-black uppercase', statusInfo.color)}>{statusInfo.label}</span>
                                                    </div>
                                                </div>
                                                {/* Row 2: type + time */}
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <span className={cn('px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wide', eventInfo.color)}>
                                                        {eventInfo.label}
                                                    </span>
                                                    <span className="text-[10px] text-slate-400 font-medium">
                                                        {log.created_at ? format(new Date(log.created_at), 'dd MMM, HH:mm', { locale: uz }) : '—'}
                                                    </span>
                                                </div>
                                                {/* Row 3: message */}
                                                <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">{log.message}</p>
                                                {log.error_message && (
                                                    <p className="text-[10px] text-rose-500 font-medium line-clamp-1">{log.error_message}</p>
                                                )}
                                            </motion.div>
                                        );
                                    })}
                                </div>

                                {/* ── Desktop Table (≥ md) ── */}
                                <div className="hidden md:block overflow-x-auto">
                                    <table className="w-full">
                                        <thead>
                                            <tr className="border-b border-slate-100 bg-slate-50">
                                                <th className="px-6 py-4 text-left text-[10px] font-black text-slate-500 uppercase tracking-widest">O'quvchi</th>
                                                <th className="px-4 py-4 text-left text-[10px] font-black text-slate-500 uppercase tracking-widest">Telefon</th>
                                                <th className="px-4 py-4 text-left text-[10px] font-black text-slate-500 uppercase tracking-widest">Tur</th>
                                                <th className="px-4 py-4 text-left text-[10px] font-black text-slate-500 uppercase tracking-widest">Xabar</th>
                                                <th className="px-4 py-4 text-left text-[10px] font-black text-slate-500 uppercase tracking-widest">Status</th>
                                                <th className="px-4 py-4 text-left text-[10px] font-black text-slate-500 uppercase tracking-widest">Vaqt</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-50">
                                            {filteredLogs.map((log, idx) => {
                                                const profile = log.student;
                                                const studentName = profile?.full_name ||
                                                    [profile?.first_name, profile?.last_name].filter(Boolean).join(' ') || '—';
                                                const eventInfo = TRIGGER_LABELS[log.trigger_event] || { label: log.trigger_event || '—', color: 'bg-slate-100 text-slate-600' };
                                                const statusInfo = STATUS_CONFIG[log.status] || STATUS_CONFIG.pending;
                                                const StatusIcon = statusInfo.icon;
                                                return (
                                                    <motion.tr key={log.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: idx * 0.02 }} className="hover:bg-slate-50 transition-colors">
                                                        <td className="px-6 py-4">
                                                            <div className="flex items-center gap-3">
                                                                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white font-black text-xs shrink-0">
                                                                    {studentName[0]?.toUpperCase() || '?'}
                                                                </div>
                                                                <span className="font-bold text-slate-800 text-sm">{studentName}</span>
                                                            </div>
                                                        </td>
                                                        <td className="px-4 py-4"><span className="font-mono text-xs text-slate-600">{log.phone || '—'}</span></td>
                                                        <td className="px-4 py-4">
                                                            <span className={cn('px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wide', eventInfo.color)}>{eventInfo.label}</span>
                                                        </td>
                                                        <td className="px-4 py-4 max-w-[260px]">
                                                            <p className="text-xs text-slate-600 line-clamp-2">{log.message}</p>
                                                            {log.error_message && <p className="text-[10px] text-rose-500 mt-0.5 font-medium line-clamp-1">{log.error_message}</p>}
                                                        </td>
                                                        <td className="px-4 py-4">
                                                            <div className={cn('inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg', statusInfo.bg)}>
                                                                <StatusIcon size={12} className={statusInfo.color} />
                                                                <span className={cn('text-[10px] font-black uppercase', statusInfo.color)}>{statusInfo.label}</span>
                                                            </div>
                                                        </td>
                                                        <td className="px-4 py-4">
                                                            <span className="text-xs text-slate-400 font-medium whitespace-nowrap">
                                                                {log.created_at ? format(new Date(log.created_at), 'dd MMM, HH:mm', { locale: uz }) : '—'}
                                                            </span>
                                                        </td>
                                                    </motion.tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}

            {/* SETTINGS TAB */}
            {activeTab === 'settings' && (
                <div className="space-y-4">
                    <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm p-8 space-y-8">
                        <div>
                            <h2 className="text-lg font-black text-slate-900 mb-1">SMS Sozlamalari</h2>
                            <p className="text-sm text-slate-500">SMS xabarlar avtomatik yuborilishini boshqaring</p>
                        </div>

                        {!settings ? (
                            <div className="flex items-center justify-center py-10">
                                <Loader2 size={28} className="animate-spin text-indigo-500" />
                            </div>
                        ) : (
                            <div className="space-y-6">
                                {/* Attendance SMS toggle */}
                                <div className="flex items-center justify-between p-6 bg-slate-50 rounded-2xl border border-slate-100">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-2xl bg-rose-50 flex items-center justify-center">
                                            <Users size={22} className="text-rose-500" />
                                        </div>
                                        <div>
                                            <h3 className="font-black text-slate-900">Davomat SMS</h3>
                                            <p className="text-sm text-slate-500 mt-0.5">
                                                O'quvchi darsga kelmasa ota-onaga avtomatik SMS yuboriladi
                                            </p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => saveSettings({ attendance_sms_enabled: !settings.attendance_sms_enabled })}
                                        disabled={savingSettings}
                                        className="shrink-0"
                                    >
                                        {settings.attendance_sms_enabled ? (
                                            <ToggleRight size={40} className="text-emerald-500 hover:text-emerald-600 transition-colors" />
                                        ) : (
                                            <ToggleLeft size={40} className="text-slate-300 hover:text-slate-400 transition-colors" />
                                        )}
                                    </button>
                                </div>

                                {/* Payment SMS toggle */}
                                <div className="flex items-center justify-between p-6 bg-slate-50 rounded-2xl border border-slate-100">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center">
                                            <CreditCard size={22} className="text-blue-500" />
                                        </div>
                                        <div>
                                            <h3 className="font-black text-slate-900">To'lov SMS</h3>
                                            <p className="text-sm text-slate-500 mt-0.5">
                                                To'lov eslatmalari, muddati o'tganlar va tasdiqlash xabarlari
                                            </p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => saveSettings({ payment_sms_enabled: !settings.payment_sms_enabled })}
                                        disabled={savingSettings}
                                        className="shrink-0"
                                    >
                                        {settings.payment_sms_enabled ? (
                                            <ToggleRight size={40} className="text-emerald-500 hover:text-emerald-600 transition-colors" />
                                        ) : (
                                            <ToggleLeft size={40} className="text-slate-300 hover:text-slate-400 transition-colors" />
                                        )}
                                    </button>
                                </div>

                                {/* Late warning threshold */}
                                <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100">
                                    <div className="flex items-center gap-4 mb-4">
                                        <div className="w-12 h-12 rounded-2xl bg-amber-50 flex items-center justify-center">
                                            <AlertCircle size={22} className="text-amber-500" />
                                        </div>
                                        <div>
                                            <h3 className="font-black text-slate-900">Kech kelish ogohlantirishı</h3>
                                            <p className="text-sm text-slate-500 mt-0.5">
                                                O'quvchi bir oyda necha marta kech kelsa SMS yuborilsin
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <input
                                            type="number"
                                            min="1"
                                            max="10"
                                            value={settings.late_warning_count}
                                            onChange={e => setSettings(prev => ({
                                                ...prev,
                                                late_warning_count: Number(e.target.value)
                                            }))}
                                            className="w-20 px-3 py-2 bg-white border border-slate-200 rounded-xl text-center font-black text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                                        />
                                        <span className="text-sm text-slate-500 font-medium">marta kech kelsa ogohlantirish SMS yuboriladi</span>
                                        <button
                                            onClick={() => saveSettings({ late_warning_count: settings.late_warning_count })}
                                            disabled={savingSettings}
                                            className="ml-auto px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black uppercase tracking-widest transition-all disabled:opacity-50"
                                        >
                                            {savingSettings ? <Loader2 size={14} className="animate-spin" /> : 'Saqlash'}
                                        </button>
                                    </div>
                                </div>

                                {/* Info box */}
                                <div className="p-5 bg-indigo-50 rounded-2xl border border-indigo-100 flex gap-3">
                                    <Info size={18} className="text-indigo-500 shrink-0 mt-0.5" />
                                    <div className="text-sm text-indigo-700">
                                        <p className="font-black mb-1">SMS spam himoyasi</p>
                                        <ul className="space-y-1 text-indigo-600 font-medium">
                                            <li>• Bir xil SMS 5 daqiqa ichida qayta yuborilmaydi</li>
                                            <li>• Har bir o'quvchiga kuniga maksimal 5 ta SMS</li>
                                            <li>• Xatolik yuz bersa 3 marta qayta uriniladi</li>
                                            <li>• Sender nomi: <strong>TERRA</strong> (DevSMS da ro'yxatdan o'tgan bo'lishi kerak)</li>
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default SMSCenter;
