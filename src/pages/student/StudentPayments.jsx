import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import {
    CreditCard, CheckCircle2, AlertCircle, Calendar,
    DollarSign, Download, Receipt, Wallet, ArrowUpRight,
    Smartphone, Landmark, Info, Printer, X, FileText
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import { uz } from 'date-fns/locale';
import toast from 'react-hot-toast';
import { cn } from '../../utils/cn';

import { formatMonthYear, STATUS_CONFIG } from '../../utils/paymentUtils';

const StudentPayments = () => {
    const [loading, setLoading] = useState(true);
    const [payments, setPayments] = useState([]);
    const [currentBill, setCurrentBill] = useState(null);
    const [transactions, setTransactions] = useState([]);
    const [showReceipt, setShowReceipt] = useState(false);
    const [receiptData, setReceiptData] = useState(null);
    const [userData, setUserData] = useState(null);

    useEffect(() => {
        fetchPaymentData();
    }, []);

    const fetchPaymentData = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            // Fetch Profile for receipt
            const { data: profile } = await supabase.from('profiles').select('full_name').eq('id', user.id).single();
            setUserData(profile);

            // 1. Fetch Monthly Payments
            const { data: payData } = await supabase
                .from('monthly_payments')
                .select('*')
                .eq('student_id', user.id)
                .order('payment_year', { ascending: false })
                .order('payment_month', { ascending: false });

            // 2. Fetch Detailed Transactions (Filtered by RLS automatically)
            const { data: txData } = await supabase
                .from('payment_transactions')
                .select('*, monthly_payments!inner(student_id)')
                .eq('monthly_payments.student_id', user.id)
                .order('created_at', { ascending: false });

            setPayments(payData || []);
            setTransactions(txData || []);

            if (payData && payData.length > 0) {
                setCurrentBill(payData[0]);
            }

        } catch (err) {
            console.error('Error:', err);
            toast.error("Ma'lumotlarni yuklashda xatolik");
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="h-[60vh] flex flex-col items-center justify-center gap-4">
                <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest animate-pulse">Ma'lumotlar yuklanmoqda...</p>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-fade-in max-w-[1400px] mx-auto pb-20">

            {/* Header */}
            <div className="relative overflow-hidden rounded-[2.5rem] bg-slate-900 shadow-2xl">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-700 via-indigo-900 to-black opacity-95"></div>

                <div className="relative z-10 p-10 md:p-14 flex flex-col md:flex-row items-center justify-between gap-10">
                    <div>
                        <div className="inline-flex items-center gap-3 px-4 py-1.5 bg-white/10 rounded-full border border-white/10 text-[10px] font-black uppercase tracking-widest text-blue-300 mb-6 backdrop-blur-md">
                            <CreditCard size={14} /> My Finances
                        </div>
                        <h1 className="text-4xl md:text-6xl font-black text-white tracking-tighter mb-4 leading-none italic">
                            Xarajatlar <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-300 to-indigo-200 not-italic">Tahlili.</span>
                        </h1>
                        <p className="text-blue-100/60 font-medium text-lg max-w-xl">
                            Oylik to'lovlar, qoldiq qarzlar va barcha muvaffaqiyatli tranzaksiyalaringiz markazi.
                        </p>
                    </div>

                    {currentBill && (
                        <div className="glass-card bg-white/10 border-white/10 backdrop-blur-2xl px-10 py-8 rounded-[3rem] text-center min-w-[280px]">
                            <p className="text-[10px] font-black uppercase tracking-widest text-blue-300 mb-2">
                                {formatMonthYear(currentBill.payment_month, currentBill.payment_year)} holati
                            </p>
                            <div className={cn(
                                "inline-flex items-center gap-2 px-5 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest mb-4",
                                STATUS_CONFIG[currentBill.status]?.bg || 'bg-slate-500',
                                STATUS_CONFIG[currentBill.status]?.text || 'text-white'
                            )}>
                                {(() => {
                                    const Icon = STATUS_CONFIG[currentBill.status]?.icon || Info;
                                    return <Icon size={14} />;
                                })()}
                                {STATUS_CONFIG[currentBill.status]?.label || currentBill.status}
                            </div>
                            <div className="text-4xl font-black text-white tracking-tighter tabular-nums">
                                {(currentBill.amount - (currentBill.paid_amount || 0)).toLocaleString()} <span className="text-sm font-bold opacity-50 uppercase tracking-widest">uzs</span>
                            </div>
                            <p className="text-[10px] font-bold text-blue-200/50 mt-2 uppercase tracking-widest italic">Qoldiq qarz miqdori</p>
                        </div>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                {/* Transactions */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="glass-card bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/50">
                        <div className="flex items-center justify-between mb-8">
                            <h3 className="text-xl font-black text-slate-900 flex items-center gap-3">
                                <span className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                                    <Receipt size={20} />
                                </span>
                                Tranzaksiyalar Tarixi
                            </h3>
                        </div>

                        {transactions.length === 0 ? (
                            <div className="py-20 flex flex-col items-center text-center">
                                <div className="w-16 h-16 bg-slate-50 rounded-3xl flex items-center justify-center mb-4 text-slate-200">
                                    <Receipt size={32} />
                                </div>
                                <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Hozircha tranzaksiyalar yo'q</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {transactions.map((tx, idx) => (
                                    <motion.div
                                        key={tx.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.05 }}
                                        className="flex items-center justify-between p-5 bg-slate-50/50 rounded-3xl border border-slate-100 hover:bg-white hover:shadow-2xl hover:border-blue-100 transition-all group"
                                    >
                                        <div className="flex items-center gap-5">
                                            <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center shadow-sm border border-slate-100 text-blue-600 group-hover:scale-110 transition-transform">
                                                <div className="bg-blue-50 p-2 rounded-xl">
                                                    <ArrowUpRight size={24} />
                                                </div>
                                            </div>
                                            <div>
                                                <h4 className="font-black text-slate-800 text-sm uppercase tracking-tight">Kirim Tranzaksiyasi</h4>
                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mt-1 flex items-center gap-2">
                                                    <Calendar size={12} /> {format(new Date(tx.created_at), 'dd MMMM, HH:mm', { locale: uz })}
                                                    <span className="w-1 h-1 bg-slate-300 rounded-full" />
                                                    {tx.method.toUpperCase()}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-xl font-black text-emerald-600 tracking-tighter">+{tx.amount.toLocaleString()} <span className="text-[9px] text-slate-400 uppercase">uzs</span></p>
                                            <button
                                                onClick={() => { setReceiptData(tx); setShowReceipt(true); }}
                                                className="text-[9px] font-black text-blue-500 uppercase tracking-widest hover:underline mt-1 flex items-center gap-1 justify-end"
                                            >
                                                <Printer size={10} /> Receipt
                                            </button>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Sidebar */}
                <div className="space-y-8">
                    <div className="glass-card bg-gradient-to-br from-indigo-600 to-blue-700 p-8 rounded-[2.5rem] text-white shadow-2xl relative overflow-hidden">
                        <h3 className="text-xl font-black mb-6 flex items-center gap-3 uppercase tracking-tighter">
                            <Info size={20} className="text-blue-300" />
                            To'lov qilish
                        </h3>
                        <div className="space-y-6">
                            {[
                                { title: 'Online (Click/Payme)', desc: 'Akademiya ID: 777 001 va Student CODE orqali.', icon: Smartphone },
                                { title: 'Bank Reallanmasi', desc: 'Rekvizitlarimizga o\'tkazma asosida.', icon: Landmark },
                                { title: 'Naqd pul / Karta', desc: 'Akademiya ofisiga kelgan holda.', icon: Wallet },
                            ].map((step, i) => (
                                <div key={i} className="flex gap-4">
                                    <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center shrink-0 border border-white/10">
                                        <step.icon size={18} className="text-blue-200" />
                                    </div>
                                    <div>
                                        <h4 className="font-black text-sm uppercase tracking-tight text-white mb-1">{step.title}</h4>
                                        <p className="text-xs text-blue-100/60 leading-relaxed font-medium">{step.desc}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="glass-card bg-white p-8 rounded-[2.5rem] border border-slate-100 flex items-center gap-4 group hover:shadow-xl transition-all">
                        <div className="w-14 h-14 bg-amber-50 text-amber-600 rounded-[1.5rem] flex items-center justify-center group-hover:rotate-12 transition-transform">
                            <Smartphone size={28} />
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Savollar bo'yicha</p>
                            <p className="text-lg font-black text-slate-800 tracking-tighter">+998 (99) 123-45-67</p>
                        </div>
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
                                <div className="w-20 h-20 bg-blue-600 rounded-3xl flex items-center justify-center text-white mx-auto shadow-xl shadow-blue-500/20 mb-6">
                                    <Printer size={32} />
                                </div>
                                <h3 className="text-2xl font-black text-slate-900 tracking-tighter uppercase italic text-center">Terra Academy</h3>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Rasmiy To'lov Kvitansiyasi</p>
                            </div>

                            <div className="space-y-6 border-y border-slate-100 py-8 my-8">
                                <div className="flex justify-between items-center text-xs">
                                    <span className="font-black text-slate-400 uppercase tracking-widest">F.I.SH</span>
                                    <span className="font-black text-slate-900 uppercase italic tabular-nums">{userData?.full_name}</span>
                                </div>
                                <div className="flex justify-between items-center text-xs">
                                    <span className="font-black text-slate-400 uppercase tracking-widest">Sana</span>
                                    <span className="font-black text-slate-900 uppercase tabular-nums">{format(new Date(receiptData.created_at), 'dd.MM.yyyy, HH:mm')}</span>
                                </div>
                                <div className="flex justify-between items-center text-xs">
                                    <span className="font-black text-slate-400 uppercase tracking-widest">Summa</span>
                                    <span className="text-2xl font-black text-blue-600 tracking-tighter tabular-nums">{receiptData.amount.toLocaleString()} UZS</span>
                                </div>
                            </div>

                            <div className="text-center space-y-4">
                                <img
                                    src={`https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=TERRA-TXN-${receiptData.id}`}
                                    alt="QR" className="w-24 h-24 mx-auto opacity-80"
                                />
                                <p className="text-[9px] font-medium text-slate-400 max-w-[200px] mx-auto uppercase tracking-tighter">
                                    Xavfsizlik kod: {receiptData.id.slice(0, 8).toUpperCase()}
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

export default StudentPayments;
