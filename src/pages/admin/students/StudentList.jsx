import React, { useState, useEffect } from 'react';
import Table, { TableRow, TableCell } from '../../../components/ui/Table';
import { Search, Plus, Filter, Pencil, Trash2 } from 'lucide-react';

import { supabase } from '../../../lib/supabase';

const StudentList = () => {
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isFormatModalOpen, setIsFormatModalOpen] = useState(false);
    const [editingStudent, setEditingStudent] = useState(null);
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
        fetchStudents(currentPage);
    }, [currentPage]);

    const fetchStudents = async (page = 1) => {
        setLoading(true);
        try {
            // Calculate range
            const from = (page - 1) * pageSize;
            const to = from + pageSize - 1;

            const { data, count, error } = await supabase
                .from('profiles')
                .select('id, first_name, last_name, full_name, phone, status, role, student_code', { count: 'exact' })
                .eq('role', 'student')
                .order('created_at', { ascending: false })
                .range(from, to);

            if (error) throw error;

            setStudents(data || []);

            if (count) {
                setTotalPages(Math.ceil(count / pageSize));
            }
        } catch (err) {
            console.error('Error fetching students:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this student?')) return;
        try {
            // const { supabase } = await import('../../../lib/supabase'); // Removed dynamic import
            const { error } = await supabase.from('profiles').delete().eq('id', id);
            if (error) throw error;
            fetchStudents();
        } catch (err) {
            console.error('Error deleting student:', err);
            alert('Error deleting student');
        }
    };

    const handleEdit = (student) => {
        setEditingStudent(student);
        setFormData({
            first_name: student.first_name || '',
            last_name: student.last_name || '',
            phone: student.phone || ''
        });
        setIsFormatModalOpen(true);
    };

    const handleAdd = () => {
        setEditingStudent(null);
        setFormData({
            first_name: '',
            last_name: '',
            phone: ''
        });
        setIsFormatModalOpen(true);
    };

    // Helper to generate unique student code
    const generateStudentCode = () => {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let code = 'STU-';
        for (let i = 0; i < 6; i++) {
            code += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return code;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingStudent) {
                const { error } = await supabase
                    .from('profiles')
                    .update({
                        first_name: formData.first_name,
                        last_name: formData.last_name,
                        phone: formData.phone,
                        // Ensure code exists on edit if missing
                        student_code: editingStudent.student_code || generateStudentCode()
                    })
                    .eq('id', editingStudent.id);
                if (error) throw error;
            } else {
                alert("To add a new student, please ask them to register at the registration page. Individual creation with student_code generation will be fully supported once the invitation system is ready.");
                return;
            }

            setIsFormatModalOpen(false);
            fetchStudents();
        } catch (err) {
            console.error('Error saving student:', err);
            alert('Error saving student: ' + err.message);
        }
    };

    // Helper to get badge color based on status
    const getStatusBadge = (status) => {
        switch (status) {
            case 'approved': return 'bg-green-100 text-green-700';
            case 'pending': return 'bg-yellow-100 text-yellow-700';
            case 'rejected': return 'bg-red-100 text-red-700';
            default: return 'bg-gray-100 text-gray-700';
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

            {/* Table */}
            {loading ? (
                <div className="text-center py-10">Loading students...</div>
            ) : (
                <Table headers={['Student Name', 'Student Code', 'Phone Number', 'Status', 'Actions']}>
                    {students.map((student) => (
                        <TableRow key={student.id}>
                            <TableCell>
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold">
                                        {(student.full_name || student.first_name || 'U').charAt(0).toUpperCase()}
                                    </div>
                                    <div className="font-medium text-gray-900">
                                        {student.full_name || `${student.first_name || ''} ${student.last_name || ''}`}
                                    </div>
                                </div>
                            </TableCell>
                            <TableCell>
                                <code className="px-2 py-1 bg-gray-100 rounded text-sm font-mono text-blue-600 font-bold">
                                    {student.student_code || '---'}
                                </code>
                            </TableCell>
                            <TableCell>{student.phone || '-'}</TableCell>
                            <TableCell>
                                <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusBadge(student.status)}`}>
                                    {student.status || 'unknown'}
                                </span>
                            </TableCell>
<TableCell>
                                <div className="flex items-center gap-2">
                                    <button 
                                        onClick={() => handleEdit(student)} 
                                        className="w-8 h-8 flex items-center justify-center bg-blue-500 hover:bg-blue-600 text-white rounded-full shadow-md hover:shadow-lg transition-all duration-200 hover:scale-110"
                                        title="Tahrirlash"
                                    >
                                        <Pencil size={14} />
                                    </button>
                                    <button 
                                        onClick={() => handleDelete(student.id)} 
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

            {/* Pagination Controls */}
            {students.length > 0 && (
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

            {/* Modal */}
            {isFormatModalOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-2xl p-6 w-full max-w-md">
                        <h2 className="text-xl font-bold mb-4">{editingStudent ? 'Edit Student' : 'Add Student'}</h2>
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

                            {!editingStudent && (
                                <div className="p-3 bg-blue-50 text-blue-700 text-sm rounded-lg">
                                    Note: Adding a new student directly is currently restricted. Please ask them to register via the signup page.
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
                                    {editingStudent ? 'Save Changes' : 'Add Student'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default StudentList;
