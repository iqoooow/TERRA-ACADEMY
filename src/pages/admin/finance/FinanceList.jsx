import React, { useState, useEffect } from 'react';
import Table, { TableRow, TableCell } from '../../../components/ui/Table';
import { Search, Download, DollarSign, TrendingUp, AlertCircle, Eye, X, Trash2 } from 'lucide-react';
import StatsCard from '../../../components/ui/StatsCard';
import { supabase } from '../../../lib/supabase';

const FinanceList = () => {
    const [transactions, setTransactions] = useState([]);
    const [rawData, setRawData] = useState([]); // Store raw data for export
    const [students, setStudents] = useState([]);
    const [stats, setStats] = useState([
        { title: 'Jami daromad', value: '0 so\'m', change: '0%', icon: DollarSign, color: 'green' },
        { title: 'Kutilayotgan to\'lovlar', value: '0 so\'m', change: '0%', icon: AlertCircle, color: 'orange' },
        { title: 'O\'rtacha tranzaksiya', value: '0 so\'m', change: '0%', icon: TrendingUp, color: 'blue' },
    ]);
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
        const fetchFinance = async () => {
            try {
                const { supabase } = await import('../../../lib/supabase');
                const { data, error } = await supabase
                    .from('payments')
                    .select(`
                        *,
                        profiles (full_name, first_name, last_name)
                    `)
                    .order('created_at', { ascending: false });

                if (error) throw error;

                // Store raw data for export
                setRawData(data || []);

                // Process Data
                const formattedTrx = data?.map(t => {
                    // Format date properly
                    let formattedDate = '';
                    if (t.date) {
                        try {
                            const dateObj = new Date(t.date);
                            if (!isNaN(dateObj.getTime())) {
                                formattedDate = dateObj.toLocaleDateString('uz-UZ', {
                                    year: 'numeric',
                                    month: '2-digit',
                                    day: '2-digit'
                                });
                            } else {
                                formattedDate = t.date.split('T')[0]; // Fallback to YYYY-MM-DD
                            }
                        } catch {
                            formattedDate = t.date.split('T')[0];
                        }
                    }

                    // Format type with proper labels
                    const typeLabels = {
                        'tuition': 'Ta\'lim',
                        'books': 'Kitoblar',
                        'materials': 'Materiallar',
                        'other': 'Boshqa'
                    };

                    return {
                        id: t.id,
                        shortId: `TRX-${String(t.id).slice(-8)}`, // Last 8 characters
                        student: t.profiles?.full_name || `${t.profiles?.first_name || ''} ${t.profiles?.last_name || ''}`.trim() || 'Unknown',
                        date: formattedDate,
                        rawDate: t.date,
                        amount: Number(t.amount).toFixed(2),
                        type: t.type || 'other',
                        typeLabel: typeLabels[t.type] || t.type || 'Boshqa',
                        status: t.status.charAt(0).toUpperCase() + t.status.slice(1),
                        bg: t.status === 'paid' ? 'bg-green-100 text-green-700' : t.status === 'pending' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'
                    };
                }) || [];

                setTransactions(formattedTrx);

                // Calculate Stats
                const totalRev = data?.filter(t => t.status === 'paid').reduce((acc, curr) => acc + Number(curr.amount), 0) || 0;
                const pendingRev = data?.filter(t => t.status === 'pending').reduce((acc, curr) => acc + Number(curr.amount), 0) || 0;
                const avgTrx = data?.length ? (totalRev / data.length) : 0;

                setStats([
                    { title: 'Jami daromad', value: `${Number(totalRev).toLocaleString('uz-UZ')} so'm`, change: '+0%', icon: DollarSign, color: 'green' },
                    { title: 'Kutilayotgan to\'lovlar', value: `${Number(pendingRev).toLocaleString('uz-UZ')} so'm`, change: '0%', icon: AlertCircle, color: 'orange' },
                    { title: 'O\'rtacha tranzaksiya', value: `${Number(avgTrx).toLocaleString('uz-UZ', { maximumFractionDigits: 0 })} so'm`, change: '0%', icon: TrendingUp, color: 'blue' },
                ]);

            } catch (err) {
                console.error('Error fetching finance:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchFinance();
    }, []);

    useEffect(() => {
        const fetchStudents = async () => {
            try {
                const { data, error } = await supabase
                    .from('profiles')
                    .select('id, first_name, last_name, full_name, student_code')
                    .eq('role', 'student')
                    .eq('status', 'approved')
                    .order('first_name', { ascending: true });

                if (error) throw error;
                setStudents(data || []);
            } catch (err) {
                console.error('Error fetching students:', err);
            }
        };

        fetchStudents();
    }, []);

    const handleExport = () => {
        if (rawData.length === 0) {
            alert('Eksport qilish uchun ma\'lumot mavjud emas');
            return;
        }

        const typeLabels = { tuition: "Ta'lim", books: 'Kitoblar', materials: 'Materiallar', other: 'Boshqa' };
        const statusLabels = { paid: "To'langan", pending: 'Kutilmoqda', overdue: "Muddati o'tgan" };

        const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

        const formatDate = (d) => {
            if (!d) return '-';
            try {
                const dateObj = new Date(d);
                if (!isNaN(dateObj.getTime())) {
                    return dateObj.toLocaleDateString('uz-UZ', { year: 'numeric', month: '2-digit', day: '2-digit' });
                }
            } catch (_) {}
            return typeof d === 'string' ? d.split('T')[0] : '-';
        };

        const rows = rawData.map(item => {
            const studentName = item.profiles?.full_name ||
                `${item.profiles?.first_name || ''} ${item.profiles?.last_name || ''}`.trim() || '—';
            const type = typeLabels[item.type] || item.type || 'Boshqa';
            const status = statusLabels[item.status] || item.status || '—';
            const amount = `${Number(item.amount || 0).toLocaleString('uz-UZ')} so'm`;
            return { id: `TRX-${item.id}`, student: studentName, date: formatDate(item.date), type, amount, status };
        });

        const thead = '<tr><th>ID</th><th>O\'quvchi</th><th>Sana</th><th>Turi</th><th>Summa</th><th>Holat</th></tr>';
        const tbody = rows.map(r =>
            `<tr><td>${esc(r.id)}</td><td>${esc(r.student)}</td><td>${esc(r.date)}</td><td>${esc(r.type)}</td><td>${esc(r.amount)}</td><td>${esc(r.status)}</td></tr>`
        ).join('');

        const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>To'lovlar</title></head><body>
<table border="1" cellpadding="8" cellspacing="0" style="border-collapse:collapse;font-family:sans-serif;font-size:14px;">
<thead style="background:#f3f4f6;">${thead}</thead>
<tbody>${tbody}</tbody>
</table></body></html>`;

        const blob = new Blob(['\ufeff' + html], { type: 'application/vnd.ms-excel;charset=utf-8' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `tolovlar_${new Date().toISOString().split('T')[0]}.xls`;
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(link.href);
    };

    const refreshFinance = async () => {
        const { data, error } = await supabase
            .from('payments')
            .select(`*, profiles (full_name, first_name, last_name)`)
            .order('created_at', { ascending: false });
        if (error) throw error;
        setRawData(data || []);
        const typeLabels = { 'tuition': "Ta'lim", 'books': 'Kitoblar', 'materials': 'Materiallar', 'other': 'Boshqa' };
        const formattedTrx = (data || []).map(t => {
            let formattedDate = '';
            if (t.date) {
                try {
                    const d = new Date(t.date);
                    formattedDate = !isNaN(d.getTime()) ? d.toLocaleDateString('uz-UZ', { year: 'numeric', month: '2-digit', day: '2-digit' }) : t.date.split('T')[0];
                } catch { formattedDate = t.date.split('T')[0]; }
            }
            return {
                id: t.id,
                shortId: `TRX-${String(t.id).slice(-8)}`,
                student: t.profiles?.full_name || `${t.profiles?.first_name || ''} ${t.profiles?.last_name || ''}`.trim() || 'Unknown',
                date: formattedDate,
                rawDate: t.date,
                amount: Number(t.amount).toFixed(2),
                type: t.type || 'other',
                typeLabel: typeLabels[t.type] || t.type || 'Boshqa',
                status: t.status.charAt(0).toUpperCase() + t.status.slice(1),
                bg: t.status === 'paid' ? 'bg-green-100 text-green-700' : t.status === 'pending' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'
            };
        });
        setTransactions(formattedTrx);
        const totalRev = (data || []).filter(t => t.status === 'paid').reduce((a, c) => a + Number(c.amount), 0) || 0;
        const pendingRev = (data || []).filter(t => t.status === 'pending').reduce((a, c) => a + Number(c.amount), 0) || 0;
        const avgTrx = (data || []).length ? totalRev / (data || []).length : 0;
        setStats([
            { title: 'Jami daromad', value: `${Number(totalRev).toLocaleString('uz-UZ')} so'm`, change: '+0%', icon: DollarSign, color: 'green' },
            { title: "Kutilayotgan to'lovlar", value: `${Number(pendingRev).toLocaleString('uz-UZ')} so'm`, change: '0%', icon: AlertCircle, color: 'orange' },
            { title: "O'rtacha tranzaksiya", value: `${Number(avgTrx).toLocaleString('uz-UZ', { maximumFractionDigits: 0 })} so'm`, change: '0%', icon: TrendingUp, color: 'blue' },
        ]);
    };

    const handleDeletePayment = async (e, id) => {
        e?.preventDefault?.();
        e?.stopPropagation?.();
        if (!id) return;
        if (!confirm('Ushbu to\'lovni o\'chirishni xohlaysizmi?')) return;
        setDeletingId(id);
        try {
            const { error } = await supabase.from('payments').delete().eq('id', id);
            if (error) throw error;
            await refreshFinance();
            alert('To\'lov o\'chirildi.');
        } catch (err) {
            console.error('To\'lovni o\'chirishda xatolik:', err);
            alert('O\'chirishda xatolik: ' + (err.message || ''));
        } finally {
            setDeletingId(null);
        }
    };

    const parseAmount = (v) => {
        if (v == null || v === '') return NaN;
        const s = String(v).trim().replace(/\s/g, '').replace(',', '.');
        return parseFloat(s);
    };

    const handleAddPayment = async (e) => {
        e?.preventDefault?.();
        if (submitting) return;
        setSubmitting(true);

        try {
            const studentId = (formData.student_id || '').trim();
            const amountRaw = formData.amount;
            const amount = parseAmount(amountRaw);
            const date = (formData.date || '').trim();

            if (!studentId) {
                setSubmitting(false);
                alert('O\'quvchini tanlang.');
                return;
            }
            if (amountRaw === '' || amountRaw == null) {
                setSubmitting(false);
                alert('Summani kiriting.');
                return;
            }
            if (Number.isNaN(amount) || amount < 0) {
                setSubmitting(false);
                alert('Summa noto\'g\'ri. Faqat musbat son kiriting (masalan: 500000 yoki 500000,50).');
                return;
            }
            if (!date) {
                setSubmitting(false);
                alert('Sanani tanlang.');
                return;
            }

            const { error } = await supabase
                .from('payments')
                .insert([{
                    student_id: studentId,
                    amount: amount,
                    type: formData.type || 'tuition',
                    status: formData.status || 'paid',
                    date: date
                }]);

            if (error) throw error;

            setFormData({
                student_id: '',
                amount: '',
                type: 'tuition',
                status: 'paid',
                date: new Date().toISOString().split('T')[0]
            });
            setIsModalOpen(false);
            await refreshFinance();
            alert('To\'lov muvaffaqiyatli qo\'shildi.');
        } catch (err) {
            console.error('Error adding payment:', err);
            alert('To\'lov qo\'shishda xatolik: ' + (err?.message || 'Noma\'lum xatolik'));
        } finally {
            setSubmitting(false);
        }
    };

    const filteredTransactions = transactions.filter(trx => {
        if (!searchQuery) return true;
        const query = searchQuery.toLowerCase();
        return (
            (trx.shortId || trx.id || '').toLowerCase().includes(query) ||
            trx.student.toLowerCase().includes(query) ||
            (trx.typeLabel || trx.type || '').toLowerCase().includes(query) ||
            trx.status.toLowerCase().includes(query) ||
            trx.amount.includes(query)
        );
    });

    return (
        <div className="space-y-4">
            {/* Header with Search and Actions */}
            <div className="bg-white rounded-lg border border-gray-200 p-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input
                            type="text"
                            placeholder="Izlash..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-sm"
                        />
                    </div>
                    <div className="flex gap-2">
                        <button 
                            onClick={handleExport}
                            className="flex items-center gap-2 px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-all text-sm font-medium"
                        >
                            <Download size={16} />
                            <span>Eksport</span>
                        </button>
                        <button 
                            onClick={() => setIsModalOpen(true)}
                            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-lg hover:from-cyan-600 hover:to-blue-600 transition-all shadow-lg shadow-cyan-500/30 text-sm font-medium"
                        >
                            <DollarSign size={18} />
                            <span>To'lov qo'shish</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Finance Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {stats.map((stat, i) => (
                    <StatsCard key={i} {...stat} />
                ))}
            </div>

            {/* Transactions Table */}
            <div className="space-y-4">
                {loading ? (
                    <div className="text-center py-10">Loading transactions...</div>
                ) : (
                    <Table headers={['ID', 'O\'quvchi', 'Sana', 'Turi', 'Summa', 'Holat', 'Amallar']}>
                        {filteredTransactions.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                                    {searchQuery ? 'Hech qanday natija topilmadi' : 'To\'lovlar mavjud emas'}
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredTransactions.map((trx) => (
                                <TableRow key={trx.id}>
                                    <TableCell>
                                        <span className="font-mono text-xs text-gray-600 font-medium" title={trx.id}>
                                            {trx.shortId || trx.id}
                                        </span>
                                    </TableCell>
                                    <TableCell>
                                        <div className="font-medium text-gray-900">{trx.student}</div>
                                    </TableCell>
                                    <TableCell>
                                        <span className="text-sm text-gray-700 whitespace-nowrap">
                                            {trx.date || '-'}
                                        </span>
                                    </TableCell>
                                    <TableCell>
                                        <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded-md text-xs font-medium">
                                            {trx.typeLabel || trx.type}
                                        </span>
                                    </TableCell>
                                    <TableCell className="font-bold text-gray-800">
                                        {Number(trx.amount).toLocaleString('uz-UZ')} so'm
                                    </TableCell>
                                    <TableCell>
                                        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${trx.bg}`}>
                                            {trx.status}
                                        </span>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            <button
                                                type="button"
                                                onClick={() => setViewingTrx(trx)}
                                                className="w-8 h-8 flex items-center justify-center bg-gray-500 hover:bg-gray-600 text-white rounded-full shadow-md hover:shadow-lg transition-all duration-200 hover:scale-110"
                                                title="Ko'rish"
                                            >
                                                <Eye size={14} />
                                            </button>
                                            <button
                                                type="button"
                                                onClick={(e) => handleDeletePayment(e, trx.id)}
                                                disabled={deletingId === trx.id}
                                                className="w-8 h-8 flex items-center justify-center bg-red-500 hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-full shadow-md hover:shadow-lg transition-all duration-200 hover:scale-110"
                                                title="O'chirish"
                                            >
                                                {deletingId === trx.id ? (
                                                    <span className="inline-block w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                                ) : (
                                                    <Trash2 size={14} />
                                                )}
                                            </button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </Table>
                )}
            </div>

            {/* View Transaction Modal */}
            {viewingTrx && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 overflow-y-auto p-4" onClick={() => setViewingTrx(null)}>
                    <div className="bg-white rounded-2xl w-full max-w-md my-8 shadow-2xl" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-between p-6 border-b">
                            <h2 className="text-xl font-bold text-gray-900">To&apos;lov tafsilotlari</h2>
                            <button 
                                type="button"
                                onClick={() => setViewingTrx(null)}
                                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                            >
                                <X size={20} className="text-gray-400" />
                            </button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div>
                                <span className="text-sm text-gray-500 block mb-1">ID</span>
                                <span className="font-mono text-sm font-medium text-gray-900">{viewingTrx.shortId || viewingTrx.id}</span>
                            </div>
                            <div>
                                <span className="text-sm text-gray-500 block mb-1">O&apos;quvchi</span>
                                <span className="font-medium text-gray-900">{viewingTrx.student}</span>
                            </div>
                            <div>
                                <span className="text-sm text-gray-500 block mb-1">Sana</span>
                                <span className="text-gray-900">{viewingTrx.date || '-'}</span>
                            </div>
                            <div>
                                <span className="text-sm text-gray-500 block mb-1">To&apos;lov turi</span>
                                <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded-md text-sm font-medium">{viewingTrx.typeLabel || viewingTrx.type}</span>
                            </div>
                            <div>
                                <span className="text-sm text-gray-500 block mb-1">Summa</span>
                                <span className="text-lg font-bold text-gray-900">{Number(viewingTrx.amount).toLocaleString('uz-UZ')} so&apos;m</span>
                            </div>
                            <div>
                                <span className="text-sm text-gray-500 block mb-1">Holat</span>
                                <span className={`px-2.5 py-1 rounded-full text-sm font-semibold ${viewingTrx.bg}`}>{viewingTrx.status}</span>
                            </div>
                        </div>
                        <div className="p-6 pt-0">
                            <button
                                type="button"
                                onClick={() => setViewingTrx(null)}
                                className="w-full px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors font-medium"
                            >
                                Yopish
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Add Payment Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 overflow-y-auto p-4">
                    <div className="bg-white rounded-2xl w-full max-w-lg my-8 shadow-2xl" onClick={(e) => e.stopPropagation()}>
                        {/* Header */}
                        <div className="flex items-center justify-between p-6 border-b">
                            <h2 className="text-xl font-bold text-gray-900">To'lov qo'shish</h2>
                            <button 
                                onClick={() => setIsModalOpen(false)}
                                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                            >
                                <X size={20} className="text-gray-400" />
                            </button>
                        </div>

                        {/* Form */}
                        <form onSubmit={handleAddPayment} className="p-6 space-y-4" noValidate>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    O'quvchi
                                </label>
                                <select
                                    value={formData.student_id}
                                    onChange={(e) => setFormData({ ...formData, student_id: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                                    aria-required
                                >
                                    <option value="">O'quvchini tanlang</option>
                                    {students.map((student) => (
                                        <option key={student.id} value={student.id}>
                                            {student.full_name || `${student.first_name || ''} ${student.last_name || ''}`.trim()}
                                            {student.student_code ? ` (${student.student_code})` : ''}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Summa (so'm)
                                </label>
                                <input
                                    type="text"
                                    inputMode="decimal"
                                    value={formData.amount}
                                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                                    placeholder="Masalan: 500000 yoki 500000,50"
                                    aria-required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    To'lov turi
                                </label>
                                <select
                                    value={formData.type}
                                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                                >
                                    <option value="tuition">Tuition (Ta'lim)</option>
                                    <option value="books">Books (Kitoblar)</option>
                                    <option value="materials">Materials (Materiallar)</option>
                                    <option value="other">Other (Boshqa)</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Holat
                                </label>
                                <select
                                    value={formData.status}
                                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                                >
                                    <option value="paid">Paid (To'langan)</option>
                                    <option value="pending">Pending (Kutilmoqda)</option>
                                    <option value="overdue">Overdue (Muddati o'tgan)</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Sana
                                </label>
                                <input
                                    type="date"
                                    value={formData.date}
                                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                                    aria-required
                                />
                            </div>

                            {/* Actions */}
                            <div className="flex gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                                >
                                    Bekor qilish
                                </button>
                                <button
                                    type="button"
                                    disabled={submitting}
                                    onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        handleAddPayment(e);
                                    }}
                                    className="flex-1 px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-lg hover:from-cyan-600 hover:to-blue-600 transition-all shadow-lg shadow-cyan-500/30 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {submitting ? 'Saqlanmoqda...' : 'Saqlash'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default FinanceList;
