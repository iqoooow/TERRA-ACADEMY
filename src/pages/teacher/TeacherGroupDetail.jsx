import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ChevronLeft, Users, Clock, BookOpen, Calendar,
    GraduationCap, ClipboardCheck, Loader2, UserCircle2
} from 'lucide-react';

const DAY_LABELS = { Mon: 'Du', Tue: 'Se', Wed: 'Ch', Thu: 'Pa', Fri: 'Ju', Sat: 'Sh', Sun: 'Ya' };

const TeacherGroupDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [group, setGroup] = useState(null);
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                // 1. Group info
                const { data: grp, error } = await supabase
                    .from('groups')
                    .select('id, name, time, schedule_days, subjects (name)')
                    .eq('id', id)
                    .single();
                if (error) throw error;
                setGroup(grp);

                // 2. Enrolled students
                const { data: enrollments } = await supabase
                    .from('enrollments')
                    .select('profiles (id, full_name, first_name, last_name, phone)')
                    .eq('group_id', id);

                const list = (enrollments || []).map(e => e.profiles).filter(Boolean);
                setStudents(list);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        if (id) fetchData();
    }, [id]);

    if (loading) {
        return (
            <div className="h-[60vh] flex items-center justify-center">
                <Loader2 size={36} className="animate-spin text-indigo-600" />
            </div>
        );
    }

    if (!group) {
        return (
            <div className="h-[60vh] flex flex-col items-center justify-center gap-4">
                <p className="text-slate-500 font-bold">Guruh topilmadi</p>
                <button onClick={() => navigate('/teacher/groups')} className="text-indigo-600 font-black text-sm underline">
                    Orqaga
                </button>
            </div>
        );
    }

    const scheduleDays = (group.schedule_days || [])
        .map(d => DAY_LABELS[d] || d)
        .join(', ');

    return (
        <div className="space-y-6 animate-fade-in max-w-[1200px] mx-auto pb-10">

            {/* Header */}
            <div className="relative overflow-hidden rounded-[2.5rem] bg-slate-900 shadow-2xl">
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-700 via-violet-800 to-slate-900 opacity-95" />
                <div className="absolute -top-20 -right-20 w-80 h-80 bg-indigo-500/20 rounded-full blur-[80px]" />

                <div className="relative z-10 p-5 sm:p-10">
                    <button
                        onClick={() => navigate('/teacher/groups')}
                        className="inline-flex items-center gap-2 text-indigo-300 font-black text-[10px] uppercase tracking-widest mb-6 hover:text-white transition-colors"
                    >
                        <ChevronLeft size={14} /> Guruhlar
                    </button>

                    <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6">
                        <div>
                            <span className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 rounded-full text-[10px] font-black uppercase tracking-widest mb-4 border border-white/10 text-indigo-300">
                                <BookOpen size={12} /> {group.subjects?.name || 'Fan'}
                            </span>
                            <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tighter leading-none">
                                {group.name}
                            </h1>
                        </div>

                        <div className="flex gap-3 flex-wrap">
                            <div className="bg-white/10 border border-white/10 backdrop-blur-md rounded-2xl px-5 py-3 flex items-center gap-2">
                                <Clock size={16} className="text-indigo-300" />
                                <span className="text-white font-black text-sm">
                                    {group.time?.slice(0, 5) || '--:--'}
                                </span>
                            </div>
                            <div className="bg-white/10 border border-white/10 backdrop-blur-md rounded-2xl px-5 py-3 flex items-center gap-2">
                                <Calendar size={16} className="text-indigo-300" />
                                <span className="text-white font-black text-sm">
                                    {scheduleDays || 'TBD'}
                                </span>
                            </div>
                            <div className="bg-white/10 border border-white/10 backdrop-blur-md rounded-2xl px-5 py-3 flex items-center gap-2">
                                <Users size={16} className="text-indigo-300" />
                                <span className="text-white font-black text-sm">{students.length} ta</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-2 gap-4">
                <button
                    onClick={() => navigate('/teacher/grades')}
                    className="flex items-center gap-3 p-5 bg-white border border-slate-100 rounded-[2rem] shadow-sm hover:shadow-xl hover:border-indigo-100 transition-all group"
                >
                    <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                        <GraduationCap size={22} />
                    </div>
                    <div className="text-left">
                        <p className="font-black text-slate-900 text-sm uppercase tracking-tight">Baholar</p>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Baho qo'shish</p>
                    </div>
                </button>
                <button
                    onClick={() => navigate('/teacher/attendance')}
                    className="flex items-center gap-3 p-5 bg-white border border-slate-100 rounded-[2rem] shadow-sm hover:shadow-xl hover:border-emerald-100 transition-all group"
                >
                    <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                        <ClipboardCheck size={22} />
                    </div>
                    <div className="text-left">
                        <p className="font-black text-slate-900 text-sm uppercase tracking-tight">Davomat</p>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Davomat belgilash</p>
                    </div>
                </button>
            </div>

            {/* Students List */}
            <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-xl overflow-hidden">
                <div className="p-6 sm:p-8 border-b border-slate-100 flex items-center justify-between">
                    <h3 className="text-xl font-black text-slate-900 flex items-center gap-3">
                        <span className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center">
                            <Users size={20} />
                        </span>
                        O'quvchilar
                    </h3>
                    <span className="px-3 py-1 bg-indigo-50 text-indigo-600 rounded-full text-xs font-black uppercase tracking-widest border border-indigo-100">
                        {students.length} ta
                    </span>
                </div>

                {students.length === 0 ? (
                    <div className="py-16 flex flex-col items-center gap-3">
                        <UserCircle2 size={40} className="text-slate-200" />
                        <p className="text-slate-400 font-bold text-sm uppercase tracking-widest">O'quvchilar yo'q</p>
                    </div>
                ) : (
                    <div className="divide-y divide-slate-50">
                        {students.map((student, idx) => (
                            <motion.div
                                key={student.id}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: idx * 0.04 }}
                                className="flex items-center gap-4 px-6 sm:px-8 py-4 hover:bg-slate-50 transition-colors"
                            >
                                <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white font-black text-sm shrink-0">
                                    {(student.full_name || student.first_name || 'O')[0].toUpperCase()}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="font-black text-slate-800 text-sm uppercase tracking-tight truncate">
                                        {student.full_name || `${student.first_name || ''} ${student.last_name || ''}`.trim()}
                                    </p>
                                    {student.phone && (
                                        <p className="text-[10px] font-bold text-slate-400 font-mono tracking-wider">
                                            {student.phone}
                                        </p>
                                    )}
                                </div>
                                <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">
                                    #{idx + 1}
                                </span>
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default TeacherGroupDetail;
