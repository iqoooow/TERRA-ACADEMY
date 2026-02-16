import React, { useState, useEffect } from 'react';
import { Search, ChevronRight, GraduationCap, Users, Clock, Calendar, BookOpen, MoreVertical, Sparkles, Loader2, BarChart2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { format } from 'date-fns';

const TeacherGroups = () => {
    const { user } = useAuth();
    const [groups, setGroups] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        const fetchGroups = async () => {
            if (!user?.id) return;
            try {
                // 1. Fetch groups
                const { data: groupData, error } = await supabase
                    .from('groups')
                    .select(`
                        id, 
                        name, 
                        level,
                        schedule_days,
                        time,
                        room,
                        subjects (name),
                        enrollments (count)
                    `)
                    .eq('teacher_id', user.id);

                if (error) throw error;

                // 2. Fetch Performance Stats for EACH group
                const groupsWithStats = await Promise.all(groupData.map(async (group) => {
                    // Fetch grades for this group
                    const { data: grades } = await supabase
                        .from('grades')
                        .select('score')
                        .eq('group_id', group.id);

                    // Calculate Average
                    let totalScore = 0;
                    let count = 0;

                    (grades || []).forEach(g => {
                        // Robust parsing
                        const s = g.score.toString().toUpperCase().trim();
                        let val = 0;
                        if (s === 'A1') val = 30;
                        else if (s === 'A2') val = 50;
                        else if (s === 'B1') val = 65;
                        else if (s === 'B2') val = 75;
                        else if (s === 'C1') val = 85;
                        else if (s === 'C2') val = 95;
                        else {
                            const num = parseFloat(s);
                            if (!isNaN(num)) {
                                if (num <= 10) val = num * 10;
                                else if (num <= 100) val = num;
                            }
                        }

                        if (val > 0) {
                            totalScore += val;
                            count++;
                        }
                    });

                    const progress = count > 0 ? Math.round(totalScore / count) : 0;

                    return {
                        id: group.id,
                        name: group.name,
                        subject: group.subjects?.name || 'General',
                        level: group.level || 'Standard',
                        students: group.enrollments[0]?.count || 0,
                        schedule: `${group.schedule_days?.join(', ') || 'TBD'} • ${group.time?.slice(0, 5) || '--:--'}`,
                        room: group.room || 'Online',
                        progress: progress
                    };
                }));

                setGroups(groupsWithStats);
            } catch (err) {
                console.error('Error fetching groups:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchGroups();
    }, [user?.id]);

    const filteredGroups = groups.filter(g =>
        g.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        g.subject.toLowerCase().includes(searchQuery.toLowerCase())
    );

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
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-slate-900 p-8 rounded-[2.5rem] shadow-2xl relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-r from-indigo-900 via-slate-900 to-indigo-900 opacity-80 group-hover:scale-105 transition-transform duration-1000"></div>
                <div className="absolute -top-24 -right-24 w-96 h-96 bg-indigo-500/20 rounded-full blur-[80px]"></div>
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-500/10 rounded-full blur-[60px]"></div>

                <div className="relative z-10">
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 rounded-full text-[10px] font-black uppercase tracking-widest mb-3 backdrop-blur-md border border-white/10 text-indigo-300"
                    >
                        <Users size={12} />
                        Mening Guruhlarim
                    </motion.div>
                    <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight mb-2">
                        Guruhlarni Boshqarish
                    </h1>
                    <p className="text-slate-400 font-medium text-lg max-w-xl">
                        Barcha sinflaringiz bir joyda. Dars jadvali, o'quvchilar va natijalarni nazorat qiling.
                    </p>
                </div>

                <div className="relative z-10 w-full md:w-auto">
                    <div className="relative group/search">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                            <Search className="h-5 w-5 text-slate-400 group-focus-within/search:text-indigo-400 transition-colors" />
                        </div>
                        <input
                            type="text"
                            placeholder="Guruh yoki fan nomi..."
                            className="w-full md:w-80 pl-12 pr-4 py-4 bg-white/5 border border-white/10 rounded-2xl text-white placeholder:text-slate-500 focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all backdrop-blur-sm"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>
            </div>

            {/* Grid */}
            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="h-64 bg-white rounded-3xl flex items-center justify-center border border-slate-100 shadow-sm">
                            <Loader2 className="animate-spin text-indigo-500" size={32} />
                        </div>
                    ))}
                </div>
            ) : filteredGroups.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 bg-white rounded-[2.5rem] border-2 border-dashed border-slate-200">
                    <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mb-6">
                        <Users className="text-slate-300" size={40} />
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 mb-2">Guruhlar topilmadi</h3>
                    <p className="text-slate-500 text-center max-w-sm">Hozircha sizga biriktirilgan guruhlar mavjud emas.</p>
                </div>
            ) : (
                <motion.div
                    variants={container}
                    initial="hidden"
                    animate="show"
                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                >
                    {filteredGroups.map((group) => (
                        <motion.div
                            key={group.id}
                            variants={item}
                            whileHover={{ y: -5 }}
                            className="group bg-white p-6 rounded-[2rem] border border-slate-100 hover:border-indigo-200 shadow-lg shadow-slate-200/50 hover:shadow-xl hover:shadow-indigo-500/10 transition-all duration-300 relative overflow-hidden"
                        >
                            {/* Decorative Header Gradient */}
                            <div className="absolute top-0 left-0 right-0 h-24 bg-gradient-to-br from-indigo-50 via-purple-50 to-white opacity-50 group-hover:opacity-100 transition-opacity"></div>

                            <div className="relative z-10">
                                <div className="flex justify-between items-start mb-6">
                                    <div className="p-3 bg-white rounded-2xl shadow-sm border border-slate-100 group-hover:scale-110 transition-transform duration-300 text-indigo-600">
                                        <BookOpen size={24} strokeWidth={2.5} />
                                    </div>
                                    <div className="flex items-center gap-1 bg-white/50 backdrop-blur-sm px-2 py-1 rounded-lg border border-slate-100/50">
                                        <BarChart2 size={14} className="text-indigo-500" />
                                        <span className="text-xs font-black text-slate-600">{group.progress > 0 ? group.progress + '%' : 'N/A'}</span>
                                    </div>
                                </div>

                                <div className="mb-6">
                                    <span className="inline-block px-3 py-1 rounded-lg bg-indigo-50 text-indigo-600 text-[10px] font-black uppercase tracking-widest mb-2 border border-indigo-100">
                                        {group.subject}
                                    </span>
                                    <h3 className="text-2xl font-black text-slate-900 mb-1 group-hover:text-indigo-700 transition-colors">
                                        {group.name}
                                    </h3>
                                    <div className="flex items-center gap-2 text-sm text-slate-500 font-medium">
                                        <span>{group.level}</span>
                                        <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                                        <span>{group.room} xona</span>
                                    </div>
                                </div>

                                <div className="space-y-4 mb-6">
                                    <div className="flex items-center gap-3 text-slate-600 bg-slate-50/80 p-3 rounded-xl border border-slate-100">
                                        <Users size={16} className="text-slate-400" />
                                        <span className="text-sm font-bold">{group.students} O'quvchi</span>
                                    </div>
                                    <div className="flex items-center gap-3 text-slate-600 bg-slate-50/80 p-3 rounded-xl border border-slate-100">
                                        <Clock size={16} className="text-slate-400" />
                                        <span className="text-xs font-bold uppercase tracking-wide">{group.schedule}</span>
                                    </div>
                                </div>

                                {/* Progress Bar */}
                                <div className="mb-6">
                                    <div className="flex justify-between items-center mb-2">
                                        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">O'zlashtirish</span>
                                    </div>
                                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                                        <motion.div
                                            initial={{ width: 0 }}
                                            animate={{ width: `${group.progress}%` }}
                                            transition={{ duration: 1.5, ease: "easeOut" }}
                                            className={`h-full rounded-full ${group.progress > 80 ? 'bg-gradient-to-r from-emerald-500 to-green-500' :
                                                    group.progress > 60 ? 'bg-gradient-to-r from-indigo-500 to-purple-500' :
                                                        'bg-gradient-to-r from-amber-500 to-orange-500'
                                                }`}
                                        />
                                    </div>
                                </div>

                                <button className="w-full py-3.5 flex items-center justify-center gap-2 bg-slate-900 text-white rounded-xl font-bold text-sm uppercase tracking-wider hover:bg-indigo-600 transition-all shadow-lg shadow-slate-900/20 hover:shadow-indigo-600/30 active:scale-95 group/btn">
                                    <span>Guruhni Ochish</span>
                                    <ChevronRight size={16} className="group-hover/btn:translate-x-1 transition-transform" />
                                </button>
                            </div>
                        </motion.div>
                    ))}
                </motion.div>
            )}
        </div>
    );
};

export default TeacherGroups;
