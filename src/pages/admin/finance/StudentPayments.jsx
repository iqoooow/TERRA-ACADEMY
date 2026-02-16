import React, { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';
import { SMSService } from '../../../lib/sms';
import Table, { TableRow, TableCell } from '../../../components/ui/Table';
import StatsCard from '../../../components/ui/StatsCard';
import {
    Search, DollarSign, Calendar, MessageSquare, CheckCircle,
    AlertCircle, Clock, Users, Filter, X, FileText, PlusCircle, CreditCard, ChevronRight
} from 'lucide-react';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';

const StudentPayments = () => {
    const [loading, setLoading] = useState(true);
    const [students, setStudents] = useState([]);
    const [payments, setPayments] = useState({}); // Map: studentId -> paymentRecord

    // Filters
    const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7)); // YYYY-MM
    const [selectedGroup, setSelectedGroup] = useState('all');
    const [filterStatus, setFilterStatus] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [groups, setGroups] = useState([]);

    // Modals
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
    const [selectedStudentCtx, setSelectedStudentCtx] = useState(null); // { student, payment }
    const [paymentAmount, setPaymentAmount] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // History Drawer
    const [isHistoryOpen, setIsHistoryOpen] = useState(false);
    const [historyStudent, setHistoryStudent] = useState(null);
    const [historyData, setHistoryData] = useState([]);
    const [historyLoading, setHistoryLoading] = useState(false);

    // Stats
    const [stats, setStats] = useState({
        total: 0,
        paid: 0,
        overdue: 0,
        pending: 0,
        expectedIncome: 0,
        collectedIncome: 0
    });

    useEffect(() => {
        fetchGroups();
    }, []);

    useEffect(() => {
        fetchData();
    }, [selectedMonth, selectedGroup]);

    const fetchGroups = async () => {
        const { data } = await supabase.from('groups').select('id, name');
        if (data) setGroups(data);
    };

    const fetchData = async () => {
        setLoading(true);
        try {
            // 1. Fetch Students (Profiles)
            let query = supabase
                .from('profiles')
                .select(`*, enrollments(groups(id, name))`)
                .eq('role', 'student')
                .order('full_name');

            const { data: studentsData, error: studentsError } = await query;
            if (studentsError) throw studentsError;

            // 2. Fetch Payments for Selected Month
            const startStr = `${selectedMonth}-01`;
            const { data: paymentsData, error: paymentsError } = await supabase
                .from('monthly_payments')
                .select('*')
                .eq('payment_month', startStr);

            if (paymentsError) throw paymentsError;

            // 3. Process & Merge
            const paymentMap = {};
            let statsCount = { total: 0, paid: 0, overdue: 0, pending: 0, expected: 0, collected: 0 };

            const getGroup = (s) => s.enrollments?.[0]?.groups;

            const merged = studentsData.filter(s => {
                const group = getGroup(s);
                if (selectedGroup !== 'all' && String(group?.id) !== String(selectedGroup)) return false;
                return true;
            }).map(student => {
                const payment = paymentsData.find(p => p.student_id === student.id);
                paymentMap[student.id] = payment;

                statsCount.total++;
                if (payment) {
                    if (payment.status === 'paid') {
                        statsCount.paid++;
                        statsCount.collected += Number(payment.paid_amount || 0);
                    } else if (payment.status === 'overdue') {
                        statsCount.overdue++;
                    } else {
                        statsCount.pending++;
                    }
                    statsCount.expected += Number(payment.final_amount || payment.amount || 0);
                } else {
                    statsCount.pending++;
                    statsCount.expected += Number(student.monthly_fee || 0);
                }

                return student;
            });

            setStudents(merged);
            setPayments(paymentMap);
            setStats({
                total: statsCount.total,
                paid: statsCount.paid,
                overdue: statsCount.overdue,
                pending: statsCount.pending,
                expectedIncome: statsCount.expected,
                collectedIncome: statsCount.collected
            });

        } catch (error) {
            console.error('Error fetching data:', error);
            toast.error('Ma\'lumotlarni yuklashda xatolik');
        } finally {
            setLoading(false);
        }
    };

    const handleOpenHistory = async (student) => {
        setHistoryStudent(student);
        setIsHistoryOpen(true);
        setHistoryLoading(true);
        try {
            const { data, error } = await supabase
                .from('monthly_payments')
                .select('*')
                .eq('student_id', student.id)
                .order('payment_month', { ascending: false });

            if (error) throw error;
            setHistoryData(data || []);
        } catch (error) {
            toast.error("Tarixni yuklashda xatolik");
        } finally {
            setHistoryLoading(false);
        }
    };

    const handleCreatePayment = async (student) => {
        if (!confirm(`${student.full_name} uchun ${selectedMonth} oyiga to'lov qog'ozi yaratilsinmi?`)) return;

        const toastId = toast.loading('Yaratilmoqda...');
        try {
            const { error } = await supabase
                .from('monthly_payments')
                .insert({
                    student_id: student.id,
                    payment_month: `${selectedMonth}-01`,
                    amount: student.monthly_fee || 0,
                    due_date: `${selectedMonth}-10`,
                    status: 'pending'
                });

            if (error) throw error;
            toast.success('Yaratildi!', { id: toastId });
            fetchData();
        } catch (error) {
            toast.error('Xatolik: ' + error.message, { id: toastId });
        }
    };

    const handleOpenPayModal = (student) => {
        const payment = payments[student.id];
        const amount = payment ? (payment.final_amount - (payment.paid_amount || 0)) : (student.monthly_fee || 0);

        setSelectedStudentCtx({ student, payment });
        setPaymentAmount(amount);
        setIsPaymentModalOpen(true);
    };

    const handlePaySubmit = async (e) => {
        e.preventDefault();
        if (!selectedStudentCtx) return;

        setIsSubmitting(true);
        const { student, payment } = selectedStudentCtx;
        const monthDate = `${selectedMonth}-01`;

        try {
            const amountVal = Number(paymentAmount);
            if (payment) {
                const { error } = await supabase
                    .from('monthly_payments')
                    .update({
                        status: 'paid',
                        paid_amount: amountVal,
                        paid_date: new Date().toISOString(),
                        updated_at: new Date().toISOString()
                    })
                    .eq('id', payment.id);
                if (error) throw error;
            } else {
                const { error } = await supabase
                    .from('monthly_payments')
                    .insert({
                        student_id: student.id,
                        payment_month: monthDate,
                        amount: amountVal,
                        paid_amount: amountVal,
                        status: 'paid',
                        due_date: `${selectedMonth}-10`,
                        paid_date: new Date().toISOString()
                    });
                if (error) throw error;
            }

            await SMSService.sendSMS(
                student.id,
                `Hurmatli ota-ona, ${student.full_name} uchun ${amountVal.toLocaleString()} so'm to'lov qabul qilindi. Rahmat!`,
                'paid'
            );

            toast.success("To'lov qabul qilindi!");
            setIsPaymentModalOpen(false);
            fetchData();

        } catch (error) {
            console.error(error);
            toast.error('Xatolik: ' + error.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleSendReminder = async (student) => {
        const payment = payments[student.id];
        if (!payment || payment.status === 'paid') return;

        if (!confirm(`${student.full_name} ga SMS eslatma yuborilsinmi?`)) return;

        const toastId = toast.loading('Yuborilmoqda...');
        const res = await SMSService.sendSMS(
            student.id,
            `Eslatma: ${student.full_name} uchun to'lov muddati yaqinlashmoqda. Summa: ${Number(payment.final_amount).toLocaleString()} so'm`,
            'reminder'
        );

        if (res.success) toast.success('Yuborildi!', { id: toastId });
        else toast.error('Xatolik', { id: toastId });
    };

    const getStatusBadge = (status) => {
        switch (status) {
            case 'paid': return <span className="glass-badge bg-emerald-100 text-emerald-700 border-emerald-200"><CheckCircle size={10} strokeWidth={3} /> TO'LANGAN</span>;
            case 'pending': return <span className="glass-badge bg-amber-100 text-amber-700 border-amber-200"><Clock size={10} strokeWidth={3} /> KUTILMOQDA</span>;
            case 'overdue': return <span className="glass-badge bg-rose-100 text-rose-700 border-rose-200"><AlertCircle size={10} strokeWidth={3} /> QARZDOR</span>;
            default: return <span className="glass-badge bg-slate-100 text-slate-500 border-slate-200">MAVJUD EMAS</span>;
        }
    };

    const filteredList = students.filter(s => {
        const p = payments[s.id];
        const status = p ? p.status : 'none';
        const searchMatch = s.full_name?.toLowerCase().includes(searchQuery.toLowerCase());
        let statusMatch = true;
        if (filterStatus !== 'all') {
            if (filterStatus === 'paid') statusMatch = status === 'paid';
            else if (filterStatus === 'pending') statusMatch = status === 'pending' || status === 'none';
            else if (filterStatus === 'overdue') statusMatch = status === 'overdue';
        }
        return searchMatch && statusMatch;
    });

    return (
        <div className="space-y-8 animate-fade-in pb-10">
            {/* Header Area */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight">Oylik To'lovlar</h1>
                    <p className="text-slate-500 font-medium mt-1">To'lov holati va qarzdorlikni nazorat qilish</p>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 glass-card p-2 items-center">
                    <div className="text-right px-4 py-1">
                        <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Kutilayotgan</p>
                        <p className="font-black text-slate-700 text-xl">{Number(stats.expectedIncome).toLocaleString()} <span className="text-xs text-slate-400">so'm</span></p>
                    </div>
                    <div className="w-px h-10 bg-slate-200 hidden sm:block"></div>
                    <div className="text-right px-4 py-1">
                        <p className="text-[10px] uppercase font-bold text-emerald-500 tracking-wider flex items-center gap-1 justify-end">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                            Tushum
                        </p>
                        <p className="font-black text-emerald-600 text-xl">{Number(stats.collectedIncome).toLocaleString()} <span className="text-xs text-emerald-400/70">so'm</span></p>
                    </div>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatsCard title="Jami O'quvchilar" value={stats.total} icon={Users} color="blue" trend="+2%" trendLabel="bu oy" />
                <StatsCard title="To'laganlar" value={stats.paid} icon={CheckCircle} color="green" trend={`${Math.round((stats.paid / stats.total || 0) * 100)}%`} trendLabel="foiz" />
                <StatsCard title="Qarzdorlar" value={stats.overdue} icon={AlertCircle} color="red" trend={`${stats.overdue} ta`} trendLabel="kiritilmagan" />
                <StatsCard title="Kutilmoqda" value={stats.pending} icon={Clock} color="yellow" trend="Jarayonda" />
            </div>

            {/* Filters Bar */}
            <div className="glass-card p-2 flex flex-col md:flex-row items-center gap-3 sticky top-24 z-30">
                {/* Month Picker */}
                <div className="relative group">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-hover:text-emerald-500 transition-colors" size={16} />
                    <input
                        type="month"
                        value={selectedMonth}
                        onChange={e => setSelectedMonth(e.target.value)}
                        className="pl-10 pr-4 py-2.5 bg-slate-50 hover:bg-white border-none rounded-xl text-sm font-bold text-slate-700 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all cursor-pointer"
                    />
                </div>

                {/* Group Select */}
                <div className="relative group">
                    <Users className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-hover:text-emerald-500 transition-colors" size={16} />
                    <select
                        value={selectedGroup}
                        onChange={e => setSelectedGroup(e.target.value)}
                        className="pl-10 pr-8 py-2.5 bg-slate-50 hover:bg-white border-none rounded-xl text-sm font-bold text-slate-700 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all appearance-none cursor-pointer min-w-[160px]"
                    >
                        <option value="all">Barcha Guruhlar</option>
                        {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                    </select>
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                        <div className="w-0 h-0 border-l-[4px] border-l-transparent border-r-[4px] border-r-transparent border-t-[4px] border-t-slate-400"></div>
                    </div>
                </div>

                {/* Status Tabs */}
                <div className="flex bg-slate-100 p-1 rounded-xl overflow-x-auto max-w-full no-scrollbar">
                    {['all', 'paid', 'pending', 'overdue'].map(f => (
                        <button
                            key={f}
                            onClick={() => setFilterStatus(f)}
                            className={`px-4 py-2 rounded-lg text-xs font-black uppercase tracking-wider transition-all whitespace-nowrap ${filterStatus === f
                                    ? 'bg-white text-emerald-600 shadow-sm transform scale-105'
                                    : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'
                                }`}
                        >
                            {f === 'all' ? 'Barchasi' : f === 'paid' ? "To'lagan" : f === 'pending' ? 'Kutilmoqda' : 'Qarzdor'}
                        </button>
                    ))}
                </div>

                {/* Search */}
                <div className="relative flex-1 w-full md:w-auto">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <input
                        type="text"
                        placeholder="O'quvchini izlash..."
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:bg-white transition-all text-sm font-medium placeholder:text-slate-400"
                    />
                </div>
            </div>

            {/* Table */}
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
            >
                <Table headers={['O\'quvchi', 'Guruh', 'Hisoblangan', 'To\'langan', 'Holat', 'Amallar']}>
                    {loading ? (
                        <TableRow><TableCell colSpan={6} className="text-center py-20 text-slate-400 font-medium">Yuklanmoqda...</TableCell></TableRow>
                    ) : filteredList.length === 0 ? (
                        <TableRow><TableCell colSpan={6} className="text-center py-20 text-slate-400 font-medium">Ma'lumot topilmadi</TableCell></TableRow>
                    ) : (
                        filteredList.map(student => {
                            const payment = payments[student.id];
                            const groupName = student.enrollments?.[0]?.groups?.name || 'Guruhsiz';
                            const fee = student.monthly_fee || 0;
                            const amount = payment ? payment.final_amount : fee;
                            const paid = payment ? payment.paid_amount : 0;
                            const status = payment ? payment.status : 'none';

                            return (
                                <TableRow key={student.id} className="group hover:bg-emerald-50/10">
                                    <TableCell>
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-xs font-black text-slate-500 border border-slate-200">
                                                {student.full_name?.charAt(0)}
                                            </div>
                                            <div>
                                                <div className="font-bold text-slate-900">{student.full_name}</div>
                                                <div className="text-[10px] font-bold text-slate-400 tracking-wide font-mono">{student.phone}</div>
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-slate-100 text-slate-600 text-[10px] font-black uppercase tracking-wider border border-slate-200">
                                            {groupName}
                                        </span>
                                    </TableCell>
                                    <TableCell>
                                        <div className="font-mono text-xs font-bold text-slate-600">
                                            {Number(amount).toLocaleString()} <span className="text-[10px] text-slate-400">UZS</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className={`font-mono text-xs font-bold ${paid > 0 ? "text-emerald-600" : "text-slate-300"}`}>
                                            {Number(paid).toLocaleString()} <span className="text-[10px] text-slate-400">UZS</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>{getStatusBadge(status)}</TableCell>
                                    <TableCell>
                                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity translate-x-2 group-hover:translate-x-0 duration-200">
                                            <button
                                                onClick={() => handleOpenHistory(student)}
                                                className="p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 rounded-lg transition-all hover:scale-110"
                                                title="Tarix"
                                            >
                                                <FileText size={16} />
                                            </button>

                                            {status !== 'paid' && (
                                                <>
                                                    {status === 'none' ? (
                                                        <button
                                                            onClick={() => handleCreatePayment(student)}
                                                            className="p-2 text-blue-500 hover:bg-blue-50 hover:text-blue-700 rounded-lg transition-all hover:scale-110"
                                                            title="Yaratish"
                                                        >
                                                            <PlusCircle size={16} />
                                                        </button>
                                                    ) : (
                                                        <button
                                                            onClick={() => handleOpenPayModal(student)}
                                                            className="p-2 text-emerald-500 hover:bg-emerald-50 hover:text-emerald-700 rounded-lg transition-all hover:scale-110"
                                                            title="To'lash"
                                                        >
                                                            <CreditCard size={16} />
                                                        </button>
                                                    )}
                                                    {status !== 'none' && (
                                                        <button
                                                            onClick={() => handleSendReminder(student)}
                                                            className="p-2 text-amber-500 hover:bg-amber-50 hover:text-amber-700 rounded-lg transition-all hover:scale-110"
                                                            title="SMS Eslatma"
                                                        >
                                                            <MessageSquare size={16} />
                                                        </button>
                                                    )}
                                                </>
                                            )}
                                        </div>
                                    </TableCell>
                                </TableRow>
                            );
                        })
                    )}
                </Table>
            </motion.div>

            {/* Premium Payment Modal */}
            <AnimatePresence>
                {isPaymentModalOpen && (
                    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-slate-900/40 backdrop-blur-md"
                            onClick={() => setIsPaymentModalOpen(false)}
                        />
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            className="bg-white rounded-3xl p-8 w-full max-w-md relative z-10 shadow-2xl shadow-emerald-900/20 border border-white/20"
                        >
                            <button onClick={() => setIsPaymentModalOpen(false)} className="absolute top-6 right-6 p-2 bg-slate-50 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600 transition-colors">
                                <X size={20} />
                            </button>

                            <div className="mb-6">
                                <div className="w-16 h-16 bg-emerald-100 rounded-2xl flex items-center justify-center text-emerald-600 mb-4 shadow-inner">
                                    <DollarSign size={32} />
                                </div>
                                <h2 className="text-2xl font-black text-slate-900 tracking-tight">To'lov Qabul Qilish</h2>
                                <p className="text-slate-500 font-medium">To'lov ma'lumotlarini kiriting</p>
                            </div>

                            <form onSubmit={handlePaySubmit} className="space-y-6">
                                <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">O'quvchi</p>
                                    <p className="font-bold text-slate-800 text-lg">{selectedStudentCtx?.student?.full_name}</p>
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1 mb-2 block">Summa (so'm)</label>
                                    <div className="relative">
                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">UZS</span>
                                        <input
                                            type="number"
                                            required
                                            className="w-full pl-14 pr-4 py-4 bg-slate-50 border-none rounded-2xl text-xl font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500/20 focus:bg-white transition-all outline-none"
                                            value={paymentAmount}
                                            onChange={e => setPaymentAmount(e.target.value)}
                                        />
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="w-full py-4 bg-emerald-500 text-white font-bold rounded-xl hover:bg-emerald-600 shadow-lg shadow-emerald-500/30 transition-all uppercase tracking-widest text-xs flex items-center justify-center gap-2"
                                >
                                    {isSubmitting ? <Clock size={18} className="animate-spin" /> : 'To\'lovni Tasdiqlash'}
                                </button>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Premium History Drawer */}
            <AnimatePresence>
                {isHistoryOpen && (
                    <div className="fixed inset-0 z-[70] flex justify-end">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-slate-900/30 backdrop-blur-sm"
                            onClick={() => setIsHistoryOpen(false)}
                        />
                        <motion.div
                            initial={{ x: '100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '100%' }}
                            transition={{ type: "spring", stiffness: 300, damping: 30 }}
                            className="relative w-full max-w-md bg-white h-full shadow-2xl p-0 overflow-y-auto"
                        >
                            <div className="sticky top-0 bg-white/80 backdrop-blur-md p-6 border-b border-slate-100 z-10 flex items-center justify-between">
                                <div>
                                    <h2 className="text-xl font-black text-slate-900">To'lovlar Tarixi</h2>
                                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mt-1">{historyStudent?.full_name}</p>
                                </div>
                                <button onClick={() => setIsHistoryOpen(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400"><X size={24} /></button>
                            </div>

                            <div className="p-6 space-y-4">
                                {historyLoading ? (
                                    <div className="flex justify-center py-10">
                                        <div className="w-8 h-8 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin"></div>
                                    </div>
                                ) : historyData.length === 0 ? (
                                    <div className="text-center py-16 bg-slate-50 rounded-3xl dashed-border">
                                        <p className="text-slate-400 font-medium">To'lovlar tarixi mavjud emas</p>
                                    </div>
                                ) : (
                                    historyData.map((payment, i) => (
                                        <motion.div
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: i * 0.05 }}
                                            key={payment.id}
                                            className="p-4 rounded-2xl bg-white border border-slate-100 shadow-sm flex justify-between items-center group hover:border-emerald-200 hover:shadow-md transition-all"
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${payment.status === 'paid' ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'}`}>
                                                    {payment.status === 'paid' ? <CheckCircle size={24} /> : <AlertCircle size={24} />}
                                                </div>
                                                <div>
                                                    <p className="font-black text-slate-900 text-lg">{Number(payment.final_amount).toLocaleString()}</p>
                                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">{payment.payment_month}</p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-xs font-medium text-slate-500 mb-1">{payment.paid_date ? new Date(payment.paid_date).toLocaleDateString() : '-'}</p>
                                                {getStatusBadge(payment.status)}
                                            </div>
                                        </motion.div>
                                    ))
                                )}
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default StudentPayments;
