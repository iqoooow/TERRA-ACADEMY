import { useState, useEffect } from 'react';
import { X, Phone, ShieldCheck, Users, Link as RLink, CheckCircle, Clock, Download } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../../lib/supabase';
import { toast } from 'react-hot-toast';
import Table, { TableRow, TableCell } from '../../components/ui/Table';
import StatsCard from '../../components/ui/StatsCard';
import EmptyState from '../../components/ui/EmptyState';

const RegistrationRequests = () => {
    const [parentLinks, setParentLinks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedRequest, setSelectedRequest] = useState(null);
    const [actionLoading, setActionLoading] = useState(false);

    const handleExport = () => {
        if (!parentLinks.length) return toast.error("Eksport qilish uchun ma'lumot yo'q");

        const escapeCSV = (val) => {
            if (val === null || val === undefined) return '';
            const str = String(val);
            return str.includes(',') || str.includes('"') || str.includes('\n')
                ? `"${str.replace(/"/g, '""')}"` : str;
        };

        const headers = ['Ota-ona', 'Farzand', 'Farzand kodi', 'Sana'];
        const rows = parentLinks.map(l => [
            `${l.parent?.first_name || ''} ${l.parent?.last_name || ''}`.trim(),
            `${l.student?.first_name || ''} ${l.student?.last_name || ''}`.trim(),
            l.student?.student_code || '',
            new Date(l.created_at).toLocaleDateString()
        ]);
        let csvContent = headers.map(escapeCSV).join(',') + '\n' + rows.map(r => r.map(escapeCSV).join(',')).join('\n');

        const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `arizalar_${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        toast.success('Hisobot yuklab olindi');
    };

    const fetchData = async () => {
        setLoading(true);
        try {
            const { data: links, error: linkError } = await supabase
                .from('parent_student')
                .select(`
                    *,
                    parent:parent_id(id, first_name, last_name, phone),
                    student:student_id(id, first_name, last_name, student_code)
                `)
                .eq('status', 'pending');

            if (linkError) throw linkError;
            setParentLinks(links || []);
        } catch (err) {
            console.error('RegistrationRequests fetchData error:', err);
            toast.error("Ma'lumotlarni yuklashda xatolik");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
        const channel = supabase.channel('requests-realtime')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'parent_student' }, () => fetchData())
            .subscribe();
        return () => supabase.removeChannel(channel);
    }, []);

    const handleAction = async (id, action) => {
        setActionLoading(true);
        try {
            const status = action === 'approve' ? 'approved' : 'rejected';
            const { error } = await supabase
                .from('parent_student')
                .update({ status })
                .eq('id', id);
            if (error) throw error;
            toast.success(action === 'approve' ? "Bog'lanish tasdiqlandi" : "Bog'lanish rad etildi");
            setSelectedRequest(null);
            fetchData();
        } catch (err) {
            toast.error('Xatolik yuz berdi: ' + err.message);
        } finally {
            setActionLoading(false);
        }
    };

    return (
        <div className="space-y-8 animate-fade-in max-w-[1600px] mx-auto pb-10">
            {/* Intelligence Header */}
            <div className="relative overflow-hidden rounded-[2.5rem] bg-slate-900 shadow-lg">
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-700 via-violet-700 to-slate-900 opacity-95"></div>

                <div className="relative z-10 p-8 md:p-12 flex flex-col md:flex-row md:items-center justify-between gap-8">
                    <div>
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 rounded-full text-[10px] font-black uppercase tracking-widest mb-4 backdrop-blur-md border border-white/10 text-indigo-200 shadow-inner"
                        >
                            <ShieldCheck size={12} className="text-emerald-400" />
                            Xavfsizlik va Verifikatsiya
                        </motion.div>
                        <h1 className="text-3xl md:text-5xl font-black text-white tracking-tight mb-3 italic">
                            Arizalar <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-200 to-violet-100 not-italic">Markazi</span>
                        </h1>
                        <p className="text-indigo-100/80 font-medium text-lg max-w-xl leading-relaxed">
                            Yangi foydalanuvchilarni tasdiqlash va ota-ona-bola bog'lanishlarini boshqarish.
                        </p>
                    </div>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <StatsCard title="Kutilayotgan bog'lanishlar" value={parentLinks.length} icon={RLink} color="indigo" trend="Kutmoqda" />
                <StatsCard title="Ota-ona so'rovlari" value={parentLinks.length} icon={Users} color="amber" trend="Pending" />
            </div>

            {/* Controls Bar */}
            <div className="glass-card p-2 flex flex-col md:flex-row md:items-center justify-between gap-4 sticky top-24 z-30">
                <div className="flex bg-slate-100 p-1 rounded-2xl">
                    <div className="flex items-center gap-3 px-6 py-2.5 rounded-xl bg-white text-indigo-600 shadow-xl shadow-indigo-500/10">
                        <RLink size={16} className="text-indigo-600" />
                        <span className="text-[10px] font-black uppercase tracking-widest">Bog'lanishlar</span>
                        {parentLinks.length > 0 && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-indigo-100 text-indigo-600">
                                {parentLinks.length}
                            </span>
                        )}
                    </div>
                </div>

                <div className="flex gap-2 p-1">
                    <button
                        onClick={handleExport}
                        className="flex items-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-xl hover:bg-slate-800 transition-all font-black text-[10px] uppercase tracking-widest shadow-lg shadow-slate-900/20 active:scale-95"
                    >
                        <Download size={16} />
                        Eksport
                    </button>
                </div>
            </div>

            {loading ? (
                <div className="flex flex-col items-center justify-center py-40 space-y-4">
                    <div className="w-12 h-12 border-4 border-indigo-600/20 border-t-indigo-600 rounded-full animate-spin"></div>
                    <p className="text-slate-400 font-bold uppercase tracking-[0.2em] text-[10px] animate-pulse">Yuklanmoqda...</p>
                </div>
            ) : parentLinks.length === 0 ? (
                <EmptyState
                    icon={CheckCircle}
                    title="Kutilayotgan bog'lanishlar yo'q"
                    description="Hozirda barcha ota-ona bog'lanish so'rovlari ko'rib chiqilgan."
                />
            ) : (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="pt-4"
                >
                    <Table headers={['Ota-ona', 'Farzand', 'Aloqa', 'Amallar']}>
                        {parentLinks.map((req) => (
                            <TableRow key={req.id} className="group cursor-default">
                                <TableCell>
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-white font-black text-lg shadow-lg bg-gradient-to-br from-orange-400 to-amber-600">
                                            {req.parent?.first_name?.[0]?.toUpperCase()}
                                        </div>
                                        <div>
                                            <div className="font-bold text-slate-900">
                                                {req.parent?.first_name} {req.parent?.last_name}
                                            </div>
                                            <div className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-0.5">
                                                Ota-ona
                                            </div>
                                        </div>
                                    </div>
                                </TableCell>

                                <TableCell>
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600 font-black text-xs">
                                            {req.student?.first_name?.[0]}
                                        </div>
                                        <div>
                                            <div className="text-xs font-bold text-slate-700">{req.student?.first_name} {req.student?.last_name}</div>
                                            <div className="text-[9px] text-blue-500 font-black uppercase tracking-wider">#{req.student?.student_code}</div>
                                        </div>
                                    </div>
                                </TableCell>

                                <TableCell>
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-2 text-xs font-medium text-slate-600">
                                            <Phone size={12} className="text-slate-400" />
                                            {req.parent?.phone || '—'}
                                        </div>
                                        <div className="flex items-center gap-2 text-[10px] text-slate-400 font-bold">
                                            <Clock size={10} />
                                            {new Date(req.created_at).toLocaleDateString()}
                                        </div>
                                    </div>
                                </TableCell>

                                <TableCell>
                                    <div className="flex items-center gap-3">
                                        <button
                                            onClick={() => setSelectedRequest({ ...req, type: 'link', action: 'approve' })}
                                            className="px-4 py-2 bg-emerald-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-600 hover:scale-105 transition-all shadow-lg shadow-emerald-500/20"
                                        >
                                            Tasdiqlash
                                        </button>
                                        <button
                                            onClick={() => setSelectedRequest({ ...req, type: 'link', action: 'reject' })}
                                            className="p-2 bg-rose-50 text-rose-500 rounded-xl hover:bg-rose-500 hover:text-white transition-all hover:rotate-90"
                                            title="Rad etish"
                                        >
                                            <X size={16} />
                                        </button>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))}
                    </Table>
                </motion.div>
            )}

            {/* Premium Confirmation Modal */}
            <AnimatePresence>
                {selectedRequest && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
                            onClick={() => setSelectedRequest(null)}
                        />
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            className="bg-white rounded-[3rem] p-10 max-w-md w-full shadow-2xl relative z-10 border border-white/20"
                        >
                            <div className={`w-24 h-24 rounded-[2rem] flex items-center justify-center mx-auto mb-8 shadow-2xl ${selectedRequest.action === 'approve' ? 'bg-emerald-500 text-white shadow-emerald-200' : 'bg-rose-500 text-white shadow-rose-200'
                                }`}>
                                {selectedRequest.action === 'approve' ? <CheckCircle size={48} /> : <X size={48} />}
                            </div>

                            <h2 className="text-3xl font-black text-slate-900 text-center mb-2 tracking-tight">
                                {selectedRequest.action === 'approve' ? 'Tasdiqlaysizmi?' : 'Rad etasizmi?'}
                            </h2>
                            <p className="text-slate-500 text-center mb-8 font-medium leading-relaxed">
                                {selectedRequest.type === 'link' ? (
                                    <>
                                        <span className="text-slate-900 font-bold">{selectedRequest.parent?.first_name}</span> va <span className="text-slate-900 font-bold">{selectedRequest.student?.first_name}</span> o'rtasidagi bog'lanishni qayta ishlaymiz.
                                    </>
                                ) : (
                                    <>
                                        <span className="text-slate-900 font-bold">{selectedRequest.first_name}</span> ismli foydalanuvchiga platforma uchun ruxsat beramiz.
                                    </>
                                )}
                            </p>

                            <div className="flex gap-4 pt-4">
                                <button
                                    onClick={() => setSelectedRequest(null)}
                                    className="flex-1 py-4 bg-slate-100 text-slate-400 hover:bg-slate-200 hover:text-slate-600 rounded-2xl transition-all font-black text-[10px] uppercase tracking-widest"
                                >
                                    Bekor qilish
                                </button>
                                <button
                                    onClick={() => handleAction(selectedRequest.id, selectedRequest.action)}
                                    disabled={actionLoading}
                                    className={`flex-1 py-4 text-white rounded-2xl shadow-xl transition-all font-black text-[10px] uppercase tracking-widest ${selectedRequest.action === 'approve' ? 'bg-emerald-500 hover:bg-emerald-600 shadow-emerald-500/30' : 'bg-rose-500 hover:bg-rose-600 shadow-rose-500/30'
                                        } ${actionLoading ? 'opacity-70 cursor-wait' : ''}`}
                                >
                                    {actionLoading ? 'Kutilmoqda...' : 'Tasdiqlash'}
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default RegistrationRequests;

