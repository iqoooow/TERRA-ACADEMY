import React, { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';
import { SMSService } from '../../../lib/sms';
import Table, { TableRow, TableCell } from '../../../components/ui/Table';
import StatsCard from '../../../components/ui/StatsCard';
import {
    Search, DollarSign, Calendar, MessageSquare, Settings, CheckCircle,
    AlertCircle, Clock, Download, Users, Filter, X, FileText, PlusCircle
} from 'lucide-react';
import toast from 'react-hot-toast';
import { format, parseISO, startOfMonth, endOfMonth, isPast, isSameMonth } from 'date-fns';
import { uz } from 'date-fns/locale';

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

            // Helper to get group ID/Name safely
            const getGroup = (s) => s.enrollments?.[0]?.groups;

            const merged = studentsData.filter(s => {
                const group = getGroup(s);
                if (selectedGroup !== 'all' && String(group?.id) !== String(selectedGroup)) return false;
                return true;
            }).map(student => {
                const payment = paymentsData.find(p => p.student_id === student.id);
                paymentMap[student.id] = payment;

                // Stats calculation
                statsCount.total++;
                if (payment) {
                    if (payment.status === 'paid') {
                        statsCount.paid++;
                        statsCount.collected += Number(payment.paid_amount || 0); // Strict Number casting
                    } else if (payment.status === 'overdue') {
                        statsCount.overdue++;
                    } else {
                        statsCount.pending++;
                    }
                    statsCount.expected += Number(payment.final_amount || payment.amount || 0);
                } else {
                    // No payment record? Technically pending if active
                    statsCount.pending++;
                    // Assume monthly fee is expected
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

    // --- History Logic ---
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

    // --- Actions ---

    const handleCreatePayment = async (student) => {
        // Manually create a payment record for this month (e.g. for new students)
        if (!confirm(`${student.full_name} uchun ${selectedMonth} oyiga to'lov qog'ozi yaratilsinmi?`)) return;

        const toastId = toast.loading('Yaratilmoqda...');
        try {
            const { error } = await supabase
                .from('monthly_payments')
                .insert({
                    student_id: student.id,
                    payment_month: `${selectedMonth}-01`,
                    amount: student.monthly_fee || 0,
                    due_date: `${selectedMonth}-10`, // Default 10th
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
                // UPDATE existing payment
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
                // INSERT new paid payment (if it didn't exist)
                const { error } = await supabase
                    .from('monthly_payments')
                    .insert({
                        student_id: student.id,
                        payment_month: monthDate,
                        amount: amountVal, // Assuming full payment
                        paid_amount: amountVal,
                        status: 'paid',
                        due_date: `${selectedMonth}-10`,
                        paid_date: new Date().toISOString()
                    });
                if (error) throw error;
            }

            // SMS Notification
            await SMSService.sendSMS(
                student.id,
                `Hurmatli ota-ona, ${student.full_name} uchun ${amountVal.toLocaleString()} so'm to'lov qabul qilindi. Rahmat!`,
                'paid'
            );

            toast.success("To'lov qabul qilindi!");
            setIsPaymentModalOpen(false);
            fetchData(); // Refresh to see unblocked status

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

    // --- Helpers ---

    const getStatusBadge = (status) => {
        switch (status) {
            case 'paid': return <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1"><CheckCircle size={12} /> To'langan</span>;
            case 'pending': return <span className="bg-yellow-100 text-yellow-700 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1"><Clock size={12} /> Kutilmoqda</span>;
            case 'overdue': return <span className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1"><AlertCircle size={12} /> Qarzdor</span>;
            default: return <span className="bg-gray-100 text-gray-500 px-3 py-1 rounded-full text-xs font-bold">Mavjud emas</span>;
        }
    };

    // --- Content Rendering ---

    // Filter logic runs on the merged state
    const filteredList = students.filter(s => {
        const p = payments[s.id];
        const status = p ? p.status : 'none';

        // Search
        const searchMatch = s.full_name?.toLowerCase().includes(searchQuery.toLowerCase());

        // Status Filter
        let statusMatch = true;
        if (filterStatus !== 'all') {
            if (filterStatus === 'paid') statusMatch = status === 'paid';
            else if (filterStatus === 'pending') statusMatch = status === 'pending' || status === 'none';
            else if (filterStatus === 'overdue') statusMatch = status === 'overdue';
        }

        return searchMatch && statusMatch;
    });

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center flex-wrap gap-4">
                <h1 className="text-2xl font-bold text-gray-800">Oylik To'lovlar Nazorati</h1>
                <div className="flex gap-4 items-center">
                    <div className="text-right px-4 border-r border-gray-200">
                        <p className="text-xs text-gray-500">Kutilayotgan (Jami)</p>
                        <p className="font-bold text-gray-600 text-lg">{Number(stats.expectedIncome).toLocaleString()} so'm</p>
                    </div>
                    <div className="text-right px-4">
                        <p className="text-xs text-gray-500">Haqiqiy Tushum</p>
                        <p className="font-bold text-green-600 text-lg">{Number(stats.collectedIncome).toLocaleString()} so'm</p>
                    </div>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <StatsCard title="Jami O'quvchilar" value={stats.total} icon={Users} color="blue" />
                <StatsCard title="To'laganlar" value={stats.paid} icon={CheckCircle} color="green" />
                <StatsCard title="Qarzdorlar" value={stats.overdue} icon={AlertCircle} color="red" />
                <StatsCard title="Kutilmoqda" value={stats.pending} icon={Clock} color="yellow" />
            </div>

            {/* Filters */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col md:flex-row gap-4 justify-between items-center">
                <div className="flex flex-wrap gap-3 items-center w-full md:w-auto">
                    <div className="flex items-center gap-2 bg-gray-50 p-1.5 rounded-lg border border-gray-200">
                        <Calendar size={18} className="text-gray-500 ml-2" />
                        <input
                            type="month"
                            value={selectedMonth}
                            onChange={e => setSelectedMonth(e.target.value)}
                            className="bg-transparent border-none focus:ring-0 text-sm font-medium text-gray-700"
                        />
                    </div>

                    <div className="flex items-center gap-2 bg-gray-50 p-1.5 rounded-lg border border-gray-200">
                        <Filter size={18} className="text-gray-500 ml-2" />
                        <select
                            value={selectedGroup}
                            onChange={e => setSelectedGroup(e.target.value)}
                            className="bg-transparent border-none focus:ring-0 text-sm font-medium text-gray-700 min-w-[150px]"
                        >
                            <option value="all">Barcha Guruhlar</option>
                            {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                        </select>
                    </div>

                    <div className="flex bg-gray-100 p-1 rounded-lg">
                        {['all', 'paid', 'pending', 'overdue'].map(f => (
                            <button
                                key={f}
                                onClick={() => setFilterStatus(f)}
                                className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${filterStatus === f ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                            >
                                {f === 'all' ? 'Barchasi' : f === 'paid' ? "To'lagan" : f === 'pending' ? 'Kutilmoqda' : 'Qarzdor'}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="relative w-full md:w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                        type="text"
                        placeholder="Qidirish..."
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-gray-50 focus:bg-white transition-all"
                    />
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <Table headers={['O\'quvchi', 'Guruh', 'Hisoblangan', 'To\'landi', 'Holat', 'Amallar']}>
                    {loading ? (
                        <TableRow><TableCell colSpan={6} className="text-center py-8 text-gray-500">Yuklanmoqda...</TableCell></TableRow>
                    ) : filteredList.length === 0 ? (
                        <TableRow><TableCell colSpan={6} className="text-center py-8 text-gray-500">Ma'lumot topilmadi</TableCell></TableRow>
                    ) : (
                        filteredList.map(student => {
                            const payment = payments[student.id];
                            const groupName = student.enrollments?.[0]?.groups?.name || 'Guruhsiz';
                            const fee = student.monthly_fee || 0;
                            const amount = payment ? payment.final_amount : fee;
                            const paid = payment ? payment.paid_amount : 0;
                            const status = payment ? payment.status : 'none';

                            return (
                                <TableRow key={student.id}>
                                    <TableCell>
                                        <div className="font-medium text-gray-900">{student.full_name}</div>
                                        <div className="text-xs text-gray-500">{student.phone}</div>
                                    </TableCell>
                                    <TableCell>
                                        <span className="inline-flex items-center px-2 py-1 rounded-md bg-gray-100 text-gray-700 text-xs font-medium">
                                            {groupName}
                                        </span>
                                    </TableCell>
                                    <TableCell>
                                        <span className="text-gray-900 font-medium">{Number(amount).toLocaleString()}</span> <span className="text-xs text-gray-500">so'm</span>
                                    </TableCell>
                                    <TableCell>
                                        <span className={paid > 0 ? "text-green-600 font-bold" : "text-gray-400"}>
                                            {Number(paid).toLocaleString()}
                                        </span> <span className="text-xs text-gray-500">so'm</span>
                                    </TableCell>
                                    <TableCell>{getStatusBadge(status)}</TableCell>
                                    <TableCell>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => handleOpenHistory(student)}
                                                className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors"
                                                title="Tarix"
                                            >
                                                <FileText size={18} />
                                            </button>

                                            {status !== 'paid' && (
                                                <>
                                                    {status === 'none' ? (
                                                        <button
                                                            onClick={() => handleCreatePayment(student)}
                                                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors border border-transparent hover:border-blue-100"
                                                            title="Yaratish"
                                                        >
                                                            <PlusCircle size={18} />
                                                        </button>
                                                    ) : (
                                                        <button
                                                            onClick={() => handleOpenPayModal(student)}
                                                            className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors border border-transparent hover:border-green-100"
                                                            title="To'lash"
                                                        >
                                                            <DollarSign size={18} />
                                                        </button>
                                                    )}
                                                    {status !== 'none' && (
                                                        <button
                                                            onClick={() => handleSendReminder(student)}
                                                            className="p-2 text-orange-600 hover:bg-orange-50 rounded-lg transition-colors border border-transparent hover:border-orange-100"
                                                            title="SMS Eslatma"
                                                        >
                                                            <MessageSquare size={18} />
                                                        </button>
                                                    )}
                                                </>
                                            )}
                                            {status === 'paid' && (
                                                <button className="p-2 text-gray-400 cursor-default" title="To'langan">
                                                    <CheckCircle size={18} />
                                                </button>
                                            )}
                                        </div>
                                    </TableCell>
                                </TableRow>
                            );
                        })
                    )}
                </Table>
            </div>

            {/* Payment Modal */}
            {isPaymentModalOpen && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in zoom-in duration-200">
                    <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold text-gray-800">To'lov Qabul Qilish</h2>
                            <button onClick={() => setIsPaymentModalOpen(false)} className="p-1 hover:bg-gray-100 rounded-full"><X size={20} /></button>
                        </div>
                        <form onSubmit={handlePaySubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">O'quvchi</label>
                                <div className="p-3 bg-gray-50 rounded-lg border text-gray-900 font-medium">
                                    {selectedStudentCtx?.student?.full_name}
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Summa (so'm)</label>
                                <input
                                    type="number"
                                    required
                                    className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-green-500 outline-none transition-all"
                                    value={paymentAmount}
                                    onChange={e => setPaymentAmount(e.target.value)}
                                />
                            </div>
                            <div className="pt-2">
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="w-full p-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-bold disabled:opacity-50 shadow-md transition-all flex justify-center"
                                >
                                    {isSubmitting ? <Clock className="animate-spin" /> : 'To\'lovni Tasdiqlash'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* History Drawer */}
            {isHistoryOpen && (
                <div className="fixed inset-0 z-50 flex justify-end">
                    <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setIsHistoryOpen(false)}></div>
                    <div className="relative w-full max-w-md bg-white h-full shadow-2xl p-6 overflow-y-auto animate-in slide-in-from-right duration-300">
                        <div className="flex justify-between items-center mb-6">
                            <div>
                                <h2 className="text-xl font-bold text-gray-900">To'lovlar Tarixi</h2>
                                <p className="text-sm text-gray-500">{historyStudent?.full_name}</p>
                            </div>
                            <button onClick={() => setIsHistoryOpen(false)} className="p-2 hover:bg-gray-100 rounded-full"><X size={24} /></button>
                        </div>

                        <div className="space-y-4">
                            {historyLoading ? (
                                <p className="text-center text-gray-500">Yuklanmoqda...</p>
                            ) : historyData.length === 0 ? (
                                <div className="text-center py-10 bg-gray-50 rounded-xl border border-dashed">
                                    <p className="text-gray-500">To'lovlar tarixi mavjud emas.</p>
                                </div>
                            ) : (
                                historyData.map((payment) => (
                                    <div key={payment.id} className="p-4 border rounded-xl bg-gray-50 flex justify-between items-center group hover:border-blue-200 transition-colors">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${payment.status === 'paid' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                                                {payment.status === 'paid' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
                                            </div>
                                            <div>
                                                <p className="font-bold text-gray-900">{Number(payment.final_amount).toLocaleString()} so'm</p>
                                                <p className="text-xs text-gray-500">{payment.payment_month}</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-sm font-medium text-gray-600">{payment.paid_date ? payment.paid_date.slice(0, 10) : '-'}</p>
                                            {getStatusBadge(payment.status)}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default StudentPayments;
