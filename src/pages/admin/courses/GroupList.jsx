import { useState, useEffect, useRef } from 'react';
import Table, { TableRow, TableCell } from '../../../components/ui/Table';
import { Search, Plus, Pencil, Trash2, Users, UsersRound, X, ChevronDown, Check, Clock, CalendarDays, GraduationCap, Download, UserCheck, RefreshCw } from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import StatsCard from '../../../components/ui/StatsCard';
import EmptyState from '../../../components/ui/EmptyState';

// Searchable Select Component (Premium)
const SearchableSelect = ({ value, onChange, options, placeholder, displayKey = 'name', valueKey = 'id', disabled = false }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [search, setSearch] = useState('');
    const ref = useRef(null);

    const selectedOption = options.find(o => o[valueKey] === value);
    const filteredOptions = options.filter(o =>
        (o[displayKey] || '').toLowerCase().includes(search.toLowerCase())
    );

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (ref.current && !ref.current.contains(e.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div ref={ref} className="relative group">
            <div
                onClick={() => !disabled && setIsOpen(!isOpen)}
                className={`w-full px-4 py-3 border-none bg-slate-50 rounded-xl flex items-center justify-between cursor-pointer hover:bg-white hover:shadow-md transition-all duration-200 ring-1 ring-slate-200 ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
                <span className={selectedOption ? 'text-slate-900 font-bold' : 'text-slate-400 font-medium'}>
                    {selectedOption ? selectedOption[displayKey] : placeholder}
                </span>
                <div className="flex items-center gap-2">
                    <ChevronDown size={18} className={`text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                </div>
            </div>
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        className="absolute z-50 w-full mt-2 bg-white border border-slate-100 rounded-xl shadow-xl overflow-hidden"
                    >
                        <div className="p-2 border-b border-slate-50">
                            <input
                                type="text"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Qidirish..."
                                className="w-full px-3 py-2 bg-slate-50 border-none rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-medium"
                                autoFocus
                            />
                        </div>
                        <div className="max-h-48 overflow-y-auto">
                            {filteredOptions.length === 0 ? (
                                <div className="px-4 py-3 text-slate-400 text-sm font-medium text-center">Topilmadi</div>
                            ) : (
                                filteredOptions.map((option) => (
                                    <div
                                        key={option[valueKey]}
                                        onClick={() => { onChange(option[valueKey]); setIsOpen(false); setSearch(''); }}
                                        className={`px-4 py-3 cursor-pointer hover:bg-blue-50 flex items-center justify-between transition-colors ${value === option[valueKey] ? 'bg-blue-50' : ''}`}
                                    >
                                        <span className="text-slate-900 font-medium text-sm">{option[displayKey]}</span>
                                        {value === option[valueKey] && <Check size={16} className="text-blue-600" />}
                                    </div>
                                ))
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

// Day Checkbox Component (Premium)
const DayCheckbox = ({ label, checked, onChange }) => (
    <label className={`flex items-center justify-center gap-2 p-3 border-2 rounded-xl cursor-pointer transition-all duration-200 ${checked
        ? 'border-blue-500 bg-blue-500 text-white shadow-lg shadow-blue-500/30'
        : 'border-slate-100 bg-white text-slate-500 hover:border-blue-200 hover:bg-blue-50'
        }`}>
        <input type="checkbox" checked={checked} onChange={onChange} className="sr-only" />
        <span className="text-xs font-black uppercase tracking-wider">{label}</span>
    </label>
);

const GroupList = () => {
    // ... (Keep existing logic, updating visual render only)
    const [groups, setGroups] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    // Group Modal State
    const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);
    const [editingGroup, setEditingGroup] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        subject_id: '',
        teacher_id: '',
        start_time: '',
        end_time: '',
        schedule_days: []
    });

    // Students Modal State
    const [isStudentsModalOpen, setIsStudentsModalOpen] = useState(false);
    const [selectedGroup, setSelectedGroup] = useState(null);
    const [studentsTab, setStudentsTab] = useState('list'); // 'list' or 'add'
    const [groupStudents, setGroupStudents] = useState([]);
    const [allStudents, setAllStudents] = useState([]);
    const [loadingStudents, setLoadingStudents] = useState(false);
    const [studentSearch, setStudentSearch] = useState('');

    // Dropdown Data
    const [subjects, setSubjects] = useState([]);
    const [teachers, setTeachers] = useState([]);

    const days = [
        { key: 'Mon', uz: 'Du', ru: 'Пн' },
        { key: 'Tue', uz: 'Se', ru: 'Вт' },
        { key: 'Wed', uz: 'Ch', ru: 'Ср' },
        { key: 'Thu', uz: 'Pa', ru: 'Чт' },
        { key: 'Fri', uz: 'Ju', ru: 'Пт' },
        { key: 'Sat', uz: 'Sh', ru: 'Сб' },
        { key: 'Sun', uz: 'Ya', ru: 'Вс' }
    ];

    useEffect(() => {
        fetchGroups();
        fetchDropdownData();
    }, []);

    const fetchDropdownData = async () => {
        try {
            const { data: subData } = await supabase.from('subjects').select('id, name');
            setSubjects(subData || []);

            const { data: teachData } = await supabase
                .from('profiles')
                .select('id, full_name, first_name, last_name')
                .eq('role', 'teacher');

            const formattedTeachers = (teachData || []).map(t => ({
                ...t,
                displayName: t.full_name || `${t.first_name || ''} ${t.last_name || ''}`.trim() || 'Teacher'
            }));
            setTeachers(formattedTeachers);
        } catch (err) {
            console.error('Error fetching dropdowns:', err);
        }
    };

    const fetchGroups = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('groups')
                .select(`
                    *,
                    subjects (name),
                    profiles (full_name, first_name, last_name)
                `)
                .order('created_at', { ascending: false });

            if (error) throw error;

            // Get student counts
            const groupIds = data?.map(g => g.id) || [];
            let studentCounts = {};

            if (groupIds.length > 0) {
                const { data: enrollments } = await supabase
                    .from('enrollments')
                    .select('group_id')
                    .in('group_id', groupIds);

                if (enrollments) {
                    enrollments.forEach(e => {
                        studentCounts[e.group_id] = (studentCounts[e.group_id] || 0) + 1;
                    });
                }
            }

            const formattedGroups = data?.map(g => ({
                ...g,
                subject: g.subjects?.name || 'Unknown',
                teacher: g.profiles?.full_name || `${g.profiles?.first_name || ''} ${g.profiles?.last_name || ''}`.trim() || 'Not assigned',
                students: studentCounts[g.id] || 0,
                status: 'Active',
                bg: 'bg-green-100 text-green-700'
            })) || [];

            setGroups(formattedGroups);
        } catch (err) {
            console.error('Error fetching groups:', err);
            toast.error("Guruhlarni yuklashda xatolik");
        } finally {
            setLoading(false);
        }
    };

    const fetchGroupStudents = async (groupId) => {
        setLoadingStudents(true);
        try {
            // Get enrolled students
            const { data: enrollments, error } = await supabase
                .from('enrollments')
                .select(`
                    id,
                    student_id,
                    profiles (id, full_name, first_name, last_name)
                `)
                .eq('group_id', groupId);

            if (error) throw error;

            const students = (enrollments || []).map(e => ({
                enrollmentId: e.id,
                id: e.profiles?.id,
                name: e.profiles?.full_name || `${e.profiles?.first_name || ''} ${e.profiles?.last_name || ''}`.trim() || 'Unknown'
            }));

            setGroupStudents(students);

            // Get all students for adding
            const { data: allStudentsData } = await supabase
                .from('profiles')
                .select('id, full_name, first_name, last_name')
                .eq('role', 'student')
                .eq('status', 'approved');

            const enrolledIds = students.map(s => s.id);
            const availableStudents = (allStudentsData || [])
                .filter(s => !enrolledIds.includes(s.id))
                .map(s => ({
                    id: s.id,
                    name: s.full_name || `${s.first_name || ''} ${s.last_name || ''}`.trim() || 'Unknown'
                }));

            setAllStudents(availableStudents);
        } catch (err) {
            console.error('Error fetching group students:', err);
        } finally {
            setLoadingStudents(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Bu guruhni o\'chirishni xohlaysizmi?')) return;
        try {
            const { error } = await supabase.from('groups').delete().eq('id', id);
            if (error) throw error;
            toast.success("Guruh o'chirildi");
            fetchGroups();
        } catch (err) {
            console.error('Error deleting group:', err);
            toast.error('Guruhni o\'chirishda xatolik');
        }
    };

    const handleEdit = (group) => {
        setEditingGroup(group);

        let startTime = '';
        let endTime = '';

        if (group.time) {
            const timeStr = String(group.time);
            startTime = timeStr.substring(0, 5);
        }

        if (group.end_time) {
            const endTimeStr = String(group.end_time);
            endTime = endTimeStr.substring(0, 5);
        }

        setFormData({
            name: group.name || '',
            subject_id: group.subject_id || '',
            teacher_id: group.teacher_id || '',
            start_time: startTime,
            end_time: endTime,
            schedule_days: group.schedule_days || []
        });
        setIsGroupModalOpen(true);
    };

    const handleAdd = () => {
        setEditingGroup(null);
        setFormData({
            name: '',
            subject_id: '',
            teacher_id: '',
            start_time: '',
            end_time: '',
            schedule_days: []
        });
        setIsGroupModalOpen(true);
    };

    const handleOpenStudents = (group) => {
        setSelectedGroup(group);
        setStudentsTab('list');
        setStudentSearch('');
        fetchGroupStudents(group.id);
        setIsStudentsModalOpen(true);
    };

    const toggleDay = (dayKey) => {
        setFormData(prev => {
            const days = prev.schedule_days || [];
            if (days.includes(dayKey)) {
                return { ...prev, schedule_days: days.filter(d => d !== dayKey) };
            } else {
                return { ...prev, schedule_days: [...days, dayKey] };
            }
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            const payload = {
                name: formData.name,
                subject_id: formData.subject_id || null,
                teacher_id: formData.teacher_id || null,
                time: formData.start_time || null,
                end_time: formData.end_time || null,
                schedule_days: formData.schedule_days
            };

            let error;
            if (editingGroup) {
                const result = await supabase.from('groups').update(payload).eq('id', editingGroup.id);
                error = result.error;
            } else {
                const result = await supabase.from('groups').insert([payload]);
                error = result.error;
            }

            if (error) throw error;

            toast.success("Muvaffaqiyatli saqlandi");
            setIsGroupModalOpen(false);
            fetchGroups();
        } catch (err) {
            console.error('Error saving group:', err);
            toast.error('Guruhni saqlashda xatolik');
        }
    };

    const handleRemoveStudent = async (enrollmentId) => {
        if (!window.confirm('O\'quvchini guruhdan chiqarishni xohlaysizmi?')) return;
        try {
            const { error } = await supabase.from('enrollments').delete().eq('id', enrollmentId);
            if (error) throw error;
            fetchGroupStudents(selectedGroup.id);
            fetchGroups();
            toast.success("O'quvchi guruhdan chiqarildi");
        } catch (err) {
            console.error('Error removing student:', err);
            toast.error('O\'quvchini chiqarishda xatolik');
        }
    };

    // Need logic for adding students (was missing in previous view but assumed needed)
    // Placeholder function for now as previous file view was truncated
    const handleAddStudent = async (studentId) => {
        try {
            const { error } = await supabase.from('enrollments').insert([{
                student_id: studentId,
                group_id: selectedGroup.id
            }]);
            if (error) throw error;
            fetchGroupStudents(selectedGroup.id);
            fetchGroups();
            toast.success("O'quvchi qo'shildi");
        } catch (err) {
            console.error("Error adding student:", err);
            toast.error("O'quvchi qo'shishda xatolik");
        }
    };

    const handleExport = () => {
        if (groups.length === 0) return toast.error("Eksport qilish uchun ma'lumot yo'q");
        const headers = ['Guruh nomi', 'Fan', "O'qituvchi", 'Jadval', "O'quvchilar", 'Holat'];

        const escapeCSV = (val) => {
            if (val === null || val === undefined) return '';
            const str = String(val);
            if (str.includes(',') || str.includes('"') || str.includes('\n')) {
                return `"${str.replace(/"/g, '""')}"`;
            }
            return str;
        };

        const mapDay = { 'Mon': 'Du', 'Tue': 'Se', 'Wed': 'Ch', 'Thu': 'Pa', 'Fri': 'Ju', 'Sat': 'Sh', 'Sun': 'Ya' };

        const rows = groups.map(g => [
            g.name,
            g.subject,
            g.teacher,
            (g.schedule_days || []).map(d => mapDay[d] || d).join(', '),
            g.students,
            g.status
        ]);

        const csvContent = headers.map(escapeCSV).join(",") + "\n"
            + rows.map(r => r.map(escapeCSV).join(",")).join("\n");

        const blob = new Blob(["\uFEFF" + csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        const dateStr = new Date().toISOString().split('T')[0].replace(/-/g, '_');
        link.setAttribute("download", `terra_groups_${dateStr}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast.success("Guruhlar ro'yxati yuklandi");
    };

    const filteredGroups = groups.filter(g =>
        g.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        g.subject?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        g.teacher?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const filteredAllStudents = allStudents.filter(s =>
        s.name.toLowerCase().includes(studentSearch.toLowerCase())
    );

    const stats = {
        total: groups.length,
        students: groups.reduce((sum, g) => sum + g.students, 0),
        teachers: new Set(groups.map(g => g.teacher_id)).size,
        active: groups.filter(g => g.status === 'Active').length
    };

    return (
        <div className="space-y-8 animate-fade-in max-w-[1600px] mx-auto pb-10">
            {/* Intelligence Header */}
            <div className="relative group overflow-hidden rounded-[2.5rem] bg-slate-900 shadow-2xl">
                <div className="absolute inset-0 bg-gradient-to-br from-teal-600 via-emerald-600 to-slate-900 opacity-90 group-hover:scale-105 transition-transform duration-1000"></div>
                <div className="absolute inset-0 opacity-20 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] blend-overlay"></div>

                <div className="relative z-10 p-8 md:p-12 flex flex-col md:flex-row md:items-center justify-between gap-8">
                    <div>
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 rounded-full text-[10px] font-black uppercase tracking-widest mb-4 backdrop-blur-md border border-white/10 text-teal-200 shadow-inner"
                        >
                            <CalendarDays size={12} className="text-teal-300" />
                            Guruhlar Boshqaruv Tizimi
                        </motion.div>
                        <h1 className="text-3xl md:text-5xl font-black text-white tracking-tight mb-3 italic">
                            Akademik <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-200 to-emerald-100 not-italic">Guruhlar</span>
                        </h1>
                        <p className="text-teal-100/80 font-medium text-lg max-w-xl leading-relaxed">
                            O'quv guruhlarini shakllantirish, dars jadvallarini belgilash va tarkibni nazorat qilish.
                        </p>
                    </div>

                    <motion.button
                        whileHover={{ scale: 1.05, y: -5 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={handleAdd}
                        className="btn-primary from-white to-slate-100 !text-slate-900 shadow-xl shadow-white/10 !py-4 h-fit"
                    >
                        <Plus size={18} className="text-teal-600" />
                        Yangi Guruh Qo'shish
                    </motion.button>
                </div>
            </div>

            {/* Matrix Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <StatsCard title="Jami Guruhlar" value={stats.total} icon={Users} color="teal" trend="Sinxron" />
                <StatsCard title="Jami O'quvchilar" value={stats.students} icon={GraduationCap} color="blue" trend={`${stats.total > 0 ? (stats.students / stats.total).toFixed(1) : 0} avg`} />
                <StatsCard title="O'qituvchilar" value={stats.teachers} icon={UserCheck} color="purple" trend="Faol" />
                <StatsCard title="Faol Kurslar" value={stats.active} icon={Check} color="emerald" trend="100%" />
            </div>

            {/* Controls Bar */}
            <div className="glass-card p-2 flex flex-col md:flex-row md:items-center justify-between gap-4 sticky top-24 z-30">
                <div className="relative flex-1 max-w-md ml-2">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input
                        type="text"
                        placeholder="Guruh nomi, fan yoki o'qituvchi bo'yicha izlash..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-12 pr-4 py-3 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-teal-500/20 focus:bg-white transition-all text-sm font-medium placeholder:text-slate-400"
                    />
                </div>
                <div className="flex gap-2 p-1">
                    <button
                        onClick={fetchGroups}
                        disabled={loading}
                        className="p-3 bg-slate-100 text-slate-500 rounded-xl hover:bg-teal-600 hover:text-white transition-all shadow-sm active:scale-95 disabled:opacity-50"
                    >
                        <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
                    </button>
                    <button
                        onClick={handleExport}
                        className="flex items-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-xl hover:bg-slate-800 transition-all font-black text-[10px] uppercase tracking-widest shadow-lg shadow-slate-900/20 active:scale-95"
                    >
                        <Download size={16} />
                        EXPORT CSV
                    </button>
                </div>
            </div>

            {loading ? (
                <div className="py-20 flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-teal-500 border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest animate-pulse">Guruhlar yuklanmoqda...</p>
                </div>
            ) : filteredGroups.length === 0 ? (
                <EmptyState
                    icon={Users}
                    title="Guruhlar topilmadi"
                    description={searchQuery ? `"${searchQuery}" bo'yicha hech qanday guruh topilmadi.` : "Hozircha guruhlar ro'yxati bo'sh."}
                />
            ) : (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                >
                    <Table headers={['Guruh nomi', "To'garak", "O'qituvchi", 'Jadval', "O'quvchilar", 'Holat', 'Amallar']}>
                        {filteredGroups.map((group) => (
                            <TableRow key={group.id} className="group hover:bg-teal-50/30">
                                <TableCell>
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-100 to-emerald-100 flex items-center justify-center text-teal-600 font-black shadow-inner">
                                            <Users size={20} />
                                        </div>
                                        <div>
                                            <div className="font-bold text-slate-900">{group.name}</div>
                                            <div className="text-xs text-slate-400 font-medium tracking-wide">ID: {group.id?.substring(0, 8)}...</div>
                                        </div>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <span className="font-bold text-slate-700 bg-slate-100 px-2 py-1 rounded-lg text-xs">{group.subject}</span>
                                </TableCell>
                                <TableCell>
                                    <div className="flex items-center gap-2">
                                        <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-500">
                                            {group.teacher?.[0] || '?'}
                                        </div>
                                        <span className="text-sm font-medium text-slate-600">{group.teacher}</span>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <div className="flex flex-col gap-1">
                                        <div className="flex flex-wrap gap-1">
                                            {group.schedule_days?.map(day => {
                                                const dayColors = {
                                                    'Mon': 'bg-blue-100 text-blue-700',
                                                    'Tue': 'bg-green-100 text-green-700',
                                                    'Wed': 'bg-purple-100 text-purple-700',
                                                    'Thu': 'bg-orange-100 text-orange-700',
                                                    'Fri': 'bg-pink-100 text-pink-700',
                                                    'Sat': 'bg-teal-100 text-teal-700',
                                                    'Sun': 'bg-red-100 text-red-700'
                                                };
                                                // Short names for display
                                                const mapDay = { 'Mon': 'Du', 'Tue': 'Se', 'Wed': 'Ch', 'Thu': 'Pa', 'Fri': 'Ju', 'Sat': 'Sh', 'Sun': 'Ya' };
                                                return (
                                                    <span
                                                        key={day}
                                                        className={`${dayColors[day] || 'bg-slate-100 text-slate-600'} text-[10px] font-black px-1.5 py-0.5 rounded uppercase`}
                                                    >
                                                        {mapDay[day] || day}
                                                    </span>
                                                );
                                            })}
                                        </div>
                                        {(group.time || group.end_time) && (
                                            <div className="flex items-center gap-1 text-[10px] font-bold text-slate-400">
                                                <Clock size={10} />
                                                <span>{group.time ? String(group.time).substring(0, 5) : ''} - {group.end_time ? String(group.end_time).substring(0, 5) : ''}</span>
                                            </div>
                                        )}
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <div className="flex items-center gap-1.5 font-bold text-slate-700">
                                        <UsersRound size={14} className="text-teal-500" />
                                        {group.students}
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <span className="px-2 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-emerald-100 text-emerald-700 border border-emerald-200">
                                        {group.status}
                                    </span>
                                </TableCell>
                                <TableCell>
                                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity translate-x-2 group-hover:translate-x-0 duration-300">
                                        <button
                                            onClick={() => handleEdit(group)}
                                            className="p-2 bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white rounded-lg transition-all hover:scale-110 shadow-sm"
                                            title="Tahrirlash"
                                        >
                                            <Pencil size={14} />
                                        </button>
                                        <button
                                            onClick={() => handleOpenStudents(group)}
                                            className="p-2 bg-purple-50 text-purple-600 hover:bg-purple-600 hover:text-white rounded-lg transition-all hover:scale-110 shadow-sm"
                                            title="O'quvchilar"
                                        >
                                            <UsersRound size={14} />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(group.id)}
                                            className="p-2 bg-red-50 text-red-600 hover:bg-red-600 hover:text-white rounded-lg transition-all hover:scale-110 shadow-sm"
                                            title="O'chirish"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))}
                    </Table>
                </motion.div>
            )}

            {/* Premium Group Modal */}
            <AnimatePresence>
                {isGroupModalOpen && (
                    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-slate-900/40 backdrop-blur-md"
                            onClick={() => setIsGroupModalOpen(false)}
                        />
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            className="bg-white rounded-3xl p-8 w-full max-w-lg relative z-10 shadow-2xl shadow-teal-900/20 border border-white/20 max-h-[90vh] overflow-y-auto"
                        >
                            <button
                                onClick={() => setIsGroupModalOpen(false)}
                                className="absolute top-6 right-6 p-2 bg-slate-50 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600 transition-colors"
                            >
                                <X size={20} />
                            </button>

                            <div className="mb-8">
                                <span className="px-3 py-1 bg-teal-100 text-teal-700 rounded-full text-xs font-black uppercase tracking-widest mb-4 inline-block">
                                    {editingGroup ? 'Tahrirlash' : 'Yangi'}
                                </span>
                                <h2 className="text-3xl font-black text-slate-900 tracking-tight">
                                    {editingGroup ? "Guruhni Tahrirlash" : "Yangi Guruh Qo'shish"}
                                </h2>
                                <p className="text-slate-500 mt-2 font-medium">Barcha maydonlarni to'ldiring</p>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div>
                                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1 mb-2 block">Guruh Nomi</label>
                                    <input
                                        type="text"
                                        value={formData.name}
                                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                                        className="input-field"
                                        placeholder="Masalan: Frontend React N1"
                                        required
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1 mb-2 block">Fan</label>
                                        <SearchableSelect
                                            value={formData.subject_id}
                                            onChange={(val) => setFormData({ ...formData, subject_id: val })}
                                            options={subjects}
                                            placeholder="Tanlang..."
                                            displayKey="name"
                                            valueKey="id"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1 mb-2 block">O'qituvchi</label>
                                        <SearchableSelect
                                            value={formData.teacher_id}
                                            onChange={(val) => setFormData({ ...formData, teacher_id: val })}
                                            options={teachers}
                                            placeholder="Tanlang..."
                                            displayKey="displayName"
                                            valueKey="id"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1 mb-3 block">Hafta Kunlari</label>
                                    <div className="grid grid-cols-4 gap-2">
                                        {days.map(day => (
                                            <DayCheckbox
                                                key={day.key}
                                                label={day.uz}
                                                checked={formData.schedule_days.includes(day.key)}
                                                onChange={() => toggleDay(day.key)}
                                            />
                                        ))}
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1 mb-2 block">Boshlash Vaqti</label>
                                        <input
                                            type="time"
                                            value={formData.start_time}
                                            onChange={e => setFormData({ ...formData, start_time: e.target.value })}
                                            className="input-field"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1 mb-2 block">Tugash Vaqti</label>
                                        <input
                                            type="time"
                                            value={formData.end_time}
                                            onChange={e => setFormData({ ...formData, end_time: e.target.value })}
                                            className="input-field"
                                        />
                                    </div>
                                </div>

                                <div className="pt-4 flex gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setIsGroupModalOpen(false)}
                                        className="flex-1 py-4 bg-white border border-slate-200 text-slate-700 font-bold rounded-xl hover:bg-slate-50 transition-all uppercase tracking-widest text-xs"
                                    >
                                        Bekor qilish
                                    </button>
                                    <button
                                        type="submit"
                                        className="flex-1 py-4 bg-teal-600 text-white font-bold rounded-xl hover:bg-teal-700 shadow-lg shadow-teal-500/30 transition-all uppercase tracking-widest text-xs"
                                    >
                                        {editingGroup ? 'Saqlash' : "Qo'shish"}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Premium Students Modal */}
            <AnimatePresence>
                {isStudentsModalOpen && selectedGroup && (
                    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
                            onClick={() => setIsStudentsModalOpen(false)}
                        />
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            className="bg-white rounded-3xl w-full max-w-2xl relative z-10 shadow-2xl flex flex-col max-h-[85vh] overflow-hidden"
                        >
                            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                                <div>
                                    <h2 className="text-xl font-black text-slate-900">{selectedGroup.name}</h2>
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">O'quvchilarni boshqarish</p>
                                </div>
                                <button
                                    onClick={() => setIsStudentsModalOpen(false)}
                                    className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-400"
                                >
                                    <X size={20} />
                                </button>
                            </div>

                            <div className="p-4 border-b border-slate-100 bg-white">
                                <div className="flex p-1 bg-slate-100 rounded-xl">
                                    <button
                                        onClick={() => setStudentsTab('list')}
                                        className={`flex-1 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${studentsTab === 'list' ? 'bg-white text-teal-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                                    >
                                        Ro'yxat ({groupStudents.length})
                                    </button>
                                    <button
                                        onClick={() => setStudentsTab('add')}
                                        className={`flex-1 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${studentsTab === 'add' ? 'bg-white text-teal-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                                    >
                                        Qo'shish
                                    </button>
                                </div>
                            </div>

                            <div className="flex-1 overflow-y-auto p-0 bg-slate-50/30">
                                {loadingStudents ? (
                                    <div className="flex justify-center p-10">
                                        <div className="w-8 h-8 border-4 border-teal-500/30 border-t-teal-500 rounded-full animate-spin"></div>
                                    </div>
                                ) : studentsTab === 'list' ? (
                                    <div className="divide-y divide-slate-100">
                                        {groupStudents.length === 0 ? (
                                            <div className="p-10 text-center text-slate-400 font-medium text-sm">Guruhda o'quvchilar yo'q</div>
                                        ) : (
                                            groupStudents.map((student, i) => (
                                                <div key={student.enrollmentId} className="flex items-center justify-between p-4 hover:bg-white transition-colors">
                                                    <div className="flex items-center gap-3">
                                                        <span className="w-6 h-6 flex items-center justify-center bg-slate-200 rounded-full text-[10px] font-bold text-slate-500">{i + 1}</span>
                                                        <span className="font-bold text-slate-700">{student.name}</span>
                                                    </div>
                                                    <button
                                                        onClick={() => handleRemoveStudent(student.enrollmentId)}
                                                        className="p-2 text-rose-400 hover:bg-rose-50 hover:text-rose-600 rounded-lg transition-colors"
                                                        title="Guruhdan chiqarish"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                ) : (
                                    <div className="p-4">
                                        <div className="relative mb-4">
                                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                            <input
                                                type="text"
                                                placeholder="O'quvchi ismini izlash..."
                                                value={studentSearch}
                                                onChange={(e) => setStudentSearch(e.target.value)}
                                                className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500/20 outline-none text-sm font-medium"
                                                autoFocus
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            {filteredAllStudents.slice(0, 10).map(student => (
                                                <div key={student.id} className="flex items-center justify-between p-3 bg-white border border-slate-100 rounded-xl hover:border-teal-200 transition-colors">
                                                    <span className="font-bold text-slate-700">{student.name}</span>
                                                    <button
                                                        onClick={() => handleAddStudent(student.id)}
                                                        className="px-3 py-1.5 bg-teal-50 text-teal-600 hover:bg-teal-500 hover:text-white rounded-lg text-xs font-black uppercase tracking-wider transition-all"
                                                    >
                                                        Qo'shish
                                                    </button>
                                                </div>
                                            ))}
                                            {filteredAllStudents.length === 0 && (
                                                <div className="text-center p-4 text-slate-400 text-sm">O'quvchilar topilmadi</div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default GroupList;
