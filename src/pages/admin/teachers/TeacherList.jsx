import React, { useState, useEffect } from 'react';
import Table, { TableRow, TableCell } from '../../../components/ui/Table';
import { Search, Plus, Filter, MoreVertical } from 'lucide-react';

const TeacherList = () => {
    const [teachers, setTeachers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isFormatModalOpen, setIsFormatModalOpen] = useState(false);
    const [editingTeacher, setEditingTeacher] = useState(null);
    const [formData, setFormData] = useState({
        first_name: '',
        last_name: '',
        phone: '',
        subject: '', // Note: Subject isn't in profiles, maybe we need to join? Or just store for now? 
        // Actually, subjects are separate. We might need to link them. 
        // For MVP, letting them edit profile fields is key.
    });

    useEffect(() => {
        fetchTeachers();
    }, []);

    const fetchTeachers = async () => {
        try {
            const { supabase } = await import('../../../lib/supabase');
            const { data, error } = await supabase
                .from('profiles')
                .select('id, first_name, last_name, full_name, phone, status, role')
                .eq('role', 'teacher')
                .order('created_at', { ascending: false });

            if (error) throw error;
            setTeachers(data || []);
        } catch (err) {
            console.error('Error fetching teachers:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this teacher?')) return;

        try {
            const { supabase } = await import('../../../lib/supabase');
            const { error } = await supabase.from('profiles').delete().eq('id', id);
            if (error) throw error;
            fetchTeachers();
        } catch (err) {
            console.error('Error deleting teacher:', err);
            alert('Error deleting teacher');
        }
    };

    const handleEdit = (teacher) => {
        setEditingTeacher(teacher);
        setFormData({
            first_name: teacher.first_name || '',
            last_name: teacher.last_name || '',
            phone: teacher.phone || '',
        });
        setIsFormatModalOpen(true);
    };

    const handleAdd = () => {
        setEditingTeacher(null);
        setFormData({
            first_name: '',
            last_name: '',
            phone: '',
            email: '', // Add email for new users
            password: '' // Add password for new users
        });
        setIsFormatModalOpen(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const { supabase } = await import('../../../lib/supabase');

            if (editingTeacher) {
                // Update existing
                const { error } = await supabase
                    .from('profiles')
                    .update({
                        first_name: formData.first_name,
                        last_name: formData.last_name,
                        phone: formData.phone,
                    })
                    .eq('id', editingTeacher.id);

                if (error) throw error;
            } else {
                // Create new Teacher (Link to Auth)
                // Since we can't create Auth User easily without Service Role here, 
                // we will attempt a trick: warn the user, or just create a profile if it allows (unlikely)
                // OR - we actually use the signUp method, but that signs the admin out.
                // BEST UX: Just say "To add a teacher, please ask them to register via the /register page."
                // BUT user demanded "Add". 
                // Let's try to insert into profiles directly. If FK fails, we show error.

                alert("To add a new teacher, please ask them to register at the registration page. Or use the 'Invite' feature (coming soon). currently we only support editing existing profiles.");
                return;
            }

            setIsFormatModalOpen(false);
            fetchTeachers();
        } catch (err) {
            console.error('Error saving teacher:', err);
            alert('Error saving teacher: ' + err.message);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Teachers</h1>
                    <p className="text-gray-500 text-sm">Manage academy teachers</p>
                </div>
                <div className="flex gap-3">
                    <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors">
                        <Filter size={18} />
                        <span>Filter</span>
                    </button>
                    <button onClick={handleAdd} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-lg shadow-blue-500/30">
                        <Plus size={18} />
                        <span>Add Teacher</span>
                    </button>
                </div>
            </div>

            {loading ? (
                <div className="text-center py-10">Loading teachers...</div>
            ) : (
                <Table headers={['Teacher Name', 'Phone Number', 'Status', 'Actions']}>
                    {teachers.map((t) => (
                        <TableRow key={t.id}>
                            <TableCell>
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 font-bold">
                                        {(t.full_name || t.first_name || 'U').charAt(0).toUpperCase()}
                                    </div>
                                    <div className="font-medium text-gray-900">
                                        {t.full_name || `${t.first_name || ''} ${t.last_name || ''}`}
                                    </div>
                                </div>
                            </TableCell>
                            <TableCell>{t.phone || '-'}</TableCell>
                            <TableCell>
                                <span className={`px-2 py-1 rounded-full text-xs font-semibold ${t.status === 'approved' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                                    {t.status || 'unknown'}
                                </span>
                            </TableCell>
                            <TableCell>
                                <div className="flex gap-2">
                                    <button onClick={() => handleEdit(t)} className="p-2 hover:bg-blue-50 text-blue-600 rounded-lg transition-colors">
                                        Edit
                                    </button>
                                    <button onClick={() => handleDelete(t.id)} className="p-2 hover:bg-red-50 text-red-600 rounded-lg transition-colors">
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
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-2xl p-6 w-full max-w-md">
                        <h2 className="text-xl font-bold mb-4">{editingTeacher ? 'Edit Teacher' : 'Add Teacher'}</h2>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                                <input
                                    type="text"
                                    value={formData.first_name}
                                    onChange={e => setFormData({ ...formData, first_name: e.target.value })}
                                    className="w-full px-3 py-2 border rounded-lg"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                                <input
                                    type="text"
                                    value={formData.last_name}
                                    onChange={e => setFormData({ ...formData, last_name: e.target.value })}
                                    className="w-full px-3 py-2 border rounded-lg"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                                <input
                                    type="text"
                                    value={formData.phone}
                                    onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                    className="w-full px-3 py-2 border rounded-lg"
                                />
                            </div>

                            {!editingTeacher && (
                                <div className="p-3 bg-blue-50 text-blue-700 text-sm rounded-lg">
                                    Note: Adding a new teacher directly is currently restricted. Please ask them to register via the signup page.
                                </div>
                            )}

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
                                    {editingTeacher ? 'Save Changes' : 'Add Teacher'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TeacherList;
