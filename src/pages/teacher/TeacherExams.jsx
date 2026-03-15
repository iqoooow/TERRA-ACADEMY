import { useState, useEffect } from 'react';
import { Plus, FileText, Clock, MapPin, Search, MoreVertical, Trash2, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import ModalPortal from '../../components/common/ModalPortal';

const TeacherExams = () => {
    const { user } = useAuth();
    const [exams, setExams] = useState([]);
    const [groups, setGroups] = useState([]);
    const [loading, setLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [newItem, setNewItem] = useState({
        title: '',
        group_id: '',
        date: '',
        time: '',
        duration: '60',
        room: '',
        type: 'Quiz',
        status: 'Upcoming'
    });
    const [saving, setSaving] = useState(false);

    // Initial Fetch
    useEffect(() => {
        if (!user?.id) return;

        const fetchData = async () => {
            setLoading(true);
            try {
                // 1. Fetch Teacher's Groups (for dropdown)
                const { data: groupData, error: groupError } = await supabase
                    .from('groups')
                    .select('id, name')
                    .eq('teacher_id', user.id);

                if (groupError) throw groupError;
                setGroups(groupData || []);

                // 2. Fetch Exams (if table exists)
                // Note: If table doesn't exist, this will error gracefully
                const { data: examData, error: examError } = await supabase
                    .from('exams')
                    .select('*, groups(name)')
                    .eq('teacher_id', user.id)
                    .order('date', { ascending: true });

                if (examError) {
                    console.warn("Exams table might not exist yet:", examError.message);
                    // Fallback to empty or mock if critical
                } else {
                    setExams(examData || []);
                }
            } catch (err) {
                console.error("Error loading data:", err);
                toast.error("Ma'lumotlarni yuklashda xatolik");
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [user?.id]);

    const handleAdd = async (e) => {
        e.preventDefault();
        if (!user?.id) return;
        setSaving(true);
        try {
            const { error } = await supabase.from('exams').insert([{
                ...newItem,
                teacher_id: user.id
            }]);

            if (error) throw error;

            toast.success("Imtihon muvaffaqiyatli qo'shildi");
            setModalOpen(false);
            setNewItem({ title: '', group_id: '', date: '', time: '', duration: '60', room: '', type: 'Quiz', status: 'Upcoming' });

            // Refresh
            const { data } = await supabase
                .from('exams')
                .select('*, groups(name)')
                .eq('teacher_id', user.id)
                .order('date', { ascending: true });
            setExams(data || []);

        } catch (err) {
            console.error(err);
            toast.error("Saqlashda xatolik: " + err.message);
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id) => {
        if (!confirm("Haqiqatan ham o'chirmoqchimisiz?")) return;
        try {
            const { error } = await supabase.from('exams').delete().eq('id', id);
            if (error) throw error;
            setExams(exams.filter(e => e.id !== id));
            toast.success("O'chirildi");
        } catch (err) {
            console.error(err);
            toast.error("O'chirishda xatolik");
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'Upcoming': return 'bg-indigo-50 text-indigo-700 border-indigo-200';
            case 'Completed': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
            case 'Draft': return 'bg-slate-50 text-slate-700 border-slate-200';
            default: return 'bg-gray-50 text-gray-700';
        }
    };

    const filteredExams = exams.filter(e =>
        e.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        e.groups?.name?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="space-y-8 animate-fade-in max-w-[1600px] mx-auto pb-10">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-slate-900 p-8 rounded-[2.5rem] shadow-lg relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-900 via-slate-900 to-indigo-900 opacity-95"></div>

                <div className="relative z-10">
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 rounded-full text-[10px] font-black uppercase tracking-widest mb-3 backdrop-blur-md border border-white/10 text-blue-300"
                    >
                        <FileText size={12} />
                        Imtihonlar Markazi
                    </motion.div>
                    <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight mb-2">
                        Imtihonlar Jadvali
                    </h1>
                    <p className="text-slate-400 font-medium text-lg max-w-xl">
                        Yaqinlashib kelayotgan nazorat ishlari va imtihonlarni boshqaring.
                    </p>
                </div>

                <div className="relative z-10 flex gap-4">
                    <button
                        onClick={() => setModalOpen(true)}
                        className="px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-2xl font-bold uppercase tracking-widest text-xs shadow-lg shadow-blue-500/30 transition-all flex items-center gap-2 active:scale-95"
                    >
                        <Plus size={18} />
                        Yangi Imtihon
                    </button>
                </div>
            </div>

            {/* Content */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* List */}
                <div className="lg:col-span-2 space-y-4">
                    <div className="relative mb-4">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                        <input
                            type="text"
                            placeholder="Imtihonlarni qidirish..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-12 pr-4 py-4 bg-white rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium text-slate-700"
                        />
                    </div>

                    {loading ? (
                        <div className="flex justify-center p-10"><Loader2 className="animate-spin text-blue-500" /></div>
                    ) : filteredExams.length === 0 ? (
                        <div className="text-center py-10 bg-white rounded-3xl border border-dashed border-slate-300">
                            <p className="text-slate-500 font-medium">Hozircha imtihonlar yo'q</p>
                        </div>
                    ) : (
                        <AnimatePresence>
                            {filteredExams.map((exam, i) => (
                                <motion.div
                                    key={exam.id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                                    transition={{ delay: i * 0.05 }}
                                    className="group bg-white p-6 rounded-[2rem] border border-slate-100 hover:border-blue-200 shadow-sm hover:shadow-lg hover:shadow-blue-500/5 transition-all relative overflow-hidden"
                                >
                                    <div className="absolute top-0 right-0 p-6 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                                        <button onClick={() => handleDelete(exam.id)} className="p-2 bg-rose-50 text-rose-500 rounded-xl hover:bg-rose-100 transition-colors" title="O'chirish">
                                            <Trash2 size={16} />
                                        </button>
                                    </div>

                                    <div className="flex items-start gap-4">
                                        <div className="w-16 h-16 rounded-2xl bg-blue-50 text-blue-600 flex flex-col items-center justify-center border border-blue-100 shrink-0">
                                            <span className="text-xs font-bold uppercase text-blue-400">
                                                {exam.date ? new Date(exam.date).toLocaleString('default', { month: 'short' }) : '--'}
                                            </span>
                                            <span className="text-2xl font-black">
                                                {exam.date ? new Date(exam.date).getDate() : '--'}
                                            </span>
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className={`px-2 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-widest border ${getStatusColor(exam.status)}`}>
                                                    {exam.status}
                                                </span>
                                                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">• {exam.type}</span>
                                            </div>
                                            <h3 className="text-xl font-black text-slate-900 mb-2">{exam.title}</h3>
                                            <div className="flex flex-wrap items-center gap-4 text-sm font-medium text-slate-500">
                                                <span className="flex items-center gap-1.5 bg-slate-50 px-2 py-1 rounded-lg">
                                                    <Clock size={14} className="text-slate-400" />
                                                    {exam.time ? exam.time.substring(0, 5) : '--:--'} ({exam.duration} min)
                                                </span>
                                                <span className="flex items-center gap-1.5 bg-slate-50 px-2 py-1 rounded-lg">
                                                    <MapPin size={14} className="text-slate-400" />
                                                    Room {exam.room || 'TBD'}
                                                </span>
                                                <span className="flex items-center gap-1.5 bg-slate-50 px-2 py-1 rounded-lg">
                                                    <MoreVertical size={14} className="text-slate-400" />
                                                    {exam.groups?.name || 'Guruh?'}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    )}
                </div>

                {/* Sidebar / Stats */}
                <div className="space-y-6">
                    <div className="bg-slate-900 text-white p-6 rounded-[2rem] shadow-xl relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/30 rounded-full blur-[40px]"></div>
                        <h3 className="text-lg font-black mb-4 relative z-10">Statistika</h3>
                        <div className="space-y-4 relative z-10">
                            <div className="flex items-center justify-between p-3 bg-white/10 rounded-xl border border-white/10">
                                <span className="text-sm font-medium text-slate-300">Jami Imtihonlar</span>
                                <span className="font-bold text-xl">{exams.length}</span>
                            </div>
                            <div className="flex items-center justify-between p-3 bg-white/10 rounded-xl border border-white/10">
                                <span className="text-sm font-medium text-slate-300">Yaqin 7 kun</span>
                                <span className="font-bold text-xl">
                                    {exams.filter(e => {
                                        if (!e.date) return false;
                                        const d = new Date(e.date);
                                        const now = new Date();
                                        const diffTime = Math.abs(d - now);
                                        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                                        return diffDays <= 7 && d >= now;
                                    }).length}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Modal */}
            <AnimatePresence>
                {modalOpen && (
                    <ModalPortal><div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
                        onClick={() => !saving && setModalOpen(false)}>
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            className="bg-white rounded-[2.5rem] w-full max-w-md p-8 shadow-2xl relative overflow-hidden"
                            onClick={e => e.stopPropagation()}
                        >
                            <h2 className="text-2xl font-black text-slate-900 mb-6">Yangi Imtihon</h2>
                            <form onSubmit={handleAdd} className="space-y-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5">Mavzu / Nomi</label>
                                    <input required value={newItem.title} onChange={e => setNewItem({ ...newItem, title: e.target.value })} className="w-full p-3 bg-slate-50 rounded-xl border-slate-200 outline-none focus:ring-2 focus:ring-blue-500 transition-all font-bold text-slate-900" placeholder="Masalan: Final Exam" />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5">Guruh</label>
                                    <div className="relative">
                                        <select
                                            required
                                            value={newItem.group_id}
                                            onChange={e => setNewItem({ ...newItem, group_id: e.target.value })}
                                            className="w-full p-3 bg-slate-50 rounded-xl border-slate-200 outline-none focus:ring-2 focus:ring-blue-500 appearance-none font-bold text-slate-900"
                                        >
                                            <option value="">Tanlang...</option>
                                            {groups.map(g => (
                                                <option key={g.id} value={g.id}>{g.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5">Sana</label>
                                        <input required type="date" value={newItem.date} onChange={e => setNewItem({ ...newItem, date: e.target.value })} className="w-full p-3 bg-slate-50 rounded-xl border-slate-200 outline-none focus:ring-2 focus:ring-blue-500 font-bold text-slate-900" />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5">Vaqt</label>
                                        <input required type="time" value={newItem.time} onChange={e => setNewItem({ ...newItem, time: e.target.value })} className="w-full p-3 bg-slate-50 rounded-xl border-slate-200 outline-none focus:ring-2 focus:ring-blue-500 font-bold text-slate-900" />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5">Xona</label>
                                        <input value={newItem.room} onChange={e => setNewItem({ ...newItem, room: e.target.value })} className="w-full p-3 bg-slate-50 rounded-xl border-slate-200 outline-none focus:ring-2 focus:ring-blue-500 font-bold text-slate-900" placeholder="204" />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5">Davomiylik (min)</label>
                                        <input type="number" value={newItem.duration} onChange={e => setNewItem({ ...newItem, duration: e.target.value })} className="w-full p-3 bg-slate-50 rounded-xl border-slate-200 outline-none focus:ring-2 focus:ring-blue-500 font-bold text-slate-900" />
                                    </div>
                                </div>

                                <button type="submit" disabled={saving} className="w-full py-4 bg-blue-600 text-white rounded-xl font-bold uppercase tracking-widest mt-4 hover:bg-blue-700 shadow-lg shadow-blue-500/30 disabled:opacity-50 flex items-center justify-center gap-2">
                                    {saving && <Loader2 className="animate-spin" size={20} />}
                                    {saving ? 'Saqlanmoqda...' : 'Saqlash'}
                                </button>
                            </form>
                        </motion.div>
                    </div></ModalPortal>
                )}
            </AnimatePresence>
        </div>
    );
};

export default TeacherExams;
