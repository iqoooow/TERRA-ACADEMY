import React, { useState, useEffect } from 'react';
import { GraduationCap, Loader2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import Table, { TableRow, TableCell } from '../../components/ui/Table';

const TYPE_LABELS = { cefr: 'CEFR', ielts: 'IELTS', test: 'Test', exam: 'Imtihon', quiz: 'Quiz', homework: 'Uy vazifasi', other: 'Boshqa' };

const StudentGrades = () => {
    const { user } = useAuth();
    const [grades, setGrades] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user?.id) {
            setGrades([]);
            setLoading(false);
            return;
        }
        (async () => {
            setLoading(true);
            try {
                const { data, error } = await supabase
                    .from('grades')
                    .select(`
                        id, title, score, grade_type, date,
                        groups (id, name)
                    `)
                    .eq('student_id', user.id)
                    .order('date', { ascending: false });
                if (error) throw error;
                const rows = (data || []).map((r) => ({
                    ...r,
                    subject: r.groups?.name || '—',
                }));
                setGrades(rows);
            } catch (e) {
                console.error(e);
                setGrades([]);
            } finally {
                setLoading(false);
            }
        })();
    }, [user?.id]);

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                    <span className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-lg shadow-violet-500/25">
                        <GraduationCap size={20} className="text-white" />
                    </span>
                    Mening baholarim
                </h1>
                <p className="text-gray-500 text-sm mt-2">Topshiriq va imtihon natijalari</p>
            </div>

            {loading ? (
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-16 flex items-center justify-center gap-2 text-gray-500">
                    <Loader2 size={24} className="animate-spin" />
                    <span>Yuklanmoqda...</span>
                </div>
            ) : grades.length === 0 ? (
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-16 text-center">
                    <GraduationCap size={40} className="text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-600 font-medium">Hozircha baholar yo&apos;q</p>
                    <p className="text-gray-500 text-sm mt-1">O&apos;qituvchi baho qo&apos;shgach, shu yerda ko&apos;rinadi</p>
                </div>
            ) : (
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                    <Table headers={['Guruh / Fan', 'Topshiriq / Imtihon', 'Ball', 'Turi', 'Sana']}>
                        {grades.map((r) => (
                            <TableRow key={r.id}>
                                <TableCell className="font-medium text-gray-900">{r.subject}</TableCell>
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

export default StudentGrades;
