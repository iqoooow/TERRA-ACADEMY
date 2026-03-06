import { useState, useEffect } from 'react';
import { BookOpen, Clock, AlertTriangle, ChevronRight, Zap, Target, TrendingUp, DollarSign } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { motion } from 'framer-motion';
import LoadingScreen from '../../components/common/LoadingScreen';

const parseScore = (score) => {
    if (!score) return 0;
    const s = score.toString().toUpperCase().trim();
    if (s === 'A1') return 30;
    if (s === 'A2') return 50;
    if (s === 'B1') return 65;
    if (s === 'B2') return 75;
    if (s === 'C1') return 85;
    if (s === 'C2') return 95;
    const num = parseFloat(s);
    if (!isNaN(num)) return num <= 10 ? num * 10 : num;
    return 0;
};

const ParentDashboard = () => {
    const navigate = useNavigate();
    const [children, setChildren] = useState([]);
    const [loading, setLoading] = useState(true);
    const [parentName, setParentName] = useState('');

    useEffect(() => {
        fetchParentData();
    }, []);

    const fetchParentData = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            // 1. Profile
            const { data: profile } = await supabase.from('profiles').select('first_name, full_name').eq('id', user.id).single();
            if (profile) setParentName(profile.first_name || profile.full_name);

            // 2. Fetch Children via parent_student link
            const { data: linkedChildren, error: linkError } = await supabase
                .from('parent_student')
                .select(`
                    student_id,
                    status,
                    student:student_id (
                        id,
                        full_name,
                        first_name,
                        student_code,
                        enrollments (
                            group_id,
                            groups (
                                name,
                                subjects (name)
                            )
                        )
                    )
                `)
                .eq('parent_id', user.id)
                .eq('status', 'approved');

            if (linkError) throw linkError;

            // 3. For each child, get stats
            const childrenWithStats = await Promise.all((linkedChildren || []).map(async (item) => {
                const child = item.student;

                // Get avg grade
                const { data: grades } = await supabase.from('grades').select('score').eq('student_id', child.id);
                let scoreSum = 0;
                let scoreCount = 0;
                (grades || []).forEach(g => {
                    const val = parseScore(g.score);
                    if (val > 0) { scoreSum += val; scoreCount++; }
                });

                // Get attendance
                const { data: attendance } = await supabase.from('attendance').select('status').eq('student_id', child.id);
                const totalDays = attendance?.length || 0;
                const presentDays = attendance?.filter(a => a.status === 'present').length || 0;

                // Get payment status
                const { data: payments } = await supabase
                    .from('monthly_payments')
                    .select('status')
                    .eq('student_id', child.id)
                    .order('payment_year', { ascending: false })
                    .order('payment_month', { ascending: false })
                    .limit(1);

                return {
                    id: child.id,
                    name: child.full_name,
                    shortName: child.first_name,
                    code: child.student_code,
                    groups: child.enrollments?.map(e => e.groups?.name).join(', ') || 'Kurslar yo\'q',
                    gpa: scoreCount > 0 ? Math.round(scoreSum / scoreCount) + '%' : '—',
                    attendance: totalDays > 0 ? Math.round((presentDays / totalDays) * 100) + '%' : '—',
                    isPaymentDue: !payments?.[0] || ['pending', 'overdue', 'partially_paid', 'unpaid'].includes(payments[0]?.status)
                };
            }));

            setChildren(childrenWithStats);
        } catch (err) {
            console.error('Error fetching parent dash:', err);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <LoadingScreen />;

    return (
        <div className="space-y-8 animate-fade-in max-w-[1600px] mx-auto pb-10">
            {/* Premium Header */}
            <div className="relative group overflow-hidden rounded-[2.5rem] bg-slate-900 shadow-2xl">
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-600 via-teal-600 to-slate-900 opacity-90 transition-transform duration-1000 group-hover:scale-105"></div>

                <div className="relative z-10 p-8 md:p-12">
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 rounded-full text-[10px] font-black uppercase tracking-widest mb-4 backdrop-blur-md border border-white/10 text-emerald-100 shadow-inner"
                    >
                        <Zap size={12} className="text-emerald-300 fill-emerald-300" />
                        Ota-ona Nazorati
                    </motion.div>
                    <h1 className="text-3xl md:text-5xl font-black text-white tracking-tight mb-3">
                        Xayrli kun, <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-200 to-teal-100">{parentName || 'Ota-ona'}</span>!
                    </h1>
                    <p className="text-teal-50/80 font-medium text-lg max-w-xl leading-relaxed">
                        Farzandlaringizning ta'lim jarayoni va yutuqlarini doimiy kuzatib boring.
                    </p>
                    {children.length > 0 && (
                        <div className="inline-flex items-center gap-2 mt-4 px-4 py-2 bg-white/10 rounded-full border border-white/10 backdrop-blur-sm">
                            <div className="flex -space-x-2">
                                {children.slice(0, 3).map((c, i) => (
                                    <div key={i} className="w-6 h-6 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 border-2 border-white/20 flex items-center justify-center text-white font-black text-[9px]">
                                        {c.shortName?.charAt(0)}
                                    </div>
                                ))}
                            </div>
                            <span className="text-[10px] font-black text-emerald-200 uppercase tracking-widest">
                                {children.length} ta farzand kuzatilmoqda
                            </span>
                        </div>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {children.length === 0 ? (
                    <div className="lg:col-span-2 glass-card p-20 text-center flex flex-col items-center justify-center rounded-[3rem]">
                        <div className="w-24 h-24 bg-emerald-50 rounded-[2rem] flex items-center justify-center mb-8">
                            <Target size={48} className="text-emerald-300" />
                        </div>
                        <h3 className="text-2xl font-black text-slate-900 mb-2">Farzandlar bog'lanmagan</h3>
                        <p className="text-slate-500 font-medium max-w-sm mb-8">
                            Hozircha tizimda sizga biriktirilgan o'quvchilar yo'q. Administrator bilan bog'laning.
                        </p>
                    </div>
                ) : (
                    children.map((child, idx) => (
                        <motion.div
                            key={child.id}
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: idx * 0.1 }}
                            className="glass-card p-8 rounded-[3rem] border border-slate-100 bg-white/80 backdrop-blur-xl relative overflow-hidden group hover:shadow-2xl hover:shadow-emerald-500/10 transition-all duration-500"
                        >
                            <div className="flex items-center gap-6 mb-8">
                                <div className="w-20 h-20 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-[2rem] flex items-center justify-center text-white font-black text-3xl shadow-lg shadow-emerald-500/20 group-hover:scale-110 transition-transform duration-500">
                                    {child.shortName?.charAt(0)}
                                </div>
                                <div className="flex-1">
                                    <div className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-1">{child.code}</div>
                                    <h2 className="text-2xl font-black text-slate-900 tracking-tight">{child.name}</h2>
                                    <p className="text-slate-500 font-medium text-sm mt-1">{child.groups}</p>
                                </div>
                                <button
                                    onClick={() => navigate(`/parent/children?id=${child.id}`)}
                                    className="w-12 h-12 rounded-2xl bg-slate-50 text-slate-400 flex items-center justify-center hover:bg-emerald-600 hover:text-white transition-all shadow-sm hover:shadow-lg hover:shadow-emerald-500/20"
                                >
                                    <ChevronRight size={24} />
                                </button>
                            </div>

                            <div className="grid grid-cols-2 gap-4 mb-8">
                                <div className="p-5 bg-slate-50 rounded-[2rem] border border-slate-100 flex flex-col items-center group-hover:bg-white transition-colors">
                                    <TrendingUp className="text-emerald-500 mb-2" size={20} />
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">O'rtacha Baho</p>
                                    <p className="text-2xl font-black text-slate-900 mt-1">{child.gpa}</p>
                                </div>
                                <div className="p-5 bg-slate-50 rounded-[2rem] border border-slate-100 flex flex-col items-center group-hover:bg-white transition-colors">
                                    <Clock className="text-blue-500 mb-2" size={20} />
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Davomat</p>
                                    <p className="text-2xl font-black text-slate-900 mt-1">{child.attendance}</p>
                                </div>
                            </div>

                            <div className="flex items-center justify-between gap-4">
                                {child.isPaymentDue ? (
                                    <div className="flex-1 flex items-center gap-3 p-4 bg-amber-50 text-amber-700 rounded-2xl text-xs font-bold border border-amber-100">
                                        <AlertTriangle size={18} className="text-amber-500" />
                                        <span>Oy uchun to'lov kutilmoqda!</span>
                                    </div>
                                ) : (
                                    <div className="flex-1 flex items-center gap-3 p-4 bg-emerald-50 text-emerald-700 rounded-2xl text-xs font-bold border border-emerald-100">
                                        <BookOpen size={18} className="text-emerald-500" />
                                        <span>To'lovlar o'z vaqtida to'langan</span>
                                    </div>
                                )}
                                <Link
                                    to={`/parent/payments?id=${child.id}`}
                                    className="p-4 bg-slate-900 text-white rounded-2xl hover:bg-emerald-600 transition-all shadow-sm hover:shadow-lg hover:shadow-emerald-500/20"
                                >
                                    <DollarSign size={20} />
                                </Link>
                            </div>
                        </motion.div>
                    ))
                )}
            </div>
        </div>
    );
};

export default ParentDashboard;
