import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
    CreditCard, CheckCircle2, AlertCircle, Calendar,
    DollarSign, Receipt, ArrowUpRight,
    Smartphone, Info, ChevronLeft, ShieldCheck,
    Printer, X
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import { uz } from 'date-fns/locale';
import toast from 'react-hot-toast';
import { cn } from '../../utils/cn';
import { formatMonthYear, STATUS_CONFIG } from '../../utils/paymentUtils';
import { useParent } from '../../context/ParentContext';

const ParentPayments = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const { selectedChild, selectChild, children } = useParent();

    // URL param takes priority, then context
    const urlStudentId = searchParams.get('id');
    const studentId = urlStudentId || selectedChild?.id;

    const [payments, setPayments] = useState([]);
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [studentInfo, setStudentInfo] = useState(null);
    const [showReceipt, setShowReceipt] = useState(false);
    const [receiptData, setReceiptData] = useState(null);

    // Sync context if URL has a different id
    useEffect(() => {
        if (urlStudentId && urlStudentId !== selectedChild?.id) {
            const found = children.find(c => c.id === urlStudentId);
            if (found) selectChild(found);
        }
    }, [urlStudentId]);

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
            const { data: student } = await supabase
                .from('profiles')
                .select('full_name, student_code')
                .eq('id', studentId)
                .single();
            setStudentInfo(student);

            const { data: paymentsData } = await supabase
                .from('monthly_payments')
                .select('*')
                .eq('student_id', studentId)
                .order('payment_year', { ascending: false })
                .order('payment_month', { ascending: false });

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
            <div className="h-[60vh] flex flex-col items-center justify-center text-center px-6">
                <div className="w-20 h-20 bg-slate-50 rounded-3xl flex items-center justify-center mb-6 text-slate-300">
                    <ShieldCheck size={40} />
                </div>
                <h2 className="text-2xl font-black text-slate-800 tracking-tighter mb-2">Farzandni tanlang</h2>
                <p className="text-slate-400 font-medium max-w-xs mb-8 text-sm">To'lovlar tarixini ko'rish uchun dashboarddan farzandingizni tanlang.</p>
                <button onClick={() => navigate('/parent/dashboard')} className="btn-primary">Dashboardga qaytish</button>
            </div>
        );
    }

    const totalPaid = transactions.reduce((sum, tx) => sum + (Number(tx.amount) || 0), 0);
    const latestBill = payments[0];
    const expected = latestBill ? (latestBill.final_amount || latestBill.amount || 0) : 0;
    const paid = latestBill ? (latestBill.paid_amount || 0) : 0;
    const debt = Math.max(0, expected - paid);

    const academyId = studentInfo?.student_code
        ? studentInfo.student_code.toUpperCase()
        : studentId?.slice(0, 8).toUpperCase() || '—';

    return (
        <div className="space-y-6 animate-fade-in max-w-[1400px] mx-auto pb-20">

            {/* Header */}
            <div className="relative overflow-hidden rounded-[2rem] md:rounded-[2.5rem] bg-slate-900 shadow-2xl">
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-700 via-slate-900 to-black opacity-90"></div>
                <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-emerald-500/10 rounded-full blur-[120px]"></div>

                <div className="relative z-10 p-5 sm:p-8 md:p-12">
                    <button
                        onClick={() => navigate(-1)}
                        className="inline-flex items-center gap-2 text-emerald-400 font-black text-[10px] uppercase tracking-widest mb-4 hover:text-emerald-300 transition-colors"
                    >
                        <ChevronLeft size={14} /> Orqaga
                    </button>

                    <div className="flex flex-col sm:flex-row sm:items-end gap-4 sm:gap-6 mb-5">
                        <div className="w-14 h-14 sm:w-16 sm:h-16 bg-emerald-500/20 rounded-[1.5rem] flex items-center justify-center text-emerald-300 font-black text-2xl sm:text-3xl border border-emerald-500/20 shadow-inner shrink-0">
                            {studentInfo?.full_name?.[0]}
                        </div>
                        <div>
                            <h1 className="text-2xl sm:text-3xl md:text-5xl font-black text-white tracking-tighter leading-none italic">
                                {studentInfo?.full_name}
                            </h1>
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-200 not-italic text-lg sm:text-xl md:text-3xl font-black tracking-tighter">
                                To'lovlar Tarixi
                            </span>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 sm:gap-4 sm:w-auto">
                        <div className="glass-card bg-white/5 border-white/10 backdrop-blur-2xl px-4 py-4 sm:px-6 sm:py-6 rounded-[1.5rem] sm:rounded-[2rem]">
                            <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-emerald-400 mb-1 block">Jami To'langan</span>
                            <div className="font-black text-white text-xl sm:text-2xl tracking-tighter tabular-nums">{totalPaid.toLocaleString()} <span className="text-[10px] text-white/40">UZS</span></div>
                        </div>
                        <div className="glass-card bg-white/10 border-white/10 backdrop-blur-2xl px-4 py-4 sm:px-6 sm:py-6 rounded-[1.5rem] sm:rounded-[2rem]">
                            <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-rose-400 mb-1 block">Qarz</span>
                            <div className="font-black text-rose-400 text-xl sm:text-2xl tracking-tighter tabular-nums">{debt > 0 ? debt.toLocaleString() : 0} <span className="text-[10px] text-rose-400/40">UZS</span></div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Transactions + Monthly */}
                <div className="lg:col-span-2 space-y-5">
                    {/* Transactions */}
                    <div className="glass-card bg-white p-5 sm:p-8 rounded-[2rem] border border-slate-100 shadow-xl shadow-slate-200/50">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-lg font-black text-slate-900 flex items-center gap-3">
                                <span className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                                    <Receipt size={18} />
                                </span>
                                Tranzaksiyalar
                            </h3>
                        </div>

                        {transactions.length === 0 ? (
                            <div className="py-14 flex flex-col items-center text-center text-slate-300">
                                <Receipt size={40} className="mb-4 opacity-20" />
                                <p className="font-bold text-xs uppercase tracking-widest">Hozircha ma'lumot yo'q</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {transactions.map((tx, idx) => (
                                    <motion.div
                                        key={tx.id}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: idx * 0.04 }}
                                        className="flex items-center justify-between p-4 sm:p-5 bg-slate-50/50 rounded-[1.5rem] border border-slate-100 hover:bg-white hover:shadow-lg hover:border-emerald-100 transition-all group"
                                    >
                                        <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                                            <div className="w-11 h-11 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform shrink-0">
                                                <ArrowUpRight size={20} />
                                            </div>
                                            <div className="min-w-0">
                                                <h4 className="font-black text-slate-800 text-xs uppercase tracking-tight">To'lov Qabul Qilindi</h4>
                                                <div className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] mt-0.5 flex items-center gap-1.5 flex-wrap">
                                                    <Calendar size={10} />
                                                    {format(new Date(tx.created_at), 'dd MMM, HH:mm', { locale: uz })}
                                                    <span className="w-1 h-1 bg-slate-300 rounded-full" />
                                                    {(tx.method || 'cash').toUpperCase()}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="text-right shrink-0 ml-2">
                                            <p className="text-base sm:text-lg font-black text-emerald-600 tracking-tighter">+{Number(tx.amount).toLocaleString()} <span className="text-[9px] text-slate-400 uppercase">uzs</span></p>
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

                    {/* Monthly reports */}
                    <div className="glass-card bg-slate-900 p-5 sm:p-8 rounded-[2rem] text-white shadow-2xl">
                        <h3 className="text-lg font-black mb-6 flex items-center gap-3">
                            <Calendar size={18} className="text-emerald-400" />
                            Oylik Hisobotlar
                        </h3>
                        {payments.length === 0 ? (
                            <div className="py-10 text-center text-slate-500">
                                <p className="font-bold text-xs uppercase tracking-widest">To'lov ma'lumotlari yo'q</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {payments.map((p) => (
                                    <div key={p.id} className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5 hover:bg-white/10 transition-all gap-3">
                                        <div className="flex items-center gap-3 min-w-0">
                                            <div className="w-9 h-9 bg-white/10 rounded-lg flex items-center justify-center text-xs font-black shrink-0">
                                                {String(p.payment_month).padStart(2, '0')}
                                            </div>
                                            <div className="min-w-0">
                                                <h4 className="font-black text-sm uppercase tracking-tight truncate">
                                                    {formatMonthYear(p.payment_month, p.payment_year)}
                                                </h4>
                                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                                    {(p.final_amount || p.amount || 0).toLocaleString()} UZS
                                                </p>
                                            </div>
                                        </div>
                                        <div className={cn(
                                            "px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-[0.15em] shrink-0",
                                            STATUS_CONFIG[p.status]?.bg || 'bg-slate-700'
                                        )}>
                                            {STATUS_CONFIG[p.status]?.label || p.status}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Sidebar info */}
                <div className="space-y-5">
                    <div className="glass-card bg-emerald-600 p-6 sm:p-8 rounded-[2rem] text-white shadow-2xl relative overflow-hidden group">
                        <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-1000"></div>
                        <h3 className="text-lg font-black mb-4 flex items-center gap-3">
                            <Smartphone size={18} className="text-emerald-200" />
                            To'lov Ma'lumotlari
                        </h3>
                        <p className="text-emerald-100 font-medium text-sm mb-6 leading-relaxed opacity-80">
                            Masofadan to'lov qilish uchun Click, Payme yoki bank ilovalaridan foydalanishingiz mumkin.
                        </p>
                        <div className="space-y-3">
                            <div className="p-3.5 bg-white/10 rounded-xl border border-white/10">
                                <p className="text-[10px] font-black text-emerald-200 uppercase tracking-widest mb-1">Student CODE</p>
                                <p className="text-base font-black tracking-widest uppercase">{studentInfo?.student_code || 'T-...'}</p>
                            </div>
                            <div className="p-3.5 bg-white/10 rounded-xl border border-white/10">
                                <p className="text-[10px] font-black text-emerald-200 uppercase tracking-widest mb-1">Akademiya ID</p>
                                <p className="text-base font-black tracking-widest">{academyId}</p>
                            </div>
                        </div>
                    </div>

                    <div className="glass-card bg-white p-6 rounded-[2rem] border border-slate-100 shadow-xl shadow-slate-200/50 flex flex-col items-center text-center">
                        <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-3xl flex items-center justify-center mb-3">
                            <Info size={28} />
                        </div>
                        <h4 className="font-black text-slate-800 uppercase tracking-tight mb-2 text-sm">Yordam kerakmi?</h4>
                        <p className="text-xs text-slate-400 font-medium mb-3 leading-relaxed">To'lov va boshqa texnik savollar uchun ma'muriyat bilan bog'laning.</p>
                        <p className="text-sm font-black text-slate-900 tracking-widest">+998 (99) 123-45-67</p>
                    </div>
                </div>
            </div>

            {/* Receipt Modal */}
            <AnimatePresence>
                {showReceipt && receiptData && (
                    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 receipt-exclude">
                        <motion.div
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-slate-950/80 backdrop-blur-3xl receipt-exclude"
                            onClick={() => setShowReceipt(false)}
                        />
                        <motion.div
                            initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.8, opacity: 0 }}
                            className="bg-white rounded-[2rem] w-full max-w-sm relative z-10 p-8 shadow-2xl receipt-modal"
                        >
                            <button
                                onClick={() => setShowReceipt(false)}
                                className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center text-slate-400 hover:text-slate-600 receipt-exclude"
                            >
                                <X size={18} />
                            </button>

                            <div className="text-center mb-8">
                                <div className="w-16 h-16 bg-emerald-600 rounded-3xl flex items-center justify-center text-white mx-auto shadow-xl shadow-emerald-500/20 mb-4">
                                    <Printer size={28} />
                                </div>
                                <h3 className="text-xl font-black text-slate-900 tracking-tighter uppercase italic">Terra Academy</h3>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">To'lov Tasdiqi</p>
                            </div>

                            <div className="space-y-4 border-y border-slate-100 py-6 my-6">
                                <div className="flex justify-between items-center text-xs">
                                    <span className="font-black text-slate-400 uppercase tracking-widest">Farzand</span>
                                    <span className="font-black text-slate-900 uppercase italic">{studentInfo?.full_name}</span>
                                </div>
                                <div className="flex justify-between items-center text-xs">
                                    <span className="font-black text-slate-400 uppercase tracking-widest">Sana</span>
                                    <span className="font-black text-slate-900 uppercase tabular-nums">{format(new Date(receiptData.created_at), 'dd.MM.yyyy, HH:mm')}</span>
                                </div>
                                <div className="flex justify-between items-center text-xs">
                                    <span className="font-black text-slate-400 uppercase tracking-widest">To'lov turi</span>
                                    <span className="font-black text-slate-900 uppercase italic">{receiptData.method}</span>
                                </div>
                                <div className="flex justify-between items-center text-xs pt-3 border-t border-dashed border-slate-200">
                                    <span className="font-black text-slate-900 uppercase tracking-widest">Summa</span>
                                    <span className="text-xl font-black text-emerald-600 tracking-tighter tabular-nums">{Number(receiptData.amount).toLocaleString()} UZS</span>
                                </div>
                            </div>

                            <div className="text-center space-y-3">
                                <img
                                    src={`https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=TERRA-TXN-${receiptData.id}`}
                                    alt="QR"
                                    className="w-20 h-20 mx-auto opacity-80"
                                    onError={(e) => { e.target.style.display = 'none'; }}
                                />
                                <p className="text-[9px] font-medium text-slate-400 max-w-[180px] mx-auto uppercase tracking-tighter">
                                    Ushbu kvitansiya ota-onalar nazorati tizimi orqali tasdiqlandi.
                                </p>
                            </div>

                            <button
                                onClick={() => window.print()}
                                className="w-full mt-8 py-4 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-black transition-all flex items-center justify-center gap-2 receipt-exclude"
                            >
                                <Printer size={14} /> Chop etish
                            </button>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default ParentPayments;
