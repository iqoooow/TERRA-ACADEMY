import { useState, useEffect } from 'react';
import { BookOpen, Clock, Users, ChevronRight, Calendar, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { parseScore } from '../../utils/parseScore';

const StudentCourses = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchCourses = async () => {
            if (!user?.id) return;
            try {
                // 1. Fetch Enrollments with Group Details
                const { data: enrollments, error } = await supabase
                    .from('enrollments')
                    .select(`
                        id,
                        groups (
                            id,
                            name,
                            schedule_days,
                            time,
                            room,
                            subjects (name),
                            profiles (full_name, first_name)
                        )
                    `)
                    .eq('student_id', user.id);

                if (error) throw error;

                // 2. Fetch Progress/Grades for EACH group
                const formattedCourses = await Promise.all(enrollments.map(async (e) => {
                    const g = e.groups;

                    // Fetch grades for this specific group/student
                    const { data: grades } = await supabase
                        .from('grades')
                        .select('score')
                        .eq('student_id', user.id)
                        .eq('group_id', g.id);

                    // Calculate Average Score
                    let total = 0;
                    let count = 0;
                    (grades || []).forEach(grade => {
                        const val = parseScore(grade.score);
                        if (val > 0) {
                            total += val;
                            count++;
                        }
                    });

                    const progress = count > 0 ? Math.round(total / count) : 0;

                    // Estimate "completion" based on start date or lessons attended vs total? 
                    // For now, let's use the grade average as a proxy for "Mastery"

                    return {
                        id: g.id,
                        name: g.name,
                        subject: g.subjects?.name || "Noma'lum",
                        teacher: g.profiles?.full_name || g.profiles?.first_name || 'Ustoz',
                        schedule: `${g.schedule_days?.join(', ') || "Aniqlanmagan"} • ${g.time?.slice(0, 5) || '--:--'}`,
                        room: g.room || "Ko'rsatilmagan",
                        progress: progress,
                        status: 'Faol'
                    };
                }));

                setCourses(formattedCourses);
            } catch (err) {
                console.error("Error loading courses:", err);
                toast.error("Kurslarni yuklashda xatolik yuz berdi");
            } finally {
                setLoading(false);
            }
        };

        fetchCourses();
    }, [user?.id]);

    const container = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: { staggerChildren: 0.1 }
        }
    };

    const item = {
        hidden: { y: 20, opacity: 0 },
        show: { y: 0, opacity: 1 }
    };

    return (
        <div className="space-y-8 animate-fade-in max-w-[1600px] mx-auto pb-10">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-slate-900 p-8 rounded-[2.5rem] shadow-lg relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-800 via-slate-900 to-slate-900"></div>
                <div className="absolute -top-10 -right-10 w-48 h-48 bg-blue-400/10 rounded-full blur-[60px] pointer-events-none"></div>

                <div className="relative z-10">
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 rounded-full text-[10px] font-black uppercase tracking-widest mb-3 backdrop-blur-md border border-white/10 text-cyan-300"
                    >
                        <BookOpen size={12} />
                        O'quv Markazi
                    </motion.div>
                    <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight mb-2">
                        Mening Kurslarim
                    </h1>
                    <p className="text-slate-400 font-medium text-lg max-w-xl">
                        Ro'yxatdan o'tgan barcha fanlaringiz va o'zlashtirish ko'rsatkichlaringiz.
                    </p>
                </div>
            </div>

            {/* List */}
            {loading ? (
                <div className="flex justify-center py-20"><Loader2 className="animate-spin text-cyan-500" size={40} /></div>
            ) : courses.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-24 bg-white rounded-[2.5rem] border-2 border-dashed border-slate-200">
                    <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mb-6">
                        <BookOpen className="text-slate-300" size={40} />
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 mb-2">Kurslar topilmadi</h3>
                    <p className="text-slate-500 text-center max-w-sm mb-6">Siz hozircha hech qaysi guruhga a'zo emassiz.</p>
                </div>
            ) : (
                <motion.div
                    variants={container}
                    initial="hidden"
                    animate="show"
                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                >
                    {courses.map((course, i) => (
                        <motion.div
                            key={course.id}
                            variants={item}
                            whileHover={{ y: -5 }}
                            className="group bg-white p-6 rounded-[2rem] border border-slate-100 hover:border-cyan-200 shadow-sm hover:shadow-md transition-all duration-200 relative overflow-hidden flex flex-col"
                        >
                            <div className="absolute top-0 right-0 p-6 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button className="p-2 bg-slate-50 text-slate-400 rounded-xl hover:bg-cyan-50 hover:text-cyan-600 transition-colors">
                                    <ChevronRight size={20} />
                                </button>
                            </div>

                            <div className="mb-6">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-lg ${i % 3 === 0 ? 'bg-gradient-to-br from-blue-500 to-indigo-600 shadow-blue-500/30' :
                                            i % 3 === 1 ? 'bg-gradient-to-br from-purple-500 to-pink-600 shadow-purple-500/30' :
                                                'bg-gradient-to-br from-emerald-500 to-teal-600 shadow-emerald-500/30'
                                        }`}>
                                        <BookOpen size={24} />
                                    </div>
                                    <div>
                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{course.subject}</span>
                                        <h3 className="text-xl font-black text-slate-900 leading-none">{course.name}</h3>
                                    </div>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    <span className="px-2.5 py-1 bg-slate-50 border border-slate-100 rounded-lg text-xs font-bold text-slate-600 flex items-center gap-1.5">
                                        <Users size={12} className="text-slate-400" />
                                        {course.teacher}
                                    </span>
                                    <span className="px-2.5 py-1 bg-slate-50 border border-slate-100 rounded-lg text-xs font-bold text-slate-600 flex items-center gap-1.5">
                                        <Clock size={12} className="text-slate-400" />
                                        {course.schedule}
                                    </span>
                                </div>
                            </div>

                            <div className="mt-auto space-y-4">
                                <div className="flex items-center justify-between text-sm font-bold">
                                    <span className="text-slate-500">O'zlashtirish</span>
                                    <span className={course.progress >= 80 ? 'text-emerald-600' : 'text-amber-600'}>{course.progress}%</span>
                                </div>
                                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${course.progress}%` }}
                                        transition={{ duration: 1.5, ease: "easeOut" }}
                                        className={`h-full rounded-full ${course.progress >= 80 ? 'bg-gradient-to-r from-emerald-500 to-teal-500' :
                                                course.progress >= 60 ? 'bg-gradient-to-r from-blue-500 to-indigo-500' :
                                                    'bg-gradient-to-r from-amber-500 to-orange-500'
                                            }`}
                                    />
                                </div>

                                <div className="pt-4 border-t border-slate-50 flex items-center justify-between">
                                    <div className="flex items-center gap-1.5 text-xs font-bold text-slate-400 uppercase tracking-wide">
                                        <div className={`w-2 h-2 rounded-full ${course.status === 'Active' ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'}`}></div>
                                        {course.status}
                                    </div>
                                    <div className="text-xs font-bold text-slate-400 uppercase tracking-wide flex items-center gap-1">
                                        <Calendar size={12} />
                                        Xona: <span className="text-slate-700 font-extrabold">{course.room}</span>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </motion.div>
            )}
        </div>
    );
};

export default StudentCourses;
