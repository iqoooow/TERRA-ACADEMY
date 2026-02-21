import { useState, useEffect } from 'react';
import Table, { TableRow, TableCell } from '../../components/ui/Table';
import { supabase } from '../../lib/supabase';
import { useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Trophy, BookOpen, MessageSquare, Star } from 'lucide-react';
import LoadingScreen from '../../components/common/LoadingScreen';
import { format } from 'date-fns';

const ChildPerformance = () => {
    const [searchParams] = useSearchParams();
    const studentId = searchParams.get('id');
    const [grades, setGrades] = useState([]);
    const [loading, setLoading] = useState(true);
    const [studentInfo, setStudentInfo] = useState(null);

    useEffect(() => {
        if (studentId) {
            fetchPerformanceData();
        }
    }, [studentId]);

    const fetchPerformanceData = async () => {
        try {
            // 1. Get Student Info
            const { data: student } = await supabase.from('profiles').select('full_name').eq('id', studentId).single();
            setStudentInfo(student);

            // 2. Get Grades
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
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <LoadingScreen />;

    return (
        <div className="space-y-8 animate-fade-in max-w-[1600px] mx-auto pb-10">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight italic">
                        <span className="text-emerald-600 uppercase not-italic text-sm tracking-[0.3em] font-black block mb-2">Monitor</span>
                        {studentInfo?.full_name} — O'zlashtirish
                    </h1>
                    <p className="text-slate-500 font-medium">Barcha fanlar bo'yicha akademik natijalar</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="glass-card p-6 bg-emerald-50 border-emerald-100 flex items-center gap-4">
                    <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-emerald-600 shadow-sm">
                        <Trophy size={24} />
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">O'rtacha Baho</p>
                        <p className="text-2xl font-black text-slate-900">{grades.length > 0 ? (grades.reduce((sum, g) => sum + (parseFloat(g.score) || 0), 0) / grades.length).toFixed(1) : '—'}</p>
                    </div>
                </div>
                <div className="glass-card p-6 bg-blue-50 border-blue-100 flex items-center gap-4">
                    <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-blue-600 shadow-sm">
                        <BookOpen size={24} />
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest">Jami Baholar</p>
                        <p className="text-2xl font-black text-slate-900">{grades.length}</p>
                    </div>
                </div>
                <div className="glass-card p-6 bg-purple-50 border-purple-100 flex items-center gap-4">
                    <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-purple-600 shadow-sm">
                        <Star size={24} />
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-purple-600 uppercase tracking-widest">Oxirgi Baho</p>
                        <p className="text-2xl font-black text-slate-900">{grades[0]?.score || '—'}</p>
                    </div>
                </div>
            </div>

            <div className="glass-card overflow-hidden">
                <div className="p-8 border-b border-slate-100 flex items-center justify-between">
                    <h3 className="text-xl font-black text-slate-900 flex items-center gap-3">
                        <MessageSquare className="text-emerald-500" size={20} />
                        Batafsil Natijalar
                    </h3>
                </div>
                {grades.length === 0 ? (
                    <div className="p-20 text-center flex flex-col items-center justify-center">
                        <BookOpen size={48} className="text-slate-200 mb-4" />
                        <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Baholar mavjud emas</p>
                    </div>
                ) : (
                    <Table headers={['Fan / Guruh', 'Baholash turi', 'Baho', 'Sana', 'O\'qituvchi Fikri']}>
                        {grades.map((grade, i) => (
                            <TableRow key={i} className="group hover:bg-slate-50 transition-colors">
                                <TableCell>
                                    <div>
                                        <div className="font-black text-slate-900">{grade.groups?.subjects?.name}</div>
                                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{grade.groups?.name}</div>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <span className="px-2 py-1 bg-slate-100 text-slate-600 rounded-lg text-xs font-black uppercase tracking-widest">
                                        {grade.type || 'Vazifa'}
                                    </span>
                                </TableCell>
                                <TableCell>
                                    <span className={`px-3 py-1 rounded-xl text-sm font-black shadow-sm ${parseFloat(grade.score) >= 90 ? 'bg-emerald-500 text-white' :
                                            parseFloat(grade.score) >= 70 ? 'bg-blue-500 text-white' : 'bg-amber-500 text-white'
                                        }`}>
                                        {grade.score}%
                                    </span>
                                </TableCell>
                                <TableCell className="text-slate-500 font-bold text-xs italic">
                                    {grade.created_at ? format(new Date(grade.created_at), 'dd.MM.yyyy') : '—'}
                                </TableCell>
                                <TableCell>
                                    <div className="flex items-start gap-2 max-w-xs">
                                        <MessageSquare size={14} className="text-slate-300 mt-1 shrink-0" />
                                        <p className="text-sm text-slate-600 leading-relaxed font-medium italic">
                                            {grade.teacher_feedback || "Fikr qoldirilmagan"}
                                        </p>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))}
                    </Table>
                )}
            </div>
        </div>
    );
};

export default ChildPerformance;
