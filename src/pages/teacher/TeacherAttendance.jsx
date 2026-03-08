import { useState, useEffect } from 'react';
import { Calendar, Check, X, Clock, Loader2, Users, ChevronDown, CheckCircle2, AlertCircle, ShieldCheck } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';

const TeacherAttendance = () => {
    const { user } = useAuth();
    const [groups, setGroups] = useState([]);
    const [selectedGroup, setSelectedGroup] = useState(null);
    const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
    const [students, setStudents] = useState([]);
    const [attendance, setAttendance] = useState({});
    const [loadingGroups, setLoadingGroups] = useState(true);
    const [loadingStudents, setLoadingStudents] = useState(false);
    const [saving, setSaving] = useState(false);
    const [examEvent, setExamEvent] = useState(null);
    const [isLocked, setIsLocked] = useState(false);

    useEffect(() => {
        const fetchGroups = async () => {
            if (!user?.id) return;
            setLoadingGroups(true);
            try {
                const { data, error } = await supabase
                    .from('groups')
                    .select('id, name')
                    .eq('teacher_id', user.id)
                    .order('name');

                if (error) throw error;
                setGroups(data || []);
                if (data?.length && !selectedGroup) setSelectedGroup(data[0].id);
            } catch (err) {
                console.error('Error fetching groups:', err);
                toast.error('Guruhlarni yuklashda xatolik');
            } finally {
                setLoadingGroups(false);
            }
        };
        fetchGroups();
    }, [user?.id]);

    useEffect(() => {
        if (!selectedGroup || !date) {
            setStudents([]);
            setAttendance({});
            setExamEvent(null);
            return;
        }
        const fetchStudentsAndAttendance = async () => {
            setLoadingStudents(true);
            try {
                // 1. Fetch Students
                const { data: enrollments, error: enrollError } = await supabase
                    .from('enrollments')
                    .select(`
                        student_id,
                        profiles (id, full_name, first_name, last_name)
                    `)
                    .eq('group_id', selectedGroup);

                if (enrollError) throw enrollError;

                const studentList = (enrollments || []).map((e) => {
                    const p = e.profiles;
                    const name = p?.full_name || [p?.first_name, p?.last_name].filter(Boolean).join(' ').trim() || '—';
                    return { id: e.student_id, name };
                });
                setStudents(studentList);

                // 2. Fetch Existing Attendance
                const { data: attData, error: attError } = await supabase
                    .from('attendance')
                    .select('student_id, status')
                    .eq('group_id', selectedGroup)
                    .eq('date', date);

                if (attError) throw attError;

                // Lock if records already exist for this date
                setIsLocked((attData || []).length > 0);

                const map = {};
                (attData || []).forEach((a) => { map[a.student_id] = a.status; });

                // Default to 'present' if not set, but only in UI state, not DB
                studentList.forEach((s) => {
                    if (!(s.id in map)) map[s.id] = 'present';
                });
                setAttendance(map);

                // 3. Check for Exam on this date
                const { data: exams } = await supabase
                    .from('exams')
                    .select('title, type')
                    .eq('group_id', selectedGroup)
                    .eq('date', date)
                    .limit(1);

                if (exams && exams.length > 0) {
                    setExamEvent(exams[0]);
                } else {
                    setExamEvent(null);
                }

            } catch (err) {
                console.error('Error fetching data:', err);
                toast.error('Ma\'lumotlarni yuklashda xatolik');
            } finally {
                setLoadingStudents(false);
            }
        };
        fetchStudentsAndAttendance();
    }, [selectedGroup, date]);

    const setStatus = (studentId, status) => {
        setAttendance((prev) => ({ ...prev, [studentId]: status }));
    };

    const handleSave = async () => {
        if (isLocked) {
            toast.error("Bu sananing davomati allaqachon saqlangan. O'zgartirib bo'lmaydi.");
            return;
        }
        if (!selectedGroup || !date || !user?.id) return;
        setSaving(true);
        try {
            const rows = Object.entries(attendance).map(([student_id, status]) => ({
                student_id,
                group_id: selectedGroup,
                date,
                status,
                recorded_by: user.id,
            }));

            const { error } = await supabase
                .from('attendance')
                .upsert(rows, {
                    onConflict: 'student_id,group_id,date',
                    ignoreDuplicates: false,
                });

            if (error) throw error;
            toast.success('Davomat muvaffaqiyatli saqlandi!');
        } catch (err) {
            console.error('Error saving attendance:', err);
            toast.error('Saqlashda xatolik yuz berdi');
        } finally {
            setSaving(false);
        }
    };

    const selectedGroupName = groups.find((g) => g.id === selectedGroup)?.name || 'Guruh tanlanmagan';

    // Stats Calculation
    const stats = {
        present: Object.values(attendance).filter(s => s === 'present').length,
        absent: Object.values(attendance).filter(s => s === 'absent').length,
        late: Object.values(attendance).filter(s => s === 'late').length,
        total: students.length
    };
    const attendanceRate = stats.total > 0 ? Math.round(((stats.present + stats.late) / stats.total) * 100) : 0;

    return (
        <div className="space-y-8 animate-fade-in max-w-[1600px] mx-auto pb-10">
            {/* Header */}
            <div className="flex flex-col xl:flex-row justify-between gap-6 bg-slate-900 p-8 rounded-[2.5rem] shadow-2xl relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-900 via-slate-900 to-purple-900 opacity-90"></div>
                <div className="absolute -top-32 -left-32 w-96 h-96 bg-blue-500/20 rounded-full blur-[80px]"></div>

                <div className="relative z-10 flex flex-col justify-center">
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 rounded-full text-[10px] font-black uppercase tracking-widest mb-3 backdrop-blur-md border border-white/10 text-cyan-300"
                    >
                        <Calendar size={12} />
                        Kundalik Nazorat
                    </motion.div>
                    <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight mb-2">
                        Davomat
                    </h1>
                    <p className="text-slate-400 font-medium text-lg max-w-xl">
                        {date ? new Date(date).toLocaleDateString('uz-UZ', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : 'Sana tanlang'}
                    </p>
                </div>

                <div className="relative z-10 flex flex-col sm:flex-row gap-4 items-end sm:items-center">
                    <div className="glass-card bg-white/5 border-white/10 p-4 rounded-2xl min-w-[200px] flex items-center justify-between gap-4">
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
                        <div className="w-10 h-10 rounded-xl bg-indigo-500/20 flex items-center justify-center text-indigo-300">
                            <Users size={20} />
                        </div>
                    </div>

                    <div className="glass-card bg-white/5 border-white/10 p-4 rounded-2xl min-w-[200px] flex items-center justify-between gap-4">
                        <div>
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Sana</label>
                            <input
                                type="date"
                                value={date}
                                onChange={(e) => setDate(e.target.value)}
                                className="bg-transparent text-white font-bold text-lg focus:outline-none cursor-pointer [&::-webkit-calendar-picker-indicator]:invert"
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                {/* Sidebar Stats */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="lg:col-span-1 space-y-6"
                >
                    <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-xl shadow-slate-200/50 relative overflow-hidden">
                        <div className="relative z-10 text-center">
                            <div className="inline-flex items-center justify-center w-32 h-32 rounded-full border-8 border-slate-50 mb-4 relative">
                                <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                                    <path
                                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                        fill="none"
                                        stroke="#E2E8F0"
                                        strokeWidth="3"
                                    />
                                    <path
                                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                        fill="none"
                                        stroke={attendanceRate > 80 ? "#10B981" : attendanceRate > 50 ? "#F59E0B" : "#EF4444"}
                                        strokeWidth="3"
                                        strokeDasharray={`${attendanceRate}, 100`}
                                        className="animate-[pulse_2s_ease-in-out_infinite]"
                                    />
                                </svg>
                                <div className="absolute inset-0 flex flex-col items-center justify-center">
                                    <span className="text-3xl font-black text-slate-900">{attendanceRate}%</span>
                                    <span className="text-[10px] font-bold text-slate-400 uppercase">Davomat</span>
                                </div>
                            </div>

                            <div className="grid grid-cols-3 gap-2 mt-4 text-center">
                                <div className="p-2 rounded-xl bg-green-50 text-green-700">
                                    <div className="text-lg font-black">{stats.present}</div>
                                    <div className="text-[10px] font-bold uppercase">Keldi</div>
                                </div>
                                <div className="p-2 rounded-xl bg-red-50 text-red-700">
                                    <div className="text-lg font-black">{stats.absent}</div>
                                    <div className="text-[10px] font-bold uppercase">Yo'q</div>
                                </div>
                                <div className="p-2 rounded-xl bg-amber-50 text-amber-700">
                                    <div className="text-lg font-black">{stats.late}</div>
                                    <div className="text-[10px] font-bold uppercase">Kech</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Today's Exam Alert */}
                    <AnimatePresence>
                        {examEvent && (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                                className="bg-gradient-to-br from-rose-500 to-pink-600 p-6 rounded-[2rem] shadow-lg shadow-rose-500/30 text-white relative overflow-hidden"
                            >
                                <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full blur-2xl"></div>
                                <div className="relative z-10">
                                    <div className="flex items-center gap-2 text-rose-100 text-xs font-bold uppercase tracking-widest mb-2">
                                        <AlertCircle size={14} />
                                        Bugun Imtihon!
                                    </div>
                                    <h3 className="text-xl font-black mb-1">{examEvent.title}</h3>
                                    <span className="px-2 py-0.5 bg-white/20 rounded-md text-[10px] font-bold uppercase tracking-wide">
                                        {examEvent.type}
                                    </span>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {isLocked ? (
                        <div className="w-full py-4 bg-slate-100 border border-slate-200 text-slate-600 rounded-2xl font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-2">
                            <ShieldCheck size={18} /> Saqlangan — o'zgartirib bo'lmaydi
                        </div>
                    ) : (
                        <button
                            onClick={handleSave}
                            disabled={saving || loadingStudents || students.length === 0}
                            className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-2xl font-bold uppercase tracking-widest shadow-lg shadow-indigo-500/30 transition-all active:scale-95 flex items-center justify-center gap-3"
                        >
                            {saving ? <Loader2 size={20} className="animate-spin" /> : <CheckCircle2 size={20} />}
                            {saving ? 'Saqlanmoqda...' : 'Saqlash'}
                        </button>
                    )}
                </motion.div>

                {/* Student List */}
                <div className="lg:col-span-3">
                    {loadingStudents ? (
                        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-[2.5rem] border border-slate-100 shadow-sm">
                            <Loader2 size={40} className="animate-spin text-indigo-500 mb-4" />
                            <p className="text-slate-500 font-medium">O'quvchilar ro'yxati yuklanmoqda...</p>
                        </div>
                    ) : !selectedGroup ? (
                        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-[2.5rem] border-2 border-dashed border-slate-200">
                            <Users size={40} className="text-slate-300 mb-4" />
                            <p className="text-slate-500 font-medium">Iltimos, guruhni tanlang</p>
                        </div>
                    ) : students.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-[2.5rem] border border-slate-100 shadow-sm">
                            <AlertCircle size={40} className="text-slate-300 mb-4" />
                            <p className="text-slate-500 font-medium">Bu guruhda o'quvchilar yo'q</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <AnimatePresence>
                                {students.map((s, index) => {
                                    const status = attendance[s.id] || 'present';
                                    return (
                                        <motion.div
                                            key={s.id}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: index * 0.05 }}
                                            className="group bg-white p-4 sm:p-5 rounded-[1.5rem] border border-slate-100 hover:border-indigo-100 shadow-sm hover:shadow-lg hover:shadow-indigo-500/5 transition-all flex flex-col sm:flex-row items-center gap-4 sm:gap-6"
                                        >
                                            <div className="flex items-center gap-4 w-full sm:w-auto">
                                                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-slate-100 to-slate-200 text-slate-600 font-black text-lg flex items-center justify-center shadow-inner">
                                                    {s.name.charAt(0)}
                                                </div>
                                                <div className="flex-1 sm:min-w-[200px]">
                                                    <h4 className="font-bold text-slate-900 group-hover:text-indigo-700 transition-colors">{s.name}</h4>
                                                    <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">O'quvchi</div>
                                                </div>
                                            </div>

                                            <div className="flex bg-slate-50 p-1.5 rounded-xl gap-1 w-full sm:w-auto flex-1 sm:flex-none justify-center sm:justify-end sm:ml-auto">
                                                {[
                                                    { id: 'present', icon: Check, label: 'Keldi', color: 'green' },
                                                    { id: 'late', icon: Clock, label: 'Kech', color: 'amber' },
                                                    { id: 'absent', icon: X, label: 'Yo\'q', color: 'rose' },
                                                ].map((opt) => (
                                                    <button
                                                        key={opt.id}
                                                        onClick={() => !isLocked && setStatus(s.id, opt.id)}
                                                        disabled={isLocked}
                                                        className={`
                                                            flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-bold text-sm transition-all duration-300
                                                            ${isLocked ? 'cursor-not-allowed opacity-60' : ''}
                                                            ${status === opt.id
                                                                ? `bg-${opt.color}-500 text-white shadow-lg shadow-${opt.color}-500/30 scale-105`
                                                                : `text-slate-400 hover:bg-slate-200 hover:text-slate-600`
                                                            }
                                                        `}
                                                    >
                                                        <opt.icon size={18} strokeWidth={3} />
                                                        <span className="hidden sm:inline">{opt.label}</span>
                                                    </button>
                                                ))}
                                            </div>
                                        </motion.div>
                                    );
                                })}
                            </AnimatePresence>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default TeacherAttendance;
