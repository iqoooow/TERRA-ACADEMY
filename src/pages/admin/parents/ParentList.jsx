import { useState, useEffect } from 'react';
import Table, { TableRow, TableCell } from '../../../components/ui/Table';
import { Search, Pencil, Trash2, X, Users, UserPlus, Download, Zap, ShieldCheck, Heart, LayoutGrid, ArrowUpRight, RefreshCw, ChevronLeft, ChevronRight, Link2, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import CreateUserModal from '../users/CreateUserModal';
import { supabase } from '../../../lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import StatsCard from '../../../components/ui/StatsCard';
import EmptyState from '../../../components/ui/EmptyState';
import { format } from 'date-fns';

const ParentList = () => {
    const navigate = useNavigate();
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [parents, setParents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isFormatModalOpen, setIsFormatModalOpen] = useState(false);
    const [editingParent, setEditingParent] = useState(null);
    const [formData, setFormData] = useState({ first_name: '', last_name: '', phone: '' });
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const pageSize = 10;

    useEffect(() => {
        const timer = setTimeout(() => {
            fetchParents(currentPage);
        }, 500);
        return () => clearTimeout(timer);
    }, [currentPage, searchTerm]);

    const fetchParents = async (page = 1) => {
        setLoading(true);
        try {
            const from = (page - 1) * pageSize;
            const to = from + pageSize - 1;

            let query = supabase
                .from('profiles')
                .select('*', { count: 'exact' })
                .eq('role', 'parent')
                .order('created_at', { ascending: false })
                .range(from, to);

            if (searchTerm) {
                query = query.or(`full_name.ilike.%${searchTerm}%,first_name.ilike.%${searchTerm}%,last_name.ilike.%${searchTerm}%,phone.ilike.%${searchTerm}%`);
            }

            const { data: parentsData, count, error } = await query;

            if (error) throw error;

            const formattedParents = (parentsData || []).map(p => ({
                ...p,
                children_count: 0,
                status: p.status || 'active',
            }));

            setParents(formattedParents);

            if (count) {
                setTotalPages(Math.ceil(count / pageSize));
            }
        } catch (err) {
            console.error('Error fetching parents:', err);
            toast.error("Ota-onalarni yuklashda xatolik");
        } finally {
            setLoading(false);
        }
    };

    const handleExport = () => {
        if (parents.length === 0) return toast.error("Eksport qilish uchun ma'lumot yo'q");
        const headers = ['F.I.O', 'Telefon', 'Holati'];

        const escapeCSV = (val) => {
            if (val === null || val === undefined) return '';
            const str = String(val);
            if (str.includes(',') || str.includes('"') || str.includes('\n')) {
                return `"${str.replace(/"/g, '""')}"`;
            }
            return str;
        };

        const rows = parents.map(p => [
            p.full_name || `${p.first_name} ${p.last_name}`,
            p.phone,
            p.status
        ]);

        const csvContent = headers.map(escapeCSV).join(",") + "\n"
            + rows.map(r => r.map(escapeCSV).join(",")).join("\n");

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `terra_parents_${format(new Date(), 'yyyy_MM_dd')}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast.success("Ota-onalar ro'yxati yuklandi");
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Haqiqatan ham bu ota-onani o\'chirmoqchimisiz?')) return;
        try {
            const { error } = await supabase.from('profiles').delete().eq('id', id);
            if (error) throw error;
            toast.success("Ota-ona o'chirildi");
            fetchParents(currentPage);
        } catch (err) {
            console.error('Error deleting parent:', err);
            toast.error("O'chirishda xatolik");
        }
    };

    const handleEdit = (parent) => {
        setEditingParent(parent);
        setFormData({
            first_name: parent.first_name || '',
            last_name: parent.last_name || '',
            phone: parent.phone || ''
        });
        setIsFormatModalOpen(true);
    };

    // "Farzand qo'shish" modal state
    const [linkModal, setLinkModal] = useState(null); // parent object or null
    const [studentSearch, setStudentSearch] = useState('');
    const [studentResults, setStudentResults] = useState([]);
    const [isSearching, setIsSearching] = useState(false);
    const [linkRelType, setLinkRelType] = useState('guardian');
    const [isLinking, setIsLinking] = useState(false);

    const handleOpenLinkModal = (parent) => {
        setLinkModal(parent);
        setStudentSearch('');
        setStudentResults([]);
        setLinkRelType('guardian');
    };

    const handleStudentSearch = async (val) => {
        setStudentSearch(val);
        if (!val.trim()) { setStudentResults([]); return; }
        setIsSearching(true);
        try {
            const { data } = await supabase
                .from('profiles')
                .select('id, full_name, first_name, last_name, student_code')
                .eq('role', 'student')
                .eq('status', 'approved')
                .or(`full_name.ilike.%${val}%,student_code.ilike.%${val}%`)
                .limit(6);
            setStudentResults(data || []);
        } finally {
            setIsSearching(false);
        }
    };

    const handleCreateLink = async (student) => {
        if (!linkModal) return;
        setIsLinking(true);
        try {
            const { error } = await supabase.from('parent_student').upsert({
                parent_id: linkModal.id,
                student_id: student.id,
                status: 'pending',
                relationship_type: linkRelType,
            }, { onConflict: 'parent_id,student_id', ignoreDuplicates: true });
            if (error) throw error;
            toast.success(`${student.full_name || student.first_name} bog'lash so'rovi yuborildi. Arizalar markazida tasdiqlang.`);
            setLinkModal(null);
        } catch (err) {
            toast.error('Xatolik: ' + err.message);
        } finally {
            setIsLinking(false);
        }
    };

    const handleAdd = () => {
        setShowCreateModal(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingParent) {
                const { error } = await supabase
                    .from('profiles')
                    .update({
                        first_name: formData.first_name,
                        last_name: formData.last_name,
                        phone: formData.phone,
                    })
                    .eq('id', editingParent.id);
                if (error) throw error;
                toast.success("Muvaffaqiyatli saqlandi");
            } else {
                handleAdd();
                return;
            }

            setIsFormatModalOpen(false);
            fetchParents(currentPage);
        } catch (err) {
            console.error('Error saving parent:', err);
            toast.error('Saqlashda xatolik');
        }
    };

    const stats = {
        total: parents.length,
        active: parents.filter(p => p.status === 'active').length,
        new: 5, // Mocked
        satisfaction: '98%' // Mocked
    };

    return (
        <div className="space-y-8 animate-fade-in max-w-[1600px] mx-auto pb-10">
            {/* Intelligence Header */}
            <div className="relative group overflow-hidden rounded-[2.5rem] bg-slate-900 shadow-2xl">
                <div className="absolute inset-0 bg-gradient-to-br from-orange-600 via-amber-600 to-slate-900 opacity-90 group-hover:scale-105 transition-transform duration-1000"></div>
                <div className="absolute inset-0 opacity-20 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] blend-overlay"></div>

                <div className="relative z-10 p-8 md:p-12 flex flex-col md:flex-row md:items-center justify-between gap-8">
                    <div>
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 rounded-full text-[10px] font-black uppercase tracking-widest mb-4 backdrop-blur-md border border-white/10 text-orange-200 shadow-inner"
                        >
                            <Zap size={12} className="text-yellow-300 fill-yellow-300" />
                            Vasiylar Hamjamiyati
                        </motion.div>
                        <h1 className="text-3xl md:text-5xl font-black text-white tracking-tight mb-3 italic">
                            Ota-onalar <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-200 to-amber-100 not-italic">Boshqarmasi</span>
                        </h1>
                        <p className="text-orange-100/80 font-medium text-lg max-w-xl leading-relaxed">
                            Ota-onalar bilan aloqalarni va ularning hisoblarini boshqarish tizimi.
                        </p>
                    </div>

                    <motion.button
                        whileHover={{ scale: 1.05, y: -5 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={handleAdd}
                        className="btn-primary from-white to-slate-100 !text-slate-900 shadow-xl shadow-white/10 !py-4 h-fit"
                    >
                        <UserPlus size={18} className="text-orange-600" />
                        Ota-ona Qo'shish
                    </motion.button>
                </div>
            </div>

            {/* Matrix Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <StatsCard title="Jami Vasiylar" value={stats.total} icon={Users} color="orange" trend="+12 bu oy" />
                <StatsCard title="Faol Aloqada" value={stats.active} icon={ShieldCheck} color="emerald" trend="92%" />
                <StatsCard title="Yangi Ro'yxatlar" value={stats.new} icon={UserPlus} color="amber" trend="Haftalik" />
                <StatsCard title="Mamnuniyat" value={stats.satisfaction} icon={Heart} color="rose" trend="Yuqori" />
            </div>

            {/* Controls Bar */}
            <div className="glass-card p-2 flex flex-col md:flex-row md:items-center justify-between gap-4 sticky top-24 z-30">
                <div className="relative flex-1 max-w-md ml-2 group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-orange-500 transition-colors" size={18} />
                    <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                        placeholder="Vasiy ismi yoki telefon raqami..."
                        className="w-full pl-12 pr-4 py-3 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-orange-500/20 focus:bg-white transition-all text-sm font-bold text-slate-700 placeholder:text-slate-400"
                    />
                </div>
                <div className="flex gap-2 p-1 w-full md:w-auto">
                    <button
                        onClick={() => fetchParents(currentPage)}
                        disabled={loading}
                        className="p-3 bg-slate-100 text-slate-500 rounded-xl hover:bg-orange-600 hover:text-white transition-all shadow-sm active:scale-95 disabled:opacity-50"
                    >
                        <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
                    </button>
                    <button
                        onClick={handleExport}
                        className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-xl hover:bg-slate-800 transition-all font-black text-[10px] uppercase tracking-widest shadow-lg shadow-slate-900/20 active:scale-95"
                    >
                        <Download size={16} />
                        EXPORT CSV
                    </button>
                </div>
            </div>

            {/* Content Area */}
            {loading ? (
                <div className="flex flex-col items-center justify-center py-20 gap-4">
                    <div className="w-12 h-12 border-4 border-orange-600/20 border-t-orange-600 rounded-full animate-spin"></div>
                    <p className="text-slate-400 font-black uppercase tracking-widest text-xs animate-pulse">Ma'lumotlar yuklanmoqda...</p>
                </div>
            ) : parents.length === 0 ? (
                <EmptyState
                    icon={Users}
                    title="Vasiylar topilmadi"
                    description={searchTerm ? `"${searchTerm}" bo'yicha hech qanday vasiy topilmadi.` : "Hozircha ota-onalar ro'yxati bo'sh."}
                />
            ) : (
                <div className="space-y-4">
                    <Table headers={['Vasiy F.I.O', 'Telefoniya', 'Akreditatsiya', 'Amallar']}>
                        {parents.map((p) => (
                            <TableRow key={p.id} className="group/row cursor-pointer" onClick={() => navigate(`/admin/parents/${p.id}`)}>
                                <TableCell>
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-[1.2rem] bg-gradient-to-br from-orange-100 to-amber-100 flex items-center justify-center text-orange-700 font-black shadow-inner group-hover/row:scale-110 transition-transform">
                                            {(p.full_name || p.first_name || 'O').charAt(0).toUpperCase()}
                                        </div>
                                        <div>
                                            <div className="font-black text-slate-900 group-hover/row:text-orange-700 transition-colors uppercase tracking-tight text-sm">
                                                {p.full_name || `${p.first_name || ''} ${p.last_name || ''}`}
                                            </div>
                                            <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">Rasmiy Vasiy</div>
                                        </div>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <span className="font-bold text-slate-600 tracking-wider font-mono text-xs">
                                        {p.phone || 'Noma\'lum'}
                                    </span>
                                </TableCell>
                                <TableCell>
                                    <div className="flex items-center gap-3">
                                        <div className={`w-2 h-2 rounded-full ${p.status === 'active' ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'}`}></div>
                                        <span className={`px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${p.status === 'active' ? 'bg-emerald-500 text-white border-emerald-400' : 'bg-slate-100 text-slate-400 border-slate-200'}`}>
                                            {p.status === 'active' ? 'Tasdiqlangan' : 'Nofaol'}
                                        </span>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <div className="flex items-center gap-2 opacity-0 group-hover/row:opacity-100 transition-all translate-x-4 group-hover/row:translate-x-0">
                                        <button
                                            onClick={(e) => { e.stopPropagation(); handleOpenLinkModal(p); }}
                                            className="p-3 bg-purple-50 text-purple-600 hover:bg-purple-600 hover:text-white rounded-xl transition-all hover:scale-110 shadow-sm"
                                            title="Farzand qo'shish"
                                        >
                                            <Link2 size={18} />
                                        </button>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); handleEdit(p); }}
                                            className="p-3 bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white rounded-xl transition-all hover:scale-110 shadow-sm"
                                        >
                                            <Pencil size={18} />
                                        </button>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); handleDelete(p.id); }}
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
                                Sahifa <span className="text-slate-900">{currentPage}</span> / <span className="text-slate-900">{totalPages}</span>
                            </p>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                    disabled={currentPage === 1}
                                    className="w-12 h-12 flex items-center justify-center bg-white border border-slate-200 text-slate-900 rounded-xl hover:bg-slate-50 disabled:opacity-40 transition-all shadow-sm active:scale-95"
                                >
                                    <ChevronLeft size={20} />
                                </button>
                                <button
                                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                    disabled={currentPage === totalPages}
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
                            className="bg-white rounded-[3rem] p-10 w-full max-w-lg relative z-10 shadow-2xl shadow-orange-900/20 border border-white/20"
                        >
                            <button
                                onClick={() => setIsFormatModalOpen(false)}
                                className="absolute top-8 right-8 p-3 bg-slate-50 hover:bg-slate-100 rounded-2xl text-slate-400 hover:text-slate-600 transition-colors"
                            >
                                <X size={20} />
                            </button>

                            <div className="mb-8">
                                <div className="w-16 h-16 bg-orange-50 rounded-2xl flex items-center justify-center text-orange-600 mb-6 shadow-inner">
                                    <LayoutGrid size={32} />
                                </div>
                                <h2 className="text-3xl font-black text-slate-900 tracking-tight italic">
                                    Vasiy <span className="text-orange-600 not-italic">Tahriri</span>
                                </h2>
                                <p className="text-slate-500 mt-2 font-medium">Ota-onaning tizimdagi hisob ma'lumotlarini tahrirlash.</p>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-6">
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

            {/* Farzand Qo'shish Modal */}
            <AnimatePresence>
                {linkModal && (
                    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-slate-900/60 backdrop-blur-xl"
                            onClick={() => setLinkModal(null)}
                        />
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0, y: 30 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 30 }}
                            className="bg-white rounded-[3rem] w-full max-w-lg relative z-10 shadow-[0_40px_100px_rgba(0,0,0,0.3)] overflow-hidden"
                        >
                            {/* Header strip */}
                            <div className="bg-gradient-to-r from-purple-600 to-violet-600 p-8 relative">
                                <button
                                    onClick={() => setLinkModal(null)}
                                    className="absolute top-5 right-5 w-9 h-9 bg-white/10 hover:bg-white/20 rounded-xl flex items-center justify-center transition-colors"
                                >
                                    <X size={18} className="text-white" />
                                </button>
                                <div className="flex items-center gap-4">
                                    <div className="w-14 h-14 bg-white/15 rounded-2xl flex items-center justify-center">
                                        <Link2 size={24} className="text-white" />
                                    </div>
                                    <div>
                                        <p className="font-black text-white text-xl">Farzand Bog'lash</p>
                                        <p className="text-purple-200 text-sm font-medium">
                                            {linkModal.full_name || `${linkModal.first_name || ''} ${linkModal.last_name || ''}`.trim()}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="p-8 space-y-5">
                                {/* Relationship type */}
                                <div>
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-3">Munosabat turi</label>
                                    <div className="flex gap-2">
                                        {[{ v: 'parent', l: 'Ota-ona' }, { v: 'guardian', l: 'Vasiy' }, { v: 'other', l: 'Boshqa' }].map(({ v, l }) => (
                                            <button
                                                key={v} type="button"
                                                onClick={() => setLinkRelType(v)}
                                                className={`flex-1 py-3 rounded-2xl text-[10px] font-black uppercase tracking-wider border transition-all ${
                                                    linkRelType === v
                                                        ? 'bg-purple-600 text-white border-purple-600 shadow-lg shadow-purple-500/25'
                                                        : 'bg-slate-50 border-slate-100 text-slate-500 hover:border-purple-200'
                                                }`}
                                            >
                                                {l}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Student search */}
                                <div>
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-3">O'quvchi qidirish</label>
                                    <div className="relative">
                                        <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                                        {isSearching && <Loader2 size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 animate-spin" />}
                                        <input
                                            type="text"
                                            placeholder="Ism yoki STU-XXXXXX kodi..."
                                            value={studentSearch}
                                            onChange={e => handleStudentSearch(e.target.value)}
                                            className="w-full pl-12 pr-10 py-4 bg-slate-50 rounded-2xl text-sm font-medium focus:ring-2 focus:ring-purple-500/20 focus:bg-white outline-none transition-all"
                                        />
                                    </div>

                                    {/* Results */}
                                    {studentResults.length > 0 && (
                                        <div className="mt-2 space-y-2 max-h-56 overflow-y-auto">
                                            {studentResults.map(student => (
                                                <div
                                                    key={student.id}
                                                    className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl hover:bg-purple-50 hover:border-purple-100 border border-transparent transition-all group cursor-pointer"
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-xl flex items-center justify-center text-white font-black text-sm">
                                                            {(student.full_name || student.first_name || 'U').charAt(0)}
                                                        </div>
                                                        <div>
                                                            <p className="font-black text-slate-800 text-sm">
                                                                {student.full_name || `${student.first_name || ''} ${student.last_name || ''}`.trim()}
                                                            </p>
                                                            <p className="text-[10px] text-indigo-500 font-mono font-black">{student.student_code || '—'}</p>
                                                        </div>
                                                    </div>
                                                    <button
                                                        disabled={isLinking}
                                                        onClick={() => handleCreateLink(student)}
                                                        className="px-4 py-2 bg-purple-600 text-white rounded-xl text-[10px] font-black uppercase tracking-wide hover:bg-purple-700 shadow-lg shadow-purple-500/25 transition-all disabled:opacity-50 active:scale-95"
                                                    >
                                                        {isLinking ? <Loader2 size={14} className="animate-spin" /> : "Bog'lash"}
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {studentSearch && !isSearching && studentResults.length === 0 && (
                                        <p className="mt-3 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                            O'quvchi topilmadi
                                        </p>
                                    )}
                                </div>

                                <button
                                    type="button"
                                    onClick={() => setLinkModal(null)}
                                    className="w-full py-4 bg-slate-100 text-slate-600 font-black rounded-2xl hover:bg-slate-200 transition-all uppercase tracking-widest text-[10px]"
                                >
                                    Yopish
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Create Parent Modal */}
            <AnimatePresence>
                {showCreateModal && (
                    <CreateUserModal
                        role="parent"
                        onSuccess={() => fetchParents(currentPage)}
                        onClose={() => setShowCreateModal(false)}
                    />
                )}
            </AnimatePresence>
        </div>
    );
};

export default ParentList;

