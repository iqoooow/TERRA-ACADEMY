import React, { useState, useEffect } from 'react';
import Table, { TableRow, TableCell } from '../../../components/ui/Table';
import { Search, Download, DollarSign, TrendingUp, AlertCircle, Eye, X, Trash2, Calendar, FileText, Filter, Plus } from 'lucide-react';
import StatsCard from '../../../components/ui/StatsCard';
import { supabase } from '../../../lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';

const FinanceList = () => {
    const [transactions, setTransactions] = useState([]);
    const [rawData, setRawData] = useState([]);
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

            setRawData(data || []);

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
                date: t.date ? new Date(t.date).toLocaleDateString('uz-UZ') : '-',
                rawDate: t.date,
                amount: Number(t.amount || 0),
                type: t.type || 'other',
                typeLabel: typeLabels[t.type] || t.type || 'Boshqa',
                status: t.status,
                bg: t.status === 'paid' ? 'bg-emerald-100 text-emerald-700 border-emerald-200' : t.status === 'pending' ? 'bg-amber-100 text-amber-700 border-amber-200' : 'bg-rose-100 text-rose-700 border-rose-200'
            }));

            setTransactions(formattedTrx);

            const totalRev = (data || []).filter(t => t.status === 'paid').reduce((acc, curr) => acc + Number(curr.amount), 0);
            const pendingRev = (data || []).filter(t => t.status === 'pending').reduce((acc, curr) => acc + Number(curr.amount), 0);
            const avgTrx = (data || []).length ? (totalRev / data.length) : 0;

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
        if (rawData.length === 0) return toast.error("Eksport qilish uchun ma'lumot yo'q");

        // Simple CSV Export for now, could be enhanced
        const headers = ['ID,Student,Date,Type,Amount,Status'];
        const rows = rawData.map(d => {
            const student = d.profiles?.full_name || 'Unknown';
            return `${d.id},"${student}",${d.date},${d.type},${d.amount},${d.status}`;
        });

        const csvContent = "data:text/csv;charset=utf-8," + [headers, ...rows].join("\n");
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `finance_export_${new Date().toISOString().slice(0, 10)}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast.success("Eksport qilindi");
    };

    const handleDeletePayment = async (e, id) => {
        e.stopPropagation();
        if (!window.confirm("Haqiqatan ham bu to'lovni o'chirmoqchimisiz?")) return;

        setDeletingId(id);
        try {
            const { error } = await supabase.from('payments').delete().eq('id', id);
            if (error) throw error;
            toast.success("To'lov o'chirildi");
            fetchFinance();
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
            if (!formData.student_id || !formData.amount) throw new Error("Majburiy maydonlarni to'ldiring");

            const { error } = await supabase.from('payments').insert([{
                student_id: formData.student_id,
                amount: Number(formData.amount),
                type: formData.type,
                status: formData.status,
                date: formData.date
            }]);

            if (error) throw error;

            toast.success("To'lov qo'shildi");
            setIsModalOpen(false);
            setFormData({
                student_id: '',
                amount: '',
                type: 'tuition',
                status: 'paid',
                date: new Date().toISOString().split('T')[0]
            });
            fetchFinance();
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
        <div className="space-y-8 animate-fade-in pb-10">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight">Moliya</h1>
                    <p className="text-slate-500 font-medium mt-1">Barcha kirim va chiqim operatsiyalari</p>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 glass-card p-2 items-center min-w-[300px]">
                    <div className="flex-1 text-center px-4 py-1">
                        <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Jami Tushum</p>
                        <p className="font-black text-slate-800 text-xl">{stats.total.toLocaleString()} <span className="text-xs text-slate-400">UZS</span></p>
                    </div>
                    <div className="w-px h-10 bg-slate-200 hidden sm:block"></div>
                    <div className="flex-1 text-center px-4 py-1">
                        <p className="text-[10px] uppercase font-bold text-amber-500 tracking-wider">Kutilmoqda</p>
                        <p className="font-black text-amber-600 text-xl">{stats.pending.toLocaleString()} <span className="text-xs text-amber-400/70">UZS</span></p>
                    </div>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <StatsCard title="Jami Daromad" value={`${stats.total.toLocaleString()} UZS`} icon={DollarSign} color="green" trend="+12%" trendLabel="o'tgan oyga nisbatan" />
                <StatsCard title="O'rtacha Chek" value={`${Math.round(stats.avg).toLocaleString()} UZS`} icon={TrendingUp} color="blue" trend="Stabil" />
                <StatsCard title="Kutilayotgan" value={`${stats.pending.toLocaleString()} UZS`} icon={AlertCircle} color="orange" trend="Diqqat" />
            </div>

            {/* Controls */}
            <div className="glass-card p-2 flex flex-col md:flex-row items-center gap-3 sticky top-24 z-30">
                <div className="relative flex-1 w-full">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <input
                        type="text"
                        placeholder="ID yoki O'quvchi bo'yicha izlash..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:bg-white transition-all text-sm font-medium placeholder:text-slate-400"
                    />
                </div>
                <div className="flex gap-2 w-full md:w-auto">
                    <button
                        onClick={handleExport}
                        className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl transition-all font-bold text-xs uppercase tracking-wider"
                    >
                        <Download size={16} />
                        <span>Eksport</span>
                    </button>
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="flex-1 md:flex-none btn-primary from-blue-500 to-indigo-600 shadow-blue-500/30"
                    >
                        <Plus size={18} />
                        <span>To'lov Qo'shish</span>
                    </button>
                </div>
            </div>

            {/* Table */}
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
            >
                <Table headers={['ID', 'O\'quvchi', 'Sana', 'Turi', 'Summa', 'Holat', 'Amallar']}>
                    {loading ? (
                        <TableRow><TableCell colSpan={7} className="text-center py-20 text-slate-400 font-medium">Yuklanmoqda...</TableCell></TableRow>
                    ) : filteredTransactions.length === 0 ? (
                        <TableRow><TableCell colSpan={7} className="text-center py-20 text-slate-400 font-medium">Tranzaksiyalar topilmadi</TableCell></TableRow>
                    ) : (
                        filteredTransactions.map((trx) => (
                            <TableRow key={trx.id} className="group hover:bg-slate-50/50">
                                <TableCell>
                                    <span className="font-mono text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-1 rounded-md">
                                        {trx.shortId}
                                    </span>
                                </TableCell>
                                <TableCell>
                                    <div className="font-bold text-slate-700">{trx.student}</div>
                                </TableCell>
                                <TableCell>
                                    <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
                                        <Calendar size={12} />
                                        {trx.date}
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <span className="px-2 py-1 rounded-lg bg-blue-50 text-blue-600 text-[10px] font-black uppercase tracking-wider border border-blue-100">
                                        {trx.typeLabel}
                                    </span>
                                </TableCell>
                                <TableCell>
                                    <div className="font-black text-slate-700">
                                        {trx.amount.toLocaleString()} <span className="text-[10px] text-slate-400 font-bold">UZS</span>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <span className={`px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider border ${trx.bg}`}>
                                        {trx.status}
                                    </span>
                                </TableCell>
                                <TableCell>
                                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button
                                            onClick={() => setViewingTrx(trx)}
                                            className="p-2 text-slate-400 hover:bg-blue-50 hover:text-blue-600 rounded-lg transition-all hover:scale-110"
                                        >
                                            <Eye size={16} />
                                        </button>
                                        <button
                                            onClick={(e) => handleDeletePayment(e, trx.id)}
                                            className="p-2 text-slate-400 hover:bg-rose-50 hover:text-rose-600 rounded-lg transition-all hover:scale-110"
                                        >
                                            {deletingId === trx.id ? <div className="w-4 h-4 border-2 border-rose-500 border-t-transparent rounded-full animate-spin"></div> : <Trash2 size={16} />}
                                        </button>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))
                    )}
                </Table>
            </motion.div>

            {/* View Modal */}
            <AnimatePresence>
                {viewingTrx && (
                    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-slate-900/40 backdrop-blur-md"
                            onClick={() => setViewingTrx(null)}
                        />
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            className="bg-white rounded-3xl p-8 w-full max-w-sm relative z-10 shadow-2xl"
                        >
                            <button onClick={() => setViewingTrx(null)} className="absolute top-4 right-4 p-2 bg-slate-50 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600 transition-colors">
                                <X size={20} />
                            </button>

                            <div className="text-center mb-6">
                                <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-3 shadow-inner">
                                    <FileText size={32} />
                                </div>
                                <h3 className="text-xl font-black text-slate-900">Tranzaksiya Cheki</h3>
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">{viewingTrx.shortId}</p>
                            </div>

                            <div className="space-y-4 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                                <div className="flex justify-between">
                                    <span className="text-xs font-bold text-slate-400 uppercase">O'quvchi</span>
                                    <span className="text-sm font-bold text-slate-700">{viewingTrx.student}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-xs font-bold text-slate-400 uppercase">Sana</span>
                                    <span className="text-sm font-bold text-slate-700">{viewingTrx.date}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-xs font-bold text-slate-400 uppercase">Turi</span>
                                    <span className="text-sm font-bold text-slate-700">{viewingTrx.typeLabel}</span>
                                </div>
                                <div className="h-px bg-slate-200 my-2"></div>
                                <div className="flex justify-between items-center">
                                    <span className="text-xs font-bold text-slate-400 uppercase">Jami Summa</span>
                                    <span className="text-lg font-black text-slate-900">{viewingTrx.amount.toLocaleString()} UZS</span>
                                </div>
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
                            className="absolute inset-0 bg-slate-900/40 backdrop-blur-md"
                            onClick={() => setIsModalOpen(false)}
                        />
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            className="bg-white rounded-3xl p-8 w-full max-w-md relative z-10 shadow-2xl border border-white/20"
                        >
                            <button onClick={() => setIsModalOpen(false)} className="absolute top-6 right-6 p-2 bg-slate-50 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600 transition-colors">
                                <X size={20} />
                            </button>

                            <div className="mb-6">
                                <h2 className="text-2xl font-black text-slate-900 tracking-tight">Yangi To'lov</h2>
                                <p className="text-slate-500 font-medium">Qo'lda to'lov kiritish</p>
                            </div>

                            <form onSubmit={handleAddPayment} className="space-y-4">
                                <div>
                                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1 mb-2 block">O'quvchi</label>
                                    <select
                                        value={formData.student_id}
                                        onChange={(e) => setFormData({ ...formData, student_id: e.target.value })}
                                        className="input-field"
                                        required
                                    >
                                        <option value="">Tanlang...</option>
                                        {students.map(s => (
                                            <option key={s.id} value={s.id}>{s.full_name} ({s.student_code})</option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1 mb-2 block">Summa (so'm)</label>
                                    <input
                                        type="number"
                                        value={formData.amount}
                                        onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                                        className="input-field"
                                        placeholder="0.00"
                                        required
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1 mb-2 block">Turi</label>
                                        <select
                                            value={formData.type}
                                            onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                                            className="input-field"
                                        >
                                            <option value="tuition">Ta'lim</option>
                                            <option value="books">Kitoblar</option>
                                            <option value="materials">Materiallar</option>
                                            <option value="other">Boshqa</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1 mb-2 block">Sana</label>
                                        <input
                                            type="date"
                                            value={formData.date}
                                            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                            className="input-field"
                                        />
                                    </div>
                                </div>

                                <div className="pt-2">
                                    <button
                                        type="submit"
                                        disabled={submitting}
                                        className="w-full py-4 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 shadow-lg shadow-blue-500/30 transition-all uppercase tracking-widest text-xs flex items-center justify-center gap-2"
                                    >
                                        {submitting ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'Saqlash'}
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
