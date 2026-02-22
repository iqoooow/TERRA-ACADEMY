import { useState, useEffect, useMemo } from 'react';
import { supabase } from '../../../lib/supabase';
import {
    Search, Activity, Users, X,
    PlusCircle, CreditCard, RefreshCw, TrendingUp, ArrowUpRight,
    ShieldAlert, CheckCircle2, Download, Banknote, Smartphone,
    Building2, Wallet, ChevronDown, Calendar, ArrowDownLeft,
    PieChart, Receipt, Printer, Clock,
    FileText, Zap, AlertCircle
} from 'lucide-react';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import EmptyState from '../../../components/ui/EmptyState';
import { cn } from '../../../utils/cn';
import { format } from 'date-fns';
import { uz } from 'date-fns/locale';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart as RePieChart, Pie, Cell
} from 'recharts';

const MONTHS = ['Yanvar', 'Fevral', 'Mart', 'Aprel', 'May', 'Iyun', 'Iyul', 'Avgust', 'Sentabr', 'Oktabr', 'Noyabr', 'Dekabr'];

const PAYMENT_METHODS = [
    { key: 'cash', label: 'Naqd', icon: Banknote, color: 'text-emerald-500', bg: 'bg-emerald-50', hex: '#10B981' },
    { key: 'card', label: 'Karta', icon: CreditCard, color: 'text-blue-500', bg: 'bg-blue-50', hex: '#3B82F6' },
    { key: 'transfer', label: "O'tkazma", icon: Building2, color: 'text-purple-500', bg: 'bg-purple-50', hex: '#8B5CF6' },
    { key: 'online', label: 'Online', icon: Smartphone, color: 'text-orange-500', bg: 'bg-orange-50', hex: '#F59E0B' },
];

const STATUS_CONFIG = {
    paid: { label: "To'langan", bg: 'bg-emerald-100', text: 'text-emerald-700', border: 'border-emerald-200', dot: 'bg-emerald-500', hex: '#10B981' },
    partially_paid: { label: 'Qisman', bg: 'bg-blue-100', text: 'text-blue-700', border: 'border-blue-200', dot: 'bg-blue-500', hex: '#3B82F6' },
    overdue: { label: "Muddati o'tgan", bg: 'bg-rose-100', text: 'text-rose-700', border: 'border-rose-200', dot: 'bg-rose-500 animate-pulse', hex: '#F43F5E' },
    pending: { label: "To'lanmagan", bg: 'bg-amber-100', text: 'text-amber-700', border: 'border-amber-200', dot: 'bg-amber-500 animate-pulse', hex: '#F59E0B' },
};

const FinancialCenter = () => {
    const [activeTab, setActiveTab] = useState('billing'); // 'billing', 'transactions', 'analytics'
    const [loading, setLoading] = useState(true);
    const [students, setStudents] = useState([]);
    const [payments, setPayments] = useState({});
    const [transactions, setTransactions] = useState([]);
    const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
    const [searchQuery, setSearchQuery] = useState('');

    // Modal State
    const [isTxModalOpen, setIsTxModalOpen] = useState(false);
    const [selectedStudent, setSelectedStudent] = useState(null);
    const [txAmount, setTxAmount] = useState('');
    const [txMethod, setTxMethod] = useState('cash');
    const [txNote, setTxNote] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Receipt View State
    const [showReceipt, setShowReceipt] = useState(false);
    const [receiptData, setReceiptData] = useState(null);

    useEffect(() => {
        fetchData();
    }, [selectedMonth, selectedYear]);

    const fetchData = async () => {
        setLoading(true);
        try {
            // 1. Fetch Students
            const { data: studentsData, error: studentsErr } = await supabase
                .from('profiles')
                .select('id, full_name, phone, student_code, status')
                .eq('role', 'student')
                .eq('status', 'approved')
                .order('full_name');

            if (studentsErr) throw studentsErr;

            // 2. Fetch Enrollments & Monthly Payments
            const studentIds = studentsData.map(s => s.id);
            const targetDate = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-01`;

            const [enrollmentsRes, paymentsRes, txsRes] = await Promise.all([
                supabase.from('enrollments').select('student_id, groups(id, name, price)').in('student_id', studentIds),
                supabase.from('monthly_payments').select('*').eq('payment_month', targetDate),
                supabase.from('payment_transactions').select('*, monthly_payments(student_id, profiles(full_name))').order('created_at', { ascending: false }).limit(100)
            ]);

            // Map Enrollments
            const enrollMap = {};
            enrollmentsRes.data?.forEach(e => {
                enrollMap[e.student_id] = e.groups;
            });

            // Map Monthly Payments
            const pMap = {};
            paymentsRes.data?.forEach(p => {
                pMap[p.student_id] = p;
            });

            setStudents(studentsData.map(s => ({
                ...s,
                group: enrollMap[s.id] || null
            })));
            setPayments(pMap);
            setTransactions(txsRes.data || []);

        } catch (err) {
            console.error('Fetch error:', err);
            toast.error("Ma'lumotlarni yuklashda xatolik");
        } finally {
            setLoading(false);
        }
    };

    const handleOpenPayModal = (student) => {
        setSelectedStudent(student);
        const pay = payments[student.id];
        const groupPrice = student.group?.price || 0;
        const remaining = pay ? (pay.final_amount || groupPrice) - (pay.paid_amount || 0) : groupPrice;

        setTxAmount(remaining > 0 ? String(remaining) : '');
        setTxMethod('cash');
        setTxNote('');
        setIsTxModalOpen(true);
    };

    const handleProcessPayment = async (e) => {
        e.preventDefault();
        if (!txAmount || Number(txAmount) <= 0) return toast.error("Summa noto'g'ri");

        setIsSubmitting(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            const targetDate = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-01`;

            // 1. Ensure Monthly Payment record exists
            let paymentId = payments[selectedStudent.id]?.id;
            if (!paymentId) {
                const { data: newPay, error: pErr } = await supabase
                    .from('monthly_payments')
                    .insert({
                        student_id: selectedStudent.id,
                        payment_month: targetDate,
                        amount: selectedStudent.group?.price || 0,
                        status: 'pending',
                        due_date: `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-10`
                    })
                    .select().single();
                if (pErr) throw pErr;
                paymentId = newPay.id;
            }

            // 2. Insert Transaction
            const { data: newTx, error: txErr } = await supabase
                .from('payment_transactions')
                .insert({
                    payment_id: paymentId,
                    amount: Number(txAmount),
                    method: txMethod,
                    note: txNote || null,
                    performed_by: user.id
                })
                .select('*, monthly_payments(profiles(full_name))')
                .single();
            if (txErr) throw txErr;

            toast.success("To'lov muvaffaqiyatli qabul qilindi!");
            setIsTxModalOpen(false);

            // Show receipt
            setReceiptData(newTx);
            setShowReceipt(true);

            fetchData();
        } catch (err) {
            toast.error(err.message || "Xatolik yuz berdi");
        } finally {
            setIsSubmitting(false);
        }
    };

    const filteredStudents = useMemo(() =>
        students.filter(s => s.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            s.phone?.includes(searchQuery) ||
            s.student_code?.toLowerCase().includes(searchQuery.toLowerCase())),
        [students, searchQuery]);

    const stats = useMemo(() => {
        const vals = Object.values(payments);
        const totalExpected = students.reduce((sum, s) => sum + (s.group?.price || 0), 0);
        const totalReceived = vals.reduce((sum, p) => sum + Number(p.paid_amount || 0), 0);
        const paidCount = vals.filter(p => p.status === 'paid').length;
        const debt = totalExpected - totalReceived;

        return {
            totalExpected,
            totalReceived,
            paidCount,
            debt,
            percent: totalExpected > 0 ? Math.round((totalReceived / totalExpected) * 100) : 0
        };
    }, [payments, students]);

    // Analytics Helper Data
    const analyticsData = useMemo(() => {
        // 1. Status Data
        const statusCounts = {
            paid: 0, partially_paid: 0, overdue: 0, pending: 0
        };
        students.forEach(s => {
            const status = payments[s.id]?.status || 'pending';
            statusCounts[status]++;
        });

        const statusChart = Object.entries(statusCounts).map(([key, val]) => ({
            name: STATUS_CONFIG[key].label,
            value: val,
            color: STATUS_CONFIG[key].hex
        }));

        // 2. Method Data
        const methodCounts = {};
        transactions.forEach(tx => {
            methodCounts[tx.method] = (methodCounts[tx.method] || 0) + Number(tx.amount);
        });

        const methodChart = Object.entries(methodCounts).map(([key, val]) => ({
            name: PAYMENT_METHODS.find(m => m.key === key)?.label || key,
            value: Math.round(val / 1000000), // In millions
            color: PAYMENT_METHODS.find(m => m.key === key)?.hex || '#ccc'
        }));

        return { statusChart, methodChart };
    }, [students, payments, transactions]);

    return (
        <div className="space-y-8 animate-fade-in pb-20 max-w-[1600px] mx-auto">

            {/* ── Master Header ── */}
            <div className="relative overflow-hidden rounded-[3rem] bg-slate-900 shadow-2xl border border-white/5">
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-900 via-slate-900 to-black opacity-95"></div>
                <div className="absolute -top-40 -left-40 w-96 h-96 bg-blue-600/20 rounded-full blur-[120px]"></div>
                <div className="absolute bottom-0 right-0 w-80 h-80 bg-indigo-600/10 rounded-full blur-[100px]"></div>

                <div className="relative z-10 p-10 md:p-14 flex flex-col md:flex-row items-center justify-between gap-10">
                    <div>
                        <motion.div
                            initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
                            className="inline-flex items-center gap-2 px-4 py-1.5 bg-white/5 rounded-full border border-white/10 text-[10px] font-black uppercase tracking-[0.2em] text-blue-300 mb-6 backdrop-blur-xl"
                        >
                            <TrendingUp size={14} className="text-blue-400" />
                            Financial Intelligence Center
                        </motion.div>
                        <h1 className="text-4xl md:text-6xl font-black text-white tracking-tighter mb-4 leading-none italic">
                            Terra <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-400 to-cyan-400 not-italic">Capital.</span>
                        </h1>
                        <p className="text-slate-400 font-medium text-lg md:text-xl max-w-xl leading-relaxed">
                            {MONTHS[selectedMonth - 1]} {selectedYear} hisoboti — tizimning moliyaviy barqarorligi tahlili.
                        </p>
                    </div>

                    <div className="grid grid-cols-2 gap-4 shrink-0">
                        <div className="bg-white/5 border border-white/10 backdrop-blur-2xl px-8 py-6 rounded-[2.5rem] min-w-[200px] group hover:bg-white/10 transition-all">
                            <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400 mb-2 block flex items-center gap-2">
                                <ArrowUpRight size={12} /> Tushum
                            </span>
                            <div className="font-black text-white text-3xl tracking-tighter tabular-nums flex items-baseline gap-1">
                                {stats.totalReceived.toLocaleString()} <span className="text-[10px] text-slate-500 italic">uzs</span>
                            </div>
                        </div>
                        <div className="bg-white/5 border border-white/10 backdrop-blur-2xl px-8 py-6 rounded-[2.5rem] min-w-[200px] group hover:bg-white/10 transition-all">
                            <span className="text-[10px] font-black uppercase tracking-widest text-rose-400 mb-2 block flex items-center gap-2">
                                <ArrowDownLeft size={12} /> Qarz
                            </span>
                            <div className="font-black text-rose-400 text-3xl tracking-tighter tabular-nums flex items-baseline gap-1">
                                {stats.debt.toLocaleString()} <span className="text-[10px] text-slate-500 italic">uzs</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Tab Navigation */}
                <div className="relative z-10 px-10 pb-2 flex gap-8 border-t border-white/5">
                    {[
                        { id: 'billing', label: 'Boshqaruv Paneli', icon: Users },
                        { id: 'transactions', label: 'Tranzaksiyalar', icon: Receipt },
                        { id: 'analytics', label: 'Analytics Hub', icon: PieChart },
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={cn(
                                "flex items-center gap-2 py-6 px-2 text-[10px] font-black uppercase tracking-[0.2em] transition-all relative group",
                                activeTab === tab.id ? "text-white" : "text-slate-500 hover:text-slate-300"
                            )}
                        >
                            <tab.icon size={16} className={cn(activeTab === tab.id ? "text-blue-400" : "text-slate-600")} />
                            {tab.label}
                            {activeTab === tab.id && (
                                <motion.div layoutId="tab-underline" className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-t-full" />
                            )}
                        </button>
                    ))}
                </div>
            </div>

            {/* ── Quick Stats Grid ── */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                    { label: "O'quvchilar", value: students.length, icon: Users, color: 'from-blue-500 to-indigo-600', text: 'text-blue-600' },
                    { label: "Muvaffaqiyat", value: `${stats.percent}%`, icon: CheckCircle2, color: 'from-emerald-500 to-teal-600', text: 'text-emerald-600' },
                    { label: "Qarz (UZS)", value: stats.debt.toLocaleString(), icon: Clock, color: 'from-amber-500 to-orange-600', text: 'text-amber-600' },
                    { label: "To'liq To'langan", value: stats.paidCount, icon: Zap, color: 'from-violet-500 to-purple-600', text: 'text-violet-600' },
                ].map((s, i) => (
                    <motion.div
                        key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
                        className="glass-card p-6 flex items-center gap-5 group hover:-translate-y-1 transition-all"
                    >
                        <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${s.color} flex items-center justify-center shadow-lg shrink-0 group-hover:rotate-12 transition-transform`}>
                            <s.icon size={24} className="text-white" />
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{s.label}</p>
                            <p className={cn("text-2xl font-black tracking-tighter", s.text)}>{s.value}</p>
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* ── Tab Content ── */}
            <AnimatePresence mode="wait">
                {activeTab === 'billing' && (
                    <motion.div
                        key="billing" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                        className="space-y-4"
                    >
                        {/* Filters */}
                        <div className="glass-card p-3 flex flex-col md:flex-row items-center gap-3 sticky top-24 z-30 bg-white/80 backdrop-blur-xl border-slate-100">
                            <div className="flex gap-2">
                                <div className="relative">
                                    <select
                                        value={selectedMonth} onChange={e => setSelectedMonth(Number(e.target.value))}
                                        className="appearance-none pl-5 pr-10 py-3.5 bg-slate-50 border-none rounded-2xl text-sm font-black text-slate-700 cursor-pointer focus:ring-2 focus:ring-blue-500/20"
                                    >
                                        {MONTHS.map((m, i) => <option key={i + 1} value={i + 1}>{m}</option>)}
                                    </select>
                                    <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                </div>
                                <div className="relative">
                                    <select
                                        value={selectedYear} onChange={e => setSelectedYear(Number(e.target.value))}
                                        className="appearance-none pl-5 pr-10 py-3.5 bg-slate-50 border-none rounded-2xl text-sm font-black text-slate-700 cursor-pointer focus:ring-2 focus:ring-blue-500/20"
                                    >
                                        {[2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
                                    </select>
                                    <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                </div>
                            </div>

                            <div className="relative flex-1 w-full">
                                <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                                <input
                                    type="text" placeholder="Ism, telefon yoki o'quvchi kodi..."
                                    value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                                    className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-blue-500/20"
                                />
                            </div>

                            <div className="flex gap-2 text-white">
                                <button onClick={fetchData} className="p-3.5 bg-slate-100 text-slate-400 rounded-2xl hover:bg-blue-600 hover:text-white transition-all active:scale-95">
                                    <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
                                </button>
                                <button className="flex items-center gap-2 px-6 py-3.5 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-800 transition-all active:scale-95">
                                    <Download size={16} /> Export
                                </button>
                            </div>
                        </div>

                        {/* List */}
                        <div className="space-y-3">
                            <div className="grid grid-cols-12 gap-4 px-8 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                <div className="col-span-4">O'quvchi & Guruh</div>
                                <div className="col-span-2 text-center">To'lanishi kerak</div>
                                <div className="col-span-2 text-center">To'landi</div>
                                <div className="col-span-2 text-center">Holat</div>
                                <div className="col-span-2 text-right">Amal</div>
                            </div>

                            {filteredStudents.length === 0 ? (
                                <EmptyState title="Ma'lumot topilmadi" icon={Search} />
                            ) : (
                                filteredStudents.map((s, idx) => {
                                    const pay = payments[s.id];
                                    const expected = pay?.amount || s.group?.price || 0;
                                    const paid = pay?.paid_amount || 0;
                                    const status = pay?.status || 'pending';
                                    const cfg = STATUS_CONFIG[status];

                                    return (
                                        <motion.div
                                            key={s.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.03 }}
                                            className="grid grid-cols-12 gap-4 items-center bg-white border border-slate-100 rounded-[2.5rem] p-4 px-8 hover:shadow-2xl hover:shadow-slate-200 hover:border-blue-100 transition-all group"
                                        >
                                            <div className="col-span-4 flex items-center gap-4">
                                                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center font-black text-white text-lg group-hover:scale-110 transition-transform">
                                                    {s.full_name[0]}
                                                </div>
                                                <div className="min-w-0">
                                                    <h4 className="font-black text-slate-800 text-sm truncate uppercase tracking-tight">{s.full_name}</h4>
                                                    <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest flex items-center gap-2">
                                                        {s.group?.name || 'Guruhsiz'}
                                                        {status === 'overdue' && <AlertCircle size={12} className="text-rose-500 animate-pulse" />}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="col-span-2 text-center font-black text-slate-900 tabular-nums">
                                                {expected.toLocaleString()}
                                            </div>
                                            <div className="col-span-2 text-center font-black text-emerald-600 tabular-nums">
                                                {paid.toLocaleString()}
                                            </div>
                                            <div className="col-span-2 flex justify-center">
                                                <span className={cn("px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border flex items-center gap-2", cfg.bg, cfg.text, cfg.border)}>
                                                    <div className={cn("w-1.5 h-1.5 rounded-full", cfg.dot)} />
                                                    {cfg.label}
                                                </span>
                                            </div>
                                            <div className="col-span-2 text-right">
                                                <button
                                                    onClick={() => handleOpenPayModal(s)}
                                                    className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-blue-700 shadow-lg shadow-blue-500/20 transition-all opacity-0 group-hover:opacity-100 active:scale-95 translate-x-4 group-hover:translate-x-0"
                                                >
                                                    <PlusCircle size={14} /> To'lov
                                                </button>
                                            </div>
                                        </motion.div>
                                    );
                                })
                            )}
                        </div>
                    </motion.div>
                )}

                {activeTab === 'transactions' && (
                    <motion.div
                        key="transactions" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                        className="space-y-4"
                    >
                        <div className="glass-card border-none bg-white p-10 rounded-[2.5rem] shadow-xl">
                            <h3 className="text-2xl font-black text-slate-900 mb-10 flex items-center gap-3">
                                <span className="w-12 h-12 rounded-2xl bg-orange-50 text-orange-600 flex items-center justify-center">
                                    <Receipt size={24} />
                                </span>
                                Real-time Transactions
                            </h3>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {transactions.length === 0 ? (
                                    <div className="col-span-2"><EmptyState title="Tranzaksiyalar yo'q" icon={Receipt} /></div>
                                ) : (
                                    transactions.map((tx, idx) => (
                                        <motion.div
                                            key={tx.id} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: idx * 0.05 }}
                                            className="flex items-center justify-between p-6 bg-slate-50/50 rounded-3xl border border-slate-100 hover:bg-white hover:shadow-2xl hover:border-orange-100 transition-all group"
                                        >
                                            <div className="flex items-center gap-5">
                                                <div className={cn(
                                                    "w-16 h-16 rounded-[1.5rem] flex items-center justify-center shadow-sm border border-white/80",
                                                    PAYMENT_METHODS.find(m => m.key === tx.method)?.bg || 'bg-slate-100'
                                                )}>
                                                    {(() => {
                                                        const m = PAYMENT_METHODS.find(m => m.key === tx.method);
                                                        const Icon = m?.icon || Banknote;
                                                        return <Icon className={m?.color || 'text-slate-400'} size={28} />;
                                                    })()}
                                                </div>
                                                <div>
                                                    <h4 className="font-black text-slate-900 uppercase tracking-tight group-hover:text-orange-600 transition-colors">
                                                        {tx.monthly_payments?.profiles?.full_name || 'System User'}
                                                    </h4>
                                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mt-1 flex items-center gap-2">
                                                        {format(new Date(tx.created_at), 'dd MMM, HH:mm', { locale: uz })}
                                                        <span className="w-1 h-1 bg-slate-300 rounded-full" />
                                                        {tx.method}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-2xl font-black text-slate-900 tracking-tighter">+{tx.amount.toLocaleString()}</p>
                                                <button
                                                    onClick={() => { setReceiptData(tx); setShowReceipt(true); }}
                                                    className="inline-flex items-center gap-1.5 text-[9px] font-black text-blue-500 uppercase tracking-widest mt-1 hover:underline group-hover:translate-x-1 transition-transform"
                                                >
                                                    <Printer size={12} /> Receipt
                                                </button>
                                            </div>
                                        </motion.div>
                                    ))
                                )}
                            </div>
                        </div>
                    </motion.div>
                )}

                {activeTab === 'analytics' && (
                    <motion.div
                        key="analytics" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                        className="grid grid-cols-1 lg:grid-cols-2 gap-8"
                    >
                        {/* Status Chart */}
                        <div className="glass-card bg-white p-10 rounded-[3rem] border border-slate-100 shadow-xl">
                            <h3 className="text-xl font-black text-slate-900 mb-8 flex items-center gap-3">
                                <Activity size={20} className="text-blue-500" />
                                To'lov Holatlari (Oylik)
                            </h3>
                            <div className="h-[350px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <RePieChart>
                                        <Pie
                                            data={analyticsData.statusChart}
                                            innerRadius={80}
                                            outerRadius={120}
                                            paddingAngle={8}
                                            dataKey="value"
                                        >
                                            {analyticsData.statusChart.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.color} />
                                            ))}
                                        </Pie>
                                        <Tooltip
                                            contentStyle={{ borderRadius: '20px', border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.1)' }}
                                            itemStyle={{ fontWeight: 'black', fontSize: '12px' }}
                                        />
                                    </RePieChart>
                                </ResponsiveContainer>
                            </div>
                            <div className="grid grid-cols-2 gap-4 mt-8">
                                {analyticsData.statusChart.map((s, i) => (
                                    <div key={i} className="flex items-center gap-3 p-3 bg-slate-50 rounded-2xl">
                                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: s.color }} />
                                        <div>
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{s.name}</p>
                                            <p className="text-lg font-black text-slate-900">{s.value} <span className="text-[10px] text-slate-400 font-bold uppercase">kishi</span></p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Method Chart */}
                        <div className="glass-card bg-slate-900 p-10 rounded-[3rem] text-white shadow-2xl relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/10 rounded-full blur-[100px]"></div>
                            <h3 className="text-xl font-black text-white mb-8 flex items-center gap-3 relative z-10">
                                <Zap size={20} className="text-amber-400" />
                                To'lov Usullari (Mln UZS)
                            </h3>
                            <div className="h-[350px] w-full relative z-10">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={analyticsData.methodChart} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#ffffff50', fontSize: 10, fontWeight: 700 }} />
                                        <YAxis axisLine={false} tickLine={false} tick={{ fill: '#ffffff50', fontSize: 10, fontWeight: 700 }} />
                                        <Tooltip
                                            cursor={{ fill: '#ffffff05' }}
                                            contentStyle={{ backgroundColor: '#1E293B', borderRadius: '16px', border: '1px solid #ffffff10' }}
                                        />
                                        <Bar dataKey="value" radius={[10, 10, 0, 0]}>
                                            {analyticsData.methodChart.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.color} />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                            <div className="mt-8 relative z-10 p-6 bg-white/5 rounded-3xl border border-white/5">
                                {(() => {
                                    const top = analyticsData.methodChart.reduce((a, b) => b.value > a.value ? b : a, { name: '—', value: 0, color: '#ccc' });
                                    const topMethod = PAYMENT_METHODS.find(m => m.label === top.name);
                                    const TopIcon = topMethod?.icon || Banknote;
                                    const totalMethodVal = analyticsData.methodChart.reduce((s, m) => s + m.value, 0);
                                    const pct = totalMethodVal > 0 ? Math.round((top.value / totalMethodVal) * 100) : 0;
                                    return (
                                        <>
                                            <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-400 mb-4 italic">Eng ko'p foydalanilgan</h4>
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center text-white">
                                                        <TopIcon size={24} />
                                                    </div>
                                                    <div>
                                                        <p className="font-black text-lg">{top.name}</p>
                                                        <p className="text-[10px] text-slate-500 font-bold uppercase">Jami tushumning {pct}%</p>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-2xl font-black text-emerald-400 tracking-tighter">{top.value.toLocaleString()}M</p>
                                                </div>
                                            </div>
                                        </>
                                    );
                                })()}
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ── Transaction Modal ── */}
            <AnimatePresence>
                {isTxModalOpen && selectedStudent && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-slate-950/60 backdrop-blur-2xl"
                            onClick={() => setIsTxModalOpen(false)}
                        />
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0, y: 30 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 30 }}
                            className="bg-white rounded-[3rem] w-full max-w-lg relative z-10 shadow-[0_40px_100px_rgba(0,0,0,0.5)] overflow-hidden"
                        >
                            <div className="bg-gradient-to-br from-blue-600 to-indigo-700 p-10 relative">
                                <button onClick={() => setIsTxModalOpen(false)} className="absolute top-8 right-8 text-white/50 hover:text-white transition-colors">
                                    <X size={24} />
                                </button>
                                <div className="flex items-center gap-6">
                                    <div className="w-16 h-16 bg-white/10 rounded-[2rem] flex items-center justify-center text-white font-black text-3xl border border-white/10 shadow-inner">
                                        {selectedStudent.full_name[0]}
                                    </div>
                                    <div>
                                        <h3 className="text-2xl font-black text-white tracking-tight">{selectedStudent.full_name}</h3>
                                        <p className="text-blue-100/60 font-bold text-sm uppercase tracking-widest">{selectedStudent.group?.name || 'Guruhsiz'}</p>
                                    </div>
                                </div>
                            </div>

                            <form onSubmit={handleProcessPayment} className="p-10 space-y-8">
                                <div className="grid grid-cols-4 gap-3">
                                    {PAYMENT_METHODS.map(m => (
                                        <button
                                            key={m.key} type="button" onClick={() => setTxMethod(m.key)}
                                            className={cn(
                                                "flex flex-col items-center gap-3 py-5 rounded-3xl text-[10px] font-black uppercase tracking-widest transition-all border",
                                                txMethod === m.key ? "bg-blue-600 text-white border-blue-600 shadow-xl shadow-blue-500/30 -translate-y-1" : "bg-slate-50 text-slate-400 border-slate-100 hover:border-blue-200"
                                            )}
                                        >
                                            <m.icon size={20} />
                                            {m.label}
                                        </button>
                                    ))}
                                </div>

                                <div className="space-y-3">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Summa (UZS)</label>
                                    <div className="relative group">
                                        <Wallet className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-blue-500 transition-colors" />
                                        <input
                                            type="number" required value={txAmount} onChange={e => setTxAmount(e.target.value)}
                                            className="w-full pl-16 pr-8 py-6 bg-slate-50 border-none rounded-[2rem] text-3xl font-black tabular-nums focus:ring-4 focus:ring-blue-500/10 focus:bg-white transition-all outline-none"
                                            placeholder="0.00"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Izoh (ixtiyoriy)</label>
                                    <textarea
                                        value={txNote} onChange={e => setTxNote(e.target.value)}
                                        className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-blue-500/20 focus:bg-white transition-all outline-none min-h-[100px]"
                                        placeholder="To'lov haqida qo'shimcha ma'lumot..."
                                    />
                                </div>

                                <button
                                    type="submit" disabled={isSubmitting}
                                    className="w-full py-6 bg-slate-900 text-white rounded-[2rem] font-black uppercase tracking-[0.3em] text-[11px] shadow-2xl hover:bg-black transition-all active:scale-[0.98] flex items-center justify-center gap-4 disabled:opacity-50"
                                >
                                    {isSubmitting ? <RefreshCw className="animate-spin" /> : <ShieldAlert size={18} className="text-emerald-400" />}
                                    Tranzaksiyani Tasdiqlash
                                </button>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* ── Receipt Viewer Modal ── */}
            <AnimatePresence>
                {showReceipt && receiptData && (
                    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-slate-950/80 backdrop-blur-3xl"
                            onClick={() => setShowReceipt(false)}
                        />
                        <motion.div
                            initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.8, opacity: 0 }}
                            className="bg-white rounded-[2rem] w-full max-w-md relative z-10 p-10 overflow-hidden"
                            style={{ backgroundImage: 'radial-gradient(circle at 50% -20%, #eff6ff 0%, transparent 50%)' }}
                        >
                            <div className="absolute top-0 right-0 p-8">
                                <FileText size={48} className="text-blue-50 opacity-10 rotate-12" />
                            </div>

                            <div className="text-center mb-10">
                                <div className="w-20 h-20 bg-blue-600 rounded-3xl flex items-center justify-center text-white mx-auto shadow-xl shadow-blue-500/20 mb-6">
                                    <Printer size={32} />
                                </div>
                                <h3 className="text-2xl font-black text-slate-900 tracking-tighter uppercase italic">Terra Academy</h3>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">To'lov Kvitansiyasi</p>
                            </div>

                            <div className="space-y-6 border-y border-slate-100 py-8 my-8">
                                <div className="flex justify-between items-center">
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">O'quvchi</span>
                                    <span className="font-black text-slate-900 italic uppercase tabular-nums">{receiptData.monthly_payments?.profiles?.full_name}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Sana</span>
                                    <span className="font-black text-slate-900 uppercase tabular-nums">{format(new Date(receiptData.created_at), 'dd.MM.yyyy, HH:mm')}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">To'lov Usuli</span>
                                    <span className="font-black text-slate-900 uppercase italic tabular-nums">{receiptData.method}</span>
                                </div>
                                <div className="flex justify-between items-center pt-4 border-t border-dashed border-slate-200">
                                    <span className="text-[10px] font-black text-slate-900 uppercase tracking-widest">JAMI SUMMA</span>
                                    <span className="text-3xl font-black text-blue-600 tracking-tighter tabular-nums">{receiptData.amount.toLocaleString()} <span className="text-xs">uzs</span></span>
                                </div>
                            </div>

                            <div className="text-center space-y-4">
                                <img
                                    src={`https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=TXN-${receiptData.id}`}
                                    alt="QR" className="w-24 h-24 mx-auto opacity-80"
                                />
                                <p className="text-[9px] font-medium text-slate-400 max-w-[200px] mx-auto uppercase tracking-tighter">
                                    Ushbu kvitansiya Terra Academy moliyaviy tizimi tomonidan generate qilindi.
                                </p>
                            </div>

                            <button
                                onClick={() => window.print()}
                                className="w-full mt-10 py-5 bg-slate-100 text-slate-600 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-slate-200 transition-all flex items-center justify-center gap-2"
                            >
                                <Printer size={16} /> Chop etish
                            </button>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default FinancialCenter;
