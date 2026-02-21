import { useState, useEffect } from 'react';
import { Search, Download, DollarSign, TrendingUp, Eye, X, Trash2, Calendar, FileText, Plus, PieChart, ArrowUpRight, Activity, RefreshCw } from 'lucide-react';
import EmptyState from '../../../components/ui/EmptyState';
import StatsCard from '../../../components/ui/StatsCard';
import { supabase } from '../../../lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { format } from 'date-fns';
import { uz } from 'date-fns/locale';

const FinanceList = () => {
    const [transactions, setTransactions] = useState([]);
    const [students, setStudents] = useState([]);
    const [stats, setStats] = useState({
        total: 0,
        pending: 0,
        avg: 0
    });
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [viewingTrx, setViewingTrx] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [deletingId, setDeletingId] = useState(null);
    const [formData, setFormData] = useState({
        student_id: '',
        amount: '',
        type: 'tuition',
        status: 'paid',
        date: new Date().toISOString().split('T')[0]
    });

    useEffect(() => {
        fetchFinance();
        fetchStudents();

        const channel = supabase.channel('finance-realtime')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'payments' }, () => {
                fetchFinance();
            })
            .subscribe();

        return () => supabase.removeChannel(channel);
    }, []);

    const fetchFinance = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('payments')
                .select(`
                    *,
                    profiles (full_name, first_name, last_name)
                `)
                .order('created_at', { ascending: false });

            if (error) throw error;

            const typeLabels = {
                'tuition': 'Ta\'lim',
                'books': 'Kitoblar',
                'materials': 'Materiallar',
                'other': 'Boshqa'
            };

            const formattedTrx = (data || []).map(t => ({
                id: t.id,
                shortId: `TRX-${String(t.id).slice(-8)}`,
                student: t.profiles?.full_name || `${t.profiles?.first_name || ''} ${t.profiles?.last_name || ''}`.trim() || 'Noma\'lum',
                avatar: null,
                date: t.date ? format(new Date(t.date), 'dd MMM, yyyy', { locale: uz }) : '-',
                rawDate: t.date,
                amount: Number(t.amount || 0),
                type: t.type || 'other',
                typeLabel: typeLabels[t.type] || t.type || 'Boshqa',
                status: t.status,
                color: t.status === 'paid' ? 'emerald' : t.status === 'pending' ? 'amber' : 'rose'
            }));

            setTransactions(formattedTrx);

            const paidTransactions = (data || []).filter(t => t.status === 'paid');
            const totalRev = paidTransactions.reduce((sum, curr) => sum + Number(curr.amount), 0);
            const pendingRev = (data || []).filter(t => t.status === 'pending').reduce((sum, curr) => sum + Number(curr.amount), 0);
            // Average over paid transactions only — dividing by all transactions was incorrect
            const avgTrx = paidTransactions.length ? (totalRev / paidTransactions.length) : 0;

            setStats({
                total: totalRev,
                pending: pendingRev,
                avg: avgTrx
            });

        } catch (err) {
            console.error('Error fetching finance:', err);
            toast.error("Ma'lumotlarni yuklashda xatolik");
        } finally {
            setLoading(false);
        }
    };

    const fetchStudents = async () => {
        try {
            const { data } = await supabase
                .from('profiles')
                .select('id, full_name, student_code')
                .eq('role', 'student')
                .eq('status', 'approved')
                .order('full_name');
            setStudents(data || []);
        } catch (err) {
            console.error('Error fetching students:', err);
        }
    };

    const handleExport = () => {
        if (transactions.length === 0) return toast.error("Eksport qilish uchun ma'lumot yo'q");
        const headers = ['TRX ID', 'O\'quvchi', 'Sana', 'Turi', 'Summa', 'Holat'];

        // Helper to escape CSV values
        const escapeCSV = (val) => {
            if (val === null || val === undefined) return '';
            const str = String(val);
            if (str.includes(',') || str.includes('"') || str.includes('\n')) {
                return `"${str.replace(/"/g, '""')}"`;
            }
            return str;
        };

        const rows = transactions.map(d => [
            d.shortId,
            d.student,
            d.date,
            d.typeLabel,
            d.amount,
            d.status
        ]);

        const csvContent = headers.map(escapeCSV).join(",") + "\n"
            + rows.map(r => r.map(escapeCSV).join(",")).join("\n");

        const blob = new Blob(["\uFEFF" + csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `terra_finance_${format(new Date(), 'yyyy_MM_dd')}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast.success("Hisobot yuklab olindi");
    };

    const handleDeletePayment = async (e, id) => {
        e.stopPropagation();
        if (!window.confirm("Haqiqatan ham bu to'lovni o'chirmoqchimisiz?")) return;

        setDeletingId(id);
        try {
            const { error } = await supabase.from('payments').delete().eq('id', id);
            if (error) throw error;
            toast.success("To'lov o'chirildi");
        } catch (err) {
            toast.error("O'chirishda xatolik");
        } finally {
            setDeletingId(null);
        }
    };

    const handleAddPayment = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            if (!formData.student_id || !formData.amount) throw new Error("Barcha maydonlarni to'ldiring");

            const { error } = await supabase.from('payments').insert([{
                student_id: formData.student_id,
                amount: Number(formData.amount),
                type: formData.type,
                status: formData.status,
                date: formData.date
            }]);

            if (error) throw error;

            toast.success("To'lov muvaffaqiyatli kiritildi");
            setIsModalOpen(false);
            setFormData({
                student_id: '',
                amount: '',
                type: 'tuition',
                status: 'paid',
                date: new Date().toISOString().split('T')[0]
            });
        } catch (err) {
            toast.error(err.message || "Xatolik yuz berdi");
        } finally {
            setSubmitting(false);
        }
    };

    const filteredTransactions = transactions.filter(trx =>
        trx.student.toLowerCase().includes(searchQuery.toLowerCase()) ||
        trx.shortId.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="space-y-10 animate-fade-in pb-10">
            {/* Intel-Grade Header */}
            <div className="relative group overflow-hidden rounded-[3rem] bg-slate-900 border border-white/5 shadow-[0_50px_100px_rgba(0,0,0,0.2)]">
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-900 via-slate-900 to-black opacity-90 transition-transform duration-1000 group-hover:scale-105"></div>
                <div className="absolute -top-40 -left-40 w-[600px] h-[600px] bg-emerald-600/10 rounded-full blur-[120px] mix-blend-screen animate-pulse"></div>

                <div className="relative z-10 p-10 md:p-14 flex flex-col md:flex-row items-center justify-between gap-10">
                    <div>
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="inline-flex items-center gap-2 px-4 py-1.5 bg-white/5 rounded-full border border-white/10 text-[10px] font-black uppercase tracking-[0.2em] text-emerald-300 mb-6 backdrop-blur-xl"
                        >
                            <DollarSign size={14} className="text-emerald-400" />
                            Financial Intelligence
                        </motion.div>
                        <h1 className="text-4xl md:text-6xl font-black text-white tracking-tighter mb-4 leading-none">
                            Moliya <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400">Markazi.</span>
                        </h1>
                        <p className="text-slate-400 font-medium text-lg md:text-xl max-w-xl leading-relaxed">
                            Barcha tranzaksiyalar va tushumlarni <span className="text-white font-bold">professional</span> darajada nazorat qiling.
                        </p>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-6">
                        <div className="bg-white/5 border border-white/10 backdrop-blur-2xl px-8 py-6 rounded-[2.5rem] flex flex-col justify-center">
                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">Jami Tushum</span>
                            <div className="flex items-center gap-3">
                                <span className="font-black text-white text-3xl tracking-tighter">{(stats.total / 1000000).toFixed(1)}M</span>
                                <span className="text-emerald-400 bg-emerald-400/10 p-1 rounded-lg">
                                    <ArrowUpRight size={16} />
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Matrix Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatsCard
                    title="Jami Kelib Tushgan"
                    value={`${stats.total.toLocaleString()} UZS`}
                    icon={DollarSign}
                    color="green"
                    trendLabel="Haqiqiy tushum"
                    chartData={[40, 70, 45, 90, 65, 80, 95]}
                />
                <StatsCard
                    title="Kutilayotgan"
                    value={`${stats.pending.toLocaleString()} UZS`}
                    icon={Activity}
                    color="orange"
                    trendLabel="Tasdiqlanishi kutilmoqda"
                    chartData={[20, 35, 40, 30, 45, 35, 40]}
                />
                <StatsCard
                    title="O'rtacha To'lov"
                    value={`${Math.round(stats.avg).toLocaleString()} UZS`}
                    icon={TrendingUp}
                    color="blue"
                    trendLabel="Bitta tranzaksiya uchun"
                    chartData={[30, 45, 35, 50, 40, 60, 55]}
                />
            </div>

            {/* Controls Bar */}
            <div className="glass-card p-2 flex flex-col md:flex-row md:items-center justify-between gap-4 sticky top-24 z-30 bg-white/80 backdrop-blur-xl border-white/40 shadow-2xl shadow-slate-200/50 rounded-[2rem]">
                <div className="relative flex-1 max-w-md ml-2 group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-500 transition-colors" size={18} />
                    <input
                        type="text"
                        placeholder="O'quvchi yoki TRX ID bo'yicha qidirish..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-12 pr-4 py-3 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-emerald-500/20 focus:bg-white transition-all text-sm font-bold text-slate-700 placeholder:text-slate-400"
                    />
                </div>
                <div className="flex gap-2 p-1">
                    <button
                        onClick={fetchFinance}
                        disabled={loading}
                        className="p-3 bg-slate-100 text-slate-500 rounded-xl hover:bg-emerald-600 hover:text-white transition-all shadow-sm active:scale-95 disabled:opacity-50"
                    >
                        <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
                    </button>
                    <button
                        onClick={handleExport}
                        className="flex items-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-xl hover:bg-slate-800 transition-all font-black text-[10px] uppercase tracking-widest shadow-lg shadow-slate-900/20 active:scale-95"
                    >
                        <Download size={16} />
                        Eksport
                    </button>
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-all font-black text-[10px] uppercase tracking-widest shadow-lg shadow-emerald-600/20 active:scale-95"
                    >
                        <Plus size={16} />
                        Kirim Qilish
                    </button>
                </div>
            </div>

            {/* List Table Area */}
            {loading ? (
                <div className="py-40 flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest animate-pulse">Tranzaksiyalar yuklanmoqda...</p>
                </div>
            ) : filteredTransactions.length === 0 ? (
                <EmptyState
                    icon={PieChart}
                    title="Tranzaksiyalar topilmadi"
                    description={searchQuery ? `"${searchQuery}" bo'yicha hech qanday to'lov ma'lumoti topilmadi.` : "Hozircha moliyaviy amallar mavjud emas."}
                />
            ) : (
                <div className="space-y-4 pt-4">
                    <div className="px-10 grid grid-cols-7 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">
                        <div className="col-span-1">TRX ID</div>
                        <div className="col-span-2">O'quvchi</div>
                        <div className="col-span-1">Sana</div>
                        <div className="col-span-1">Summa</div>
                        <div className="col-span-1 text-center">Xolati</div>
                        <div className="col-span-1 text-right pr-6">Amallar</div>
                    </div>

                    <AnimatePresence mode="popLayout">
                        {filteredTransactions.map((trx, idx) => (
                            <motion.div
                                key={trx.id}
                                initial={{ opacity: 0, scale: 0.98, y: 10 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                transition={{ delay: idx * 0.05 }}
                                className="p-3 bg-white border border-slate-100 rounded-[2.5rem] shadow-sm hover:shadow-2xl hover:shadow-emerald-500/10 hover:bg-slate-50 transition-all duration-500 group"
                            >
                                <div className="grid grid-cols-7 items-center">
                                    <div className="col-span-1 pl-6">
                                        <span className="font-black text-[10px] text-slate-400 bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200 uppercase tracking-tighter">
                                            {trx.shortId}
                                        </span>
                                    </div>
                                    <div className="col-span-2 flex items-center gap-4">
                                        <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center font-black text-lg border border-emerald-200 group-hover:scale-110 transition-transform duration-500">
                                            {trx.student[0]}
                                        </div>
                                        <div>
                                            <h4 className="font-black text-slate-800 leading-none group-hover:text-emerald-600 transition-colors uppercase tracking-tight text-sm">{trx.student}</h4>
                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1.5 block flex items-center gap-1.5"
                                            >
                                                <Activity size={10} /> {trx.typeLabel}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="col-span-1">
                                        <div className="flex items-center gap-2 text-[10px] font-black text-slate-500 uppercase tracking-widest">
                                            <Calendar size={14} className="text-slate-300" />
                                            {trx.date}
                                        </div>
                                    </div>
                                    <div className="col-span-1">
                                        <div className="font-black text-slate-900 text-lg tracking-tighter">
                                            {trx.amount.toLocaleString()} <span className="text-[10px] text-slate-400 uppercase tracking-widest">UZS</span>
                                        </div>
                                    </div>
                                    <div className="col-span-1 flex justify-center">
                                        <div className="flex items-center gap-2">
                                            <div className={`w-2 h-2 rounded-full ${trx.status === 'paid' ? 'bg-emerald-500' : 'bg-amber-500 animate-pulse'}`}></div>
                                            <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${trx.status === 'paid' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-amber-50 text-amber-600 border border-amber-100'
                                                }`}>
                                                {trx.status === 'paid' ? 'TO\'LANGAN' : 'KUTILMOQDA'}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="col-span-1 text-right flex justify-end gap-2 pr-6">
                                        <button
                                            onClick={() => setViewingTrx(trx)}
                                            className="p-3 bg-slate-50 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-2xl transition-all hover:scale-110"
                                        >
                                            <Eye size={18} />
                                        </button>
                                        <button
                                            onClick={(e) => handleDeletePayment(e, trx.id)}
                                            disabled={deletingId === trx.id}
                                            className="p-3 bg-rose-50 text-rose-400 hover:text-rose-600 hover:bg-rose-100 rounded-2xl transition-all hover:scale-110 disabled:opacity-50"
                                        >
                                            <Trash2 size={18} className={deletingId === trx.id ? 'animate-spin' : ''} />
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>
            )}

            {/* View Details Modal */}
            <AnimatePresence>
                {viewingTrx && (
                    <div className="fixed inset-0 z-[75] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-slate-950/80 backdrop-blur-3xl"
                            onClick={() => setViewingTrx(null)}
                        />
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0, rotateX: 20 }}
                            animate={{ scale: 1, opacity: 1, rotateX: 0 }}
                            exit={{ scale: 0.9, opacity: 0, rotateX: 20 }}
                            className="bg-white rounded-[3rem] p-10 w-full max-w-sm relative z-10 shadow-[0_50px_100px_rgba(0,0,0,0.5)] border border-white/20 overflow-hidden"
                        >
                            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500"></div>

                            <button onClick={() => setViewingTrx(null)} className="absolute top-6 right-6 p-2 bg-slate-50 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600 transition-colors">
                                <X size={20} />
                            </button>

                            <div className="text-center mb-10">
                                <div className="w-20 h-20 bg-emerald-50 text-emerald-600 rounded-[2rem] flex items-center justify-center mx-auto mb-6 shadow-inner border border-emerald-100">
                                    <FileText size={36} />
                                </div>
                                <h3 className="text-2xl font-black text-slate-900 tracking-tighter italic">Terra Ledger</h3>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mt-2 italic">{viewingTrx.shortId}</p>
                            </div>

                            <div className="space-y-6">
                                <div className="space-y-4 bg-slate-50/50 p-6 rounded-[2.5rem] border border-slate-100">
                                    <div className="flex justify-between items-center px-2">
                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">O'quvchi</span>
                                        <span className="text-sm font-black text-slate-800 uppercase text-right">{viewingTrx.student}</span>
                                    </div>
                                    <div className="flex justify-between items-center px-2">
                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Sana</span>
                                        <span className="text-sm font-black text-slate-800 uppercase">{viewingTrx.date}</span>
                                    </div>
                                    <div className="flex justify-between items-center px-2">
                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Turi</span>
                                        <span className="text-[10px] font-black bg-white px-3 py-1.5 rounded-xl border border-slate-200 text-slate-600 uppercase tracking-widest">{viewingTrx.typeLabel}</span>
                                    </div>
                                    <div className="h-px bg-slate-200/50 mx-2"></div>
                                    <div className="flex justify-between items-center px-2 pt-2">
                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Jami To'lov</span>
                                        <span className="text-2xl font-black text-slate-900 tracking-tighter">{viewingTrx.amount.toLocaleString()} <span className="text-xs text-slate-400 italic">UZS</span></span>
                                    </div>
                                </div>

                                <button
                                    onClick={() => { toast.success("Kvitansiya jo'natildi"); setViewingTrx(null); }}
                                    className="w-full py-5 bg-slate-900 text-white font-black uppercase tracking-[0.2em] text-[10px] rounded-[2rem] hover:bg-slate-800 transition-all shadow-2xl hover:scale-[1.02]"
                                >
                                    Telegramga Jo'natish
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Add Payment Modal */}
            <AnimatePresence>
                {isModalOpen && (
                    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-slate-950/40 backdrop-blur-2xl"
                            onClick={() => setIsModalOpen(false)}
                        />
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            className="bg-white rounded-[3rem] p-10 w-full max-w-md relative z-10 shadow-[0_50px_100px_rgba(0,0,0,0.5)] border border-white/20"
                        >
                            <button onClick={() => setIsModalOpen(false)} className="absolute top-8 right-8 p-2 bg-slate-50 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600 transition-colors">
                                <X size={20} />
                            </button>

                            <div className="mb-10">
                                <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full text-[10px] font-black uppercase tracking-widest mb-4">
                                    <Plus size={14} /> New Record
                                </div>
                                <h2 className="text-3xl font-black text-slate-900 tracking-tighter uppercase italic">To'lov Kiritish</h2>
                                <p className="text-slate-400 font-bold text-sm tracking-wide mt-1">Yangi moliyaviy tranzaksiyani tasdiqlang</p>
                            </div>

                            <form onSubmit={handleAddPayment} className="space-y-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">O'quvchi</label>
                                    <select
                                        value={formData.student_id}
                                        onChange={(e) => setFormData({ ...formData, student_id: e.target.value })}
                                        className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-emerald-500/20 focus:bg-white transition-all text-sm font-bold text-slate-800"
                                        required
                                    >
                                        <option value="">O'quvchini tanlang...</option>
                                        {students.map(s => (
                                            <option key={s.id} value={s.id}>{s.full_name} ({s.student_code})</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Summa (UZS)</label>
                                    <div className="relative group">
                                        <span className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 font-black group-focus-within:text-emerald-500 transition-colors">$</span>
                                        <input
                                            type="number"
                                            value={formData.amount}
                                            onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                                            className="w-full pl-12 pr-6 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-emerald-500/20 focus:bg-white transition-all text-xl font-black text-slate-900 placeholder:text-slate-200"
                                            placeholder="0.00"
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Turi</label>
                                        <select
                                            value={formData.type}
                                            onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                                            className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-emerald-500/20 focus:bg-white transition-all text-xs font-black text-slate-700 uppercase"
                                        >
                                            <option value="tuition">Ta'lim</option>
                                            <option value="books">Kitoblar</option>
                                            <option value="materials">Materiallar</option>
                                            <option value="other">Boshqa</option>
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Sana</label>
                                        <input
                                            type="date"
                                            value={formData.date}
                                            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                            className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-emerald-500/20 focus:bg-white transition-all text-xs font-black text-slate-700 hover:bg-slate-100"
                                        />
                                    </div>
                                </div>

                                <div className="pt-6">
                                    <button
                                        type="submit"
                                        disabled={submitting}
                                        className="w-full py-5 bg-emerald-600 text-white font-black uppercase tracking-[0.2em] text-[10px] rounded-2xl hover:bg-emerald-700 shadow-2xl shadow-emerald-500/30 transition-all hover:scale-[1.02] flex items-center justify-center gap-3"
                                    >
                                        {submitting ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : (
                                            <>
                                                <DollarSign size={16} />
                                                Tasdiqlash
                                            </>
                                        )}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default FinanceList;
