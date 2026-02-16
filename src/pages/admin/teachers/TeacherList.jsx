import React, { useState, useEffect, useMemo } from 'react';
import Table, { TableRow, TableCell } from '../../../components/ui/Table';
import { Search, Pencil, Trash2, X, GraduationCap, UserPlus, Filter, Download, Zap, UserCheck, ShieldCheck, Star, Users, ArrowUpRight, Copy, Check, RefreshCw, ChevronLeft, ChevronRight, PieChart } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import StatsCard from '../../../components/ui/StatsCard';
import EmptyState from '../../../components/ui/EmptyState';
import { supabase } from '../../../lib/supabase';

const TeacherList = () => {
    const [teachers, setTeachers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isFormatModalOpen, setIsFormatModalOpen] = useState(false);
    const [editingTeacher, setEditingTeacher] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const itemsPerPage = 10;

    const [formData, setFormData] = useState({
        first_name: '',
        last_name: '',
        phone: '',
    });

    useEffect(() => {
        const timer = setTimeout(() => {
            fetchTeachers();
        }, 500);
        return () => clearTimeout(timer);
    }, [searchTerm, page]);

    const fetchTeachers = async () => {
        setLoading(true);
        try {
            const from = (page - 1) * itemsPerPage;
            const to = from + itemsPerPage - 1;

            let query = supabase
                .from('profiles')
                .select('id, first_name, last_name, full_name, phone, status, role', { count: 'exact' })
                .eq('role', 'teacher')
                .order('full_name', { ascending: true })
                .range(from, to);

            if (searchTerm) {
                query = query.or(`full_name.ilike.%${searchTerm}%,first_name.ilike.%${searchTerm}%,last_name.ilike.%${searchTerm}%,phone.ilike.%${searchTerm}%`);
            }

            const { data, count, error } = await query;

            if (error) throw error;
            setTeachers(data || []);
            setTotalPages(Math.ceil((count || 0) / itemsPerPage));
        } catch (err) {
            console.error('Error fetching teachers:', err);
            toast.error("O'qituvchilarni yuklashda xatolik");
        } finally {
            setLoading(false);
        }
    };

    const handleExport = () => {
        if (teachers.length === 0) return toast.error("Eksport qilish uchun ma'lumot yo'q");
        const headers = ['F.I.O', 'Telefon', 'Email', 'Holati'];

        const escapeCSV = (val) => {
            if (val === null || val === undefined) return '';
            const str = String(val);
            if (str.includes(',') || str.includes('"') || str.includes('\n')) {
                return `"${str.replace(/"/g, '""')}"`;
            }
            return str;
        };

        const rows = teachers.map(t => [
            t.full_name || `${t.first_name} ${t.last_name}`,
            t.phone,
            t.email,
            t.status
        ]);

        const csvContent = headers.map(escapeCSV).join(",") + "\n"
            + rows.map(r => r.map(escapeCSV).join(",")).join("\n");

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `terra_teachers_${format(new Date(), 'yyyy_MM_dd')}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast.success("O'qituvchilar ro'yxati yuklandi");
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Haqiqatan ham bu o\'qituvchini o\'chirmoqchimisiz?')) return;

        try {
            const { error } = await supabase.from('profiles').delete().eq('id', id);
            if (error) throw error;
            toast.success("O'qituvchi o'chirildi");
            fetchTeachers();
        } catch (err) {
            console.error('Error deleting teacher:', err);
            toast.error("O'chirishda xatolik");
        }
    };

    const handleEdit = (teacher) => {
        setEditingTeacher(teacher);
        setFormData({
            first_name: teacher.first_name || '',
            last_name: teacher.last_name || '',
            phone: teacher.phone || '',
        });
        setIsFormatModalOpen(true);
    };

    const [showInviteModal, setShowInviteModal] = useState(false);
    const [inviteLink, setInviteLink] = useState('');
    const [copied, setCopied] = useState(false);

    const generateTeacherCode = () => {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let code = 'TEA-';
        for (let i = 0; i < 6; i++) {
            code += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return code;
    };

    const handleAdd = () => {
        const code = generateTeacherCode();
        const link = `${window.location.origin}/register?role=teacher&code=${code}`;
        setInviteLink(link);
        setShowInviteModal(true);
    };

    const copyInviteLink = () => {
        navigator.clipboard.writeText(inviteLink);
        setCopied(true);
        toast.success("Havola nusxalandi!");
        setTimeout(() => setCopied(false), 2000);
    };

    const getStatusBadge = (status) => {
        switch (status) {
            case 'approved': return 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20';
            case 'pending': return 'bg-amber-500 text-white shadow-lg shadow-amber-500/20';
            case 'rejected': return 'bg-rose-500 text-white shadow-lg shadow-rose-500/20';
            default: return 'bg-slate-500 text-white shadow-lg shadow-slate-500/20';
        }
    };

    const stats = {
        total: teachers.length,
        active: teachers.filter(t => t.status === 'approved').length,
        pending: teachers.filter(t => t.status === 'pending').length,
        avgGroups: 3 // Mocked for now
    };

    return (
        <div className="space-y-8 animate-fade-in max-w-[1600px] mx-auto pb-10">
            {/* Intelligence Header */}
            <div className="relative group overflow-hidden rounded-[2.5rem] bg-slate-900 shadow-2xl">
                <div className="absolute inset-0 bg-gradient-to-br from-fuchsia-600 via-purple-600 to-slate-900 opacity-90 group-hover:scale-105 transition-transform duration-1000"></div>
                <div className="absolute inset-0 opacity-20 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] blend-overlay"></div>

                <div className="relative z-10 p-8 md:p-12 flex flex-col md:flex-row md:items-center justify-between gap-8">
                    <div>
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 rounded-full text-[10px] font-black uppercase tracking-widest mb-4 backdrop-blur-md border border-white/10 text-purple-200 shadow-inner"
                        >
                            <Zap size={12} className="text-yellow-300 fill-yellow-300" />
                            Mentorlar Boshqaruvi
                        </motion.div>
                        <h1 className="text-3xl md:text-5xl font-black text-white tracking-tight mb-3 italic">
                            O'qituvchilar <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-200 to-fuchsia-100 not-italic">Reyestri</span>
                        </h1>
                        <p className="text-purple-100/80 font-medium text-lg max-w-xl leading-relaxed">
                            Akademiya mentorlari faoliyatini va tarkibini dinamik boshqarish markazi.
                        </p>
                    </div>

                    <motion.button
                        whileHover={{ scale: 1.05, y: -5 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={handleAdd}
                        className="btn-primary from-white to-slate-100 !text-slate-900 shadow-xl shadow-white/10 !py-4 h-fit"
                    >
                        <UserPlus size={18} className="text-purple-600" />
                        O'qituvchi Qo'shish
                    </motion.button>
                </div>
            </div>

            {/* Matrix Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <StatsCard title="Jami Mentorlar" value={stats.total} icon={Users} color="purple" trend="+3 yangi" />
                <StatsCard title="Faol Mentorlar" value={stats.active} icon={ShieldCheck} color="emerald" trend="94%" />
                <StatsCard title="Ariza Holatida" value={stats.pending} icon={GraduationCap} color="amber" trend="Tezkor" />
                <StatsCard title="O'rtacha Yuklama" value={stats.avgGroups} icon={Star} color="fuchsia" trend="Barqaror" />
            </div>

            {/* Controls Bar */}
            <div className="glass-card p-2 flex flex-col md:flex-row md:items-center justify-between gap-4 sticky top-24 z-30">
                <div className="relative flex-1 max-w-md ml-2">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }}
                        placeholder="Ism, familiya yoki telefon raqami..."
                        className="w-full pl-12 pr-4 py-3 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-purple-500/20 focus:bg-white transition-all text-sm font-medium placeholder:text-slate-400"
                    />
                </div>
                <div className="flex gap-2 p-1">
                    <button
                        onClick={fetchTeachers}
                        disabled={loading}
                        className="p-3 bg-slate-100 text-slate-500 rounded-xl hover:bg-purple-600 hover:text-white transition-all shadow-sm active:scale-95 disabled:opacity-50"
                    >
                        <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
                    </button>
                    <button
                        onClick={handleExport}
                        className="flex items-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-xl hover:bg-slate-800 transition-all font-black text-[10px] uppercase tracking-widest shadow-lg shadow-slate-900/20 active:scale-95"
                    >
                        <Download size={16} />
                        EXPORT CSV
                    </button>
                </div>
            </div>

            {/* Content Area */}
            {loading ? (
                <div className="flex flex-col items-center justify-center py-20 gap-4">
                    <div className="w-12 h-12 border-4 border-purple-600/20 border-t-purple-600 rounded-full animate-spin"></div>
                    <p className="text-slate-400 font-black uppercase tracking-widest text-xs animate-pulse">Ma'lumotlar yuklanmoqda...</p>
                </div>
            ) : teachers.length === 0 ? (
                <EmptyState
                    icon={Users}
                    title="Mentorlar topilmadi"
                    description={searchTerm ? `"${searchTerm}" bo'yicha hech qanday mentor topilmadi.` : "Hozircha o'qituvchilar ro'yxati bo'sh."}
                />
            ) : (
                <div className="space-y-4">
                    <Table headers={["Mentor F.I.O", 'Bog\'lanish Maydoni', 'Xizmat Holati', 'Amallar']}>
                        {teachers.map((t) => (
                            <TableRow key={t.id} className="group/row">
                                <TableCell>
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-[1.2rem] bg-gradient-to-br from-purple-100 to-fuchsia-100 flex items-center justify-center text-purple-700 font-black shadow-inner group-hover/row:scale-110 transition-transform">
                                            {(t.full_name || t.first_name || 'U').charAt(0).toUpperCase()}
                                        </div>
                                        <div>
                                            <div className="font-black text-slate-900 group-hover/row:text-purple-700 transition-colors uppercase tracking-tight text-sm">
                                                {t.full_name || `${t.first_name || ''} ${t.last_name || ''}`}
                                            </div>
                                            <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">Akademik Mentor</div>
                                        </div>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <div className="flex flex-col gap-1">
                                        <div className="flex items-center gap-2 text-slate-600 font-bold text-xs font-mono">
                                            <Zap size={10} className="text-purple-500" />
                                            {t.phone || 'Noma\'lum'}
                                        </div>
                                        <div className="text-[10px] text-slate-400 lowercase italic font-medium">
                                            {t.email || 'email bog\'lanmagan'}
                                        </div>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <div className="flex items-center gap-3">
                                        <div className={`w-2 h-2 rounded-full ${t.status === 'approved' ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'}`}></div>
                                        <span className={`px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${getStatusBadge(t.status)}`}>
                                            {t.status === 'approved' ? 'Faol' : t.status === 'pending' ? 'Kutilmoqda' : 'Rad etilgan'}
                                        </span>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <div className="flex items-center gap-2 opacity-0 group-hover/row:opacity-100 transition-all translate-x-4 group-hover/row:translate-x-0">
                                        <button
                                            onClick={(e) => { e.stopPropagation(); handleEdit(t); }}
                                            className="p-3 bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white rounded-xl transition-all hover:scale-110 shadow-sm"
                                        >
                                            <Pencil size={18} />
                                        </button>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); handleDelete(t.id); }}
                                            className="p-3 bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white rounded-xl transition-all hover:scale-110 shadow-sm"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                        <button className="p-3 bg-slate-50 text-slate-600 hover:bg-slate-900 hover:text-white rounded-xl transition-all">
                                            <ArrowUpRight size={18} />
                                        </button>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))}
                    </Table>

                    {/* Pagination Controls */}
                    {totalPages > 1 && (
                        <div className="flex items-center justify-between mt-8 px-4 py-6 bg-white/50 backdrop-blur-md rounded-[2rem] border border-slate-100">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                Sahifa <span className="text-slate-900">{page}</span> / <span className="text-slate-900">{totalPages}</span>
                            </p>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setPage(p => Math.max(1, p - 1))}
                                    disabled={page <= 1}
                                    className="w-12 h-12 flex items-center justify-center bg-white border border-slate-200 text-slate-900 rounded-xl hover:bg-slate-50 disabled:opacity-40 transition-all shadow-sm active:scale-95"
                                >
                                    <ChevronLeft size={20} />
                                </button>
                                <button
                                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                    disabled={page >= totalPages}
                                    className="w-12 h-12 flex items-center justify-center bg-slate-900 text-white rounded-xl hover:bg-slate-800 disabled:opacity-40 transition-all shadow-lg shadow-slate-900/20 active:scale-95"
                                >
                                    <ChevronRight size={20} />
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Premium Modal */}
            <AnimatePresence>
                {isFormatModalOpen && (
                    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-slate-900/40 backdrop-blur-md"
                            onClick={() => setIsFormatModalOpen(false)}
                        />
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            className="bg-white rounded-[3rem] p-10 w-full max-w-lg relative z-10 shadow-2xl shadow-purple-900/20 border border-white/20"
                        >
                            <button
                                onClick={() => setIsFormatModalOpen(false)}
                                className="absolute top-8 right-8 p-3 bg-slate-50 hover:bg-slate-100 rounded-2xl text-slate-400 hover:text-slate-600 transition-colors"
                            >
                                <X size={20} />
                            </button>

                            <div className="mb-8">
                                <div className="w-16 h-16 bg-purple-50 rounded-2xl flex items-center justify-center text-purple-600 mb-6 shadow-inner">
                                    <UserCheck size={32} />
                                </div>
                                <h2 className="text-3xl font-black text-slate-900 tracking-tight italic">
                                    Mentor <span className="text-purple-600 not-italic">Tahriri</span>
                                </h2>
                                <p className="text-slate-500 mt-2 font-medium">O'qituvchining tizimdagi asosiy ma'lumotlarini yangilang.</p>
                            </div>

                            <form onSubmit={async (e) => {
                                e.preventDefault();
                                try {
                                    const { error } = await supabase
                                        .from('profiles')
                                        .update({
                                            first_name: formData.first_name,
                                            last_name: formData.last_name,
                                            phone: formData.phone,
                                        })
                                        .eq('id', editingTeacher.id);
                                    if (error) throw error;
                                    toast.success("Ma'lumotlar yangilandi");
                                    setIsFormatModalOpen(false);
                                    fetchTeachers();
                                } catch (err) {
                                    toast.error("Saqlashda xatolik yuz berdi");
                                }
                            }} className="space-y-6">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Ism</label>
                                        <input
                                            type="text"
                                            value={formData.first_name}
                                            onChange={e => setFormData({ ...formData, first_name: e.target.value })}
                                            className="input-field"
                                            required
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Familiya</label>
                                        <input
                                            type="text"
                                            value={formData.last_name}
                                            onChange={e => setFormData({ ...formData, last_name: e.target.value })}
                                            className="input-field"
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Telefon aloqasi</label>
                                    <input
                                        type="tel"
                                        value={formData.phone}
                                        onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                        className="input-field"
                                        placeholder="+998"
                                    />
                                </div>

                                <div className="pt-6 flex gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setIsFormatModalOpen(false)}
                                        className="flex-1 py-4 bg-slate-50 text-slate-600 font-black rounded-2xl hover:bg-slate-100 transition-all uppercase tracking-widest text-[10px]"
                                    >
                                        Bekor qilish
                                    </button>
                                    <button
                                        type="submit"
                                        className="flex-1 py-4 bg-slate-900 text-white font-black rounded-2xl hover:bg-slate-800 shadow-xl shadow-slate-900/20 transition-all uppercase tracking-widest text-[10px]"
                                    >
                                        Saqlash
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Invite Modal (Antigravity Level UX) */}
            <AnimatePresence>
                {showInviteModal && (
                    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-slate-900/60 backdrop-blur-xl"
                            onClick={() => setShowInviteModal(false)}
                        />
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0, rotateX: 20 }}
                            animate={{ scale: 1, opacity: 1, rotateX: 0 }}
                            exit={{ scale: 0.9, opacity: 0, rotateX: 20 }}
                            className="bg-white rounded-[3rem] p-12 w-full max-w-md relative z-10 shadow-[0_30px_100px_rgba(0,0,0,0.3)] border border-white/20"
                        >
                            <div className="text-center mb-8">
                                <div className="w-20 h-20 bg-purple-50 rounded-[2rem] flex items-center justify-center mx-auto mb-6 text-purple-600 shadow-inner">
                                    <UserPlus size={40} />
                                </div>
                                <h2 className="text-3xl font-black text-slate-900 tracking-tight italic">Mentor <span className="text-purple-600 not-italic">Inivite</span></h2>
                                <p className="text-slate-500 mt-2 font-medium">Ushbu kodi va havolani mentorga yuboring</p>
                            </div>

                            <div className="space-y-6">
                                <div className="p-8 bg-slate-50 rounded-[2.5rem] border border-slate-100 relative group/code overflow-hidden">
                                    <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-transparent opacity-0 group-hover/code:opacity-100 transition-opacity"></div>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 text-center relative z-10">O'qituvchi kodi</p>
                                    <p className="text-4xl font-mono font-black text-slate-900 text-center tracking-[0.3em] relative z-10">
                                        {inviteLink.split('code=')[1]}
                                    </p>
                                </div>

                                <div className="space-y-3">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 block">Reg-Link (Dinamik)</label>
                                    <div className="flex gap-2">
                                        <div className="flex-1 px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-[10px] font-bold text-slate-400 truncate font-mono">
                                            {inviteLink}
                                        </div>
                                        <button
                                            onClick={copyInviteLink}
                                            className="p-4 bg-slate-900 text-white rounded-2xl hover:bg-purple-600 transition-all shadow-lg active:scale-90"
                                        >
                                            {copied ? <Check size={20} className="text-emerald-400" /> : <Copy size={20} />}
                                        </button>
                                    </div>
                                </div>

                                <button
                                    onClick={() => setShowInviteModal(false)}
                                    className="w-full py-5 bg-slate-100 text-slate-900 font-black rounded-2xl hover:bg-slate-200 transition-all uppercase tracking-widest text-[10px]"
                                >
                                    Amallar bajarildi
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default TeacherList;

