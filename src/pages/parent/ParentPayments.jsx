import { useState, useEffect } from 'react';
import Table, { TableRow, TableCell } from '../../components/ui/Table';
import { supabase } from '../../lib/supabase';
import { useSearchParams } from 'react-router-dom';

import { CreditCard, CheckCircle2, AlertCircle, Calendar, DollarSign, Download } from 'lucide-react';
import LoadingScreen from '../../components/common/LoadingScreen';
import { format } from 'date-fns';

const ParentPayments = () => {
    const [searchParams] = useSearchParams();
    const studentId = searchParams.get('id');
    const [payments, setPayments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [studentInfo, setStudentInfo] = useState(null);

    useEffect(() => {
        if (studentId) {
            fetchPaymentData();
        }
    }, [studentId]);

    const fetchPaymentData = async () => {
        try {
            // 1. Get Student Info
            const { data: student } = await supabase.from('profiles').select('full_name').eq('id', studentId).single();
            setStudentInfo(student);

            // 2. Get Payments
            const { data: paymentsData, error } = await supabase
                .from('monthly_payments')
                .select('*')
                .eq('student_id', studentId)
                .order('payment_month', { ascending: false });

            if (error) throw error;
            setPayments(paymentsData || []);
        } catch (err) {
            console.error('Error fetching payments:', err);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <LoadingScreen />;

    return (
        <div className="space-y-8 animate-fade-in max-w-[1600px] mx-auto pb-10">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight italic">
                        <span className="text-emerald-600 uppercase not-italic text-sm tracking-[0.3em] font-black block mb-2">Finance</span>
                        {studentInfo?.full_name} — To'lovlar
                    </h1>
                    <p className="text-slate-500 font-medium">Oylik to'lovlar va tranzaksiyalar tarixi</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="glass-card p-6 border-slate-100 bg-white flex items-center gap-4">
                    <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center">
                        <DollarSign size={24} />
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Jami To'langan</p>
                        <p className="text-2xl font-black text-slate-900">
                            {payments.filter(p => p.status === 'paid').reduce((sum, p) => sum + (p.amount || 0), 0).toLocaleString()} UZS
                        </p>
                    </div>
                </div>
                <div className="glass-card p-6 border-slate-100 bg-white flex items-center gap-4">
                    <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center">
                        <AlertCircle size={24} />
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Kutilayotgan</p>
                        <p className="text-2xl font-black text-slate-900">
                            {payments.filter(p => p.status === 'unpaid').reduce((sum, p) => sum + (p.amount || 0), 0).toLocaleString()} UZS
                        </p>
                    </div>
                </div>
                <div className="glass-card p-6 border-slate-100 bg-white flex items-center gap-4">
                    <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center">
                        <Calendar size={24} />
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Oxirgi To'lov</p>
                        <p className="text-2xl font-black text-slate-900">
                            {payments.filter(p => p.status === 'paid')[0]?.payment_date ? format(new Date(payments.filter(p => p.status === 'paid')[0].payment_date), 'dd.MM.yy') : '—'}
                        </p>
                    </div>
                </div>
            </div>

            <div className="glass-card overflow-hidden">
                <div className="p-8 border-b border-slate-100">
                    <h3 className="text-xl font-black text-slate-900 flex items-center gap-3">
                        <CreditCard className="text-emerald-500" size={20} />
                        To'lov Ma'lumotlari
                    </h3>
                </div>
                {payments.length === 0 ? (
                    <div className="p-20 text-center flex flex-col items-center justify-center">
                        <CreditCard size={48} className="text-slate-200 mb-4" />
                        <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">To'lovlar topilmadi</p>
                    </div>
                ) : (
                    <Table headers={['ID', 'Oy', 'Summa', 'Sana', 'Holat', 'Kvitansiya']}>
                        {payments.map((p) => (
                            <TableRow key={p.id} className="group hover:bg-slate-50 transition-colors">
                                <TableCell className="font-mono text-[10px] text-slate-400 font-bold">#{p.id.slice(0, 8).toUpperCase()}</TableCell>
                                <TableCell className="font-black text-slate-900 uppercase text-xs tracking-wider">{p.payment_month || '—'}</TableCell>
                                <TableCell className="font-black text-emerald-600">{(p.amount || 0).toLocaleString()} UZS</TableCell>
                                <TableCell className="text-slate-500 font-bold text-xs">{p.payment_date ? format(new Date(p.payment_date), 'dd.MM.yyyy') : '—'}</TableCell>
                                <TableCell>
                                    {p.status === 'paid' ? (
                                        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full text-[10px] font-black uppercase tracking-widest border border-emerald-100">
                                            <CheckCircle2 size={12} /> To'langan
                                        </span>
                                    ) : (
                                        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-50 text-amber-600 rounded-full text-[10px] font-black uppercase tracking-widest border border-amber-100">
                                            <AlertCircle size={12} /> To'lanmagan
                                        </span>
                                    )}
                                </TableCell>
                                <TableCell>
                                    <button className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all">
                                        <Download size={18} />
                                    </button>
                                </TableCell>
                            </TableRow>
                        ))}
                    </Table>
                )}
            </div>
        </div>
    );
};

export default ParentPayments;
