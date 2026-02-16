import React, { useState, useEffect } from 'react';
import { Calendar, Clock, Users, ChevronDown, ChevronUp, BookOpen, Layers, Filter, Search } from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';
import StatsCard from '../../../components/ui/StatsCard';

const ScheduleList = () => {
    const [groups, setGroups] = useState([]);
    const [loading, setLoading] = useState(true);
    const [expandedGroups, setExpandedGroups] = useState({});
    const [searchQuery, setSearchQuery] = useState('');

    const days = [
        { key: 'Mon', name: 'Dushanba', short: 'Du' },
        { key: 'Tue', name: 'Seshanba', short: 'Se' },
        { key: 'Wed', name: 'Chorshanba', short: 'Ch' },
        { key: 'Thu', name: 'Payshanba', short: 'Pa' },
        { key: 'Fri', name: 'Juma', short: 'Ju' },
        { key: 'Sat', name: 'Shanba', short: 'Sh' },
        { key: 'Sun', name: 'Yakshanba', short: 'Ya' }
    ];

    const dayColors = {
        'Mon': 'bg-blue-500 shadow-blue-500/30',
        'Tue': 'bg-emerald-500 shadow-emerald-500/30',
        'Wed': 'bg-violet-500 shadow-violet-500/30',
        'Thu': 'bg-amber-500 shadow-amber-500/30',
        'Fri': 'bg-rose-500 shadow-rose-500/30',
        'Sat': 'bg-cyan-500 shadow-cyan-500/30',
        'Sun': 'bg-red-500 shadow-red-500/30'
    };

    useEffect(() => {
        fetchGroups();
    }, []);

    const fetchGroups = async () => {
        try {
            const { data, error } = await supabase
                .from('groups')
                .select(`
                    *,
                    subjects (name),
                    profiles (full_name, first_name, last_name)
                `)
                .order('name', { ascending: true });

            if (error) throw error;

            const groupIds = data?.map(g => g.id) || [];
            let studentCounts = {};

            if (groupIds.length > 0) {
                const { data: enrollments } = await supabase
                    .from('enrollments')
                    .select('group_id')
                    .in('group_id', groupIds);

                if (enrollments) {
                    enrollments.forEach(e => {
                        studentCounts[e.group_id] = (studentCounts[e.group_id] || 0) + 1;
                    });
                }
            }

            const formattedGroups = data?.map(g => ({
                ...g,
                subject: g.subjects?.name || 'Noma\'lum',
                teacher: g.profiles?.full_name || `${g.profiles?.first_name || ''} ${g.profiles?.last_name || ''}`.trim() || 'Biriktirilmagan',
                studentCount: studentCounts[g.id] || 0,
                startTime: g.time ? String(g.time).substring(0, 5) : '',
                endTime: g.end_time ? String(g.end_time).substring(0, 5) : ''
            })) || [];

            setGroups(formattedGroups);

            // Expand first group by default as a demo if valid
            if (formattedGroups.length > 0) {
                setExpandedGroups({ [formattedGroups[0].id]: true });
            }
        } catch (err) {
            console.error('Error fetching groups:', err);
        } finally {
            setLoading(false);
        }
    };

    const toggleGroup = (groupId) => {
        setExpandedGroups(prev => ({
            ...prev,
            [groupId]: !prev[groupId]
        }));
    };

    const expandAll = () => {
        const expanded = {};
        groups.forEach(g => { expanded[g.id] = true; });
        setExpandedGroups(expanded);
    };

    const collapseAll = () => {
        setExpandedGroups({});
    };

    const filteredGroups = groups.filter(g =>
        g.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        g.subject?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        g.teacher?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Stats Calculation
    const totalGroups = groups.length;
    const totalStudents = groups.reduce((acc, g) => acc + g.studentCount, 0);
    const totalLessons = groups.reduce((acc, g) => acc + (g.schedule_days?.length || 0), 0);
    const activeTeachers = new Set(groups.map(g => g.teacher)).size;

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-20 space-y-4">
                <div className="w-10 h-10 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin"></div>
                <p className="text-slate-400 font-medium animate-pulse">Jadval yuklanmoqda...</p>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-fade-in max-w-[1600px] mx-auto pb-10">
            {/* Intelligence Header */}
            <div className="relative group overflow-hidden rounded-[2.5rem] bg-slate-900 shadow-2xl">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-600 via-indigo-600 to-slate-900 opacity-90 group-hover:scale-105 transition-transform duration-1000"></div>
                <div className="absolute inset-0 opacity-20 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] blend-overlay"></div>

                <div className="relative z-10 p-8 md:p-12 flex flex-col md:flex-row md:items-center justify-between gap-8">
                    <div>
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 rounded-full text-[10px] font-black uppercase tracking-widest mb-4 backdrop-blur-md border border-white/10 text-blue-200 shadow-inner"
                        >
                            <Calendar size={12} className="text-blue-300" />
                            O'quv Rejasi va Taqvim
                        </motion.div>
                        <h1 className="text-3xl md:text-5xl font-black text-white tracking-tight mb-3 italic">
                            Dars <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-200 to-indigo-100 not-italic">Jadvallari</span>
                        </h1>
                        <p className="text-blue-100/80 font-medium text-lg max-w-xl leading-relaxed">
                            Barcha guruhlarning haftalik dars jadvallari, vaqtlari va xonalar taqsimoti.
                        </p>
                    </div>

                    <div className="flex gap-4">
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={expandAll}
                            className="px-6 py-4 bg-white/10 hover:bg-white/20 text-white rounded-2xl backdrop-blur-xl border border-white/10 font-bold text-xs uppercase tracking-widest transition-all"
                        >
                            Hammasini ochish
                        </motion.button>
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={collapseAll}
                            className="px-6 py-4 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-2xl border border-white/5 font-bold text-xs uppercase tracking-widest transition-all"
                        >
                            Yopish
                        </motion.button>
                    </div>
                </div>
            </div>

            {/* Matrix Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <StatsCard title="Jami Guruhlar" value={totalGroups} icon={Layers} color="blue" trend="Active" />
                <StatsCard title="Haftalik Darslar" value={totalLessons} icon={Clock} color="indigo" trend="Full sync" />
                <StatsCard title="O'quvchilar" value={totalStudents} icon={Users} color="purple" trend="Enrolled" />
                <StatsCard title="O'qituvchilar" value={activeTeachers} icon={BookOpen} color="amber" trend="On duty" />
            </div>

            {/* Controls Bar */}
            <div className="glass-card p-2 flex flex-col md:flex-row md:items-center justify-between gap-4 sticky top-24 z-30">
                <div className="relative flex-1 max-w-2xl ml-2">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input
                        type="text"
                        placeholder="Guruh, fan yoki o'qituvchi bo'yicha izlash..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-12 pr-4 py-3 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-500/20 focus:bg-white transition-all text-sm font-medium placeholder:text-slate-400"
                    />
                </div>
                <div className="flex gap-2 p-1">
                    <button className="flex items-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-xl hover:bg-slate-800 transition-all font-black text-[10px] uppercase tracking-widest shadow-lg shadow-slate-900/20">
                        <Calendar size={16} />
                        TAQVIM KO'RINISHI
                    </button>
                    <button className="p-3 bg-slate-100 text-slate-500 rounded-xl hover:bg-blue-600 hover:text-white transition-all">
                        <Filter size={20} />
                    </button>
                </div>
            </div>

            {/* Groups List */}
            <motion.div
                className="space-y-4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.1 }}
            >
                {filteredGroups.length === 0 ? (
                    <div className="text-center py-20 bg-slate-50 rounded-3xl border border-dashed border-slate-200">
                        <Calendar size={48} className="mx-auto mb-4 text-slate-300" />
                        <p className="text-slate-500 font-medium">Guruhlar topilmadi</p>
                    </div>
                ) : (
                    filteredGroups.map((group, index) => (
                        <motion.div
                            key={group.id}
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: index * 0.05 }}
                            className={`bg-white rounded-2xl border transition-all duration-300 overflow-hidden ${expandedGroups[group.id] ? 'border-blue-200 shadow-lg ring-1 ring-blue-100' : 'border-slate-100 hover:border-blue-200 hover:shadow-md'}`}
                        >
                            {/* Group Header */}
                            <div
                                onClick={() => toggleGroup(group.id)}
                                className="flex flex-col md:flex-row md:items-center justify-between p-5 cursor-pointer bg-white relative z-10"
                            >
                                <div className="flex items-center gap-5">
                                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-black text-xl shadow-lg shadow-blue-500/20 shrink-0">
                                        {group.name?.charAt(0)?.toUpperCase()}
                                    </div>
                                    <div>
                                        <h3 className="font-black text-slate-900 text-lg tracking-tight">{group.name}</h3>
                                        <div className="flex flex-wrap items-center gap-3 text-sm mt-1">
                                            <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-slate-50 text-slate-600 font-bold text-xs uppercase tracking-wider border border-slate-100">
                                                <BookOpen size={12} />
                                                {group.subject}
                                            </span>
                                            <span className="flex items-center gap-1.5 text-slate-500 font-medium text-xs">
                                                <Users size={12} />
                                                {group.teacher}
                                            </span>
                                            <span className="flex items-center gap-1.5 text-blue-600 font-bold text-xs bg-blue-50 px-2 py-0.5 rounded-full">
                                                {group.studentCount} o'quvchi
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-4 mt-4 md:mt-0 justify-between md:justify-end">
                                    {/* Mini Day Indicators */}
                                    <div className="flex gap-1.5">
                                        {days.map(day => (
                                            <div
                                                key={day.key}
                                                className={`w-8 h-8 rounded-lg flex items-center justify-center text-[10px] font-black uppercase transition-all ${group.schedule_days?.includes(day.key)
                                                    ? `${dayColors[day.key]} text-white transform scale-110`
                                                    : 'bg-slate-50 text-slate-300'
                                                    }`}
                                            >
                                                {day.short}
                                            </div>
                                        ))}
                                    </div>
                                    <div className={`p-2 rounded-full transition-transform duration-300 bg-slate-50 ${expandedGroups[group.id] ? 'rotate-180 bg-blue-50 text-blue-500' : 'text-slate-400'}`}>
                                        <ChevronDown size={20} />
                                    </div>
                                </div>
                            </div>

                            {/* Expanded Content */}
                            <AnimatePresence>
                                {expandedGroups[group.id] && (
                                    <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: 'auto', opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        className="border-t border-slate-100 bg-slate-50/50"
                                    >
                                        <div className="overflow-x-auto p-4 md:p-6">
                                            <div className="min-w-[800px] grid grid-cols-7 gap-4">
                                                {days.map(day => {
                                                    const hasClass = group.schedule_days?.includes(day.key);
                                                    return (
                                                        <div key={day.key} className="flex flex-col gap-3">
                                                            {/* Day Header */}
                                                            <div className="text-center pb-2 border-b border-slate-200">
                                                                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">{day.name}</span>
                                                            </div>

                                                            {/* Day Content */}
                                                            <div className={`flex-1 rounded-2xl p-4 flex flex-col items-center justify-center gap-2 min-h-[140px] transition-all ${hasClass
                                                                ? 'bg-white shadow-sm border border-slate-100 ring-2 ring-transparent hover:ring-blue-100'
                                                                : 'bg-transparent border border-transparent opacity-50'
                                                                }`}>
                                                                {hasClass ? (
                                                                    <>
                                                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-lg mb-1 ${dayColors[day.key]}`}>
                                                                            <Clock size={20} />
                                                                        </div>
                                                                        <div className="text-center">
                                                                            <p className="font-black text-slate-800 text-lg leading-none mb-1">
                                                                                {group.startTime || '--:--'}
                                                                            </p>
                                                                            <p className="text-xs font-bold text-slate-400 uppercase">
                                                                                {group.endTime ? `Tugash: ${group.endTime}` : 'Vaqt yo\'q'}
                                                                            </p>
                                                                        </div>
                                                                        <span className="px-2 py-1 bg-green-100 text-green-700 rounded-lg text-[10px] font-black uppercase tracking-wider">
                                                                            Dars Bor
                                                                        </span>
                                                                    </>
                                                                ) : (
                                                                    <div className="flex flex-col items-center">
                                                                        <div className="w-2 h-2 rounded-full bg-slate-200 mb-2"></div>
                                                                        <span className="text-[10px] font-bold text-slate-300 uppercase tracking-wider">Bo'sh</span>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>

                                            {/* Footer Info */}
                                            <div className="mt-6 flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-slate-200">
                                                <div className="flex items-center gap-6">
                                                    <div>
                                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Haftalik Yuklama</p>
                                                        <p className="font-bold text-slate-700">{group.schedule_days?.length || 0} kun / hafta</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Davomiyligi</p>
                                                        <p className="font-bold text-slate-700">
                                                            {(() => {
                                                                if (!group.startTime || !group.endTime) return '-';
                                                                const [sh, sm] = group.startTime.split(':').map(Number);
                                                                const [eh, em] = group.endTime.split(':').map(Number);
                                                                const diff = (eh * 60 + em) - (sh * 60 + sm);
                                                                const hours = Math.floor(diff / 60);
                                                                const mins = diff % 60;
                                                                return `${hours > 0 ? hours + ' soat ' : ''}${mins > 0 ? mins + ' daqiqa' : ''}`;
                                                            })()}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </motion.div>
                    ))
                )}
            </motion.div>
        </div>
    );
};

export default ScheduleList;
