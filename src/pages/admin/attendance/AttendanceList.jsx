import React, { useState, useEffect, useMemo } from 'react';
import { Check, X, Clock, Loader2, FileText, Users, Search } from 'lucide-react';
import { supabase } from '../../../lib/supabase';

const statusLabel = { present: "Keldi", absent: "Kelmadi", late: "Kechikdi" };
const statusBadge = {
    present: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
    absent: 'bg-rose-50 text-rose-700 border border-rose-200',
    late: 'bg-amber-50 text-amber-700 border border-amber-200',
};

const AttendanceList = () => {
    const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
    const [report, setReport] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        if (!date) {
            setReport([]);
            return;
        }
        const fetchReport = async () => {
            setLoading(true);
            try {
                const { data: att, error } = await supabase
                    .from('attendance')
                    .select(`
                        student_id,
                        group_id,
                        status,
                        profiles!student_id (full_name, first_name, last_name),
                        groups (id, name)
                    `)
                    .eq('date', date)
                    .order('group_id');

                if (error) throw error;

                const byGroup = {};
                (att || []).forEach((row) => {
                    const gid = row.group_id;
                    if (!byGroup[gid]) {
                        byGroup[gid] = {
                            id: gid,
                            name: row.groups?.name || '—',
                            students: [],
                        };
                    }
                    const p = row.profiles;
                    const name = p?.full_name || [p?.first_name, p?.last_name].filter(Boolean).join(' ').trim() || '—';
                    byGroup[gid].students.push({ student_id: row.student_id, name, status: row.status });
                });

                setReport(Object.values(byGroup).sort((a, b) => (a.name || '').localeCompare(b.name || '')));
            } catch (err) {
                console.error('Error fetching attendance report:', err);
                setReport([]);
            } finally {
                setLoading(false);
            }
        };
        fetchReport();
    }, [date]);

    const filteredReport = useMemo(() => {
        if (!searchQuery.trim()) return report;
        const q = searchQuery.trim().toLowerCase();
        return report
            .map((g) => ({
                ...g,
                students: g.students.filter((s) =>
                    (s.name || '').toLowerCase().includes(q) || (g.name || '').toLowerCase().includes(q)
                ),
            }))
            .filter((g) => g.students.length > 0);
    }, [report, searchQuery]);

    const total = filteredReport.reduce((acc, g) => acc + g.students.length, 0);
    const present = filteredReport.reduce((acc, g) => acc + g.students.filter((s) => s.status === 'present').length, 0);
    const absent = filteredReport.reduce((acc, g) => acc + g.students.filter((s) => s.status === 'absent').length, 0);
    const late = filteredReport.reduce((acc, g) => acc + g.students.filter((s) => s.status === 'late').length, 0);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                        <span className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/25">
                            <FileText size={20} className="text-white" />
                        </span>
                        Shu kungi davomat hisoboti
                    </h1>
                    <p className="text-gray-500 text-sm mt-2 max-w-xl">
                        O&apos;qituvchilar davomatni o&apos;z guruhlarida belgilaydi. Tanlangan kun bo&apos;yicha umumiy hisobot.
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <label className="text-sm font-medium text-gray-600">Sana:</label>
                    <input
                        type="date"
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        className="bg-white border border-gray-200 rounded-xl text-gray-700 py-2.5 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm"
                    />
                </div>
            </div>

            {loading ? (
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-16 flex flex-col items-center justify-center gap-3 text-gray-500">
                    <Loader2 size={32} className="animate-spin text-blue-500" />
                    <span className="text-sm font-medium">Hisobot yuklanmoqda...</span>
                </div>
            ) : report.length === 0 ? (
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-16 text-center">
                    <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-4">
                        <FileText size={28} className="text-gray-400" />
                    </div>
                    <p className="text-gray-600 font-medium">
                        {date ? `${date} uchun davomat topilmadi` : 'Sanani tanlang'}
                    </p>
                    <p className="text-gray-500 text-sm mt-1 max-w-md mx-auto">
                        {date && 'O\'qituvchilar o\'z guruhlarida davomatni belgilagach, hisobot shu yerga chiqadi.'}
                    </p>
                </div>
            ) : (
                <>
                    {/* Qidiruv */}
                    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
                        <div className="relative max-w-md">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                            <input
                                type="text"
                                placeholder="Guruh yoki o&apos;quvchi bo&apos;yicha qidirish..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                            />
                        </div>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 flex items-center gap-4 overflow-hidden">
                            <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center shrink-0">
                                <Users size={22} className="text-slate-600" />
                            </div>
                            <div>
                                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Jami</p>
                                <p className="text-2xl font-bold text-gray-900 mt-0.5">{total}</p>
                            </div>
                        </div>
                        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 flex items-center gap-4 overflow-hidden">
                            <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center shrink-0">
                                <Check size={22} className="text-emerald-600" />
                            </div>
                            <div>
                                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Keldi</p>
                                <p className="text-2xl font-bold text-emerald-600 mt-0.5">{present}</p>
                            </div>
                        </div>
                        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 flex items-center gap-4 overflow-hidden">
                            <div className="w-12 h-12 rounded-xl bg-rose-50 flex items-center justify-center shrink-0">
                                <X size={22} className="text-rose-600" />
                            </div>
                            <div>
                                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Kelmadi</p>
                                <p className="text-2xl font-bold text-rose-600 mt-0.5">{absent}</p>
                            </div>
                        </div>
                        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 flex items-center gap-4 overflow-hidden">
                            <div className="w-12 h-12 rounded-xl bg-amber-50 flex items-center justify-center shrink-0">
                                <Clock size={22} className="text-amber-600" />
                            </div>
                            <div>
                                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Kechikdi</p>
                                <p className="text-2xl font-bold text-amber-600 mt-0.5">{late}</p>
                            </div>
                        </div>
                    </div>

                    {/* Groups */}
                    <div className="space-y-6">
                        {filteredReport.length === 0 ? (
                            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-12 text-center">
                                <Search size={32} className="text-gray-300 mx-auto mb-3" />
                                <p className="text-gray-600 font-medium">Qidiruv bo&apos;yicha natija topilmadi</p>
                                <p className="text-gray-500 text-sm mt-1">Boshqa so&apos;z yoki guruh nomini kiriting</p>
                            </div>
                        ) : (
                            filteredReport.map((group) => {
                                const nPresent = group.students.filter((s) => s.status === 'present').length;
                                const nAbsent = group.students.filter((s) => s.status === 'absent').length;
                                const nLate = group.students.filter((s) => s.status === 'late').length;
                                return (
                                    <div
                                        key={group.id}
                                        className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden"
                                    >
                                        <div className="px-6 py-4 bg-gradient-to-r from-gray-50 to-white border-b border-gray-100 flex flex-wrap items-center justify-between gap-3">
                                            <h3 className="text-lg font-bold text-gray-900">{group.name}</h3>
                                            <div className="flex flex-wrap items-center gap-2">
                                                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 text-sm font-semibold">
                                                    <Check size={14} />
                                                    {nPresent} keldi
                                                </span>
                                                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-50 text-rose-700 text-sm font-semibold">
                                                    <X size={14} />
                                                    {nAbsent} kelmadi
                                                </span>
                                                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-50 text-amber-700 text-sm font-semibold">
                                                    <Clock size={14} />
                                                    {nLate} kechikdi
                                                </span>
                                            </div>
                                        </div>
                                        <div className="overflow-x-auto">
                                            <table className="w-full text-left text-sm">
                                                <thead>
                                                    <tr className="bg-gray-50/80 border-b border-gray-100">
                                                        <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider w-14">#</th>
                                                        <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">O&apos;quvchi</th>
                                                        <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider w-36">Holat</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-gray-100">
                                                    {group.students.map((s, idx) => (
                                                        <tr key={s.student_id} className="hover:bg-gray-50/50 transition-colors">
                                                            <td className="px-6 py-3.5 text-gray-500 font-medium">{idx + 1}</td>
                                                            <td className="px-6 py-3.5">
                                                                <div className="flex items-center gap-3">
                                                                    <div className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 font-semibold text-sm shrink-0">
                                                                        {s.name.charAt(0) || '?'}
                                                                    </div>
                                                                    <span className="font-medium text-gray-900">{s.name}</span>
                                                                </div>
                                                            </td>
                                                            <td className="px-6 py-3.5">
                                                                <span className={`inline-flex items-center px-3 py-1 rounded-lg text-sm font-semibold ${statusBadge[s.status] || 'bg-gray-100 text-gray-600'}`}>
                                                                    {statusLabel[s.status] || s.status}
                                                                </span>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </>
            )}
        </div>
    );
};

export default AttendanceList;
