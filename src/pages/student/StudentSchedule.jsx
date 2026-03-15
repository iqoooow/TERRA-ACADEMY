import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import { Calendar, Clock, User, MapPin, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';

const StudentSchedule = () => {
    const { user } = useAuth();
    const [schedule, setSchedule] = useState([]);
    const [loading, setLoading] = useState(true);

    const days = [
        { key: 'Mon', name: 'Dushanba', short: 'Du' },
        { key: 'Tue', name: 'Seshanba', short: 'Se' },
        { key: 'Wed', name: 'Chorshanba', short: 'Ch' },
        { key: 'Thu', name: 'Payshanba', short: 'Pa' },
        { key: 'Fri', name: 'Juma', short: 'Ju' },
        { key: 'Sat', name: 'Shanba', short: 'Sh' },
        { key: 'Sun', name: 'Yakshanba', short: 'Ya' }
    ];

    useEffect(() => {
        if (user) fetchMySchedule();
    }, [user]);

    const fetchMySchedule = async () => {
        try {
            // 1. Get Enrollments
            const { data: enrollments } = await supabase
                .from('enrollments')
                .select('group_id')
                .eq('student_id', user.id);

            const groupIds = (enrollments || []).map(e => e.group_id);

            if (groupIds.length > 0) {
                // 2. Get Groups
                const { data: groups } = await supabase
                    .from('groups')
                    .select(`
                        *,
                        subjects (name),
                        profiles (full_name, first_name, last_name)
                    `)
                    .in('id', groupIds);

                setSchedule(groups || []);
            } else {
                setSchedule([]);
            }
        } catch (error) {
            console.error('Error fetching schedule:', error);
            toast.error("Dars jadvalini yuklashda xatolik yuz berdi");
        } finally {
            setLoading(false);
        }
    };

    const getDaySchedule = (dayKey) => {
        return schedule
            .filter(group => group.schedule_days && group.schedule_days.includes(dayKey))
            .sort((a, b) => (a.time || '').localeCompare(b.time || ''));
    };

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

    if (loading) {
        return <div className="flex justify-center py-20"><Loader2 className="animate-spin text-indigo-500" size={40} /></div>;
    }

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
                        <Calendar size={12} />
                        Haftalik Reja
                    </motion.div>
                    <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight mb-2">
                        Dars Jadvali
                    </h1>
                    <p className="text-slate-400 font-medium text-lg max-w-xl">
                        Haftalik darslaringiz va mashg'ulotlaringiz. Hech narsani o'tkazib yubormang.
                    </p>
                </div>
            </div>

            {/* Timetable Grid */}
            <motion.div
                variants={container}
                initial="hidden"
                animate="show"
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
            >
                {days.map((day) => {
                    const lessons = getDaySchedule(day.key);
                    const isToday = new Date().toLocaleDateString('en-US', { weekday: 'short' }) === day.key;

                    return (
                        <motion.div
                            key={day.key}
                            variants={item}
                            className={`relative overflow-hidden rounded-[2rem] p-6 transition-all duration-300 flex flex-col h-full min-h-[300px] group/card ${isToday
                                ? 'bg-gradient-to-br from-indigo-600 to-blue-700 text-white shadow-xl shadow-blue-500/30 scale-[1.02] ring-4 ring-blue-500/20 z-10'
                                : 'bg-white border border-slate-100 shadow-sm hover:shadow-lg hover:border-indigo-100'
                                }`}
                        >
                            {/* Day Header */}
                            <div className="flex items-center justify-between mb-6 pb-4 border-b border-white/10">
                                <div>
                                    <h3 className={`text-2xl font-black leading-none ${isToday ? 'text-white' : 'text-slate-900'}`}>{day.name}</h3>
                                    {isToday && <span className="text-[10px] font-bold uppercase tracking-widest text-blue-200 mt-1 block">Bugun</span>}
                                </div>
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm ${isToday ? 'bg-white/20 text-white' : 'bg-slate-50 text-slate-400'}`}>
                                    {day.short}
                                </div>
                            </div>

                            {/* Lessons List */}
                            <div className="space-y-4 flex-1">
                                {lessons.length > 0 ? (
                                    lessons.map((group) => (
                                        <div
                                            key={group.id}
                                            className={`p-4 rounded-2xl transition-all relative overflow-hidden group/item ${isToday
                                                ? 'bg-white/10 border border-white/10 hover:bg-white/20'
                                                : 'bg-slate-50 border border-slate-100 hover:bg-white hover:shadow-md hover:border-indigo-100'
                                                }`}
                                        >
                                            <div className={`absolute left-0 top-0 bottom-0 w-1 ${isToday ? 'bg-blue-300' : 'bg-indigo-500'} opacity-0 group-hover/item:opacity-100 transition-opacity`}></div>

                                            <div className="flex justify-between items-start mb-2">
                                                <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-wider ${isToday ? 'bg-white/20 text-blue-100' : 'bg-indigo-50 text-indigo-600'}`}>
                                                    <Clock size={10} />
                                                    {group.time?.substring(0, 5)}
                                                </span>
                                                {group.room && (
                                                    <span className={`text-[10px] font-bold uppercase flex items-center gap-1 ${isToday ? 'text-blue-200' : 'text-slate-400'}`}>
                                                        <MapPin size={10} /> {group.room}
                                                    </span>
                                                )}
                                            </div>

                                            <h4 className={`font-bold text-lg leading-tight mb-2 ${isToday ? 'text-white' : 'text-slate-900 group-hover/item:text-indigo-700'}`}>
                                                {group.subjects?.name || group.name}
                                            </h4>

                                            <div className={`flex items-center gap-2 text-xs font-bold uppercase tracking-wide ${isToday ? 'text-blue-200' : 'text-slate-500'}`}>
                                                <div className={`w-5 h-5 rounded-full flex items-center justify-center ${isToday ? 'bg-blue-500 text-white' : 'bg-slate-200 text-slate-500'}`}>
                                                    <User size={10} />
                                                </div>
                                                <span className="truncate">{group.profiles?.first_name || 'Ustoz'}</span>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className={`h-full flex flex-col items-center justify-center text-center p-6 rounded-2xl border-2 border-dashed ${isToday ? 'border-white/10 bg-white/5' : 'border-slate-100 bg-slate-50/30'}`}>
                                        <Calendar size={24} className={`mb-2 opacity-50 ${isToday ? 'text-blue-200' : 'text-slate-300'}`} />
                                        <p className={`text-xs font-bold uppercase tracking-widest ${isToday ? 'text-blue-200' : 'text-slate-400'}`}>Darslar Yo'q</p>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    );
                })}
            </motion.div>
        </div>
    );
};

export default StudentSchedule;
