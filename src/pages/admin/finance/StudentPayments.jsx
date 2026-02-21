import { useState, useEffect, useMemo } from 'react';
import { supabase } from '../../../lib/supabase';
import {
    Search, DollarSign, AlertCircle, Users, X,
    PlusCircle, CreditCard, RefreshCw, TrendingUp, ArrowUpRight,
    ShieldAlert, CheckCircle2, Download, Banknote, Smartphone,
    Building2, Wallet, ChevronDown
} from 'lucide-react';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import EmptyState from '../../../components/ui/EmptyState';
import { cn } from '../../../utils/cn';

const MONTHS = ['Yanvar', 'Fevral', 'Mart', 'Aprel', 'May', 'Iyun', 'Iyul', 'Avgust', 'Sentabr', 'Oktabr', 'Noyabr', 'Dekabr'];

const PAYMENT_METHODS = [
    { key: 'cash', label: 'Naqd', icon: Banknote },
    { key: 'card', label: 'Karta', icon: CreditCard },
    { key: 'transfer', label: "O'tkazma", icon: Building2 },
    { key: 'online', label: 'Online', icon: Smartphone },
];

const STATUS_CONFIG = {
    paid:           { label: "To'langan",        bg: 'bg-emerald-100', text: 'text-emerald-700', border: 'border-emerald-200', dot: 'bg-emerald-500' },
    partially_paid: { label: 'Qisman',           bg: 'bg-blue-100',    text: 'text-blue-700',    border: 'border-blue-200',    dot: 'bg-blue-500' },
    overdue:        { label: "Muddati o'tgan",   bg: 'bg-rose-100',    text: 'text-rose-700',    border: 'border-rose-200',    dot: 'bg-rose-500 animate-pulse' },
    pending:        { label: "To'lanmagan",      bg: 'bg-amber-100',   text: 'text-amber-700',   border: 'border-amber-200',   dot: 'bg-amber-500 animate-pulse' },
};

const StudentPayments = () => {
    const [loading, setLoading] = useState(true);
    const [students, setStudents] = useState([]);
    const [payments, setPayments] = useState({});
    const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
    const [selectedYear, setSelectedYear]   = useState(new Date().getFullYear());
    const [searchQuery, setSearchQuery]     = useState('');

    // Modal
    const [isTxModalOpen,  setIsTxModalOpen]  = useState(false);
    const [activePayment,  setActivePayment]   = useState(null);
    const [selectedStudent, setSelectedStudent] = useState(null);
    const [txAmount,   setTxAmount]   = useState('');
    const [txMethod,   setTxMethod]   = useState('cash');
    const [txNote,     setTxNote]     = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => { fetchData(); }, [selectedMonth, selectedYear]);

    const fetchData = async () => {
        setLoading(true);
        try {
            // Step 1: Fetch students — simple query (no nested join to avoid PostgREST issues)
            const { data: studentsData, error: studentsErr } = await supabase
                .from('profiles')
                .select('id, full_name, phone')
                .eq('role', 'student')
                .eq('status', 'approved')
                .order('full_name');
            if (studentsErr) throw studentsErr;

            const rawStudents = studentsData || [];

            // Step 2: Fetch enrollments + groups separately for these students
            let enrollmentMap = {};
            if (rawStudents.length > 0) {
                const ids = rawStudents.map(s => s.id);
                const { data: enrollments } = await supabase
                    .from('enrollments')
                    .select('student_id, groups(id, name, price)')
                    .in('student_id', ids);
                (enrollments || []).forEach(e => {
                    if (!enrollmentMap[e.student_id]) {
                        enrollmentMap[e.student_id] = [{ groups: e.groups }];
                    }
                });
            }

            setStudents(rawStudents.map(s => ({
                ...s,
                finance_status: null,
                enrollments: enrollmentMap[s.id] || [],
            })));

            // Step 3: Fetch monthly payments (gracefully — may not exist yet)
            const { data: paymentsData } = await supabase
                .from('monthly_payments')
                .select('*')
                .eq('payment_month', selectedMonth)
                .eq('payment_year', selectedYear);

            const pMap = {};
            (paymentsData || []).forEach(p => { pMap[p.student_id] = p; });
            setPayments(pMap);
        } catch (err) {
            console.error('fetchData error:', err);
            toast.error("Ma'lumotlarni yuklashda xatolik");
        } finally {
            setLoading(false);
        }
    };

    const handleOpenModal = (student) => {
        setSelectedStudent(student);
        setActivePayment(payments[student.id] || null);
        const group = student.enrollments?.[0]?.groups;
        const pay   = payments[student.id];
        const remaining = pay ? Number(pay.remaining_amount ?? pay.final_amount ?? group?.price ?? 0) : Number(group?.price ?? 0);
        setTxAmount(remaining > 0 ? String(remaining) : '');
        setTxMethod('cash');
        setTxNote('');
        setIsTxModalOpen(true);
    };

    const handleCreateTransaction = async (e) => {
        e.preventDefault();
        if (!txAmount || Number(txAmount) <= 0) return toast.error("Summa kiritilishi shart");
        setIsSubmitting(true);
        try {
            const { data: { user: currentUser } } = await supabase.auth.getUser();
            if (!currentUser) throw new Error("Sessiya muddati tugagan");

            let paymentId = activePayment?.id;
            if (!paymentId) {
                const group = selectedStudent.enrollments?.[0]?.groups;
                const { data: newPay, error: pErr } = await supabase
                    .from('monthly_payments')
                    .insert({
                        student_id:    selectedStudent.id,
                        group_id:      group?.id || null,
                        payment_month: Number(selectedMonth),
                        payment_year:  Number(selectedYear),
                        base_amount:   Number(group?.price || 0),
                        amount_paid:   0,
                        due_date:      new Date(selectedYear, selectedMonth - 1, 10).toISOString(),
                    })
                    .select()
                    .single();
                if (pErr) throw pErr;
                paymentId = newPay.id;
            }

            const { error: txErr } = await supabase
                .from('payment_transactions')
                .insert({
                    payment_id:   paymentId,
                    amount:       Number(txAmount),
                    method:       txMethod,
                    note:         txNote || null,
                    performed_by: currentUser.id,
                });
            if (txErr) throw txErr;

            toast.success("To'lov muvaffaqiyatli saqlandi!");
            setIsTxModalOpen(false);
            fetchData();
        } catch (err) {
            toast.error(err.message || "Xatolik yuz berdi");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleExport = () => {
        const rows = filteredStudents.map(student => {
            const pay   = payments[student.id];
            const group = student.enrollments?.[0]?.groups;
            const expected  = Number(pay?.final_amount   || group?.price || 0);
            const paid      = Number(pay?.amount_paid    || 0);
            const remaining = Number(pay?.remaining_amount ?? expected);
            const status    = STATUS_CONFIG[pay?.status || 'pending']?.label || "To'lanmagan";
            return [student.full_name, student.phone || '-', group?.name || 'Guruhsiz',
                    expected, paid, remaining, status].join(',');
        });
        const csv = ["F.I.O,Telefon,Guruh,Hisob,To'landi,Qoldiq,Holat", ...rows].join('\n');
        const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
        const url  = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href     = url;
        link.download = `tolovlar_${MONTHS[selectedMonth-1]}_${selectedYear}.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        toast.success("Hisobot yuklandi");
    };

    const stats = useMemo(() => {
        const vals = Object.values(payments);
        const totalExpected = vals.reduce((a, p) => a + Number(p.final_amount || p.base_amount || 0), 0);
        const totalReceived = vals.reduce((a, p) => a + Number(p.amount_paid  || 0), 0);
        const paidCount     = vals.filter(p => p.status === 'paid').length;
        const overdueCount  = vals.filter(p => p.status === 'overdue').length;
        const percent       = totalExpected > 0 ? Math.round((totalReceived / totalExpected) * 100) : 0;
        return { totalExpected, totalReceived, paidCount, overdueCount, percent,
                 blockedCount: students.filter(s => s.finance_status === 'blocked').length };
    }, [payments, students]);

    const filteredStudents = useMemo(() =>
        students.filter(s => s.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                             s.phone?.includes(searchQuery)),
    [students, searchQuery]);

    const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i);

    return (
        <div className="space-y-8 max-w-[1600px] mx-auto pb-10 animate-fade-in">

            {/* ── Header ── */}
            <div className="relative overflow-hidden rounded-[2.5rem] bg-slate-900 shadow-2xl">
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-700 via-violet-700 to-slate-900 opacity-90 transition-transform duration-1000 hover:scale-105"></div>
                <div className="absolute -top-32 -right-32 w-[500px] h-[500px] bg-indigo-500/10 rounded-full blur-[100px]"></div>

                <div className="relative z-10 p-8 md:p-12 flex flex-col md:flex-row md:items-end justify-between gap-8">
                    <div>
                        <motion.div
                            initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
                            className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 rounded-full text-[10px] font-black uppercase tracking-widest mb-4 backdrop-blur-md border border-white/10 text-indigo-200"
                        >
                            <TrendingUp size={12} className="text-indigo-300" />
                            Moliyaviy Monitoring
                        </motion.div>
                        <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight mb-3 italic">
                            Oylik <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-300 to-violet-200 not-italic">To'lovlar</span>
                        </h1>
                        <p className="text-indigo-100/70 font-medium text-lg max-w-xl">
                            {MONTHS[selectedMonth - 1]} {selectedYear} — o'quvchilar to'lov holatlari va tranzaksiyalar
                        </p>
                    </div>

                    {/* Collected widget */}
                    <div className="flex gap-4 shrink-0">
                        <div className="bg-white/10 backdrop-blur-xl border border-white/10 rounded-[2rem] px-8 py-6 min-w-[200px]">
                            <p className="text-[10px] font-black text-indigo-300 uppercase tracking-widest mb-1">Yig'ilgan (UZS)</p>
                            <p className="text-3xl font-black text-white tabular-nums">
                                {stats.totalReceived.toLocaleString()}
                            </p>
                            <div className="mt-3 h-1.5 bg-white/10 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-gradient-to-r from-indigo-400 to-violet-400 rounded-full transition-all duration-700"
                                    style={{ width: `${stats.percent}%` }}
                                />
                            </div>
                            <p className="text-[10px] text-indigo-300 font-bold mt-1">{stats.percent}% bajarildi</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Stats ── */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                    { label: "Jami O'quvchilar", value: students.length,     icon: Users,       color: 'from-blue-500 to-indigo-600',   bg: 'bg-blue-50',    text: 'text-blue-700'   },
                    { label: "To'lagan",          value: stats.paidCount,    icon: CheckCircle2, color: 'from-emerald-500 to-teal-600',  bg: 'bg-emerald-50', text: 'text-emerald-700' },
                    { label: "Muddati o'tgan",    value: stats.overdueCount, icon: AlertCircle, color: 'from-rose-500 to-pink-600',     bg: 'bg-rose-50',    text: 'text-rose-700'   },
                    { label: "Bloklangan",        value: stats.blockedCount, icon: ShieldAlert,  color: 'from-amber-500 to-orange-600',  bg: 'bg-amber-50',   text: 'text-amber-700'  },
                ].map((s, i) => (
                    <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.07 }}
                        className={`glass-card p-6 flex items-center gap-5 group hover:-translate-y-1 transition-all duration-300`}
                    >
                        <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${s.color} flex items-center justify-center shadow-lg shrink-0 group-hover:scale-110 transition-transform`}>
                            <s.icon size={24} className="text-white" />
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{s.label}</p>
                            <p className={`text-3xl font-black ${s.text} tracking-tight`}>{s.value}</p>
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* ── Controls ── */}
            <div className="glass-card p-3 flex flex-col md:flex-row items-center gap-3 sticky top-24 z-30 backdrop-blur-2xl">
                {/* Month */}
                <div className="relative">
                    <select
                        value={selectedMonth}
                        onChange={e => setSelectedMonth(Number(e.target.value))}
                        className="appearance-none pl-5 pr-10 py-3.5 bg-slate-50 border-none rounded-2xl text-sm font-black text-slate-700 focus:ring-2 focus:ring-indigo-500/20 cursor-pointer"
                    >
                        {MONTHS.map((m, i) => <option key={i + 1} value={i + 1}>{m}</option>)}
                    </select>
                    <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                </div>

                {/* Year */}
                <div className="relative">
                    <select
                        value={selectedYear}
                        onChange={e => setSelectedYear(Number(e.target.value))}
                        className="appearance-none pl-5 pr-10 py-3.5 bg-slate-50 border-none rounded-2xl text-sm font-black text-slate-700 focus:ring-2 focus:ring-indigo-500/20 cursor-pointer"
                    >
                        {years.map(y => <option key={y} value={y}>{y}</option>)}
                    </select>
                    <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                </div>

                {/* Search */}
                <div className="relative flex-1 w-full">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input
                        type="text"
                        placeholder="Ism yoki telefon raqami bo'yicha qidirish..."
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        className="w-full pl-12 pr-5 py-3.5 bg-slate-50 border-none rounded-2xl text-sm font-medium focus:ring-2 focus:ring-indigo-500/20 focus:bg-white transition-all"
                    />
                </div>

                {/* Actions */}
                <div className="flex gap-2 shrink-0">
                    <button
                        onClick={fetchData} disabled={loading}
                        className="p-3.5 bg-slate-100 text-slate-500 rounded-2xl hover:bg-indigo-600 hover:text-white transition-all disabled:opacity-50 active:scale-95"
                    >
                        <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
                    </button>
                    <button
                        onClick={handleExport}
                        className="flex items-center gap-2 px-5 py-3.5 bg-slate-900 text-white rounded-2xl hover:bg-indigo-700 transition-all font-black text-[10px] uppercase tracking-widest shadow-lg active:scale-95"
                    >
                        <Download size={16} />
                        CSV
                    </button>
                </div>
            </div>

            {/* ── Table ── */}
            {loading ? (
                <div className="py-20 flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest animate-pulse">Yuklanmoqda...</p>
                </div>
            ) : filteredStudents.length === 0 ? (
                <EmptyState icon={Users} title="O'quvchilar topilmadi" description={searchQuery ? `"${searchQuery}" bo'yicha hech kim topilmadi.` : "Hozircha ro'yxat bo'sh."} />
            ) : (
                <div className="space-y-3">
                    {/* Header row */}
                    <div className="grid grid-cols-12 gap-4 px-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        <div className="col-span-3">O'quvchi</div>
                        <div className="col-span-2">Guruh</div>
                        <div className="col-span-2">To'lov holati</div>
                        <div className="col-span-3">Jarayon</div>
                        <div className="col-span-2 text-right">Amallar</div>
                    </div>

                    <AnimatePresence mode="popLayout">
                        {filteredStudents.map((student, idx) => {
                            const pay       = payments[student.id];
                            const group     = student.enrollments?.[0]?.groups;
                            const expected  = Number(pay?.final_amount  || pay?.base_amount || group?.price || 0);
                            const paid      = Number(pay?.amount_paid   || 0);
                            const remaining = Number(pay?.remaining_amount ?? (expected - paid));
                            const pct       = expected > 0 ? Math.round((paid / expected) * 100) : 0;
                            const statusKey = pay?.status || 'pending';
                            const cfg       = STATUS_CONFIG[statusKey] || STATUS_CONFIG.pending;
                            const isBlocked = student.finance_status === 'blocked';

                            return (
                                <motion.div
                                    key={student.id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.98 }}
                                    transition={{ delay: idx * 0.03 }}
                                    className="grid grid-cols-12 gap-4 items-center bg-white border border-slate-100 rounded-[2rem] px-6 py-4 hover:shadow-xl hover:shadow-slate-200/50 hover:border-indigo-100 transition-all duration-300 group"
                                >
                                    {/* Student */}
                                    <div className="col-span-3 flex items-center gap-3">
                                        <div className={cn(
                                            "w-12 h-12 rounded-2xl flex items-center justify-center font-black text-white text-lg shadow-md shrink-0 group-hover:scale-110 transition-transform",
                                            isBlocked ? 'bg-gradient-to-br from-rose-500 to-pink-600' :
                                            statusKey === 'paid' ? 'bg-gradient-to-br from-emerald-500 to-teal-600' :
                                            'bg-gradient-to-br from-indigo-500 to-violet-600'
                                        )}>
                                            {(student.full_name || 'U').charAt(0).toUpperCase()}
                                        </div>
                                        <div className="min-w-0">
                                            <p className="font-black text-slate-800 text-sm truncate group-hover:text-indigo-700 transition-colors">
                                                {student.full_name}
                                            </p>
                                            <p className="text-[10px] text-slate-400 font-mono">{student.phone || '—'}</p>
                                            {isBlocked && (
                                                <span className="inline-flex items-center gap-1 text-[9px] font-black text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-100 mt-0.5">
                                                    <ShieldAlert size={9} /> BLOKLANGAN
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Group */}
                                    <div className="col-span-2">
                                        <span className="px-3 py-1.5 bg-slate-100 text-slate-600 rounded-xl text-[10px] font-black uppercase tracking-wider block truncate">
                                            {group?.name || 'Guruhsiz'}
                                        </span>
                                        {group?.price && (
                                            <p className="text-[10px] text-slate-400 font-mono mt-0.5 ml-1">
                                                {Number(group.price).toLocaleString()} so'm
                                            </p>
                                        )}
                                    </div>

                                    {/* Status badge */}
                                    <div className="col-span-2">
                                        <div className={cn(
                                            "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-2xl text-[10px] font-black uppercase tracking-widest border",
                                            cfg.bg, cfg.text, cfg.border
                                        )}>
                                            <div className={cn("w-1.5 h-1.5 rounded-full", cfg.dot)} />
                                            {cfg.label}
                                        </div>
                                        <p className="text-[10px] text-slate-400 font-mono mt-0.5 ml-1">
                                            {paid > 0 ? `${paid.toLocaleString()} so'm` : "Hali to'lanmagan"}
                                        </p>
                                    </div>

                                    {/* Progress */}
                                    <div className="col-span-3">
                                        <div className="flex items-center justify-between mb-1.5">
                                            <span className="text-[9px] font-black text-slate-400 uppercase">{pct}%</span>
                                            <span className="text-[9px] font-black text-slate-400">
                                                {remaining > 0 ? `${remaining.toLocaleString()} qoldiq` : 'Bajarildi ✓'}
                                            </span>
                                        </div>
                                        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                                            <motion.div
                                                initial={{ width: 0 }}
                                                animate={{ width: `${Math.min(pct, 100)}%` }}
                                                transition={{ duration: 0.6, delay: idx * 0.03 }}
                                                className={cn(
                                                    "h-full rounded-full",
                                                    pct >= 100 ? "bg-gradient-to-r from-emerald-500 to-teal-500" :
                                                    pct > 50   ? "bg-gradient-to-r from-blue-500 to-indigo-500" :
                                                    pct > 0    ? "bg-gradient-to-r from-amber-500 to-orange-500" :
                                                                 "bg-slate-200"
                                                )}
                                            />
                                        </div>
                                        <div className="flex items-center justify-between mt-1">
                                            <span className="text-[9px] font-bold text-slate-400 font-mono">{paid.toLocaleString()}</span>
                                            <span className="text-[9px] font-bold text-slate-400 font-mono">{expected.toLocaleString()}</span>
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    <div className="col-span-2 flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all translate-x-4 group-hover:translate-x-0 duration-300">
                                        <button
                                            onClick={() => handleOpenModal(student)}
                                            className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 shadow-lg shadow-indigo-500/25 transition-all text-[10px] font-black uppercase tracking-wider hover:scale-105 active:scale-95"
                                        >
                                            <PlusCircle size={15} />
                                            To'lov
                                        </button>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </AnimatePresence>

                    {/* Summary footer */}
                    <div className="mt-6 p-6 bg-gradient-to-r from-slate-900 to-indigo-950 rounded-[2rem] flex flex-col md:flex-row items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-indigo-500/20 rounded-xl flex items-center justify-center">
                                <DollarSign size={20} className="text-indigo-300" />
                            </div>
                            <div>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Jami Kutilayotgan</p>
                                <p className="text-xl font-black text-white tabular-nums">{stats.totalExpected.toLocaleString()} <span className="text-slate-400 text-sm font-bold">so'm</span></p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-emerald-500/20 rounded-xl flex items-center justify-center">
                                <ArrowUpRight size={20} className="text-emerald-300" />
                            </div>
                            <div>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Jami Yig'ilgan</p>
                                <p className="text-xl font-black text-emerald-400 tabular-nums">{stats.totalReceived.toLocaleString()} <span className="text-slate-400 text-sm font-bold">so'm</span></p>
                            </div>
                        </div>
                        <div className="flex flex-col items-center gap-2 min-w-[180px]">
                            <div className="flex items-center justify-between w-full">
                                <span className="text-[10px] font-black text-slate-400 uppercase">Bajarilish</span>
                                <span className="text-[10px] font-black text-indigo-300">{stats.percent}%</span>
                            </div>
                            <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-gradient-to-r from-indigo-400 to-violet-400 rounded-full transition-all duration-700"
                                    style={{ width: `${stats.percent}%` }}
                                />
                            </div>
                            <p className="text-[10px] text-slate-500 font-bold">
                                {(stats.totalExpected - stats.totalReceived).toLocaleString()} so'm qoldiq
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Transaction Modal ── */}
            <AnimatePresence>
                {isTxModalOpen && selectedStudent && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-slate-900/50 backdrop-blur-xl"
                            onClick={() => setIsTxModalOpen(false)}
                        />
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0, y: 30 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 30 }}
                            className="bg-white rounded-[3rem] w-full max-w-lg relative z-10 shadow-[0_40px_100px_rgba(0,0,0,0.3)] overflow-hidden"
                        >
                            {/* Modal header strip */}
                            <div className="bg-gradient-to-r from-indigo-600 to-violet-600 p-8 relative overflow-hidden">
                                <div className="absolute -top-8 -right-8 w-32 h-32 bg-white/5 rounded-full" />
                                <button
                                    onClick={() => setIsTxModalOpen(false)}
                                    className="absolute top-5 right-5 w-9 h-9 bg-white/10 hover:bg-white/20 rounded-xl flex items-center justify-center transition-colors"
                                >
                                    <X size={18} className="text-white" />
                                </button>
                                <div className="flex items-center gap-4 relative z-10">
                                    <div className="w-14 h-14 bg-white/15 rounded-2xl flex items-center justify-center text-white font-black text-2xl shadow-inner">
                                        {selectedStudent.full_name.charAt(0).toUpperCase()}
                                    </div>
                                    <div>
                                        <p className="font-black text-white text-xl tracking-tight">{selectedStudent.full_name}</p>
                                        <p className="text-indigo-200 text-sm font-medium">
                                            {selectedStudent.enrollments?.[0]?.groups?.name || 'Guruhsiz'} &bull; {MONTHS[selectedMonth - 1]} {selectedYear}
                                        </p>
                                    </div>
                                </div>

                                {/* Mini progress in modal header */}
                                {activePayment && (
                                    <div className="mt-4 relative z-10">
                                        <div className="flex justify-between text-[10px] font-black text-indigo-200 mb-1">
                                            <span>To'langan: {Number(activePayment.amount_paid).toLocaleString()} so'm</span>
                                            <span>Jami: {Number(activePayment.final_amount || activePayment.base_amount).toLocaleString()} so'm</span>
                                        </div>
                                        <div className="h-1.5 bg-white/20 rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-white/70 rounded-full"
                                                style={{
                                                    width: `${Math.min(100, Math.round(Number(activePayment.amount_paid) / Number(activePayment.final_amount || activePayment.base_amount || 1) * 100))}%`
                                                }}
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="p-8 space-y-6">
                                {/* Payment method */}
                                <div>
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-3">To'lov usuli</label>
                                    <div className="grid grid-cols-4 gap-2">
                                        {PAYMENT_METHODS.map(({ key, label, icon: Icon }) => (
                                            <button
                                                key={key} type="button"
                                                onClick={() => setTxMethod(key)}
                                                className={cn(
                                                    "flex flex-col items-center gap-2 py-4 rounded-2xl text-[10px] font-black uppercase tracking-wider border transition-all",
                                                    txMethod === key
                                                        ? "bg-indigo-600 text-white border-indigo-600 shadow-xl shadow-indigo-500/25"
                                                        : "bg-slate-50 border-slate-100 text-slate-500 hover:bg-white hover:border-indigo-200"
                                                )}
                                            >
                                                <Icon size={18} />
                                                {label}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Amount */}
                                <div>
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-3">Summa (so'm)</label>
                                    <div className="relative">
                                        <Wallet size={20} className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" />
                                        <input
                                            type="number" required min="1"
                                            placeholder="0"
                                            value={txAmount}
                                            onChange={e => setTxAmount(e.target.value)}
                                            className="w-full pl-14 pr-6 py-5 bg-slate-50 border-none rounded-2xl text-2xl font-black font-mono focus:ring-4 focus:ring-indigo-500/10 focus:bg-white transition-all outline-none"
                                        />
                                    </div>
                                    {/* Quick amounts */}
                                    {activePayment && (
                                        <div className="flex gap-2 mt-2">
                                            {[25, 50, 75, 100].map(p => {
                                                const base = Number(activePayment.final_amount || activePayment.base_amount || 0);
                                                const val  = Math.round(base * p / 100);
                                                return (
                                                    <button
                                                        key={p} type="button"
                                                        onClick={() => setTxAmount(String(val))}
                                                        className="flex-1 py-2 text-[10px] font-black bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 text-slate-500 rounded-xl transition-all uppercase tracking-wider"
                                                    >
                                                        {p}%
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>

                                {/* Note */}
                                <div>
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-3">Izoh (ixtiyoriy)</label>
                                    <input
                                        type="text"
                                        placeholder="To'lov haqida izoh..."
                                        value={txNote}
                                        onChange={e => setTxNote(e.target.value)}
                                        className="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl text-sm font-medium focus:ring-2 focus:ring-indigo-500/20 focus:bg-white transition-all outline-none"
                                    />
                                </div>

                                {/* Confirm */}
                                <div className="flex gap-3 pt-2">
                                    <button
                                        type="button"
                                        onClick={() => setIsTxModalOpen(false)}
                                        className="flex-1 py-4 bg-slate-100 text-slate-600 font-black rounded-2xl hover:bg-slate-200 transition-all uppercase tracking-widest text-[10px]"
                                    >
                                        Bekor
                                    </button>
                                    <button
                                        onClick={handleCreateTransaction}
                                        disabled={isSubmitting || !txAmount}
                                        className="flex-[2] py-4 bg-indigo-600 text-white font-black rounded-2xl hover:bg-indigo-700 shadow-2xl shadow-indigo-500/30 transition-all uppercase tracking-[0.15em] text-[10px] flex items-center justify-center gap-3 disabled:opacity-50 active:scale-95"
                                    >
                                        {isSubmitting
                                            ? <RefreshCw size={18} className="animate-spin" />
                                            : <CreditCard size={18} />
                                        }
                                        Tranzaksiyani Tasdiqlash
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default StudentPayments;
