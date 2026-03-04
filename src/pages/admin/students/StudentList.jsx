import { useState, useEffect } from 'react';
import { Search, Pencil, Trash2, Download, UserPlus, GraduationCap, Calendar, Phone, ShieldCheck, Activity, ChevronLeft, ChevronRight, RefreshCw, ArrowUpRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../../../lib/supabase';
import { toast } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import EmptyState from '../../../components/ui/EmptyState';
import CreateUserModal from '../users/CreateUserModal';
import { format } from 'date-fns';
import { uz } from 'date-fns/locale';

const StudentList = () => {
    const navigate = useNavigate();
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isFormatModalOpen, setIsFormatModalOpen] = useState(false);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [editingStudent, setEditingStudent] = useState(null);
    const [formData, setFormData] = useState({
        first_name: '',
        last_name: '',
        phone: ''
    });

    // Pagination state
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [searchQuery, setSearchQuery] = useState('');
    const pageSize = 10;

    useEffect(() => {
        fetchStudents(currentPage);

        const channel = supabase.channel('students-realtime')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles', filter: "role=eq.student" }, () => {
                fetchStudents(currentPage);
            })
            .subscribe();

        return () => supabase.removeChannel(channel);
    }, [currentPage, searchQuery]);

    const fetchStudents = async (page = 1) => {
        setLoading(true);
        try {
            const from = (page - 1) * pageSize;
            const to = from + pageSize - 1;

            let query = supabase
                .from('profiles')
                .select('id, first_name, last_name, full_name, phone, status, role, student_code, created_at', { count: 'exact' })
                .eq('role', 'student')
                .order('created_at', { ascending: false });

            if (searchQuery) {
                query = query.or(`full_name.ilike.%${searchQuery}%,first_name.ilike.%${searchQuery}%,last_name.ilike.%${searchQuery}%,student_code.ilike.%${searchQuery}%`);
            }

            const { data, count, error } = await query.range(from, to);

            if (error) throw error;

            setStudents(data || []);
            if (count) {
                setTotalPages(Math.ceil(count / pageSize));
            } else {
                setTotalPages(1);
            }
        } catch (err) {
            console.error('Error fetching students:', err);
            toast.error("O'quvchilarni yuklashda xatolik");
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Haqiqatan ham bu o\'quvchini o\'chirmoqchimisiz?')) return;
        try {
            const { error } = await supabase.from('profiles').delete().eq('id', id);
            if (error) throw error;
            toast.success("O'quvchi o'chirildi", {
                style: { borderRadius: '15px', background: '#333', color: '#fff' }
            });
        } catch (err) {
            console.error('Error deleting student:', err);
            toast.error("O'chirishda xatolik");
        }
    };

    const handleEdit = (student) => {
        setEditingStudent(student);
        setFormData({
            first_name: student.first_name || '',
            last_name: student.last_name || '',
            phone: student.phone || ''
        });
        setIsFormatModalOpen(true);
    };

    const handleAdd = () => {
        setShowCreateModal(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingStudent) {
                const { error } = await supabase
                    .from('profiles')
                    .update({
                        first_name: formData.first_name,
                        last_name: formData.last_name,
                        phone: formData.phone,
                        full_name: `${formData.first_name} ${formData.last_name}`.trim()
                    })
                    .eq('id', editingStudent.id);
                if (error) throw error;
                toast.success("Muvaffaqiyatli saqlandi");
            } else {
                handleAdd();
                return;
            }

            setIsFormatModalOpen(false);
        } catch (err) {
            console.error('Error saving student:', err);
            toast.error("Saqlashda xatolik: " + err.message);
        }
    };

    const getStatusBadge = (status) => {
        switch (status) {
            case 'approved': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
            case 'pending': return 'bg-amber-100 text-amber-700 border-amber-200';
            case 'rejected': return 'bg-rose-100 text-rose-700 border-rose-200';
            default: return 'bg-slate-100 text-slate-700 border-slate-200';
        }
    };

    const handleExport = () => {
        if (students.length === 0) return toast.error("Eksport qilish uchun ma'lumot yo'q");

        const escapeCSV = (val) => {
            if (val === null || val === undefined) return '';
            const str = String(val);
            if (str.includes(',') || str.includes('\"') || str.includes('\n')) {
                return `\"${str.replace(/\"/g, '\"\"')}\"`;
            }
            return str;
        };

        const headers = ["O'quvchi", "Kodi", "Telefon", "Holat", "Sana"];
        const rows = students.map(s => [
            s.full_name || `${s.first_name || ''} ${s.last_name || ''}`.trim(),
            s.student_code || '-',
            s.phone || '-',
            s.status || '-',
            s.created_at ? format(new Date(s.created_at), 'yyyy-MM-dd') : '-'
        ]);

        const csvContent = headers.map(escapeCSV).join(',') + "\n"
            + rows.map(r => r.map(escapeCSV).join(',')).join("\n");

        const blob = new Blob(["\uFEFF" + csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `terra_students_${format(new Date(), 'yyyy_MM_dd')}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast.success("CSV hisoboti tayyorlandi");
    };

    return (
        <div className="space-y-10 animate-fade-in pb-10">
            {/* Intel-Grade Header */}
            <div className="relative group overflow-hidden rounded-[3rem] bg-slate-900 border border-white/5 shadow-[0_50px_100px_rgba(0,0,0,0.2)]">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-900 via-slate-900 to-black opacity-90 transition-transform duration-1000 group-hover:scale-105"></div>
                <div className="absolute -top-40 -left-40 w-[600px] h-[600px] bg-blue-600/10 rounded-full blur-[120px] mix-blend-screen animate-pulse"></div>

                <div className="relative z-10 p-5 sm:p-10 md:p-14 flex flex-col md:flex-row items-center justify-between gap-6 md:gap-10">
                    <div>
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="inline-flex items-center gap-2 px-4 py-1.5 bg-white/5 rounded-full border border-white/10 text-[10px] font-black uppercase tracking-[0.2em] text-blue-300 mb-4 md:mb-6 backdrop-blur-xl"
                        >
                            <GraduationCap size={14} className="text-blue-400" />
                            Registry Intelligence
                        </motion.div>
                        <h1 className="text-2xl sm:text-4xl md:text-6xl font-black text-white tracking-tighter mb-3 md:mb-4 leading-none">
                            O'quvchilar <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-400 to-cyan-400">Arxivi.</span>
                        </h1>
                        <p className="text-slate-400 font-medium text-base md:text-xl max-w-xl leading-relaxed">
                            Barcha o'quvchilar ma'lumotlarini <span className="text-white font-bold">industrial</span> standartda boshqaring va nazorat qiling.
                        </p>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-4">
                        <div className="bg-white/5 border border-white/10 backdrop-blur-2xl px-8 py-6 rounded-[2.5rem] flex flex-col justify-center">
                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 text-center">Jami Faol</span>
                            <div className="flex items-center gap-3 justify-center">
                                <span className="font-black text-white text-3xl tracking-tighter">{students.length}</span>
                                <span className="text-blue-400 bg-blue-400/10 p-1 rounded-lg">
                                    <Activity size={16} />
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Advanced Search & Controls */}
            <div className="glass-card p-3 flex flex-col md:flex-row items-center gap-4 sticky top-24 z-30 bg-white/80 backdrop-blur-xl border-white/40 shadow-2xl shadow-slate-200/50 rounded-[2rem]">
                <div className="relative flex-1 w-full group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={20} />
                    <input
                        type="text"
                        placeholder="Ism, ID yoki kodi bo'yicha izlash..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-12 pr-6 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-500/20 focus:bg-white transition-all text-sm font-bold text-slate-700 placeholder:text-slate-400"
                    />
                </div>
                <div className="flex gap-3 w-full md:w-auto">
                    <button
                        onClick={() => fetchStudents(currentPage)}
                        disabled={loading}
                        className="p-4 bg-slate-100 text-slate-500 rounded-2xl hover:bg-blue-600 hover:text-white transition-all shadow-sm active:scale-95 disabled:opacity-50"
                    >
                        <RefreshCw size={24} className={loading ? 'animate-spin' : ''} />
                    </button>
                    <button
                        onClick={handleExport}
                        className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-4 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-2xl transition-all font-black text-[10px] uppercase tracking-[0.2em]"
                    >
                        <Download size={18} />
                        Eksport
                    </button>
                    <button
                        onClick={handleAdd}
                        className="flex-1 md:flex-none btn-primary from-blue-500 to-indigo-600 shadow-blue-500/30 rounded-2xl px-6 py-4 flex items-center gap-2"
                    >
                        <UserPlus size={20} />
                        <span className="font-black text-[10px] uppercase tracking-[0.2em]">O'quvchi Qo'shish</span>
                    </button>
                </div>
            </div>

            {/* Separated Row Table */}
            <div className="overflow-x-auto">
            <div className="min-w-[640px] space-y-4">
                <div className="px-10 grid grid-cols-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                    <div className="col-span-2">O'quvchi Ma'lumotlari</div>
                    <div className="col-span-1">ID Kodi</div>
                    <div className="col-span-1">Kontakt</div>
                    <div className="col-span-1 text-center">Holati</div>
                    <div className="col-span-1 text-right">Boshqaruv</div>
                </div>

                {loading ? (
                    <div className="py-20 flex flex-col items-center gap-4">
                        <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Ma'lumotlar yuklanmoqda...</p>
                    </div>
                ) : students.length === 0 ? (
                    <EmptyState
                        title="O'quvchilar topilmadi"
                        description={searchQuery ? `"${searchQuery}" bo'yicha hech qanday o'quvchi topilmadi.` : "Hozircha o'quvchilar ro'yxati bo'sh."}
                    />
                ) : (
                    <div className="space-y-4">
                        <AnimatePresence mode="popLayout">
                            {students.map((student, idx) => (
                                <motion.div
                                    key={student.id}
                                    initial={{ opacity: 0, scale: 0.98, y: 10 }}
                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                    transition={{ delay: idx * 0.05 }}
                                    className="p-3 bg-white border border-slate-100 rounded-[2.5rem] shadow-sm hover:shadow-2xl hover:shadow-slate-200/50 hover:bg-slate-50 transition-all duration-500 group cursor-pointer"
                                    onClick={() => navigate(`/admin/students/${student.id}`)}
                                >
                                    <div className="grid grid-cols-6 items-center">
                                        <div className="col-span-2 flex items-center gap-4 pl-6">
                                            <div className="w-14 h-14 bg-blue-100 text-blue-600 rounded-3xl flex items-center justify-center font-black text-xl border border-blue-200 group-hover:scale-110 transition-transform duration-500 shadow-inner overflow-hidden">
                                                {(student.full_name || 'S').charAt(0).toUpperCase()}
                                            </div>
                                            <div>
                                                <h4 className="font-black text-slate-800 leading-none group-hover:text-blue-600 transition-colors uppercase tracking-tight">{student.full_name}</h4>
                                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mt-1.5 block flex items-center gap-1.5">
                                                    <Calendar size={10} /> {format(new Date(student.created_at), 'dd MMM, yyyy', { locale: uz })}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="col-span-1">
                                            <span className="font-black text-[10px] text-blue-600 bg-blue-50 px-4 py-2 rounded-xl border border-blue-100 uppercase tracking-widest">
                                                {student.student_code || '---'}
                                            </span>
                                        </div>
                                        <div className="col-span-1">
                                            <div className="flex flex-col gap-1">
                                                <div className="flex items-center gap-2 text-[10px] font-black text-slate-600 tracking-wider">
                                                    <Phone size={12} className="text-slate-400" />
                                                    {student.phone || 'N/A'}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="col-span-1 flex justify-center">
                                            <div className={`px-5 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-2 border ${getStatusBadge(student.status)}`}>
                                                <div className={`w-2 h-2 rounded-full ${student.status === 'approved' ? 'bg-emerald-500' :
                                                    student.status === 'pending' ? 'bg-amber-500 animate-pulse' : 'bg-rose-500'
                                                    }`} />
                                                {student.status}
                                            </div>
                                        </div>
                                        <div className="col-span-1 pr-6 flex justify-end gap-2">
                                            <button
                                                onClick={(e) => { e.stopPropagation(); navigate(`/admin/students/${student.id}`); }}
                                                className="w-11 h-11 bg-white text-slate-400 hover:bg-blue-600 hover:text-white rounded-[1.2rem] flex items-center justify-center transition-all hover:scale-110 border border-slate-100 shadow-sm"
                                                title="Profilni ko'rish"
                                            >
                                                <ArrowUpRight size={18} />
                                            </button>
                                            <button
                                                onClick={(e) => { e.stopPropagation(); handleEdit(student); }}
                                                className="w-11 h-11 bg-white text-slate-400 hover:bg-indigo-600 hover:text-white rounded-[1.2rem] flex items-center justify-center transition-all hover:scale-110 border border-slate-100 shadow-sm"
                                                title="Tahrirlash"
                                            >
                                                <Pencil size={18} />
                                            </button>
                                            <button
                                                onClick={(e) => { e.stopPropagation(); handleDelete(student.id); }}
                                                className="w-11 h-11 bg-white text-slate-400 hover:bg-rose-600 hover:text-white rounded-[1.2rem] flex items-center justify-center transition-all hover:scale-110 border border-slate-100 shadow-sm"
                                                title="O'chirish"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>
                )}
            </div>
            </div>

            {/* Ultra-Premium Pagination */}
            {totalPages > 1 && (
                <div className="flex items-center justify-between px-10 pt-6">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">
                        Sahifa <span className="text-slate-900 border-b-2 border-blue-500">{currentPage}</span> dan {totalPages} gacha
                    </p>
                    <div className="flex gap-4">
                        <button
                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                            disabled={currentPage === 1}
                            className="w-14 h-14 bg-white border border-slate-100 rounded-[1.5rem] flex items-center justify-center text-slate-400 hover:text-blue-600 hover:border-blue-200 transition-all disabled:opacity-30 shadow-xl shadow-slate-200/50"
                        >
                            <ChevronLeft size={24} />
                        </button>
                        <button
                            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                            disabled={currentPage === totalPages}
                            className="w-14 h-14 bg-white border border-slate-100 rounded-[1.5rem] flex items-center justify-center text-slate-400 hover:text-blue-600 hover:border-blue-200 transition-all disabled:opacity-30 shadow-xl shadow-slate-200/50"
                        >
                            <ChevronRight size={24} />
                        </button>
                    </div>
                </div>
            )}

            {/* Create User Modal */}
            <AnimatePresence>
                {showCreateModal && (
                    <CreateUserModal
                        role="student"
                        onSuccess={() => fetchStudents(currentPage)}
                        onClose={() => setShowCreateModal(false)}
                    />
                )}
            </AnimatePresence>

            {/* Edit / Add Modal */}
            <AnimatePresence>
                {isFormatModalOpen && (
                    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-slate-950/40 backdrop-blur-2xl"
                            onClick={() => setIsFormatModalOpen(false)}
                        />
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            className="bg-white rounded-[3.5rem] p-12 w-full max-w-lg relative z-10 shadow-2xl border border-white/20"
                        >
                            <div className="mb-10">
                                <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-blue-50 text-blue-700 rounded-full text-[10px] font-black uppercase tracking-widest mb-6 border border-blue-100 italic">
                                    <ShieldCheck size={14} /> Profile Intelligence
                                </div>
                                <h2 className="text-4xl font-black text-slate-900 tracking-tighter uppercase italic">
                                    {editingStudent ? "Ma'lumotlarni tahrirlash" : "Yangi o'quvchi"}
                                </h2>
                                <p className="text-slate-400 mt-2 font-bold tracking-wide">Profil detallarini aniqlik bilan boshqaring</p>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div className="grid grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4 block">Ism</label>
                                        <input
                                            type="text"
                                            value={formData.first_name}
                                            onChange={e => setFormData({ ...formData, first_name: e.target.value })}
                                            className="w-full px-6 py-5 bg-slate-50 border-none rounded-[1.5rem] focus:ring-4 focus:ring-blue-500/10 focus:bg-white transition-all text-sm font-black text-slate-800"
                                            placeholder="John"
                                            required
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4 block">Familiya</label>
                                        <input
                                            type="text"
                                            value={formData.last_name}
                                            onChange={e => setFormData({ ...formData, last_name: e.target.value })}
                                            className="w-full px-6 py-5 bg-slate-50 border-none rounded-[1.5rem] focus:ring-4 focus:ring-blue-500/10 focus:bg-white transition-all text-sm font-black text-slate-800"
                                            placeholder="Doe"
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4 block">Telefon raqam</label>
                                    <input
                                        type="tel"
                                        value={formData.phone}
                                        onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                        className="w-full px-6 py-5 bg-slate-50 border-none rounded-[1.5rem] focus:ring-4 focus:ring-blue-500/10 focus:bg-white transition-all text-sm font-black text-slate-800"
                                        placeholder="+998 90 123 45 67"
                                    />
                                </div>

                                <div className="pt-8 flex gap-4">
                                    <button
                                        type="button"
                                        onClick={() => setIsFormatModalOpen(false)}
                                        className="flex-1 py-6 bg-slate-50 text-slate-400 font-black rounded-2xl hover:bg-slate-100 transition-all uppercase tracking-widest text-[10px]"
                                    >
                                        Bekor qilish
                                    </button>
                                    <button
                                        type="submit"
                                        className="flex-[2] py-6 bg-blue-600 text-white font-black rounded-2xl hover:bg-blue-700 shadow-2xl shadow-blue-500/30 transition-all uppercase tracking-[0.2em] text-[10px] hover:scale-[1.02]"
                                    >
                                        {editingStudent ? 'Ma\'lumotlarni saqlash' : "Ro'yxatni ochish"}
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

export default StudentList;
