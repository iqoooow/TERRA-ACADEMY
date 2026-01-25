import React, { useState, useEffect } from 'react';
import { GraduationCap, Plus, Loader2, X, Trash2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import Table, { TableRow, TableCell } from '../../components/ui/Table';

const TYPE_LABELS = {
    cefr: 'CEFR',
    ielts: 'IELTS',
    test: 'Test',
    exam: 'Imtihon',
    quiz: 'Quiz',
    homework: 'Uy vazifasi',
    other: 'Boshqa',
};

const getLastSunday = () => {
    const d = new Date();
    const day = d.getDay();
    d.setDate(d.getDate() - day);
    return d.toISOString().split('T')[0];
};

const TeacherGrades = () => {
    const { user } = useAuth();
    const [groups, setGroups] = useState([]);
    const [selectedGroup, setSelectedGroup] = useState(null);
    const [grades, setGrades] = useState([]);
    const [students, setStudents] = useState([]);
    const [loadingGroups, setLoadingGroups] = useState(true);
    const [loadingData, setLoadingData] = useState(false);
    const [modalOpen, setModalOpen] = useState(false);
    const [saving, setSaving] = useState(false);
    const [form, setForm] = useState({
        student_id: '',
        title: '',
        score: '',
        grade_type: 'cefr',
        date: getLastSunday(),
    });

    useEffect(() => {
        if (!user?.id) return;
        setLoadingGroups(true);
        (async () => {
            try {
                const { data, error } = await supabase
                    .from('groups')
                    .select('id, name')
                    .eq('teacher_id', user.id)
                    .order('name');
                if (error) throw error;
                setGroups(data || []);
                if (data?.length && !selectedGroup) setSelectedGroup(data[0].id);
            } catch (e) {
                console.error(e);
            } finally {
                setLoadingGroups(false);
            }
        })();
    }, [user?.id]);

    useEffect(() => {
        if (!selectedGroup) {
            setGrades([]);
            setStudents([]);
            return;
        }
        setLoadingData(true);
        (async () => {
            try {
                const [gradesRes, enrollRes] = await Promise.all([
                    supabase
                        .from('grades')
                        .select(`
                            id, student_id, title, score, grade_type, date,
                            profiles!student_id (full_name, first_name, last_name)
                        `)
                        .eq('group_id', selectedGroup)
                        .order('date', { ascending: false }),
                    supabase
                        .from('enrollments')
                        .select('student_id, profiles (id, full_name, first_name, last_name)')
                        .eq('group_id', selectedGroup),
                ]);
                if (gradesRes.error) throw gradesRes.error;
                const rows = (gradesRes.data || []).map((r) => {
                    const p = r.profiles;
                    const name = p?.full_name || [p?.first_name, p?.last_name].filter(Boolean).join(' ').trim() || '—';
                    return { ...r, studentName: name };
                });
                setGrades(rows);

                const list = (enrollRes.data || []).map((e) => {
                    const p = e.profiles;
                    const name = p?.full_name || [p?.first_name, p?.last_name].filter(Boolean).join(' ').trim() || '—';
                    return { id: e.student_id, name };
                });
                setStudents(list);
            } catch (e) {
                console.error(e);
                setGrades([]);
                setStudents([]);
            } finally {
                setLoadingData(false);
            }
        })();
    }, [selectedGroup]);

    const refetch = async () => {
        if (!selectedGroup) return;
        const { data, error } = await supabase
            .from('grades')
            .select(`
                id, student_id, title, score, grade_type, date,
                profiles!student_id (full_name, first_name, last_name)
            `)
            .eq('group_id', selectedGroup)
            .order('date', { ascending: false });
        if (!error) {
            const rows = (data || []).map((r) => {
                const p = r.profiles;
                const name = p?.full_name || [p?.first_name, p?.last_name].filter(Boolean).join(' ').trim() || '—';
                return { ...r, studentName: name };
            });
            setGrades(rows);
        }
    };

    const handleAdd = async (e) => {
        e.preventDefault();
        if (!selectedGroup || !user?.id || !form.student_id || !form.title.trim() || !form.score.trim()) return;
        setSaving(true);
        try {
            const { error } = await supabase.from('grades').insert([{
                student_id: form.student_id,
                group_id: selectedGroup,
                title: form.title.trim(),
                score: form.score.trim(),
                grade_type: form.grade_type,
                date: form.date,
                recorded_by: user.id,
            }]);
            if (error) throw error;
            setForm({ student_id: '', title: '', score: '', grade_type: 'cefr', date: getLastSunday() });
            setModalOpen(false);
            refetch();
        } catch (err) {
            console.error(err);
            alert("Baho qo'shishda xatolik: " + (err.message || ''));
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('Ushbu bahoni o\'chirishni xohlaysizmi?')) return;
        try {
            const { error } = await supabase.from('grades').delete().eq('id', id);
            if (error) throw error;
            refetch();
        } catch (err) {
            console.error(err);
            alert('O\'chirishda xatolik: ' + (err.message || ''));
        }
    };

    const groupName = groups.find((g) => g.id === selectedGroup)?.name || '—';

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                        <span className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-lg shadow-violet-500/25">
                            <GraduationCap size={20} className="text-white" />
                        </span>
                        Baholar
                    </h1>
                    <p className="text-gray-500 text-sm mt-2">Haftalik test har Yakshanba — CEFR yoki IELTS bo&apos;yicha. Guruh tanlang, baho qo&apos;shing.</p>
                </div>
                <div className="flex items-center gap-3">
                    <select
                        value={selectedGroup ?? ''}
                        onChange={(e) => setSelectedGroup(e.target.value || null)}
                        className="bg-white border border-gray-200 rounded-xl py-2.5 px-4 text-gray-700 focus:outline-none focus:ring-2 focus:ring-violet-500 min-w-[180px]"
                        disabled={loadingGroups}
                    >
                        <option value="">Guruhni tanlang</option>
                        {groups.map((g) => (
                            <option key={g.id} value={g.id}>{g.name}</option>
                        ))}
                    </select>
                    <button
                        type="button"
                        onClick={() => {
                            setForm({ student_id: '', title: '', score: '', grade_type: 'cefr', date: getLastSunday() });
                            setModalOpen(true);
                        }}
                        disabled={!selectedGroup || loadingData}
                        className="flex items-center gap-2 px-4 py-2.5 bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white rounded-xl font-medium text-sm"
                    >
                        <Plus size={18} />
                        Baho qo&apos;shish
                    </button>
                </div>
            </div>

            {loadingData ? (
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-16 flex items-center justify-center gap-2 text-gray-500">
                    <Loader2 size={24} className="animate-spin" />
                    <span>Yuklanmoqda...</span>
                </div>
            ) : !selectedGroup ? (
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-16 text-center text-gray-500">
                    Guruhni tanlang
                </div>
            ) : grades.length === 0 ? (
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-16 text-center">
                    <GraduationCap size={40} className="text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-600 font-medium">{groupName} uchun baholar yo&apos;q</p>
                    <p className="text-gray-500 text-sm mt-1">&quot;Baho qo&apos;shish&quot; orqali qo&apos;shing</p>
                </div>
            ) : (
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/80">
                        <h3 className="font-bold text-gray-900">{groupName}</h3>
                    </div>
                    <Table headers={['O\'quvchi', 'Topshiriq / Imtihon', 'Ball', 'Turi', 'Sana', 'Amallar']}>
                        {grades.map((r) => (
                            <TableRow key={r.id}>
                                <TableCell className="font-medium text-gray-900">{r.studentName}</TableCell>
                                <TableCell>{r.title}</TableCell>
                                <TableCell>
                                    <span className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 font-semibold text-sm">
                                        {r.score}
                                    </span>
                                </TableCell>
                                <TableCell>
                                    <span className="text-gray-600">{TYPE_LABELS[r.grade_type] || r.grade_type}</span>
                                </TableCell>
                                <TableCell className="text-gray-600">
                                    {r.date ? new Date(r.date + 'T12:00:00').toLocaleDateString('uz-UZ') : '—'}
                                </TableCell>
                                <TableCell>
                                    <button
                                        type="button"
                                        onClick={() => handleDelete(r.id)}
                                        className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"
                                        title="O'chirish"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </TableCell>
                            </TableRow>
                        ))}
                    </Table>
                </div>
            )}

            {modalOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => !saving && setModalOpen(false)}>
                    <div className="bg-white rounded-2xl w-full max-w-md shadow-xl" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-between p-6 border-b">
                            <h2 className="text-lg font-bold text-gray-900">Baho qo&apos;shish</h2>
                            <button type="button" onClick={() => !saving && setModalOpen(false)} className="p-2 hover:bg-gray-100 rounded-full">
                                <X size={18} className="text-gray-500" />
                            </button>
                        </div>
                        <form onSubmit={handleAdd} className="p-6 space-y-4">
                            <p className="text-sm text-gray-500 -mt-1 mb-1">
                                Haftalik test har <strong>Yakshanba</strong> o&apos;tkaziladi. CEFR yoki IELTS bo&apos;yicha. Sanani o&apos;zgartirish mumkin.
                            </p>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">O&apos;quvchi</label>
                                <select
                                    value={form.student_id}
                                    onChange={(e) => setForm((f) => ({ ...f, student_id: e.target.value }))}
                                    className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                                    required
                                >
                                    <option value="">Tanlang</option>
                                    {students.map((s) => (
                                        <option key={s.id} value={s.id}>{s.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Test turi</label>
                                <select
                                    value={form.grade_type}
                                    onChange={(e) => setForm((f) => ({ ...f, grade_type: e.target.value }))}
                                    className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                                >
                                    <option value="cefr">CEFR</option>
                                    <option value="ielts">IELTS</option>
                                    <option value="test">Test</option>
                                    <option value="exam">Imtihon</option>
                                    <option value="quiz">Quiz</option>
                                    <option value="homework">Uy vazifasi</option>
                                    <option value="other">Boshqa</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Topshiriq / Imtihon</label>
                                <input
                                    type="text"
                                    value={form.title}
                                    onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                                    placeholder="Masalan: Haftalik test 1, CEFR"
                                    className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Ball</label>
                                <input
                                    type="text"
                                    value={form.score}
                                    onChange={(e) => setForm((f) => ({ ...f, score: e.target.value }))}
                                    placeholder="Masalan: 6.5, B2, 85/100"
                                    className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Sana (odatda Yakshanba)</label>
                                <input
                                    type="date"
                                    value={form.date}
                                    onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
                                    className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                                    required
                                />
                            </div>
                            <div className="flex gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => !saving && setModalOpen(false)}
                                    className="flex-1 py-2.5 border border-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-50"
                                >
                                    Bekor qilish
                                </button>
                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="flex-1 py-2.5 bg-violet-600 hover:bg-violet-700 text-white rounded-xl font-medium disabled:opacity-50 flex items-center justify-center gap-2"
                                >
                                    {saving ? <Loader2 size={18} className="animate-spin" /> : null}
                                    {saving ? 'Saqlanmoqda...' : 'Saqlash'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TeacherGrades;
