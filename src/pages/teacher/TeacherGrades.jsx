import React, { useState, useEffect } from 'react';
import { GraduationCap, Plus, Loader2, X, Trash2, CheckCircle2, Award, Zap, ChevronDown, Calendar, Filter, Link, FileText } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';

const TYPE_LABELS = {
    cefr: { label: 'CEFR', color: 'bg-indigo-100 text-indigo-700' },
    ielts: { label: 'IELTS', color: 'bg-rose-100 text-rose-700' },
    test: { label: 'Test', color: 'bg-blue-100 text-blue-700' },
    exam: { label: 'Imtihon', color: 'bg-purple-100 text-purple-700' },
    quiz: { label: 'Quiz', color: 'bg-amber-100 text-amber-700' },
    homework: { label: 'Uy vazifasi', color: 'bg-emerald-100 text-emerald-700' },
    other: { label: 'Boshqa', color: 'bg-slate-100 text-slate-700' },
};

const getLastSunday = () => {
    const d = new Date();
    const day = d.getDay();
    d.setDate(d.getDate() - day);
    return d.toISOString().split('T')[0];
};

const TeacherGrades = () => {
    const { user } = useAuth();
    const [groups, setGroups] = useState([]);
    const [selectedGroup, setSelectedGroup] = useState(null);
    const [grades, setGrades] = useState([]);
    const [students, setStudents] = useState([]);
    const [exams, setExams] = useState([]);
    const [loadingGroups, setLoadingGroups] = useState(true);
    const [loadingData, setLoadingData] = useState(false);
    const [modalOpen, setModalOpen] = useState(false);
    const [saving, setSaving] = useState(false);
    const [form, setForm] = useState({
        student_id: '',
        title: '',
        score: '',
        grade_type: 'cefr',
        date: getLastSunday(),
    });

    useEffect(() => {
        if (!user?.id) return;
        setLoadingGroups(true);
        (async () => {
            try {
                const { data, error } = await supabase
                    .from('groups')
                    .select('id, name')
                    .eq('teacher_id', user.id)
                    .order('name');
                if (error) throw error;
                setGroups(data || []);
                if (data?.length && !selectedGroup) setSelectedGroup(data[0].id);
            } catch (e) {
                console.error(e);
                toast.error("Guruhlarni yuklashda xatolik");
            } finally {
                setLoadingGroups(false);
            }
        })();
    }, [user?.id]);

    useEffect(() => {
        if (!selectedGroup) {
            setGrades([]);
            setStudents([]);
            setExams([]);
            return;
        }
        setLoadingData(true);
        (async () => {
            try {
                const [gradesRes, enrollRes, examsRes] = await Promise.all([
                    supabase
                        .from('grades')
                        .select(`
                            id, student_id, title, score, grade_type, date,
                            profiles!student_id (full_name, first_name, last_name)
                        `)
                        .eq('group_id', selectedGroup)
                        .order('date', { ascending: false }),
                    supabase
                        .from('enrollments')
                        .select('student_id, profiles (id, full_name, first_name, last_name)')
                        .eq('group_id', selectedGroup),
                    supabase
                        .from('exams')
                        .select('id, title, date, type')
                        .eq('group_id', selectedGroup)
                        .order('date', { ascending: false })
                        .limit(10)
                ]);

                if (gradesRes.error) throw gradesRes.error;

                const rows = (gradesRes.data || []).map((r) => {
                    const p = r.profiles;
                    const name = p?.full_name || [p?.first_name, p?.last_name].filter(Boolean).join(' ').trim() || '—';
                    return { ...r, studentName: name };
                });
                setGrades(rows);

                const list = (enrollRes.data || []).map((e) => {
                    const p = e.profiles;
                    const name = p?.full_name || [p?.first_name, p?.last_name].filter(Boolean).join(' ').trim() || '—';
                    return { id: e.student_id, name };
                });
                setStudents(list);

                setExams(examsRes.data || []);

            } catch (e) {
                console.error(e);
                toast.error("Ma'lumotlarni yuklashda xatolik");
                setGrades([]);
                setStudents([]);
            } finally {
                setLoadingData(false);
            }
        })();
    }, [selectedGroup]);

    const refetch = async () => {
        if (!selectedGroup) return;
        const { data, error } = await supabase
            .from('grades')
            .select(`
                id, student_id, title, score, grade_type, date,
                profiles!student_id (full_name, first_name, last_name)
            `)
            .eq('group_id', selectedGroup)
            .order('date', { ascending: false });
        if (!error) {
            const rows = (data || []).map((r) => {
                const p = r.profiles;
                const name = p?.full_name || [p?.first_name, p?.last_name].filter(Boolean).join(' ').trim() || '—';
                return { ...r, studentName: name };
            });
            setGrades(rows);
        }
    };

    const handleAdd = async (e) => {
        e.preventDefault();
        if (!selectedGroup || !user?.id || !form.student_id || !form.title.trim() || !form.score.trim()) return;
        setSaving(true);
        try {
            const { error } = await supabase.from('grades').insert([{
                student_id: form.student_id,
                group_id: selectedGroup,
                title: form.title.trim(),
                score: form.score.trim(),
                grade_type: form.grade_type,
                date: form.date,
                recorded_by: user.id,
            }]);
            if (error) throw error;
            setForm({ student_id: '', title: '', score: '', grade_type: 'cefr', date: getLastSunday() });
            setModalOpen(false);
            toast.success("Baho muvaffaqiyatli qo'shildi");
            refetch();
        } catch (err) {
            console.error(err);
            toast.error("Baho qo'shishda xatolik: " + (err.message || ''));
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('Ushbu bahoni o\'chirishni xohlaysizmi?')) return;
        try {
            const { error } = await supabase.from('grades').delete().eq('id', id);
            if (error) throw error;
            toast.success("Baho o'chirildi");
            refetch();
        } catch (err) {
            console.error(err);
            toast.error('O\'chirishda xatolik');
        }
    };

    const handleExamSelect = (examId) => {
        const exam = exams.find(e => e.id === examId);
        if (exam) {
            setForm(prev => ({
                ...prev,
                title: exam.title,
                date: exam.date,
                grade_type: exam.type?.toLowerCase() || 'exam'
            }));
        }
    };

    return (
        <div className="space-y-8 animate-fade-in max-w-[1600px] mx-auto pb-10">
            {/* Header */}
            <div className="flex flex-col xl:flex-row justify-between gap-6 bg-slate-900 p-8 rounded-[2.5rem] shadow-2xl relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-r from-violet-900 via-slate-900 to-indigo-900 opacity-90 group-hover:scale-105 transition-transform duration-1000"></div>
                <div className="absolute top-0 right-0 w-80 h-80 bg-purple-500/20 rounded-full blur-[80px]"></div>

                <div className="relative z-10 flex flex-col justify-center">
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 rounded-full text-[10px] font-black uppercase tracking-widest mb-3 backdrop-blur-md border border-white/10 text-violet-300"
                    >
                        <Award size={12} />
                        O'zlashtirish Nazorati
                    </motion.div>
                    <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight mb-2">
                        Baholar Jurnali
                    </h1>
                    <p className="text-slate-400 font-medium text-lg max-w-xl">
                        O'quvchilarning bilim darajasini baholang va monitoring qiling.
                    </p>
                </div>

                <div className="relative z-10 flex flex-col sm:flex-row gap-4 items-end sm:items-center">
                    <div className="glass-card bg-white/5 border-white/10 p-4 rounded-2xl min-w-[240px] flex items-center justify-between gap-4">
                        <div>
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Guruhni Tanlang</label>
                            <div className="relative">
                                <select
                                    value={selectedGroup ?? ''}
                                    onChange={(e) => setSelectedGroup(e.target.value || null)}
                                    className="w-full bg-transparent text-white font-bold text-lg focus:outline-none appearance-none cursor-pointer pr-6"
                                    disabled={loadingGroups}
                                >
                                    {groups.map((g) => (
                                        <option key={g.id} value={g.id} className="text-slate-900">{g.name}</option>
                                    ))}
                                    {groups.length === 0 && <option value="" className="text-slate-900">Guruhlar yo'q</option>}
                                </select>
                                <ChevronDown className="absolute right-0 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
                            </div>
                        </div>
                        <div className="w-10 h-10 rounded-xl bg-violet-500/20 flex items-center justify-center text-violet-300">
                            <Filter size={20} />
                        </div>
                    </div>

                    <button
                        onClick={() => {
                            setForm({ student_id: '', title: '', score: '', grade_type: 'cefr', date: getLastSunday() });
                            setModalOpen(true);
                        }}
                        disabled={!selectedGroup || loadingData}
                        className="h-full px-8 py-4 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white rounded-2xl font-bold uppercase tracking-widest text-xs shadow-lg shadow-violet-500/30 transition-all flex items-center gap-2 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <Plus size={18} />
                        Baho Qo'shish
                    </button>
                </div>
            </div>

            {loadingData ? (
                <div className="flex flex-col items-center justify-center py-20 bg-white rounded-[2.5rem] border border-slate-100 shadow-sm">
                    <Loader2 size={40} className="animate-spin text-violet-500 mb-4" />
                    <p className="text-slate-500 font-medium">Jurnal yuklanmoqda...</p>
                </div>
            ) : !selectedGroup ? (
                <div className="flex flex-col items-center justify-center py-24 bg-white rounded-[2.5rem] border-2 border-dashed border-slate-200">
                    <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-6">
                        <Filter className="text-slate-300" size={32} />
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 mb-2">Guruh tanlanmagan</h3>
                    <p className="text-slate-500 text-center max-w-sm">Iltimos, ishni boshlash uchun yuqoridagi menyudan guruhni tanlang.</p>
                </div>
            ) : grades.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-24 bg-white rounded-[2.5rem] border border-slate-100 shadow-sm">
                    <div className="w-20 h-20 bg-violet-50 rounded-full flex items-center justify-center mb-6">
                        <GraduationCap className="text-violet-300" size={32} />
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 mb-2">Baholar mavjud emas</h3>
                    <p className="text-slate-500 text-center max-w-sm mb-6">Ushbu guruh uchun hali hech qanday baho kiritilmagan.</p>
                    <button
                        onClick={() => setModalOpen(true)}
                        className="px-6 py-3 bg-slate-900 text-white rounded-xl font-bold text-xs uppercase tracking-wider hover:bg-slate-800 transition-colors"
                    >
                        Birinchi bahoni qo'shish
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-4">
                    <AnimatePresence>
                        {grades.map((r, i) => (
                            <motion.div
                                key={r.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                transition={{ delay: i * 0.05 }}
                                className="group bg-white p-5 rounded-[1.5rem] border border-slate-100 hover:border-violet-100 hover:shadow-lg hover:shadow-violet-500/10 transition-all flex flex-col sm:flex-row items-center gap-6"
                            >
                                {/* Date Box */}
                                <div className="hidden sm:flex flex-col items-center justify-center w-16 h-16 bg-slate-50 rounded-2xl border border-slate-100 group-hover:bg-violet-50 group-hover:border-violet-100 transition-colors">
                                    <span className="text-[10px] font-black uppercase text-slate-400 group-hover:text-violet-400">
                                        {r.date ? new Date(r.date).toLocaleDateString('en-US', { month: 'short' }) : '---'}
                                    </span>
                                    <span className="text-xl font-black text-slate-700 group-hover:text-violet-600">
                                        {r.date ? new Date(r.date).getDate() : '--'}
                                    </span>
                                </div>

                                {/* Info */}
                                <div className="flex-1 text-center sm:text-left">
                                    <div className="flex items-center justify-center sm:justify-start gap-3 mb-1">
                                        <h4 className="text-lg font-bold text-slate-900 group-hover:text-violet-600 transition-colors">
                                            {r.studentName}
                                        </h4>
                                        <span className={`px-2 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-widest ${TYPE_LABELS[r.grade_type]?.color || 'bg-slate-100 text-slate-600'}`}>
                                            {TYPE_LABELS[r.grade_type]?.label || r.grade_type}
                                        </span>
                                    </div>
                                    <p className="text-sm font-medium text-slate-500">{r.title}</p>
                                </div>

                                {/* Score */}
                                <div className="flex items-center gap-6 w-full sm:w-auto justify-between sm:justify-end">
                                    <div className="px-6 py-2 bg-slate-900 text-white rounded-xl font-black text-lg shadow-lg shadow-slate-900/10">
                                        {r.score}
                                    </div>
                                    <button
                                        onClick={() => handleDelete(r.id)}
                                        className="w-10 h-10 rounded-xl bg-slate-50 text-slate-400 hover:bg-rose-50 hover:text-rose-500 flex items-center justify-center transition-colors"
                                        title="O'chirish"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>
            )}

            {/* Modal */}
            <AnimatePresence>
                {modalOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4"
                        onClick={() => !saving && setModalOpen(false)}
                    >
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="bg-white rounded-[2rem] w-full max-w-lg shadow-2xl overflow-hidden"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                                <div>
                                    <h2 className="text-2xl font-black text-slate-900">Baho Qo'shish</h2>
                                    <p className="text-slate-500 text-sm font-medium">Yangi natijani kiriting</p>
                                </div>
                                <button onClick={() => !saving && setModalOpen(false)} className="w-10 h-10 rounded-full bg-white border border-slate-200 text-slate-400 hover:text-slate-600 flex items-center justify-center transition-colors">
                                    <X size={20} />
                                </button>
                            </div>

                            <form onSubmit={handleAdd} className="p-8 space-y-6">
                                {/* Create/Select Exam Link */}
                                {exams.length > 0 && (
                                    <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-100">
                                        <label className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest block mb-2 flex items-center gap-1">
                                            <FileText size={12} /> Imtihonga bog'lash
                                        </label>
                                        <div className="relative">
                                            <select
                                                onChange={(e) => handleExamSelect(e.target.value)}
                                                className="w-full bg-transparent text-indigo-900 font-bold focus:outline-none appearance-none cursor-pointer"
                                            >
                                                <option value="">Imtihon tanlanmagan (Mustaqil baho)</option>
                                                {exams.map(e => (
                                                    <option key={e.id} value={e.id}>{e.title} ({new Date(e.date).toLocaleDateString()})</option>
                                                ))}
                                            </select>
                                            <ChevronDown className="absolute right-0 top-1/2 -translate-y-1/2 text-indigo-400 pointer-events-none" size={16} />
                                        </div>
                                    </div>
                                )}

                                <div className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="col-span-2">
                                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 ml-1">O'quvchi</label>
                                            <div className="relative">
                                                <select
                                                    value={form.student_id}
                                                    onChange={(e) => setForm((f) => ({ ...f, student_id: e.target.value }))}
                                                    className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-bold focus:ring-4 focus:ring-violet-500/10 focus:border-violet-500 outline-none appearance-none transition-all"
                                                    required
                                                >
                                                    <option value="">Tanlang...</option>
                                                    {students.map((s) => (
                                                        <option key={s.id} value={s.id}>{s.name}</option>
                                                    ))}
                                                </select>
                                                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 ml-1">Test Turi</label>
                                            <div className="relative">
                                                <select
                                                    value={form.grade_type}
                                                    onChange={(e) => setForm((f) => ({ ...f, grade_type: e.target.value }))}
                                                    className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-bold focus:ring-4 focus:ring-violet-500/10 focus:border-violet-500 outline-none appearance-none transition-all"
                                                >
                                                    {Object.entries(TYPE_LABELS).map(([key, val]) => (
                                                        <option key={key} value={key}>{val.label}</option>
                                                    ))}
                                                </select>
                                                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 ml-1">Sana</label>
                                            <input
                                                type="date"
                                                value={form.date}
                                                onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
                                                className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-bold focus:ring-4 focus:ring-violet-500/10 focus:border-violet-500 outline-none transition-all"
                                                required
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 ml-1">Topshiriq Nomi</label>
                                        <input
                                            type="text"
                                            value={form.title}
                                            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                                            placeholder="Masalan: Unit 1 Test"
                                            className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-bold placeholder:font-medium placeholder:text-slate-400 focus:ring-4 focus:ring-violet-500/10 focus:border-violet-500 outline-none transition-all"
                                            required
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 ml-1">Ball / Natija</label>
                                        <div className="relative">
                                            <input
                                                type="text"
                                                value={form.score}
                                                onChange={(e) => setForm((f) => ({ ...f, score: e.target.value }))}
                                                placeholder="Masalan: 85, B2, 7.5"
                                                className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-bold placeholder:font-medium placeholder:text-slate-400 focus:ring-4 focus:ring-violet-500/10 focus:border-violet-500 outline-none transition-all pl-12"
                                                required
                                            />
                                            <Zap className="absolute left-4 top-1/2 -translate-y-1/2 text-violet-400" size={18} />
                                        </div>
                                    </div>
                                </div>

                                <div className="pt-4 flex gap-4">
                                    <button
                                        type="button"
                                        onClick={() => !saving && setModalOpen(false)}
                                        className="flex-1 py-4 bg-white border border-slate-200 text-slate-700 rounded-xl font-bold uppercase tracking-widest text-xs hover:bg-slate-50 transition-colors"
                                    >
                                        Bekor qilish
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={saving}
                                        className="flex-1 py-4 bg-violet-600 hover:bg-violet-700 text-white rounded-xl font-bold uppercase tracking-widest text-xs shadow-lg shadow-violet-500/30 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
                                    >
                                        {saving ? <Loader2 size={18} className="animate-spin" /> : <CheckCircle2 size={18} />}
                                        {saving ? 'Saqlanmoqda...' : 'Saqlash'}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default TeacherGrades;
