import React, { useState, useEffect } from 'react';
import Table, { TableRow, TableCell } from '../../../components/ui/Table';
import { Search, Plus, Pencil, Trash2, BookOpen } from 'lucide-react';
import { supabase } from '../../../lib/supabase';

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

    // Pagination state
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const pageSize = 10;

    useEffect(() => {
        fetchSubjects(currentPage);
    }, [currentPage]);

    const fetchSubjects = async (page = 1) => {
        setLoading(true);
        try {
            // Calculate range
            const from = (page - 1) * pageSize;
            const to = from + pageSize - 1;

            const { data, count, error } = await supabase
                .from('subjects')
                .select('*', { count: 'exact' })
                .order('created_at', { ascending: false })
                .range(from, to);

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

            if (count) {
                setTotalPages(Math.ceil(count / pageSize));
            }
        } catch (err) {
            console.error('Error fetching subjects:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this subject?')) return;
        try {
            const { error } = await supabase.from('subjects').delete().eq('id', id);
            if (error) throw error;
            fetchSubjects(currentPage);
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
            fetchSubjects(currentPage);
        } catch (err) {
            console.error('Error saving subject:', err);
            alert('Error saving subject');
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
                <div className="text-center py-10">Loading subjects...</div>
            ) : (
                <>
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
                                    <div className="flex items-center gap-2">
                                        <button 
                                            onClick={() => handleEdit(sub)} 
                                            className="w-8 h-8 flex items-center justify-center bg-blue-500 hover:bg-blue-600 text-white rounded-full shadow-md hover:shadow-lg transition-all duration-200 hover:scale-110"
                                            title="Tahrirlash"
                                        >
                                            <Pencil size={14} />
                                        </button>
                                        <button 
                                            onClick={() => handleDelete(sub.id)} 
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

                    {/* Pagination Controls */}
                    {subjects.length > 0 && (
                        <div className="flex items-center justify-between border-t border-gray-200 pt-4 mt-4">
                            <div className="text-sm text-gray-500">
                                Page {currentPage} of {totalPages}
                            </div>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                    disabled={currentPage === 1}
                                    className="px-3 py-1 border rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Previous
                                </button>
                                <button
                                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                    disabled={currentPage === totalPages}
                                    className="px-3 py-1 border rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Next
                                </button>
                            </div>
                        </div>
                    )}
                </>
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
