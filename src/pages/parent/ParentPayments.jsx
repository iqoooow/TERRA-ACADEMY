import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
    CreditCard, CheckCircle2, AlertCircle, Calendar,
    DollarSign, Download, Receipt, Wallet, ArrowUpRight,
    Smartphone, Landmark, Info, ChevronLeft, ShieldCheck,
    Printer, X, FileText
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { format, parseISO } from 'date-fns';
import { uz } from 'date-fns/locale';
import toast from 'react-hot-toast';
import { cn } from '../../utils/cn';

const STATUS_CONFIG = {
    paid: { label: "To'langan", bg: 'bg-emerald-500', text: 'text-white', icon: CheckCircle2 },
    partially_paid: { label: 'Qisman', bg: 'bg-blue-500', text: 'text-white', icon: Receipt },
    overdue: { label: "Muddati o'tgan", bg: 'bg-rose-500', text: 'text-white', icon: AlertCircle },
    pending: { label: "Kutilmoqda", bg: 'bg-amber-500', text: 'text-white', icon: Wallet },
};

const ParentPayments = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const studentId = searchParams.get('id');

    const [payments, setPayments] = useState([]);
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [studentInfo, setStudentInfo] = useState(null);
    const [showReceipt, setShowReceipt] = useState(false);
    const [receiptData, setReceiptData] = useState(null);

    useEffect(() => {
        if (studentId) {
            fetchPaymentData();
        } else {
            setLoading(false);
        }
    }, [studentId]);

    const fetchPaymentData = async () => {
        setLoading(true);
        try {
            // 1. Get Student Info
            const { data: student } = await supabase.from('profiles').select('full_name, student_code').eq('id', studentId).single();
            setStudentInfo(student);

            // 2. Get Payments
            const { data: paymentsData } = await supabase
                .from('monthly_payments')
                .select('*')
                .eq('student_id', studentId)
                .order('payment_month', { ascending: false });

            // 3. Get Transactions
            const { data: txData } = await supabase
                .from('payment_transactions')
                .select('*, monthly_payments!inner(student_id)')
                .eq('monthly_payments.student_id', studentId)
                .order('created_at', { ascending: false });

            setPayments(paymentsData || []);
            setTransactions(txData || []);
        } catch (err) {
            console.error('Error fetching payments:', err);
            toast.error("Ma'lumotlarni yuklashda xatolik");
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="h-[60vh] flex flex-col items-center justify-center gap-4">
                <div className="w-12 h-12 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Ma'lumotlar yuklanmoqda...</p>
            </div>
        );
    }

    if (!studentId) {
        return (
            <div className="h-[60vh] flex flex-col items-center justify-center text-center">
                <div className="w-20 h-20 bg-slate-50 rounded-3xl flex items-center justify-center mb-6 text-slate-300">
                    <ShieldCheck size={40} />
                </div>
                <h2 className="text-2xl font-black text-slate-800 tracking-tighter mb-2">Farzandni tanlang</h2>
                <p className="text-slate-400 font-medium max-w-xs mb-8">To'lovlar tarixini ko'rish uchun dashboarddan farzandingizni tanlang.</p>
                <button onClick={() => navigate('/parent/dashboard')} className="btn-primary">Dashboardga qaytish</button>
            </div>
        );
    }

    const totalPaid = transactions.reduce((sum, tx) => sum + (tx.amount || 0), 0);
    const latestBill = payments[0];
    const debt = latestBill ? (latestBill.amount - (latestBill.paid_amount || 0)) : 0;

    return (
        <div className="space-y-8 animate-fade-in max-w-[1400px] mx-auto pb-20">

            {/* Header */}
            <div className="relative overflow-hidden rounded-[2.5rem] bg-slate-900 shadow-2xl">
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-700 via-slate-900 to-black opacity-90"></div>
                <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-emerald-500/10 rounded-full blur-[120px]"></div>

                <div className="relative z-10 p-10 md:p-14 flex flex-col md:flex-row items-center justify-between gap-10">
                    <div className="w-full">
                        <button
                            onClick={() => navigate(-1)}
                            className="inline-flex items-center gap-2 text-emerald-400 font-black text-[10px] uppercase tracking-widest mb-6 hover:text-emerald-300 transition-colors"
                        >
                            <ChevronLeft size={14} /> Orqaga qaytish
                        </button>
                        <div className="flex flex-col md:flex-row md:items-end gap-6 mb-4">
                            <div className="w-20 h-20 bg-emerald-500/20 rounded-[2rem] flex items-center justify-center text-emerald-300 font-black text-4xl border border-emerald-500/20 shadow-inner">
                                {studentInfo?.full_name?.[0]}
                            </div>
                            <div>
                                <h1 className="text-4xl md:text-6xl font-black text-white tracking-tighter leading-none italic">
                                    {studentInfo?.full_name} <br />
                                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-200 not-italic">To'lovlar Tarixi.</span>
                                </h1>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 shrink-0">
                        <div className="glass-card bg-white/5 border-white/10 backdrop-blur-2xl px-8 py-6 rounded-[2.5rem] min-w-[180px]">
                            <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400 mb-2 block">Jami To'langan</span>
                            <div className="font-black text-white text-3xl tracking-tighter tabular-nums">{totalPaid.toLocaleString()}</div>
                        </div>
                        <div className="glass-card bg-white/10 border-white/10 backdrop-blur-2xl px-8 py-6 rounded-[2.5rem] min-w-[180px]">
                            <span className="text-[10px] font-black uppercase tracking-widest text-rose-400 mb-2 block">Qarz</span>
                            <div className="font-black text-rose-400 text-3xl tracking-tighter tabular-nums">{debt.toLocaleString()}</div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                <div className="lg:col-span-2 space-y-6">
                    <div className="glass-card bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/50">
                        <div className="flex items-center justify-between mb-8">
                            <h3 className="text-xl font-black text-slate-900 flex items-center gap-3">
                                <span className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                                    <Receipt size={20} />
                                </span>
                                Tranzaksiyalar
                            </h3>
                        </div>

                        {transactions.length === 0 ? (
                            <div className="py-20 flex flex-col items-center text-center text-slate-300">
                                <Receipt size={48} className="mb-4 opacity-20" />
                                <p className="font-bold text-xs uppercase tracking-widest">Hozircha ma'lumot yo'q</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {transactions.map((tx, idx) => (
                                    <motion.div
                                        key={tx.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.05 }}
                                        className="flex items-center justify-between p-6 bg-slate-50/50 rounded-[2rem] border border-slate-100 hover:bg-white hover:shadow-2xl hover:border-emerald-100 transition-all group"
                                    >
                                        <div className="flex items-center gap-5">
                                            <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                                                <ArrowUpRight size={24} />
                                            </div>
                                            <div>
                                                <h4 className="font-black text-slate-800 text-sm uppercase tracking-tight">To'lov Qabul Qilindi</h4>
                                                <div className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mt-1 flex items-center gap-2">
                                                    <Calendar size={12} /> {format(new Date(tx.created_at), 'dd MMMM, HH:mm', { locale: uz })}
                                                    <span className="w-1 h-1 bg-slate-300 rounded-full" />
                                                    {tx.method.toUpperCase()}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-xl font-black text-emerald-600 tracking-tighter">+{tx.amount.toLocaleString()} <span className="text-[9px] text-slate-400 uppercase">uzs</span></p>
                                            <button
                                                onClick={() => { setReceiptData(tx); setShowReceipt(true); }}
                                                className="text-[9px] font-black text-emerald-500 uppercase tracking-widest hover:underline mt-1 flex items-center gap-1 justify-end"
                                            >
                                                <Printer size={10} /> Kvitansiya
                                            </button>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="glass-card bg-slate-900 p-8 rounded-[2.5rem] text-white shadow-2xl">
                        <h3 className="text-xl font-black mb-8 flex items-center gap-3">
                            <Calendar size={20} className="text-emerald-400" />
                            Oylik Hisobotlar
                        </h3>
                        <div className="space-y-4">
                            {payments.map((p, i) => {
                                const pDate = parseISO(p.payment_month);
                                return (
                                    <div key={p.id} className="flex items-center justify-between p-5 bg-white/5 rounded-3xl border border-white/5 hover:bg-white/10 transition-all">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center text-xs font-black">
                                                {format(pDate, 'MM')}
                                            </div>
                                            <div>
                                                <h4 className="font-black text-sm uppercase tracking-tight">{format(pDate, 'MMMM, yyyy', { locale: uz })}</h4>
                                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Reja: {p.amount.toLocaleString()} UZS</p>
                                            </div>
                                        </div>
                                        <div className={cn(
                                            "px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-[0.2em]",
                                            STATUS_CONFIG[p.status]?.bg || 'bg-slate-700'
                                        )}>
                                            {STATUS_CONFIG[p.status]?.label || p.status}
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                </div>

                <div className="space-y-8">
                    <div className="glass-card bg-emerald-600 p-8 rounded-[2.5rem] text-white shadow-2xl relative overflow-hidden group">
                        <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-1000"></div>
                        <h3 className="text-xl font-black mb-6 flex items-center gap-3">
                            <Smartphone size={20} className="text-emerald-200" />
                            To'lov Ma'lumotlari
                        </h3>
                        <p className="text-emerald-100 font-medium text-sm mb-8 leading-relaxed opacity-80">
                            Masofadan to'lov qilish uchun Click, Payme yoki bank ilovalaridan foydalanishingiz mumkin.
                        </p>
                        <div className="space-y-3">
                            <div className="p-4 bg-white/10 rounded-2xl border border-white/10">
                                <p className="text-[10px] font-black text-emerald-200 uppercase tracking-widest mb-1">Student CODE</p>
                                <p className="text-lg font-black tracking-widest uppercase">{studentInfo?.student_code || 'T-...'}</p>
                            </div>
                            <div className="p-4 bg-white/10 rounded-2xl border border-white/10">
                                <p className="text-[10px] font-black text-emerald-200 uppercase tracking-widest mb-1">Akademiya ID</p>
                                <p className="text-lg font-black tracking-widest">777 001</p>
                            </div>
                        </div>
                    </div>

                    <div className="glass-card bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/50 flex flex-col items-center text-center">
                        <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-3xl flex items-center justify-center mb-4">
                            <Info size={32} />
                        </div>
                        <h4 className="font-black text-slate-800 uppercase tracking-tight mb-2">Yordam kerakmi?</h4>
                        <p className="text-xs text-slate-400 font-medium mb-4 leading-relaxed">To'lov va boshqa texnik savollar uchun ma'muriyat bilan bog'laning.</p>
                        <p className="text-sm font-black text-slate-900 tracking-widest">+998 (99) 123-45-67</p>
                    </div>
                </div>
            </div>

            {/* Receipt Modal */}
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
                            className="bg-white rounded-[2rem] w-full max-w-md relative z-10 p-10 shadow-2xl"
                        >
                            <div className="text-center mb-10">
                                <div className="w-20 h-20 bg-emerald-600 rounded-3xl flex items-center justify-center text-white mx-auto shadow-xl shadow-emerald-500/20 mb-6">
                                    <Printer size={32} />
                                </div>
                                <h3 className="text-2xl font-black text-slate-900 tracking-tighter uppercase italic text-center">Terra Academy</h3>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">To'lov Tasdiqi</p>
                            </div>

                            <div className="space-y-6 border-y border-slate-100 py-8 my-8">
                                <div className="flex justify-between items-center text-xs">
                                    <span className="font-black text-slate-400 uppercase tracking-widest">Farzand</span>
                                    <span className="font-black text-slate-900 uppercase italic tabular-nums">{studentInfo?.full_name}</span>
                                </div>
                                <div className="flex justify-between items-center text-xs">
                                    <span className="font-black text-slate-400 uppercase tracking-widest">Sana</span>
                                    <span className="font-black text-slate-900 uppercase tabular-nums">{format(new Date(receiptData.created_at), 'dd.MM.yyyy, HH:mm')}</span>
                                </div>
                                <div className="flex justify-between items-center text-xs">
                                    <span className="font-black text-slate-400 uppercase tracking-widest">To'lov turi</span>
                                    <span className="font-black text-slate-900 uppercase italic tabular-nums">{receiptData.method}</span>
                                </div>
                                <div className="flex justify-between items-center text-xs pt-4 border-t border-dashed border-slate-200">
                                    <span className="font-black text-slate-900 uppercase tracking-widest">Summa</span>
                                    <span className="text-2xl font-black text-emerald-600 tracking-tighter tabular-nums">{receiptData.amount.toLocaleString()} UZS</span>
                                </div>
                            </div>

                            <div className="text-center space-y-4">
                                <img
                                    src={`https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=TERRA-PARENT-TXN-${receiptData.id}`}
                                    alt="QR" className="w-24 h-24 mx-auto opacity-80"
                                />
                                <p className="text-[9px] font-medium text-slate-400 max-w-[200px] mx-auto uppercase tracking-tighter">
                                    Ushbu kvitansiya ota-onalar nazorati tizimi orqali tasdiqlandi.
                                </p>
                            </div>

                            <button
                                onClick={() => window.print()}
                                className="w-full mt-10 py-5 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-black transition-all flex items-center justify-center gap-2"
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

export default ParentPayments;
