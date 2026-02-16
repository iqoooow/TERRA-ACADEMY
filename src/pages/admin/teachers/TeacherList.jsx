import React, { useState, useEffect } from 'react';
import Table, { TableRow, TableCell } from '../../../components/ui/Table';
import { Search, Plus, Pencil, Trash2, X, GraduationCap, Phone, Mail, UserPlus, Filter } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';

const TeacherList = () => {
    const [teachers, setTeachers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isFormatModalOpen, setIsFormatModalOpen] = useState(false);
    const [editingTeacher, setEditingTeacher] = useState(null);
    const [formData, setFormData] = useState({
        first_name: '',
        last_name: '',
        phone: '',
    });

    useEffect(() => {
        fetchTeachers();
    }, []);

    const fetchTeachers = async () => {
        setLoading(true);
        try {
            const { supabase } = await import('../../../lib/supabase');
            const { data, error } = await supabase
                .from('profiles')
                .select('id, first_name, last_name, full_name, phone, status, role')
                .eq('role', 'teacher')
                .order('created_at', { ascending: false });

            if (error) throw error;
            setTeachers(data || []);
        } catch (err) {
            console.error('Error fetching teachers:', err);
            toast.error("O'qituvchilarni yuklashda xatolik");
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Haqiqatan ham bu o\'qituvchini o\'chirmoqchimisiz?')) return;

        try {
            const { supabase } = await import('../../../lib/supabase');
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

    const handleAdd = () => {
        setEditingTeacher(null);
        setFormData({
            first_name: '',
            last_name: '',
            phone: '',
        });
        setIsFormatModalOpen(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const { supabase } = await import('../../../lib/supabase');

            if (editingTeacher) {
                const { error } = await supabase
                    .from('profiles')
                    .update({
                        first_name: formData.first_name,
                        last_name: formData.last_name,
                        phone: formData.phone,
                    })
                    .eq('id', editingTeacher.id);

                if (error) throw error;
                toast.success("Muvaffaqiyatli yangilandi");
            } else {
                toast("Yangi o'qituvchi qo'shish uchun ularni ro'yxatdan o'tish sahifasiga yo'naltiring.", { icon: 'ℹ️', duration: 5000 });
                return;
            }

            setIsFormatModalOpen(false);
            fetchTeachers();
        } catch (err) {
            console.error('Error saving teacher:', err);
            toast.error('Saqlashda xatolik: ' + err.message);
        }
    };

    const getStatusBadge = (status) => {
        switch (status) {
            case 'approved': return 'bg-green-100 text-green-700 border-green-200';
            case 'pending': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
            case 'rejected': return 'bg-red-100 text-red-700 border-red-200';
            default: return 'bg-slate-100 text-slate-700 border-slate-200';
        }
    };

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Header with Search and Add Button */}
            <div className="glass-card p-2 flex flex-col md:flex-row md:items-center justify-between gap-4 sticky top-24 z-30">
                <div className="relative flex-1 max-w-md ml-2">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input
                        type="text"
                        placeholder="O'qituvchilarni izlash..."
                        className="w-full pl-12 pr-4 py-3 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-500/20 focus:bg-white transition-all text-sm font-medium placeholder:text-slate-400"
                    />
                </div>
                <div className="flex gap-2 p-1">
                    <button className="flex items-center gap-2 px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl transition-all font-bold text-xs uppercase tracking-wider">
                        <Filter size={16} />
                        <span className="hidden sm:inline">Filtr</span>
                    </button>
                    <button
                        onClick={handleAdd}
                        className="btn-primary"
                    >
                        <UserPlus size={18} />
                        <span className="hidden sm:inline">O'qituvchi Qo'shish</span>
                    </button>
                </div>
            </div>

            {loading ? (
                <div className="flex flex-col items-center justify-center py-20 space-y-4">
                    <div className="w-10 h-10 border-4 border-purple-600/20 border-t-purple-600 rounded-full animate-spin"></div>
                    <p className="text-slate-400 font-medium animate-pulse">Yuklanmoqda...</p>
                </div>
            ) : (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                >
                    <Table headers={['O\'qituvchi Ismi', 'Telefon', 'Holati', 'Amallar']}>
                        {teachers.map((t) => (
                            <TableRow key={t.id} className="group cursor-pointer">
                                <TableCell>
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-100 to-fuchsia-100 flex items-center justify-center text-purple-700 font-black shadow-inner">
                                            {(t.full_name || t.first_name || 'U').charAt(0).toUpperCase()}
                                        </div>
                                        <div>
                                            <div className="font-bold text-slate-900">
                                                {t.full_name || `${t.first_name || ''} ${t.last_name || ''}`}
                                            </div>
                                            <div className="text-xs text-slate-400 font-medium tracking-wide">O'qituvchi</div>
                                        </div>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <span className="font-medium text-slate-600 tracking-wide font-mono text-xs">
                                        {t.phone || '-'}
                                    </span>
                                </TableCell>
                                <TableCell>
                                    <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border ${getStatusBadge(t.status)}`}>
                                        {t.status || 'unknown'}
                                    </span>
                                </TableCell>
                                <TableCell>
                                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity translate-x-2 group-hover:translate-x-0 duration-300">
                                        <button
                                            onClick={(e) => { e.stopPropagation(); handleEdit(t); }}
                                            className="p-2 bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white rounded-lg transition-all hover:scale-110 shadow-sm"
                                            title="Tahrirlash"
                                        >
                                            <Pencil size={14} />
                                        </button>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); handleDelete(t.id); }}
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
                            className="bg-white rounded-3xl p-8 w-full max-w-lg relative z-10 shadow-2xl shadow-purple-900/20 border border-white/20"
                        >
                            <button
                                onClick={() => setIsFormatModalOpen(false)}
                                className="absolute top-6 right-6 p-2 bg-slate-50 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600 transition-colors"
                            >
                                <X size={20} />
                            </button>

                            <div className="mb-8">
                                <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-black uppercase tracking-widest mb-4 inline-block">
                                    {editingTeacher ? 'Tahrirlash' : 'Yangi'}
                                </span>
                                <h2 className="text-3xl font-black text-slate-900 tracking-tight">
                                    {editingTeacher ? "O'qituvchi ma'lumotlari" : "Yangi o'qituvchi"}
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
                                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Telefon raqam</label>
                                    <input
                                        type="tel"
                                        value={formData.phone}
                                        onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                        className="input-field"
                                        placeholder="+998 90 123 45 67"
                                    />
                                </div>

                                {!editingTeacher && (
                                    <div className="p-4 bg-purple-50 border border-purple-100 text-purple-800 text-sm rounded-2xl flex gap-3 items-start">
                                        <div className="mt-0.5">ℹ️</div>
                                        <p className="font-medium leading-relaxed">
                                            Yangi o'qituvchi qo'shish uchun ularni ro'yxatdan o'tish sahifasiga yo'naltiring yoki administrator tomonidan taklif havolasini yuboring.
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
                                        className="flex-1 py-4 bg-purple-600 text-white font-bold rounded-xl hover:bg-purple-700 shadow-lg shadow-purple-500/30 transition-all uppercase tracking-widest text-xs"
                                    >
                                        {editingTeacher ? 'Saqlash' : "Qo'shish"}
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

export default TeacherList;
