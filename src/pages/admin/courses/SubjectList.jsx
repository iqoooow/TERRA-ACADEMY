import React, { useState, useEffect } from 'react';
import Table, { TableRow, TableCell } from '../../../components/ui/Table';
import { Search, Plus, Filter, MoreVertical, BookOpen } from 'lucide-react';

const SubjectList = () => {
    const [subjects, setSubjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isFormatModalOpen, setIsFormatModalOpen] = useState(false);
    const [editingSubject, setEditingSubject] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        price: '',
        description: ''
    });

    useEffect(() => {
        fetchSubjects();
    }, []);

    const fetchSubjects = async () => {
        try {
            const { supabase } = await import('../../../lib/supabase');
            const { data, error } = await supabase
                .from('subjects')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;

            // Format data
            const formattedSubjects = data?.map(s => ({
                ...s,
                teacherCount: 0, // Placeholder
                studentCount: 0, // Placeholder
                status: 'Active',
                bg: 'bg-blue-100 text-blue-700'
            })) || [];

            setSubjects(formattedSubjects);
        } catch (err) {
            console.error('Error fetching subjects:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this subject?')) return;
        try {
            const { supabase } = await import('../../../lib/supabase');
            const { error } = await supabase.from('subjects').delete().eq('id', id);
            if (error) throw error;
            fetchSubjects();
        } catch (err) {
            console.error('Error deleting subject:', err);
            alert('Error deleting subject');
        }
    };

    const handleEdit = (sub) => {
        setEditingSubject(sub);
        setFormData({
            name: sub.name || '',
            price: sub.price || '',
            description: sub.description || ''
        });
        setIsFormatModalOpen(true);
    };

    const handleAdd = () => {
        setEditingSubject(null);
        setFormData({
            name: '',
            price: '',
            description: ''
        });
        setIsFormatModalOpen(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const { supabase } = await import('../../../lib/supabase');
            const payload = {
                name: formData.name,
                price: formData.price,
                description: formData.description
            };

            if (editingSubject) {
                const { error } = await supabase
                    .from('subjects')
                    .update(payload)
                    .eq('id', editingSubject.id);
                if (error) throw error;
            } else {
                const { error } = await supabase
                    .from('subjects')
                    .insert([payload]);
                if (error) throw error;
            }

            setIsFormatModalOpen(false);
            fetchSubjects();
        } catch (err) {
            console.error('Error saving subject:', err);
            alert('Error saving subject');
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Subjects</h1>
                    <p className="text-gray-500 text-sm">Manage courses and subjects</p>
                </div>
                <div className="flex gap-3">
                    <button onClick={handleAdd} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-lg shadow-blue-500/30">
                        <Plus size={18} />
                        <span>Add Subject</span>
                    </button>
                </div>
            </div>

            {loading ? (
                <div className="text-center py-10">Loading subjects...</div>
            ) : (
                <Table headers={['Subject Name', 'Price', 'Description', 'Status', 'Actions']}>
                    {subjects.map((sub) => (
                        <TableRow key={sub.id}>
                            <TableCell>
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-lg bg-indigo-100 flex items-center justify-center text-indigo-600">
                                        <BookOpen size={20} />
                                    </div>
                                    <div className="font-medium text-gray-900">{sub.name}</div>
                                </div>
                            </TableCell>
                            <TableCell>{sub.price ? `$${sub.price}` : '-'}</TableCell>
                            <TableCell className="truncate max-w-xs">{sub.description || '-'}</TableCell>
                            <TableCell>
                                <span className={`px-2 py-1 rounded-full text-xs font-semibold ${sub.bg}`}>
                                    {sub.status}
                                </span>
                            </TableCell>
                            <TableCell>
                                <div className="flex gap-2">
                                    <button onClick={() => handleEdit(sub)} className="p-2 hover:bg-blue-50 text-blue-600 rounded-lg transition-colors">
                                        Edit
                                    </button>
                                    <button onClick={() => handleDelete(sub.id)} className="p-2 hover:bg-red-50 text-red-600 rounded-lg transition-colors">
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
                        <h2 className="text-xl font-bold mb-4">{editingSubject ? 'Edit Subject' : 'Add Subject'}</h2>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Subject Name</label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full px-3 py-2 border rounded-lg"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Price</label>
                                <input
                                    type="text"
                                    value={formData.price}
                                    onChange={e => setFormData({ ...formData, price: e.target.value })}
                                    className="w-full px-3 py-2 border rounded-lg"
                                    placeholder="e.g. 100.00"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                                <textarea
                                    value={formData.description}
                                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                                    className="w-full px-3 py-2 border rounded-lg"
                                    rows="3"
                                />
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
                                    {editingSubject ? 'Save Changes' : 'Add Subject'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SubjectList;

