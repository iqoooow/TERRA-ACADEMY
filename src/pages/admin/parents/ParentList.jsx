import React, { useState, useEffect } from 'react';
import Table, { TableRow, TableCell } from '../../../components/ui/Table';
import { Search, Plus, Pencil, Trash2, X, Users, Phone, UserPlus, Filter } from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';

const ParentList = () => {
    const [parents, setParents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isFormatModalOpen, setIsFormatModalOpen] = useState(false);
    const [editingParent, setEditingParent] = useState(null);
    const [formData, setFormData] = useState({
        first_name: '',
        last_name: '',
        phone: ''
    });

    // Pagination state
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const pageSize = 10;

    useEffect(() => {
        fetchParents(currentPage);
    }, [currentPage]);

    const fetchParents = async (page = 1) => {
        setLoading(true);
        try {
            const from = (page - 1) * pageSize;
            const to = from + pageSize - 1;

            const { data: parentsData, count, error } = await supabase
                .from('profiles')
                .select('*', { count: 'exact' })
                .eq('role', 'parent')
                .order('created_at', { ascending: false })
                .range(from, to);

            if (error) throw error;

            const formattedParents = (parentsData || []).map(p => ({
                ...p,
                children_count: 0,
                status: p.status || 'active',
                bg: p.status === 'active' ? 'bg-emerald-100 text-emerald-700 border-emerald-200' : 'bg-slate-100 text-slate-700 border-slate-200'
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

    const handleAdd = () => {
        setEditingParent(null);
        setFormData({
            first_name: '',
            last_name: '',
            phone: ''
        });
        setIsFormatModalOpen(true);
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
                toast("Yangi ota-ona qo'shish uchun ularni ro'yxatdan o'tish sahifasiga yo'naltiring.", { icon: 'ℹ️', duration: 5000 });
                return;
            }

            setIsFormatModalOpen(false);
            fetchParents(currentPage);
        } catch (err) {
            console.error('Error saving parent:', err);
            toast.error('Saqlashda xatolik');
        }
    };

    return (
        <div className="space-y-6 animate-fade-in pb-10">
            {/* Header with Search and Add Button */}
            <div className="glass-card p-2 flex flex-col md:flex-row md:items-center justify-between gap-4 sticky top-24 z-30">
                <div className="relative flex-1 max-w-md ml-2">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input
                        type="text"
                        placeholder="Ota-onalarni izlash..."
                        className="w-full pl-12 pr-4 py-3 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-orange-500/20 focus:bg-white transition-all text-sm font-medium placeholder:text-slate-400"
                    />
                </div>
                <div className="flex gap-2 p-1">
                    <button className="flex items-center gap-2 px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl transition-all font-bold text-xs uppercase tracking-wider">
                        <Filter size={16} />
                        <span className="hidden sm:inline">Filtr</span>
                    </button>
                    <button
                        onClick={handleAdd}
                        className="btn-primary from-orange-500 to-amber-500 shadow-orange-500/30"
                    >
                        <UserPlus size={18} />
                        <span className="hidden sm:inline">Ota-ona Qo'shish</span>
                    </button>
                </div>
            </div>

            {loading ? (
                <div className="flex flex-col items-center justify-center py-20 space-y-4">
                    <div className="w-10 h-10 border-4 border-orange-500/20 border-t-orange-500 rounded-full animate-spin"></div>
                    <p className="text-slate-400 font-medium animate-pulse">Yuklanmoqda...</p>
                </div>
            ) : (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                >
                    <Table headers={['Ota-ona Ismi', 'Telefon', 'Holati', 'Amallar']}>
                        {parents.map((p) => (
                            <TableRow key={p.id} className="group cursor-pointer">
                                <TableCell>
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-100 to-amber-100 flex items-center justify-center text-orange-600 font-black shadow-inner">
                                            {(p.full_name || p.first_name || 'O').charAt(0).toUpperCase()}
                                        </div>
                                        <div>
                                            <div className="font-bold text-slate-900">
                                                {p.full_name || `${p.first_name || ''} ${p.last_name || ''}`}
                                            </div>
                                            <div className="text-xs text-slate-400 font-medium tracking-wide">Ota-ona</div>
                                        </div>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <span className="font-medium text-slate-600 tracking-wide font-mono text-xs">
                                        {p.phone || '-'}
                                    </span>
                                </TableCell>
                                <TableCell>
                                    <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border ${p.bg}`}>
                                        {p.status}
                                    </span>
                                </TableCell>
                                <TableCell>
                                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity translate-x-2 group-hover:translate-x-0 duration-300">
                                        <button
                                            onClick={(e) => { e.stopPropagation(); handleEdit(p); }}
                                            className="p-2 bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white rounded-lg transition-all hover:scale-110 shadow-sm"
                                            title="Tahrirlash"
                                        >
                                            <Pencil size={14} />
                                        </button>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); handleDelete(p.id); }}
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

                    {/* Pagination Controls */}
                    {parents.length > 0 && (
                        <div className="flex items-center justify-between border-t border-slate-200 mt-6 pt-6 px-2">
                            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                                Jami {parents.length} ta dan {(currentPage - 1) * pageSize + 1}-{Math.min(currentPage * pageSize, parents.length)}
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
                                                    ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/30'
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
                            className="bg-white rounded-3xl p-8 w-full max-w-lg relative z-10 shadow-2xl shadow-orange-900/20 border border-white/20"
                        >
                            <button
                                onClick={() => setIsFormatModalOpen(false)}
                                className="absolute top-6 right-6 p-2 bg-slate-50 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600 transition-colors"
                            >
                                <X size={20} />
                            </button>

                            <div className="mb-8">
                                <span className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-xs font-black uppercase tracking-widest mb-4 inline-block">
                                    {editingParent ? 'Tahrirlash' : 'Yangi'}
                                </span>
                                <h2 className="text-3xl font-black text-slate-900 tracking-tight">
                                    {editingParent ? "Ota-ona ma'lumotlari" : "Yangi ota-ona"}
                                </h2>
                                <p className="text-slate-500 mt-2 font-medium">Barcha maydonlarni to'ldiring</p>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-5">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Ism</label>
                                        <input
                                            type="text"
                                            value={formData.first_name}
                                            onChange={e => setFormData({ ...formData, first_name: e.target.value })}
                                            className="input-field"
                                            placeholder="Ismi"
                                            required
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Familiya</label>
                                        <input
                                            type="text"
                                            value={formData.last_name}
                                            onChange={e => setFormData({ ...formData, last_name: e.target.value })}
                                            className="input-field"
                                            placeholder="Familiyasi"
                                            required
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Telefon</label>
                                    <input
                                        type="tel"
                                        value={formData.phone}
                                        onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                        className="input-field"
                                        placeholder="+998 90 123 45 67"
                                    />
                                </div>

                                {!editingParent && (
                                    <div className="p-4 bg-orange-50 border border-orange-100 text-orange-800 text-sm rounded-2xl flex gap-3 items-start">
                                        <div className="mt-0.5">ℹ️</div>
                                        <p className="font-medium leading-relaxed">
                                            Yangi ota-ona qo'shish uchun ularni ro'yxatdan o'tish sahifasiga yo'naltiring.
                                        </p>
                                    </div>
                                )}

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
                                        className="flex-1 py-4 bg-orange-500 text-white font-bold rounded-xl hover:bg-orange-600 shadow-lg shadow-orange-500/30 transition-all uppercase tracking-widest text-xs"
                                    >
                                        {editingParent ? 'Saqlash' : "Qo'shish"}
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

export default ParentList;
