import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Trophy, BookOpen, MessageSquare, Star } from 'lucide-react';
import LoadingScreen from '../../components/common/LoadingScreen';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import { parseScore, scoreColorClass } from '../../utils/parseScore';
import { useParent } from '../../context/ParentContext';

const ChildPerformance = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const { selectedChild, selectChild, children } = useParent();

    // URL param takes priority (direct link), then context
    const urlStudentId = searchParams.get('id');
    const studentId = urlStudentId || selectedChild?.id;

    const [grades, setGrades] = useState([]);
    const [loading, setLoading] = useState(true);
    const [studentInfo, setStudentInfo] = useState(null);

    // If URL has an id that differs from context, sync context
    useEffect(() => {
        if (urlStudentId && urlStudentId !== selectedChild?.id) {
            const found = children.find(c => c.id === urlStudentId);
            if (found) selectChild(found);
        }
    }, [urlStudentId]);

    useEffect(() => {
        if (studentId) {
            fetchPerformanceData();
        } else {
            setLoading(false);
        }
    }, [studentId]);

    const fetchPerformanceData = async () => {
        setLoading(true);
        try {
            const { data: student } = await supabase
                .from('profiles')
                .select('full_name')
                .eq('id', studentId)
                .single();
            setStudentInfo(student);

            const { data: gradesData, error } = await supabase
                .from('grades')
                .select(`
                    *,
                    groups (
                        name,
                        subjects (name)
                    )
                `)
                .eq('student_id', studentId)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setGrades(gradesData || []);
        } catch (err) {
            console.error('Error fetching performance:', err);
            toast.error("Ma'lumotlarni yuklashda xatolik yuz berdi");
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <LoadingScreen />;

    if (!studentId) {
        return (
            <div className="h-[60vh] flex flex-col items-center justify-center text-center p-6">
                <div className="w-20 h-20 bg-slate-50 rounded-3xl flex items-center justify-center mb-6 text-slate-300">
                    <Trophy size={40} />
                </div>
                <h2 className="text-2xl font-black text-slate-800 tracking-tighter mb-2">Farzandni tanlang</h2>
                <p className="text-slate-400 font-medium max-w-xs mb-6 text-sm">Natijalarni ko'rish uchun dashboarddan farzandingizni tanlang.</p>
                <button onClick={() => navigate('/parent/dashboard')} className="px-6 py-3 bg-emerald-600 text-white rounded-2xl font-black text-sm hover:bg-emerald-700 transition-colors">
                    Dashboardga qaytish
                </button>
            </div>
        );
    }

    const avgScore = grades.length > 0
        ? Math.round(grades.reduce((sum, g) => {
            const v = parseScore(g.score);
            return sum + (v || 0);
        }, 0) / grades.length)
        : null;

    const latestScore = grades[0]?.score
        ? parseScore(grades[0].score) + '%'
        : '—';

    return (
        <div className="space-y-6 animate-fade-in max-w-[1600px] mx-auto pb-10">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight italic">
                        <span className="text-emerald-600 uppercase not-italic text-xs tracking-[0.3em] font-black block mb-1">Monitor</span>
                        {studentInfo?.full_name} — O'zlashtirish
                    </h1>
                    <p className="text-slate-500 font-medium text-sm">Barcha fanlar bo'yicha akademik natijalar</p>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="glass-card p-5 bg-emerald-50 border-emerald-100 flex items-center gap-4">
                    <div className="w-11 h-11 bg-white rounded-2xl flex items-center justify-center text-emerald-600 shadow-sm shrink-0">
                        <Trophy size={22} />
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">O'rtacha Baho</p>
                        <p className="text-2xl font-black text-slate-900">{avgScore !== null ? avgScore + '%' : '—'}</p>
                    </div>
                </div>
                <div className="glass-card p-5 bg-blue-50 border-blue-100 flex items-center gap-4">
                    <div className="w-11 h-11 bg-white rounded-2xl flex items-center justify-center text-blue-600 shadow-sm shrink-0">
                        <BookOpen size={22} />
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest">Jami Baholar</p>
                        <p className="text-2xl font-black text-slate-900">{grades.length}</p>
                    </div>
                </div>
                <div className="glass-card p-5 bg-purple-50 border-purple-100 flex items-center gap-4">
                    <div className="w-11 h-11 bg-white rounded-2xl flex items-center justify-center text-purple-600 shadow-sm shrink-0">
                        <Star size={22} />
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-purple-600 uppercase tracking-widest">Oxirgi Baho</p>
                        <p className="text-2xl font-black text-slate-900">{latestScore}</p>
                    </div>
                </div>
            </div>

            {/* Grades Table */}
            <div className="glass-card overflow-hidden">
                <div className="p-5 md:p-8 border-b border-slate-100 flex items-center justify-between">
                    <h3 className="text-lg md:text-xl font-black text-slate-900 flex items-center gap-3">
                        <MessageSquare className="text-emerald-500" size={20} />
                        Batafsil Natijalar
                    </h3>
                </div>
                {grades.length === 0 ? (
                    <div className="p-16 text-center flex flex-col items-center justify-center">
                        <BookOpen size={40} className="text-slate-200 mb-4" />
                        <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Baholar mavjud emas</p>
                    </div>
                ) : (
                    <>
                        {/* Desktop table */}
                        <div className="hidden md:block overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-slate-100">
                                        <th className="text-left p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Fan / Guruh</th>
                                        <th className="text-left p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Turi</th>
                                        <th className="text-left p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Baho</th>
                                        <th className="text-left p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Sana</th>
                                        <th className="text-left p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">O'qituvchi Fikri</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {grades.map((grade, i) => (
                                        <tr key={i} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                                            <td className="p-4">
                                                <div className="font-black text-slate-900 text-sm">{grade.groups?.subjects?.name || '—'}</div>
                                                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{grade.groups?.name}</div>
                                            </td>
                                            <td className="p-4">
                                                <span className="px-2 py-1 bg-slate-100 text-slate-600 rounded-lg text-xs font-black uppercase tracking-widest">
                                                    {grade.grade_type || grade.type || 'Vazifa'}
                                                </span>
                                            </td>
                                            <td className="p-4">
                                                <span className={`px-3 py-1 rounded-xl text-sm font-black shadow-sm ${scoreColorClass(grade.score)}`}>
                                                    {grade.score}
                                                </span>
                                            </td>
                                            <td className="p-4 text-slate-500 font-bold text-xs italic">
                                                {grade.created_at ? format(new Date(grade.created_at), 'dd.MM.yyyy') : '—'}
                                            </td>
                                            <td className="p-4">
                                                <div className="flex items-start gap-2 max-w-xs">
                                                    <MessageSquare size={14} className="text-slate-300 mt-0.5 shrink-0" />
                                                    <p className="text-sm text-slate-600 leading-relaxed font-medium italic">
                                                        {grade.teacher_feedback || "Fikr qoldirilmagan"}
                                                    </p>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Mobile cards */}
                        <div className="md:hidden divide-y divide-slate-100">
                            {grades.map((grade, i) => (
                                <motion.div
                                    key={i}
                                    initial={{ opacity: 0, y: 8 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: i * 0.04 }}
                                    className="p-4 space-y-2"
                                >
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="flex-1 min-w-0">
                                            <div className="font-black text-slate-900 text-sm truncate">
                                                {grade.groups?.subjects?.name || '—'}
                                            </div>
                                            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                                {grade.groups?.name}
                                            </div>
                                        </div>
                                        <span className={`px-2.5 py-1 rounded-lg text-sm font-black shadow-sm shrink-0 ${scoreColorClass(grade.score)}`}>
                                            {grade.score}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-[10px] font-black uppercase tracking-widest">
                                            {grade.grade_type || grade.type || 'Vazifa'}
                                        </span>
                                        <span className="text-[10px] text-slate-400 font-bold italic">
                                            {grade.created_at ? format(new Date(grade.created_at), 'dd.MM.yyyy') : '—'}
                                        </span>
                                    </div>
                                    {grade.teacher_feedback && (
                                        <p className="text-xs text-slate-500 font-medium italic leading-relaxed">
                                            "{grade.teacher_feedback}"
                                        </p>
                                    )}
                                </motion.div>
                            ))}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default ChildPerformance;
