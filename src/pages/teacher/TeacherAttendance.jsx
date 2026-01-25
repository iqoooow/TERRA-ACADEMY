import React, { useState, useEffect } from 'react';
import { Calendar, Check, X, Clock, Loader2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';

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
            return;
        }
        const fetchStudentsAndAttendance = async () => {
            setLoadingStudents(true);
            try {
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

                const { data: attData, error: attError } = await supabase
                    .from('attendance')
                    .select('student_id, status')
                    .eq('group_id', selectedGroup)
                    .eq('date', date);

                if (attError) throw attError;

                const map = {};
                (attData || []).forEach((a) => { map[a.student_id] = a.status; });
                studentList.forEach((s) => {
                    if (!(s.id in map)) map[s.id] = 'present';
                });
                setAttendance(map);
            } catch (err) {
                console.error('Error fetching students/attendance:', err);
                setStudents([]);
                setAttendance({});
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
            alert("Davomat saqlandi.");
        } catch (err) {
            console.error('Error saving attendance:', err);
            alert('Davomatni saqlashda xatolik: ' + (err.message || ''));
        } finally {
            setSaving(false);
        }
    };

    const selectedGroupName = groups.find((g) => g.id === selectedGroup)?.name || '—';

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Davomat</h1>
                    <p className="text-gray-500 text-sm">Guruh va sanani tanlang, o&apos;quvchilarning davomatini belgilang</p>
                </div>
                <div className="flex items-center gap-3 flex-wrap">
                    <select
                        value={selectedGroup ?? ''}
                        onChange={(e) => setSelectedGroup(e.target.value || null)}
                        className="bg-white border border-gray-200 text-gray-700 py-2 px-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-[180px]"
                        disabled={loadingGroups}
                    >
                        <option value="">Guruhni tanlang</option>
                        {groups.map((g) => (
                            <option key={g.id} value={g.id}>{g.name}</option>
                        ))}
                    </select>
                    <input
                        type="date"
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        className="bg-white border border-gray-200 text-gray-700 py-2 px-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-gray-100 flex flex-wrap justify-between items-center gap-4">
                    <h3 className="font-bold text-gray-800 text-lg">
                        {selectedGroupName} — {date ? new Date(date + 'T12:00:00').toLocaleDateString('uz-UZ', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : '—'}
                    </h3>
                    <button
                        type="button"
                        onClick={handleSave}
                        disabled={saving || loadingStudents || students.length === 0}
                        className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-2 rounded-lg transition-colors font-medium flex items-center gap-2"
                    >
                        {saving ? <Loader2 size={18} className="animate-spin" /> : null}
                        {saving ? 'Saqlanmoqda...' : 'Davomatni saqlash'}
                    </button>
                </div>

                {loadingStudents ? (
                    <div className="p-12 text-center text-gray-500 flex items-center justify-center gap-2">
                        <Loader2 size={24} className="animate-spin" />
                        <span>Yuklanmoqda...</span>
                    </div>
                ) : !selectedGroup ? (
                    <div className="p-12 text-center text-gray-500">Guruhni tanlang</div>
                ) : students.length === 0 ? (
                    <div className="p-12 text-center text-gray-500">Ushbu guruhda o&apos;quvchilar yo&apos;q</div>
                ) : (
                    <div className="divide-y divide-gray-100">
                        {students.map((s) => {
                            const status = attendance[s.id] || 'present';
                            return (
                                <div key={s.id} className="p-4 flex flex-wrap items-center justify-between gap-4 hover:bg-gray-50 transition-colors">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-gray-600 font-bold">
                                            {s.name.charAt(0) || '?'}
                                        </div>
                                        <span className="font-medium text-gray-700">{s.name}</span>
                                    </div>
                                    <div className="flex gap-2">
                                        <button
                                            type="button"
                                            onClick={() => setStatus(s.id, 'present')}
                                            className={`flex flex-col items-center gap-1 p-2 rounded-lg transition-colors focus:ring-2 focus:ring-green-500 ring-inset ${status === 'present' ? 'bg-green-50 text-green-600' : 'hover:bg-green-50 text-gray-400 hover:text-green-600'}`}
                                            title="Keldi"
                                        >
                                            <Check size={20} />
                                            <span className="text-[10px] uppercase font-bold">Keldi</span>
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setStatus(s.id, 'absent')}
                                            className={`flex flex-col items-center gap-1 p-2 rounded-lg transition-colors focus:ring-2 focus:ring-red-500 ring-inset ${status === 'absent' ? 'bg-red-50 text-red-600' : 'hover:bg-red-50 text-gray-400 hover:text-red-600'}`}
                                            title="Kelmadi"
                                        >
                                            <X size={20} />
                                            <span className="text-[10px] uppercase font-bold">Kelmadi</span>
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setStatus(s.id, 'late')}
                                            className={`flex flex-col items-center gap-1 p-2 rounded-lg transition-colors focus:ring-2 focus:ring-yellow-500 ring-inset ${status === 'late' ? 'bg-yellow-50 text-yellow-600' : 'hover:bg-yellow-50 text-gray-400 hover:text-yellow-600'}`}
                                            title="Kechikdi"
                                        >
                                            <Clock size={20} />
                                            <span className="text-[10px] uppercase font-bold">Kechikdi</span>
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};

export default TeacherAttendance;
