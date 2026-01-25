import React, { useState, useEffect, useMemo } from 'react';
import { GraduationCap, Search, Loader2 } from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import Table, { TableRow, TableCell } from '../../../components/ui/Table';

const TYPE_LABELS = { cefr: 'CEFR', ielts: 'IELTS', test: 'Test', exam: 'Imtihon', quiz: 'Quiz', homework: 'Uy vazifasi', other: 'Boshqa' };

const GradeList = () => {
    const [grades, setGrades] = useState([]);
    const [groups, setGroups] = useState([]);
    const [loading, setLoading] = useState(true);
    const [groupFilter, setGroupFilter] = useState('');
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        (async () => {
            try {
                const [gRes, grRes] = await Promise.all([
                    supabase.from('groups').select('id, name').order('name'),
                    supabase
                        .from('grades')
                        .select(`
                            id, student_id, group_id, title, score, grade_type, date,
                            profiles!student_id (full_name, first_name, last_name),
                            groups (id, name)
                        `)
                        .order('date', { ascending: false }),
                ]);
                if (gRes.error) throw gRes.error;
                setGroups(gRes.data || []);
                if (grRes.error) throw grRes.error;
                const rows = (grRes.data || []).map((r) => {
                    const p = r.profiles;
                    const name = p?.full_name || [p?.first_name, p?.last_name].filter(Boolean).join(' ').trim() || '—';
                    return { ...r, studentName: name, groupName: r.groups?.name || '—' };
                });
                setGrades(rows);
            } catch (e) {
                console.error(e);
                setGrades([]);
                setGroups([]);
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    const filtered = useMemo(() => {
        let list = grades;
        if (groupFilter) list = list.filter((g) => g.group_id === groupFilter);
        if (searchQuery.trim()) {
            const q = searchQuery.trim().toLowerCase();
            list = list.filter(
                (g) =>
                    (g.studentName || '').toLowerCase().includes(q) ||
                    (g.title || '').toLowerCase().includes(q) ||
                    (g.groupName || '').toLowerCase().includes(q) ||
                    (g.score || '').toLowerCase().includes(q)
            );
        }
        return list;
    }, [grades, groupFilter, searchQuery]);

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                        <span className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-lg shadow-violet-500/25">
                            <GraduationCap size={20} className="text-white" />
                        </span>
                        Baholar
                    </h1>
                    <p className="text-gray-500 text-sm mt-2">Barcha guruhlar bo&apos;yicha baholarni ko&apos;ring va qidiring</p>
                </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
                <div className="flex flex-col md:flex-row md:items-center gap-4">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input
                            type="text"
                            placeholder="O&apos;quvchi, guruh yoki topshiriq bo&apos;yicha qidirish..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                        />
                    </div>
                    <select
                        value={groupFilter}
                        onChange={(e) => setGroupFilter(e.target.value)}
                        className="px-4 py-2.5 border border-gray-200 rounded-xl bg-white text-gray-700 focus:ring-2 focus:ring-violet-500 min-w-[200px]"
                    >
                        <option value="">Barcha guruhlar</option>
                        {groups.map((g) => (
                            <option key={g.id} value={g.id}>{g.name}</option>
                        ))}
                    </select>
                </div>
            </div>

            {loading ? (
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-16 flex items-center justify-center gap-2 text-gray-500">
                    <Loader2 size={24} className="animate-spin" />
                    <span>Yuklanmoqda...</span>
                </div>
            ) : filtered.length === 0 ? (
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-16 text-center">
                    <GraduationCap size={40} className="text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-600 font-medium">
                        {grades.length === 0 ? 'Baholar hali kiritilmagan' : 'Qidiruv bo&apos;yicha natija topilmadi'}
                    </p>
                </div>
            ) : (
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                    <Table headers={['Guruh', 'O\'quvchi', 'Topshiriq / Imtihon', 'Ball', 'Turi', 'Sana']}>
                        {filtered.map((r) => (
                            <TableRow key={r.id}>
                                <TableCell className="font-medium text-gray-900">{r.groupName}</TableCell>
                                <TableCell>{r.studentName}</TableCell>
                                <TableCell>{r.title}</TableCell>
                                <TableCell>
                                    <span className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 font-semibold text-sm">
                                        {r.score}
                                    </span>
                                </TableCell>
                                <TableCell className="text-gray-600">{TYPE_LABELS[r.grade_type] || r.grade_type}</TableCell>
                                <TableCell className="text-gray-600">
                                    {r.date ? new Date(r.date + 'T12:00:00').toLocaleDateString('uz-UZ') : '—'}
                                </TableCell>
                            </TableRow>
                        ))}
                    </Table>
                </div>
            )}
        </div>
    );
};

export default GradeList;
