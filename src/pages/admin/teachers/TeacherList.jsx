import React, { useState, useEffect } from 'react';
import Table, { TableRow, TableCell } from '../../../components/ui/Table';
import { Search, Plus, Pencil, Trash2 } from 'lucide-react';

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
        <div className="space-y-4">
            {/* Header with Search and Add Button */}
            <div className="bg-white rounded-lg border border-gray-200 p-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input
                            type="text"
                            placeholder="Izlash..."
                            className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-sm"
                        />
                    </div>
                    <button 
                        onClick={handleAdd} 
                        className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-lg hover:from-cyan-600 hover:to-blue-600 transition-all shadow-lg shadow-cyan-500/30 text-sm font-medium"
                    >
                        <Plus size={18} />
                        <span>Qo'shish</span>
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
                                <div className="flex items-center gap-2">
                                    <button 
                                        onClick={() => handleEdit(t)} 
                                        className="w-8 h-8 flex items-center justify-center bg-blue-500 hover:bg-blue-600 text-white rounded-full shadow-md hover:shadow-lg transition-all duration-200 hover:scale-110"
                                        title="Tahrirlash"
                                    >
                                        <Pencil size={14} />
                                    </button>
                                    <button 
                                        onClick={() => handleDelete(t.id)} 
                                        className="w-8 h-8 flex items-center justify-center bg-red-500 hover:bg-red-600 text-white rounded-full shadow-md hover:shadow-lg transition-all duration-200 hover:scale-110"
                                        title="O'chirish"
                                    >
                                        <Trash2 size={14} />
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
