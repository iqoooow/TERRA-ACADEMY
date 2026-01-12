import React, { useState, useEffect } from 'react';
import Table, { TableRow, TableCell } from '../../../components/ui/Table';
import { Search, Plus, Filter, MoreVertical, Users } from 'lucide-react';

const GroupList = () => {
    const [groups, setGroups] = useState([]);
    const [loading, setLoading] = useState(true);

    // CRUD State
    const [isFormatModalOpen, setIsFormatModalOpen] = useState(false);
    const [editingGroup, setEditingGroup] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        subject_id: '',
        teacher_id: '',
        time: '',
        schedule_days: [] // E.g., ['Mon', 'Wed']
    });

    // Dropdown Data
    const [subjects, setSubjects] = useState([]);
    const [teachers, setTeachers] = useState([]);

    useEffect(() => {
        fetchGroups();
        fetchDropdownData();
    }, []);

    const fetchDropdownData = async () => {
        try {
            const { supabase } = await import('../../../lib/supabase');
            // Fetch subjects
            const { data: subData } = await supabase.from('subjects').select('id, name');
            setSubjects(subData || []);

            // Fetch teachers
            const { data: teachData } = await supabase.from('profiles').select('id, full_name, first_name, last_name').eq('role', 'teacher');
            setTeachers(teachData || []);
        } catch (err) {
            console.error('Error fetching dropdowns:', err);
        }
    };

    const fetchGroups = async () => {
        try {
            const { supabase } = await import('../../../lib/supabase');
            const { data, error } = await supabase
                .from('groups')
                .select(`
                    *,
                    subjects (name),
                    profiles (full_name, first_name, last_name)
                `)
                .order('created_at', { ascending: false });

            if (error) throw error;

            const formattedGroups = data?.map(g => ({
                ...g,
                subject: g.subjects?.name || 'Unknown',
                teacher: g.profiles?.full_name || `${g.profiles?.first_name || ''} ${g.profiles?.last_name || ''}` || 'Not assigned',
                schedule: g.schedule_days ? `${g.schedule_days.join('/')} ${g.time || ''}` : g.time || 'TBD',
                status: 'Active',
                bg: 'bg-green-100 text-green-700'
            })) || [];

            setGroups(formattedGroups);
        } catch (err) {
            console.error('Error fetching groups:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this group?')) return;
        try {
            const { supabase } = await import('../../../lib/supabase');
            const { error } = await supabase.from('groups').delete().eq('id', id);
            if (error) throw error;
            fetchGroups();
        } catch (err) {
            console.error('Error deleting group:', err);
            alert('Error deleting group');
        }
    };

    const handleEdit = (group) => {
        setEditingGroup(group);
        setFormData({
            name: group.name || '',
            subject_id: group.subject_id || '',
            teacher_id: group.teacher_id || '',
            time: group.time || '',
            schedule_days: group.schedule_days || []
        });
        setIsFormatModalOpen(true);
    };

    const handleAdd = () => {
        setEditingGroup(null);
        setFormData({
            name: '',
            subject_id: '',
            teacher_id: '',
            time: '',
            schedule_days: []
        });
        setIsFormatModalOpen(true);
    };

    const toggleDay = (day) => {
        setFormData(prev => {
            const days = prev.schedule_days || [];
            if (days.includes(day)) {
                return { ...prev, schedule_days: days.filter(d => d !== day) };
            } else {
                return { ...prev, schedule_days: [...days, day] };
            }
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const { supabase } = await import('../../../lib/supabase');
            const payload = {
                name: formData.name,
                subject_id: formData.subject_id || null,
                teacher_id: formData.teacher_id || null,
                time: formData.time,
                schedule_days: formData.schedule_days
            };

            if (editingGroup) {
                const { error } = await supabase.from('groups').update(payload).eq('id', editingGroup.id);
                if (error) throw error;
            } else {
                const { error } = await supabase.from('groups').insert([payload]);
                if (error) throw error;
            }

            setIsFormatModalOpen(false);
            fetchGroups();
        } catch (err) {
            console.error('Error saving group:', err);
            alert('Error saving group');
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Groups</h1>
                    <p className="text-gray-500 text-sm">Manage study groups and schedules</p>
                </div>
                <div className="flex gap-3">
                    <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors">
                        <Filter size={18} />
                        <span>Filter</span>
                    </button>
                    <button onClick={handleAdd} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-lg shadow-blue-500/30">
                        <Plus size={18} />
                        <span>Add Group</span>
                    </button>
                </div>
            </div>

            {loading ? (
                <div className="text-center py-10">Loading groups...</div>
            ) : (
                <Table headers={['Group Name', 'Subject', 'Teacher', 'Schedule', 'Students', 'Status', 'Actions']}>
                    {groups.map((group) => (
                        <TableRow key={group.id}>
                            <TableCell>
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-lg bg-teal-100 flex items-center justify-center text-teal-600">
                                        <Users size={20} />
                                    </div>
                                    <div>
                                        <div className="font-medium text-gray-900">{group.name}</div>
                                        <div className="text-xs text-gray-400">ID: {group.id}</div>
                                    </div>
                                </div>
                            </TableCell>
                            <TableCell>{group.subject}</TableCell>
                            <TableCell>{group.teacher}</TableCell>
                            <TableCell>{group.schedule}</TableCell>
                            <TableCell>{group.students || 0}</TableCell>
                            <TableCell>
                                <span className={`px-2 py-1 rounded-full text-xs font-semibold ${group.bg}`}>
                                    {group.status}
                                </span>
                            </TableCell>
                            <TableCell>
                                <div className="flex gap-2">
                                    <button onClick={() => handleEdit(group)} className="p-2 hover:bg-blue-50 text-blue-600 rounded-lg transition-colors">
                                        Edit
                                    </button>
                                    <button onClick={() => handleDelete(group.id)} className="p-2 hover:bg-red-50 text-red-600 rounded-lg transition-colors">
                                        Delete
                                    </button>
                                </div>
                            </TableCell>
                        </TableRow>
                    ))}
                </Table>
            )}

            {/* Modal */}
            {isFormatModalOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 overflow-y-auto">
                    <div className="bg-white rounded-2xl p-6 w-full max-w-lg m-4">
                        <h2 className="text-xl font-bold mb-4">{editingGroup ? 'Edit Group' : 'Add Group'}</h2>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Group Name</label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full px-3 py-2 border rounded-lg"
                                    placeholder="e.g. React Front-End N1"
                                    required
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
                                    <select
                                        value={formData.subject_id}
                                        onChange={e => setFormData({ ...formData, subject_id: e.target.value })}
                                        className="w-full px-3 py-2 border rounded-lg"
                                        required
                                    >
                                        <option value="">Select Subject</option>
                                        {subjects.map(s => (
                                            <option key={s.id} value={s.id}>{s.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Teacher</label>
                                    <select
                                        value={formData.teacher_id}
                                        onChange={e => setFormData({ ...formData, teacher_id: e.target.value })}
                                        className="w-full px-3 py-2 border rounded-lg"
                                    >
                                        <option value="">Select Teacher</option>
                                        {teachers.map(t => (
                                            <option key={t.id} value={t.id}>{t.full_name || t.first_name || 'Teacher'}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Time</label>
                                <input
                                    type="time"
                                    value={formData.time}
                                    onChange={e => setFormData({ ...formData, time: e.target.value })}
                                    className="w-full px-3 py-2 border rounded-lg"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Schedule Days</label>
                                <div className="flex gap-2 flex-wrap">
                                    {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
                                        <button
                                            key={day}
                                            type="button"
                                            onClick={() => toggleDay(day)}
                                            className={`px-3 py-1 rounded-full text-sm border ${formData.schedule_days.includes(day) ? 'bg-blue-600 text-white border-blue-600' : 'bg-gray-50 text-gray-600 border-gray-200'}`}
                                        >
                                            {day}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="flex gap-3 justify-end mt-6">
                                <button
                                    type="button"
                                    onClick={() => setIsFormatModalOpen(false)}
                                    className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                                >
                                    {editingGroup ? 'Save Changes' : 'Add Group'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default GroupList;
