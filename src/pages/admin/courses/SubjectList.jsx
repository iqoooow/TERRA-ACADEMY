import { useState, useEffect, useMemo } from 'react';
import Table, { TableRow, TableCell } from '../../../components/ui/Table';
import { Search, Plus, Pencil, Trash2, X, BookOpen, Layers, Zap, ShieldCheck, CreditCard, RefreshCw, Tag, Banknote, ChevronDown } from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import StatsCard from '../../../components/ui/StatsCard';
import EmptyState from '../../../components/ui/EmptyState';
import { cn } from '../../../utils/cn';
import ModalPortal from '../../../components/common/ModalPortal';
import { confirmToast } from '../../../utils/confirmToast';

const CATEGORIES = [
    "General English",
    "IELTS",
    "CEFR",
    "Grammar",
    "Speaking",
    "Kids English",
    "Academic Writing",
    "Math (Eng)",
    "Other"
];

const SubjectList = () => {
    const [subjects, setSubjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isFormatModalOpen, setIsFormatModalOpen] = useState(false);
    const [editingSubject, setEditingSubject] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        price: '',
        description: '',
        category: 'General English'
    });

    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const pageSize = 10;
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('All');

    useEffect(() => {
        fetchSubjects(currentPage);
    }, [currentPage, selectedCategory]);

    const fetchSubjects = async (page = 1) => {
        setLoading(true);
        try {
            const from = (page - 1) * pageSize;
            const to = from + pageSize - 1;

            let query = supabase
                .from('subjects')
                .select('*', { count: 'exact' });

            if (selectedCategory !== 'All') {
                query = query.eq('category', selectedCategory);
            }

            const { data, count, error } = await query
                .order('created_at', { ascending: false })
                .range(from, to);

            if (error) throw error;

            setSubjects(data || []);

            if (count) {
                setTotalPages(Math.ceil(count / pageSize));
            }
        } catch (err) {
            console.error('Error fetching subjects:', err);
            toast.error("Fanlarni yuklashda xatolik");
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        const confirmed = await confirmToast('Haqiqatan ham bu fanni o\'chirmoqchimisiz?', { confirmLabel: "Ha, o'chirish", type: 'danger' });
        if (!confirmed) return;
        try {
            const { error } = await supabase.from('subjects').delete().eq('id', id);
            if (error) throw error;
            toast.success("Fan o'chirildi");
            fetchSubjects(currentPage);
        } catch (err) {
            console.error('Error deleting subject:', err);
            toast.error("O'chirishda xatolik");
        }
    };

    const handleEdit = (sub) => {
        setEditingSubject(sub);
        setFormData({
            name: sub.name || '',
            price: sub.price || '',
            description: sub.description || '',
            category: sub.category || 'General English'
        });
        setIsFormatModalOpen(true);
    };

    const handleAdd = () => {
        setEditingSubject(null);
        setFormData({
            name: '',
            price: '',
            description: '',
            category: 'General English'
        });
        setIsFormatModalOpen(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const payload = {
                name: formData.name,
                price: Number(formData.price),
                description: formData.description,
                category: formData.category
            };

            if (editingSubject) {
                const { error } = await supabase
                    .from('subjects')
                    .update(payload)
                    .eq('id', editingSubject.id);
                if (error) throw error;
                toast.success("Fan yangilandi");
            } else {
                const { error } = await supabase
                    .from('subjects')
                    .insert([payload]);
                if (error) throw error;
                toast.success("Yangi fan qo'shildi");
            }

            setIsFormatModalOpen(false);
            fetchSubjects(currentPage);
        } catch (err) {
            console.error('Error saving subject:', err);
            toast.error('Saqlashda xatolik. Bazada "category" ustuni borligini tekshiring.');
        }
    };

    const filteredSubjects = subjects.filter(s =>
        s.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const stats = useMemo(() => {
        return {
            total: subjects.length,
            avgPrice: subjects.length > 0 ? (subjects.reduce((sum, s) => sum + Number(s.price || 0), 0) / subjects.length) : 0,
            uniqueCategories: new Set(subjects.map(s => s.category)).size
        };
    }, [subjects]);

    return (
        <div className="space-y-8 animate-fade-in max-w-[1600px] mx-auto pb-10">
            {/* Intelligence Header */}
            <div className="relative overflow-hidden rounded-[2.5rem] bg-slate-900 shadow-lg">
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-700 via-blue-700 to-slate-900 opacity-95"></div>

                <div className="relative z-10 p-8 md:p-12 flex flex-col md:flex-row md:items-center justify-between gap-8">
                    <div>
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 rounded-full text-[10px] font-black uppercase tracking-widest mb-4 backdrop-blur-md border border-white/10 text-indigo-200 shadow-inner"
                        >
                            <Zap size={12} className="text-yellow-300 fill-yellow-300" />
                            Academic Curriculum
                        </motion.div>
                        <h1 className="text-3xl md:text-5xl font-black text-white tracking-tight mb-3 italic">
                            Fanlar <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-200 to-indigo-100 not-italic">Kataloqi</span>
                        </h1>
                        <p className="text-indigo-100/80 font-medium text-lg max-w-xl leading-relaxed">
                            Yonalishlar (IELTS, CEFR, Grammar) bo'yicha saralangan o'quv dasturlari.
                        </p>
                    </div>

                    <motion.button
                        whileHover={{ scale: 1.05, y: -5 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={handleAdd}
                        className="btn-primary from-white to-slate-100 !text-slate-900 shadow-xl shadow-white/10 !py-4 h-fit"
                    >
                        <Plus size={18} className="text-indigo-600" />
                        Yangi Fan Qo'shish
                    </motion.button>
                </div>
            </div>

            {/* Matrix Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <StatsCard title="Jami Fanlar" value={stats.total} icon={BookOpen} color="blue" trend="Markazi" />
                <StatsCard title="Yo'nalishlar" value={stats.uniqueCategories} icon={Layers} color="rose" trend="Dynamic" />
                <StatsCard title="O'rtacha Narx" value={stats.avgPrice.toLocaleString()} icon={CreditCard} color="amber" trend="UZS" />
                <StatsCard title="Status" value="Faol" icon={ShieldCheck} color="emerald" trend="100%" />
            </div>

            {/* Controls Bar */}
            <div className="glass-card p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 sticky top-24 z-30 border-white/10 backdrop-blur-2xl">
                <div className="flex bg-slate-100 p-1.5 rounded-2xl gap-1 overflow-x-auto no-scrollbar">
                    <button
                        onClick={() => setSelectedCategory('All')}
                        className={cn("px-6 py-2.5 rounded-xl text-[10px] font-black uppercase transition-all whitespace-nowrap",
                            selectedCategory === 'All' ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500 hover:text-slate-700")}
                    >
                        Barchasi
                    </button>
                    {CATEGORIES.slice(0, 5).map(cat => (
                        <button
                            key={cat}
                            onClick={() => setSelectedCategory(cat)}
                            className={cn("px-6 py-2.5 rounded-xl text-[10px] font-black uppercase transition-all whitespace-nowrap",
                                selectedCategory === cat ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500 hover:text-slate-700")}
                        >
                            {cat}
                        </button>
                    ))}
                </div>

                <div className="flex-1 relative">
                    <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input
                        type="text"
                        placeholder="Fan nomi yoki tavsif bo'yicha izlash..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-14 pr-6 py-4 bg-slate-50 border-none rounded-2xl font-bold text-sm focus:ring-2 focus:ring-indigo-500/20"
                    />
                </div>

                <div className="flex gap-2">
                    <button
                        onClick={() => fetchSubjects(currentPage)}
                        disabled={loading}
                        className="p-4 bg-white text-slate-500 rounded-2xl hover:bg-indigo-50 transition-all border border-slate-100 shadow-sm active:scale-95 disabled:opacity-50"
                    >
                        <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
                    </button>
                </div>
            </div>

            {loading ? (
                <div className="py-20 flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest animate-pulse">Fanlar yuklanmoqda...</p>
                </div>
            ) : filteredSubjects.length === 0 ? (
                <EmptyState
                    icon={BookOpen}
                    title="Fanlar topilmadi"
                    description={searchQuery ? `"${searchQuery}" bo'yicha hech qanday fan topilmadi.` : "Hozircha fanlar ro'yxati bo'sh."}
                />
            ) : (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                >
                    <Table headers={['Fan Nomi', 'Yo\'nalish', 'Narx', 'Amallar']}>
                        {filteredSubjects.map((sub) => (
                            <TableRow key={sub.id} className="group hover:bg-slate-50/50 transition-colors">
                                <TableCell>
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 font-black shadow-inner group-hover:bg-indigo-600 group-hover:text-white transition-all duration-500">
                                            {sub.name[0].toUpperCase()}
                                        </div>
                                        <div>
                                            <div className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">{sub.name}</div>
                                            <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mt-1">{sub.description ? sub.description.substring(0, 30) + '...' : 'Tavsif yo\'q'}</div>
                                        </div>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <div className="flex items-center gap-2">
                                        <Tag size={12} className="text-rose-400" />
                                        <span className="px-3 py-1 bg-rose-50 text-rose-600 rounded-full text-[10px] font-black uppercase border border-rose-100">
                                            {sub.category || 'General'}
                                        </span>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <div className="font-mono font-black text-slate-700 bg-slate-50 px-4 py-2 rounded-xl text-xs w-fit border border-slate-100">
                                        {sub.price ? `${Number(sub.price).toLocaleString()} UZS` : 'BEPUL'}
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all translate-x-4 group-hover:translate-x-0">
                                        <button
                                            onClick={(e) => { e.stopPropagation(); handleEdit(sub); }}
                                            className="p-3 bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white rounded-xl transition-all shadow-sm"
                                        >
                                            <Pencil size={16} />
                                        </button>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); handleDelete(sub.id); }}
                                            className="p-3 bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white rounded-xl transition-all shadow-sm"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))}
                    </Table>

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="flex items-center justify-center gap-2 mt-12 pb-10">
                            {[...Array(totalPages)].map((_, i) => (
                                <button
                                    key={i}
                                    onClick={() => setCurrentPage(i + 1)}
                                    className={cn(
                                        "w-12 h-12 rounded-2xl flex items-center justify-center text-xs font-black transition-all",
                                        currentPage === i + 1
                                            ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-600/30 ring-4 ring-indigo-50'
                                            : 'bg-white text-slate-400 hover:bg-slate-50 text-slate-600 border border-slate-100'
                                    )}
                                >
                                    {i + 1}
                                </button>
                            ))}
                        </div>
                    )}
                </motion.div>
            )}

            {/* Modal */}
            <AnimatePresence>
                {isFormatModalOpen && (
                    <ModalPortal><div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        {/* Backdrop */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                            onClick={() => setIsFormatModalOpen(false)}
                        />

                        {/* Modal card */}
                        <motion.div
                            initial={{ scale: 0.92, opacity: 0, y: 24 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.92, opacity: 0, y: 24 }}
                            transition={{ type: 'spring', damping: 22, stiffness: 300 }}
                            className="relative z-10 w-full max-w-lg bg-white rounded-[2rem] shadow-2xl overflow-hidden"
                        >
                            {/* Top accent */}
                            <div className="h-1.5 w-full bg-gradient-to-r from-indigo-500 via-blue-500 to-violet-500" />

                            {/* Header */}
                            <div className="px-8 pt-7 pb-0 flex items-start justify-between">
                                <div>
                                    <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-indigo-50 text-indigo-600 rounded-full text-[10px] font-black uppercase tracking-widest mb-3">
                                        <BookOpen size={10} />
                                        {editingSubject ? 'Tahrirlash' : 'Yangi fan'}
                                    </span>
                                    <h2 className="text-2xl font-black text-slate-900 tracking-tight leading-tight">
                                        {editingSubject ? "Fan ma'lumotlarini" : 'Yangi fan'}<br />
                                        <span className="text-slate-400 text-base font-bold">
                                            {editingSubject ? 'yangilash' : "qo'shish"}
                                        </span>
                                    </h2>
                                </div>
                                <button
                                    onClick={() => setIsFormatModalOpen(false)}
                                    className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all mt-1"
                                >
                                    <X size={20} />
                                </button>
                            </div>

                            {/* Form */}
                            <form onSubmit={handleSubmit} className="px-8 pt-6 pb-8 space-y-5">
                                {/* Fan nomi */}
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Fan nomi</label>
                                    <input
                                        type="text"
                                        value={formData.name}
                                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                                        className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl font-semibold text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-300 focus:bg-white transition-all placeholder:text-slate-300"
                                        placeholder="Masalan: IELTS Intensive"
                                        required
                                    />
                                </div>

                                {/* Yo'nalish */}
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Yo'nalish (Category)</label>
                                    <div className="relative">
                                        <select
                                            value={formData.category}
                                            onChange={e => setFormData({ ...formData, category: e.target.value })}
                                            className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl font-semibold text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-300 focus:bg-white transition-all appearance-none cursor-pointer"
                                        >
                                            {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                                        </select>
                                        <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                                    </div>
                                </div>

                                {/* Narx */}
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Oylik to'lov (UZS)</label>
                                    <div className="relative">
                                        <Banknote className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                        <input
                                            type="number"
                                            value={formData.price}
                                            onChange={e => setFormData({ ...formData, price: e.target.value })}
                                            className="w-full pl-12 pr-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl font-semibold text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-300 focus:bg-white transition-all placeholder:text-slate-300"
                                            placeholder="500 000"
                                        />
                                    </div>
                                </div>

                                {/* Tavsif */}
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Tavsif <span className="normal-case font-medium text-slate-300">(ixtiyoriy)</span></label>
                                    <textarea
                                        value={formData.description}
                                        onChange={e => setFormData({ ...formData, description: e.target.value })}
                                        className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-300 focus:bg-white transition-all resize-none min-h-[90px] placeholder:text-slate-300"
                                        placeholder="Kurs haqida qisqacha ma'lumot..."
                                    />
                                </div>

                                {/* Buttons */}
                                <div className="flex gap-3 pt-1">
                                    <button
                                        type="button"
                                        onClick={() => setIsFormatModalOpen(false)}
                                        className="flex-1 py-3.5 bg-slate-100 text-slate-500 font-black text-[11px] uppercase tracking-widest rounded-2xl hover:bg-slate-200 transition-all"
                                    >
                                        Bekor qilish
                                    </button>
                                    <button
                                        type="submit"
                                        className="flex-1 py-3.5 bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-black text-[11px] uppercase tracking-widest rounded-2xl shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 hover:opacity-90 transition-all"
                                    >
                                        {editingSubject ? 'Saqlash' : "Qo'shish"}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div></ModalPortal>
                )}
            </AnimatePresence>
        </div>
    );
};

export default SubjectList;
