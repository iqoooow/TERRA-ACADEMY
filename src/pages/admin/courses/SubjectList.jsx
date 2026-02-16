import React, { useState, useEffect } from 'react';
import Table, { TableRow, TableCell } from '../../../components/ui/Table';
import { Search, Plus, Pencil, Trash2, X, BookOpen, Layers, Filter } from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';

const SubjectList = () => {
    const [subjects, setSubjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isFormatModalOpen, setIsFormatModalOpen] = useState(false);
    const [editingSubject, setEditingSubject] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        price: '',
        description: ''
    });

    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const pageSize = 10;
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        fetchSubjects(currentPage);
    }, [currentPage]);

    const fetchSubjects = async (page = 1) => {
        setLoading(true);
        try {
            const from = (page - 1) * pageSize;
            const to = from + pageSize - 1;

            const { data, count, error } = await supabase
                .from('subjects')
                .select('*', { count: 'exact' })
                .order('created_at', { ascending: false })
                .range(from, to);

            if (error) throw error;

            const formattedSubjects = (data || []).map(s => ({
                ...s,
                status: 'Active',
                bg: 'bg-indigo-100 text-indigo-700 border-indigo-200'
            }));

            setSubjects(formattedSubjects);

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
        if (!window.confirm('Haqiqatan ham bu fanni o\'chirmoqchimisiz?')) return;
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
            description: sub.description || ''
        });
        setIsFormatModalOpen(true);
    };

    const handleAdd = () => {
        setEditingSubject(null);
        setFormData({
            name: '',
            price: '',
            description: ''
        });
        setIsFormatModalOpen(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const payload = {
                name: formData.name,
                price: formData.price,
                description: formData.description
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
            toast.error('Saqlashda xatolik');
        }
    };

    const filteredSubjects = subjects.filter(s =>
        s.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="space-y-6 animate-fade-in pb-10">
            {/* Header with Search and Add Button */}
            <div className="glass-card p-2 flex flex-col md:flex-row md:items-center justify-between gap-4 sticky top-24 z-30">
                <div className="relative flex-1 max-w-md ml-2">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input
                        type="text"
                        placeholder="Fanlarni izlash..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-12 pr-4 py-3 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500/20 focus:bg-white transition-all text-sm font-medium placeholder:text-slate-400"
                    />
                </div>
                <div className="flex gap-2 p-1">
                    <button className="flex items-center gap-2 px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl transition-all font-bold text-xs uppercase tracking-wider">
                        <Filter size={16} />
                        <span className="hidden sm:inline">Filtr</span>
                    </button>
                    <button
                        onClick={handleAdd}
                        className="btn-primary from-indigo-500 to-violet-600 shadow-indigo-500/30"
                    >
                        <Plus size={18} />
                        <span className="hidden sm:inline">Fan Qo'shish</span>
                    </button>
                </div>
            </div>

            {loading ? (
                <div className="flex flex-col items-center justify-center py-20 space-y-4">
                    <div className="w-10 h-10 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin"></div>
                    <p className="text-slate-400 font-medium animate-pulse">Yuklanmoqda...</p>
                </div>
            ) : (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                >
                    <Table headers={['Fan Nomi', 'Narx', 'Tavsif', 'Holati', 'Amallar']}>
                        {filteredSubjects.map((sub) => (
                            <TableRow key={sub.id} className="group cursor-pointer">
                                <TableCell>
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-100 to-violet-100 flex items-center justify-center text-indigo-600 font-black shadow-inner">
                                            <BookOpen size={20} />
                                        </div>
                                        <div>
                                            <div className="font-bold text-slate-900">{sub.name}</div>
                                            <div className="text-xs text-slate-400 font-medium tracking-wide">ID: {sub.id?.substring(0, 8)}...</div>
                                        </div>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <span className="font-bold text-slate-700 bg-slate-100 px-2 py-1 rounded-lg text-xs font-mono">
                                        {sub.price ? `${Number(sub.price).toLocaleString()} so'm` : 'Bepul'}
                                    </span>
                                </TableCell>
                                <TableCell>
                                    <p className="truncate max-w-xs text-sm text-slate-500 font-medium">{sub.description || '-'}</p>
                                </TableCell>
                                <TableCell>
                                    <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border ${sub.bg}`}>
                                        {sub.status}
                                    </span>
                                </TableCell>
                                <TableCell>
                                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity translate-x-2 group-hover:translate-x-0 duration-300">
                                        <button
                                            onClick={(e) => { e.stopPropagation(); handleEdit(sub); }}
                                            className="p-2 bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white rounded-lg transition-all hover:scale-110 shadow-sm"
                                            title="Tahrirlash"
                                        >
                                            <Pencil size={14} />
                                        </button>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); handleDelete(sub.id); }}
                                            className="p-2 bg-red-50 text-red-600 hover:bg-red-600 hover:text-white rounded-lg transition-all hover:scale-110 shadow-sm"
                                            title="O'chirish"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))}
                    </Table>

                    {/* Pagination */}
                    {subjects.length > 0 && (
                        <div className="flex items-center justify-between border-t border-slate-200 mt-6 pt-6 px-2">
                            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                                Jami {subjects.length} ta dan {(currentPage - 1) * pageSize + 1}-{Math.min(currentPage * pageSize, subjects.length)}
                            </span>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                    disabled={currentPage === 1}
                                    className="p-2 rounded-lg hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed text-slate-500 font-bold"
                                >
                                    Oldingi
                                </button>
                                <div className="flex items-center gap-1">
                                    {[...Array(totalPages)].map((_, i) => (
                                        <button
                                            key={i}
                                            onClick={() => setCurrentPage(i + 1)}
                                            className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold transition-all ${currentPage === i + 1
                                                    ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/30'
                                                    : 'text-slate-500 hover:bg-slate-100'
                                                }`}
                                        >
                                            {i + 1}
                                        </button>
                                    ))}
                                </div>
                                <button
                                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                    disabled={currentPage === totalPages}
                                    className="p-2 rounded-lg hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed text-slate-500 font-bold"
                                >
                                    Keyingi
                                </button>
                            </div>
                        </div>
                    )}
                </motion.div>
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
                            className="bg-white rounded-3xl p-8 w-full max-w-lg relative z-10 shadow-2xl shadow-indigo-900/20 border border-white/20"
                        >
                            <button
                                onClick={() => setIsFormatModalOpen(false)}
                                className="absolute top-6 right-6 p-2 bg-slate-50 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600 transition-colors"
                            >
                                <X size={20} />
                            </button>

                            <div className="mb-8">
                                <span className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-xs font-black uppercase tracking-widest mb-4 inline-block">
                                    {editingSubject ? 'Tahrirlash' : 'Yangi'}
                                </span>
                                <h2 className="text-3xl font-black text-slate-900 tracking-tight">
                                    {editingSubject ? "Fan ma'lumotlari" : "Yangi fan qo'shish"}
                                </h2>
                                <p className="text-slate-500 mt-2 font-medium">Barcha maydonlarni to'ldiring</p>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-5">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Fan Nomi</label>
                                    <input
                                        type="text"
                                        value={formData.name}
                                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                                        className="input-field"
                                        placeholder="Masalan: Matematika"
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Narx (so'm)</label>
                                    <input
                                        type="number"
                                        value={formData.price}
                                        onChange={e => setFormData({ ...formData, price: e.target.value })}
                                        className="input-field"
                                        placeholder="Masalan: 500000"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Tavsif</label>
                                    <textarea
                                        value={formData.description}
                                        onChange={e => setFormData({ ...formData, description: e.target.value })}
                                        className="w-full px-4 py-3 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500/20 focus:bg-white transition-all text-slate-700 font-medium resize-none"
                                        placeholder="Fan haqida qisqacha..."
                                        rows="3"
                                    />
                                </div>

                                <div className="pt-4 flex gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setIsFormatModalOpen(false)}
                                        className="flex-1 py-4 bg-white border border-slate-200 text-slate-700 font-bold rounded-xl hover:bg-slate-50 transition-all uppercase tracking-widest text-xs"
                                    >
                                        Bekor qilish
                                    </button>
                                    <button
                                        type="submit"
                                        className="flex-1 py-4 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 shadow-lg shadow-indigo-500/30 transition-all uppercase tracking-widest text-xs"
                                    >
                                        {editingSubject ? 'Saqlash' : "Qo'shish"}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default SubjectList;
