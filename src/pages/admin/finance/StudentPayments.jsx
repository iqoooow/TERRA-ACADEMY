import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../../../lib/supabase';
import { SMSService } from '../../../lib/sms';
import Table, { TableRow, TableCell } from '../../../components/ui/Table';
import StatsCard from '../../../components/ui/StatsCard';
import {
    Search, DollarSign, Calendar, MessageSquare, CheckCircle,
    AlertCircle, Clock, Users, Filter, X, FileText, PlusCircle, CreditCard,
    ChevronRight, RefreshCw, PieChart, ShieldAlert, History, TrendingUp, ArrowUpRight
} from 'lucide-react';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import EmptyState from '../../../components/ui/EmptyState';
import { cn } from '../../../utils/cn';

const StudentPayments = () => {
    const [loading, setLoading] = useState(true);
    const [students, setStudents] = useState([]);
    const [payments, setPayments] = useState({});
    const [groups, setGroups] = useState([]);

    // Filters
    const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
    const [searchQuery, setSearchQuery] = useState('');

    // Modal States
    const [isTxModalOpen, setIsTxModalOpen] = useState(false);
    const [activePayment, setActivePayment] = useState(null);
    const [selectedStudent, setSelectedStudent] = useState(null);
    const [txAmount, setTxAmount] = useState('');
    const [txMethod, setTxMethod] = useState('cash');
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        fetchData();
    }, [selectedMonth, selectedYear]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const { data: studentsData } = await supabase
                .from('profiles')
                .select(`id, full_name, phone, finance_status, enrollments(groups(id, name, price))`)
                .eq('role', 'student');

            const { data: paymentsData } = await supabase
                .from('monthly_payments')
                .select('*')
                .eq('payment_month', selectedMonth)
                .eq('payment_year', selectedYear);

            const pMap = {};
            paymentsData?.forEach(p => pMap[p.student_id] = p);

            setStudents(studentsData || []);
            setPayments(pMap);
        } catch (err) {
            toast.error("Ma'lumot xatosi");
        } finally {
            setLoading(false);
        }
    };

    const handleCreateTransaction = async (e) => {
        e.preventDefault();
        if (!txAmount || Number(txAmount) <= 0) return;
        setIsSubmitting(true);

        try {
            const { data: { user: currentUser } } = await supabase.auth.getUser();
            if (!currentUser) throw new Error("Avtorizatsiya muddati tugagan. Iltimos qaytadan kiring.");

            let paymentId = activePayment?.id;

            // Agar to'lov yozuvi bo'lmasa, yangi yaratish (Mid-month joiner)
            if (!paymentId) {
                const group = selectedStudent.enrollments?.[0]?.groups;
                const { data: newPay, error: pErr } = await supabase
                    .from('monthly_payments')
                    .insert({
                        student_id: selectedStudent.id,
                        group_id: group?.id || null,
                        payment_month: Number(selectedMonth),
                        payment_year: Number(selectedYear),
                        base_amount: Number(group?.price || 0),
                        amount_paid: 0,
                        due_date: new Date(selectedYear, selectedMonth - 1, 10).toISOString()
                    }).select().single();

                if (pErr) throw pErr;
                paymentId = newPay.id;
            }

            const { error: txErr } = await supabase
                .from('payment_transactions')
                .insert({
                    payment_id: paymentId,
                    amount: Number(txAmount),
                    method: String(txMethod),
                    performed_by: currentUser.id
                });

            if (txErr) throw txErr;

            toast.success("To'lov muvaffaqiyatli saqlandi");
            setIsTxModalOpen(false);
            setTxAmount('');
            fetchData();
        } catch (err) {
            toast.error(err.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    const stats = useMemo(() => {
        const vals = Object.values(payments);
        return {
            totalExpected: vals.reduce((acc, p) => acc + Number(p.final_amount), 0),
            totalReceived: vals.reduce((acc, p) => acc + Number(p.amount_paid), 0),
            blockedCount: students.filter(s => s.finance_status === 'blocked').length,
            overdueCount: vals.filter(p => p.status === 'overdue').length
        };
    }, [payments, students]);

    return (
        <div className="space-y-8 max-w-[1600px] mx-auto pb-10">
            {/* Fintech Design Header */}
            <div className="relative overflow-hidden rounded-[3rem] bg-slate-950 p-12 shadow-2xl border border-white/5">
                <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-indigo-500/10 to-transparent"></div>
                <div className="relative z-10 flex flex-col lg:flex-row justify-between items-end gap-8">
                    <div className="space-y-4">
                        <div className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-500/10 rounded-full border border-indigo-500/20">
                            <TrendingUp size={14} className="text-indigo-400" />
                            <span className="text-[10px] font-black text-indigo-300 uppercase tracking-widest">Financial OS v2.0</span>
                        </div>
                        <h1 className="text-6xl font-black text-white italic tracking-tighter">
                            Billing <span className="text-indigo-500 not-italic">&</span> Central
                        </h1>
                        <p className="text-slate-400 font-medium text-xl max-w-xl">
                            Avtomatlashtirilgan oylik to'lovlar tizimi va o'quvchilar xavfsizlik nazorati.
                        </p>
                    </div>

                    <div className="flex gap-4">
                        <div className="bg-white/5 backdrop-blur-md p-8 rounded-[2rem] border border-white/10 min-w-[240px]">
                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Umumiy Tushum (UZS)</p>
                            <p className="text-4xl font-black text-white tabular-nums tracking-tighter">
                                {Number(stats.totalReceived).toLocaleString()}
                            </p>
                            <div className="mt-4 flex items-center gap-2 text-emerald-400 text-[10px] font-black uppercase">
                                <ArrowUpRight size={14} />
                                Collected this month
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Matrix Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <StatsCard title="Bloklanganlar" value={stats.blockedCount} icon={ShieldAlert} color="rose" trend="Immediate Action" />
                <StatsCard title="Debtor Students" value={stats.overdueCount} icon={AlertCircle} color="amber" trend="Critical" />
                <StatsCard title="Monthly Goal" value={Math.round((stats.totalReceived / stats.totalExpected) * 100 || 0) + '%'} icon={PieChart} color="indigo" trend="Progress" />
                <StatsCard title="Expected" value={(stats.totalExpected / 1e6).toFixed(1) + 'M'} icon={DollarSign} color="emerald" trend="Forecast" />
            </div>

            {/* Quick Filters */}
            <div className="glass-card p-4 flex flex-col md:flex-row gap-4 sticky top-24 z-30 border-white/10 backdrop-blur-2xl">
                <div className="flex bg-slate-100 p-1.5 rounded-2xl">
                    <select value={selectedMonth} onChange={e => setSelectedMonth(Number(e.target.value))} className="bg-white border-none text-xs font-black uppercase px-6 py-2.5 rounded-xl cursor-pointer">
                        {Array.from({ length: 12 }, (_, i) => <option key={i + 1} value={i + 1}>{new Date(0, i).toLocaleString('uz', { month: 'long' })}</option>)}
                    </select>
                </div>
                <div className="flex-1 relative">
                    <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input
                        type="text"
                        placeholder="ID yoki Ism bo'yicha qidirish..."
                        className="w-full pl-14 pr-6 py-4 bg-slate-50 border-none rounded-2xl font-bold text-sm focus:ring-2 focus:ring-indigo-500/20"
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                    />
                </div>
                <button onClick={fetchData} className="p-4 bg-indigo-600 text-white rounded-2xl hover:bg-indigo-700 shadow-xl shadow-indigo-500/20 transition-all">
                    <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
                </button>
            </div>

            {/* Payment Table */}
            <div className="glass-card p-0 overflow-hidden border-white/5 shadow-2xl">
                <Table headers={['O\'quvchi', 'Guruh', 'Hisob', 'To\'landi', 'Qoldiq', 'Holat', 'Amallar']}>
                    {students.filter(s => s.full_name.toLowerCase().includes(searchQuery.toLowerCase())).map(student => {
                        const pay = payments[student.id];
                        const group = student.enrollments?.[0]?.groups;
                        return (
                            <TableRow key={student.id} className="group hover:bg-slate-50/50 transition-colors">
                                <TableCell>
                                    <div className="flex items-center gap-4">
                                        <div className={cn(
                                            "w-12 h-12 rounded-2xl flex items-center justify-center font-black text-white shadow-lg",
                                            student.finance_status === 'blocked' ? "bg-rose-500" : "bg-indigo-500"
                                        )}>
                                            {student.full_name[0]}
                                        </div>
                                        <div>
                                            <div className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">{student.full_name}</div>
                                            <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{student.phone}</div>
                                        </div>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <span className="px-3 py-1 bg-slate-100 rounded-lg text-[9px] font-black text-slate-500 uppercase">
                                        {group?.name || 'Guruhsiz'}
                                    </span>
                                </TableCell>
                                <TableCell><div className="font-mono font-bold text-slate-600">{Number(pay?.final_amount || group?.price || 0).toLocaleString()}</div></TableCell>
                                <TableCell><div className="font-mono font-bold text-emerald-600">{Number(pay?.amount_paid || 0).toLocaleString()}</div></TableCell>
                                <TableCell><div className="font-mono font-bold text-rose-500">{Number(pay?.remaining_amount ?? (group?.price || 0)).toLocaleString()}</div></TableCell>
                                <TableCell>
                                    <div className={cn(
                                        "px-4 py-1.5 rounded-full text-[9px] font-black uppercase text-center border",
                                        pay?.status === 'paid' ? "bg-emerald-100 text-emerald-700 border-emerald-200" :
                                            pay?.status === 'partially_paid' ? "bg-blue-100 text-blue-700 border-blue-200" :
                                                "bg-amber-100 text-amber-700 border-amber-200"
                                    )}>
                                        {pay?.status || 'pending'}
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-all translate-x-4 group-hover:translate-x-0">
                                        <button
                                            onClick={() => { setSelectedStudent(student); setActivePayment(pay); setIsTxModalOpen(true); }}
                                            className="p-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 shadow-lg shadow-indigo-500/20"
                                        >
                                            <PlusCircle size={18} />
                                        </button>
                                        <button className="p-3 bg-slate-100 text-slate-500 rounded-xl hover:bg-slate-200">
                                            <History size={18} />
                                        </button>
                                    </div>
                                </TableCell>
                            </TableRow>
                        );
                    })}
                </Table>
            </div>

            {/* Transaction Modal */}
            <AnimatePresence>
                {isTxModalOpen && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-slate-900/40 backdrop-blur-xl" onClick={() => setIsTxModalOpen(false)} />
                        <motion.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} className="bg-white rounded-[4rem] p-12 w-full max-w-xl relative z-10 shadow-2xl border border-white/20">
                            <h2 className="text-4xl font-black text-slate-900 tracking-tighter mb-10">To'lovni <span className="text-indigo-600 italic">Qabul Qilish</span></h2>

                            <form onSubmit={handleCreateTransaction} className="space-y-8">
                                <div className="grid grid-cols-2 gap-4">
                                    {['cash', 'card', 'transfer', 'online'].map(m => (
                                        <button
                                            key={m} type="button" onClick={() => setTxMethod(m)}
                                            className={cn("py-4 rounded-3xl text-[10px] font-black uppercase border transition-all",
                                                txMethod === m ? "bg-indigo-600 text-white border-indigo-600 shadow-xl" : "bg-slate-50 border-slate-100 text-slate-400 hover:bg-white")}
                                        >
                                            {m}
                                        </button>
                                    ))}
                                </div>

                                <div>
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-3 ml-2">Summa (UZS)</label>
                                    <input
                                        type="number" required placeholder="0.00"
                                        className="w-full px-8 py-6 bg-slate-50 border-none rounded-[2rem] text-3xl font-black focus:ring-4 focus:ring-indigo-500/10 transition-all font-mono"
                                        value={txAmount}
                                        onChange={e => setTxAmount(e.target.value)}
                                    />
                                </div>

                                <button
                                    disabled={isSubmitting}
                                    className="w-full py-6 bg-indigo-600 text-white font-black rounded-[2rem] shadow-2xl shadow-indigo-500/30 uppercase tracking-[0.3em] text-xs flex items-center justify-center gap-4 active:scale-95 transition-all"
                                >
                                    {isSubmitting ? <RefreshCw className="animate-spin" /> : <CreditCard size={20} />}
                                    Tranzaksiyani Yakunlash
                                </button>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default StudentPayments;
