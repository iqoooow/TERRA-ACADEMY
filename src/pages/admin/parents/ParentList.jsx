import React, { useState, useEffect } from 'react';
import Table, { TableRow, TableCell } from '../../../components/ui/Table';
import { Search, Plus, Pencil, Trash2 } from 'lucide-react';
import { supabase } from '../../../lib/supabase';

const ParentList = () => {
    const [parents, setParents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isFormatModalOpen, setIsFormatModalOpen] = useState(false);
    const [editingParent, setEditingParent] = useState(null);
    const [formData, setFormData] = useState({
        first_name: '',
        last_name: '',
        phone: ''
    });

    // Pagination state
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const pageSize = 10;

    useEffect(() => {
        fetchParents(currentPage);
    }, [currentPage]);

    const fetchParents = async (page = 1) => {
        setLoading(true);
        try {
            // Calculate range
            const from = (page - 1) * pageSize;
            const to = from + pageSize - 1;

            // 1. Fetch Parents
            const { data: parentsData, count, error } = await supabase
                .from('profiles')
                .select('*', { count: 'exact' })
                .eq('role', 'parent')
                .order('created_at', { ascending: false })
                .range(from, to);

            if (error) throw error;

            if (!parentsData || parentsData.length === 0) {
                setParents([]);
                setTotalPages(0);
                return;
            }

            // 2. Fetch Children Counts manually to avoid complex join issues if not set up
            // Ideally we use a view or join, but for now we'll do a second query for counts
            // or just show "0" until we implement the linking UI.
            // For now, let's map what we have.

            const formattedParents = parentsData.map(p => ({
                ...p,
                children_count: 0, // Placeholder until linking is implemented
                status: p.status || 'active',
                bg: p.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
            }));

            setParents(formattedParents);

            if (count) {
                setTotalPages(Math.ceil(count / pageSize));
            }
        } catch (err) {
            console.error('Error fetching parents:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this parent?')) return;
        try {
            const { error } = await supabase.from('profiles').delete().eq('id', id);
            if (error) throw error;
            fetchParents(currentPage);
        } catch (err) {
            console.error('Error deleting parent:', err);
            alert('Error deleting parent');
        }
    };

    const handleEdit = (parent) => {
        setEditingParent(parent);
        setFormData({
            first_name: parent.first_name || '',
            last_name: parent.last_name || '',
            phone: parent.phone || ''
        });
        setIsFormatModalOpen(true);
    };

    const handleAdd = () => {
        setEditingParent(null);
        setFormData({
            first_name: '',
            last_name: '',
            phone: ''
        });
        setIsFormatModalOpen(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingParent) {
                const { error } = await supabase
                    .from('profiles')
                    .update({
                        first_name: formData.first_name,
                        last_name: formData.last_name,
                        phone: formData.phone,
                    })
                    .eq('id', editingParent.id);
                if (error) throw error;
            } else {
                alert("To add a new parent, please ask them to register via the signup page. We currently only support editing existing profiles.");
                return;
            }

            setIsFormatModalOpen(false);
            fetchParents(currentPage);
        } catch (err) {
            console.error('Error saving parent:', err);
            alert('Error saving parent');
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
                <div className="text-center py-10">Loading parents...</div>
            ) : (
                <>
                    <Table headers={['Parent Name', 'Phone Number', 'Status', 'Actions']}>
                        {parents.map((p) => (
                            <TableRow key={p.id}>
                                <TableCell>
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 font-bold">
                                            {(p.full_name || p.first_name || 'P').charAt(0).toUpperCase()}
                                        </div>
                                        <div className="font-medium text-gray-900">
                                            {p.full_name || `${p.first_name || ''} ${p.last_name || ''}`}
                                        </div>
                                    </div>
                                </TableCell>
                                <TableCell>{p.phone || '-'}</TableCell>
                                <TableCell>
                                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${p.bg}`}>
                                        {p.status}
                                    </span>
                                </TableCell>
                                <TableCell>
                                    <div className="flex items-center gap-2">
                                        <button 
                                            onClick={() => handleEdit(p)} 
                                            className="w-8 h-8 flex items-center justify-center bg-blue-500 hover:bg-blue-600 text-white rounded-full shadow-md hover:shadow-lg transition-all duration-200 hover:scale-110"
                                            title="Tahrirlash"
                                        >
                                            <Pencil size={14} />
                                        </button>
                                        <button 
                                            onClick={() => handleDelete(p.id)} 
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
                    {parents.length > 0 && (
                        <div className="flex items-center justify-center gap-4 py-4">
                            <span className="text-sm text-gray-500">
                                {parents.length} ta yozuvdan {(currentPage - 1) * pageSize + 1} dan {Math.min(currentPage * pageSize, parents.length)} gacha ko'rsatilmoqda
                            </span>
                            <div className="flex items-center gap-1">
                                <button
                                    onClick={() => setCurrentPage(1)}
                                    disabled={currentPage === 1}
                                    className="w-8 h-8 flex items-center justify-center rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed text-gray-500"
                                >
                                    «
                                </button>
                                <button
                                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                    disabled={currentPage === 1}
                                    className="w-8 h-8 flex items-center justify-center rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed text-gray-500"
                                >
                                    ‹
                                </button>
                                <span className="w-8 h-8 flex items-center justify-center rounded-full bg-blue-500 text-white text-sm font-medium">
                                    {currentPage}
                                </span>
                                <button
                                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                    disabled={currentPage === totalPages}
                                    className="w-8 h-8 flex items-center justify-center rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed text-gray-500"
                                >
                                    ›
                                </button>
                                <button
                                    onClick={() => setCurrentPage(totalPages)}
                                    disabled={currentPage === totalPages}
                                    className="w-8 h-8 flex items-center justify-center rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed text-gray-500"
                                >
                                    »
                                </button>
                            </div>
                            <select 
                                className="px-2 py-1 border border-gray-200 rounded text-sm"
                                defaultValue={pageSize}
                            >
                                <option value={10}>10</option>
                                <option value={25}>25</option>
                                <option value={50}>50</option>
                            </select>
                        </div>
                    )}
                </>
            )}

            {/* Modal */}
            {isFormatModalOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-2xl p-6 w-full max-w-md">
                        <h2 className="text-xl font-bold mb-4">{editingParent ? 'Edit Parent' : 'Add Parent'}</h2>
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
                                    {editingParent ? 'Save Changes' : 'Add Parent'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ParentList;
