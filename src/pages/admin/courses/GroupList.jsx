import React, { useState, useEffect, useRef } from 'react';
import Table, { TableRow, TableCell } from '../../../components/ui/Table';
import { Search, Plus, Pencil, Trash2, Users, UsersRound, X, ChevronDown, Check } from 'lucide-react';
import { supabase } from '../../../lib/supabase';

// Searchable Select Component
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
        <div ref={ref} className="relative">
            <div 
                onClick={() => !disabled && setIsOpen(!isOpen)}
                className={`w-full px-4 py-3 border border-gray-200 rounded-xl bg-white flex items-center justify-between cursor-pointer hover:border-gray-300 transition-colors ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
                <span className={selectedOption ? 'text-gray-900' : 'text-gray-400'}>
                    {selectedOption ? selectedOption[displayKey] : placeholder}
                </span>
                <div className="flex items-center gap-2">
                    {value && (
                        <button 
                            type="button"
                            onClick={(e) => { e.stopPropagation(); onChange(''); }}
                            className="p-1 hover:bg-gray-100 rounded-full"
                        >
                            <X size={14} className="text-gray-400" />
                        </button>
                    )}
                    <ChevronDown size={18} className={`text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                </div>
            </div>
            {isOpen && (
                <div className="absolute z-50 w-full mt-2 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden">
                    <div className="p-2 border-b">
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Qidirish..."
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            autoFocus
                        />
                    </div>
                    <div className="max-h-48 overflow-y-auto">
                        {filteredOptions.length === 0 ? (
                            <div className="px-4 py-3 text-gray-400 text-sm">Topilmadi</div>
                        ) : (
                            filteredOptions.map((option) => (
                                <div
                                    key={option[valueKey]}
                                    onClick={() => { onChange(option[valueKey]); setIsOpen(false); setSearch(''); }}
                                    className={`px-4 py-3 cursor-pointer hover:bg-gray-50 flex items-center justify-between ${value === option[valueKey] ? 'bg-blue-50' : ''}`}
                                >
                                    <span className="text-gray-900">{option[displayKey]}</span>
                                    {value === option[valueKey] && <Check size={16} className="text-blue-600" />}
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

// Day Checkbox Component
const DayCheckbox = ({ day, label, checked, onChange }) => (
    <label className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
        <div className={`w-5 h-5 rounded flex items-center justify-center border-2 transition-colors ${checked ? 'bg-[#3D5A80] border-[#3D5A80]' : 'border-gray-300'}`}>
            {checked && <Check size={12} className="text-white" />}
        </div>
        <input type="checkbox" checked={checked} onChange={onChange} className="sr-only" />
        <span className="text-gray-700 text-sm">{label}</span>
    </label>
);

const GroupList = () => {
    const [groups, setGroups] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    // Group Modal State
    const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);
    const [editingGroup, setEditingGroup] = useState(null);
    const [lang, setLang] = useState('uz'); // 'uz' or 'ru'
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
        { key: 'Mon', uz: 'Dushanba', ru: 'Понедельник' },
        { key: 'Tue', uz: 'Seshanba', ru: 'Вторник' },
        { key: 'Wed', uz: 'Chorshanba', ru: 'Среда' },
        { key: 'Thu', uz: 'Payshanba', ru: 'Четверг' },
        { key: 'Fri', uz: 'Juma', ru: 'Пятница' },
        { key: 'Sat', uz: 'Shanba', ru: 'Суббота' },
        { key: 'Sun', uz: 'Yakshanba', ru: 'Воскресенье' }
    ];

    const labels = {
        uz: {
            addGroup: "Guruh qo'shish",
            editGroup: "Guruhni tahrirlash",
            groupName: "Guruh nomi:",
            subjectName: "To'garak nomi:",
            teacher: "O'qituvchi:",
            selectDays: "Hafta kunlarini tanlang:",
            startTime: "Boshlanish sanasi:",
            endTime: "Tugash sanasi:",
            cancel: "Bekor qilish",
            save: "Saqlash",
            students: "O'quvchilar",
            studentList: "O'quvchilar ro'yxati",
            addStudent: "O'quvchi qo'shish",
            fio: "F.I.O",
            selectSubject: "Tanlang...",
            selectTeacher: "Tanlang..."
        },
        ru: {
            addGroup: "Добавить группу",
            editGroup: "Редактировать группу",
            groupName: "Название группы:",
            subjectName: "Название кружка:",
            teacher: "Учитель:",
            selectDays: "Выберите дни недели:",
            startTime: "Время начала:",
            endTime: "Время окончания:",
            cancel: "Отмена",
            save: "Сохранить",
            students: "Ученики",
            studentList: "Список учеников",
            addStudent: "Добавить ученика",
            fio: "Ф.И.О",
            selectSubject: "Выбрать...",
            selectTeacher: "Выбрать..."
        }
    };

    const t = labels[lang];

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

            // Get student counts for each group
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
            fetchGroups();
        } catch (err) {
            console.error('Error deleting group:', err);
            alert('Guruhni o\'chirishda xatolik');
        }
    };

    const handleEdit = (group) => {
        setEditingGroup(group);
        
        // Parse time (format: "HH:MM:SS" or "HH:MM")
        let startTime = '';
        let endTime = '';
        
        if (group.time) {
            const timeStr = String(group.time);
            startTime = timeStr.substring(0, 5); // Take only HH:MM
        }
        
        if (group.end_time) {
            const endTimeStr = String(group.end_time);
            endTime = endTimeStr.substring(0, 5); // Take only HH:MM
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

            console.log('Saving group with payload:', payload);

            let error, data;
            if (editingGroup) {
                const result = await supabase.from('groups').update(payload).eq('id', editingGroup.id).select();
                error = result.error;
                data = result.data;
                console.log('Update result:', result);
            } else {
                const result = await supabase.from('groups').insert([payload]).select();
                error = result.error;
                data = result.data;
                console.log('Insert result:', result);
            }

            if (error) {
                console.error('Supabase error:', error);
                throw error;
            }

            console.log('Successfully saved:', data);
            setIsGroupModalOpen(false);
            fetchGroups();
        } catch (err) {
            console.error('Error saving group:', err);
            alert('Guruhni saqlashda xatolik: ' + (err.message || err));
        }
    };

    const handleRemoveStudent = async (enrollmentId) => {
        if (!window.confirm('O\'quvchini guruhdan chiqarishni xohlaysizmi?')) return;
        try {
            const { error } = await supabase.from('enrollments').delete().eq('id', enrollmentId);
            if (error) throw error;
            fetchGroupStudents(selectedGroup.id);
            fetchGroups(); // Update student count
        } catch (err) {
            console.error('Error removing student:', err);
            alert('O\'quvchini chiqarishda xatolik');
        }
    };

    const handleAddStudent = async (studentId) => {
        try {
            const { error } = await supabase.from('enrollments').insert([{
                student_id: studentId,
                group_id: selectedGroup.id
            }]);
            if (error) throw error;
            fetchGroupStudents(selectedGroup.id);
            fetchGroups(); // Update student count
        } catch (err) {
            console.error('Error adding student:', err);
            alert('O\'quvchini qo\'shishda xatolik');
        }
    };

    const filteredGroups = groups.filter(g => 
        g.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        g.subject?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        g.teacher?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const filteredAllStudents = allStudents.filter(s =>
        s.name.toLowerCase().includes(studentSearch.toLowerCase())
    );

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
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
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
                <div className="text-center py-10">Loading groups...</div>
            ) : (
                <Table headers={['Guruh nomi', "To'garak", "O'qituvchi", 'Jadval', "O'quvchilar", 'Holat', 'Amallar']}>
                    {filteredGroups.map((group) => (
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
                            <TableCell>
                                <div className="flex flex-wrap gap-1">
                                    {group.schedule_days?.map(day => {
                                        const dayColors = {
                                            'Mon': 'bg-blue-500',
                                            'Tue': 'bg-green-500',
                                            'Wed': 'bg-purple-500',
                                            'Thu': 'bg-orange-500',
                                            'Fri': 'bg-pink-500',
                                            'Sat': 'bg-teal-500',
                                            'Sun': 'bg-red-500'
                                        };
                                        const dayNames = {
                                            'Mon': 'Du',
                                            'Tue': 'Se',
                                            'Wed': 'Ch',
                                            'Thu': 'Pa',
                                            'Fri': 'Ju',
                                            'Sat': 'Sh',
                                            'Sun': 'Ya'
                                        };
                                        return (
                                            <span 
                                                key={day} 
                                                className={`${dayColors[day] || 'bg-gray-500'} text-white text-xs px-2 py-0.5 rounded-md font-medium`}
                                            >
                                                {dayNames[day] || day}
                                            </span>
                                        );
                                    })}
                                    {(group.time || group.end_time) && (
                                        <span className="text-gray-500 text-xs ml-1">
                                            {group.time ? String(group.time).substring(0, 5) : ''}
                                            {group.end_time ? ` - ${String(group.end_time).substring(0, 5)}` : ''}
                                        </span>
                                    )}
                                </div>
                            </TableCell>
                            <TableCell>
                                <span className="font-medium text-gray-900">{group.students}</span>
                            </TableCell>
                            <TableCell>
                                <span className={`px-2 py-1 rounded-full text-xs font-semibold ${group.bg}`}>
                                    {group.status}
                                </span>
                            </TableCell>
                            <TableCell>
                                <div className="flex items-center gap-2">
                                    <button 
                                        onClick={() => handleDelete(group.id)} 
                                        className="w-8 h-8 flex items-center justify-center bg-red-500 hover:bg-red-600 text-white rounded-full shadow-md hover:shadow-lg transition-all duration-200 hover:scale-110"
                                        title="O'chirish"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                    <button 
                                        onClick={() => handleEdit(group)} 
                                        className="w-8 h-8 flex items-center justify-center bg-blue-500 hover:bg-blue-600 text-white rounded-full shadow-md hover:shadow-lg transition-all duration-200 hover:scale-110"
                                        title="Tahrirlash"
                                    >
                                        <Pencil size={14} />
                                    </button>
                                    <button 
                                        onClick={() => handleOpenStudents(group)}
                                        className="w-8 h-8 flex items-center justify-center bg-teal-500 hover:bg-teal-600 text-white rounded-full shadow-md hover:shadow-lg transition-all duration-200 hover:scale-110"
                                        title="O'quvchilarni ko'rish"
                                    >
                                        <UsersRound size={14} />
                                    </button>
                                </div>
                            </TableCell>
                        </TableRow>
                    ))}
                </Table>
            )}

            {/* Group Add/Edit Modal */}
            {isGroupModalOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 overflow-y-auto p-4">
                    <div className="bg-white rounded-2xl w-full max-w-lg my-8 shadow-2xl">
                        {/* Header */}
                        <div className="flex items-center justify-between p-6 border-b">
                            <h2 className="text-xl font-bold text-gray-900">
                                {editingGroup ? t.editGroup : t.addGroup}
                            </h2>
                            <button 
                                onClick={() => setIsGroupModalOpen(false)}
                                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                            >
                                <X size={20} className="text-gray-400" />
                            </button>
                        </div>

                        {/* Language Toggle */}
                        <div className="px-6 pt-4">
                            <div className="inline-flex rounded-lg border border-gray-200 p-1">
                                <button
                                    type="button"
                                    onClick={() => setLang('uz')}
                                    className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${lang === 'uz' ? 'bg-gray-100 text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
                                >
                                    <span className="w-5 h-4 rounded-sm overflow-hidden flex items-center justify-center bg-gradient-to-b from-blue-400 to-green-500 text-[8px] font-bold text-white">UZ</span>
                                    O'zbekcha
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setLang('ru')}
                                    className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${lang === 'ru' ? 'bg-gray-100 text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
                                >
                                    <span className="w-5 h-4 rounded-sm overflow-hidden flex items-center justify-center bg-gradient-to-b from-white via-blue-500 to-red-500 text-[8px] font-bold text-blue-900">RU</span>
                                    Русский
                                </button>
                            </div>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-5">
                            {/* Group Name */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">{t.groupName}</label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                                    placeholder='"Math Stars" (Matematika Yulduzlari) ⭐2'
                                    required
                                />
                            </div>

                            {/* Subject Dropdown */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">{t.subjectName}</label>
                                <SearchableSelect
                                    value={formData.subject_id}
                                    onChange={(val) => setFormData({ ...formData, subject_id: val })}
                                    options={subjects}
                                    placeholder={t.selectSubject}
                                    displayKey="name"
                                    valueKey="id"
                                />
                            </div>

                            {/* Teacher Dropdown */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">{t.teacher}</label>
                                <SearchableSelect
                                    value={formData.teacher_id}
                                    onChange={(val) => setFormData({ ...formData, teacher_id: val })}
                                    options={teachers}
                                    placeholder={t.selectTeacher}
                                    displayKey="displayName"
                                    valueKey="id"
                                />
                            </div>

                            {/* Days Selection */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-3">{t.selectDays}</label>
                                <div className="grid grid-cols-3 gap-2">
                                    {days.slice(0, 6).map(day => (
                                        <DayCheckbox
                                            key={day.key}
                                            day={day.key}
                                            label={day[lang]}
                                            checked={formData.schedule_days.includes(day.key)}
                                            onChange={() => toggleDay(day.key)}
                                        />
                                    ))}
                                </div>
                                <div className="mt-2">
                                    <DayCheckbox
                                        day={days[6].key}
                                        label={days[6][lang]}
                                        checked={formData.schedule_days.includes(days[6].key)}
                                        onChange={() => toggleDay(days[6].key)}
                                    />
                                </div>
                            </div>

                            {/* Time Selection */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">{t.startTime}</label>
                                    <div className="relative">
                                        <input
                                            type="time"
                                            value={formData.start_time}
                                            onChange={e => setFormData({ ...formData, start_time: e.target.value })}
                                            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">{t.endTime}</label>
                                    <div className="relative">
                                        <input
                                            type="time"
                                            value={formData.end_time}
                                            onChange={e => setFormData({ ...formData, end_time: e.target.value })}
                                            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Buttons */}
                            <div className="flex gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setIsGroupModalOpen(false)}
                                    className="flex-1 px-4 py-3 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl font-medium transition-colors"
                                >
                                    {t.cancel}
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 px-4 py-3 bg-[#3D5A80] text-white rounded-xl font-medium hover:bg-[#2d4a6f] transition-colors"
                                >
                                    {t.save}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Students Modal */}
            {isStudentsModalOpen && selectedGroup && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 overflow-y-auto p-4">
                    <div className="bg-white rounded-2xl w-full max-w-lg my-8 shadow-2xl max-h-[90vh] flex flex-col">
                        {/* Header */}
                        <div className="flex items-center justify-between p-6 border-b flex-shrink-0">
                            <h2 className="text-xl font-bold text-gray-900">O'quvchilar</h2>
                            <button 
                                onClick={() => setIsStudentsModalOpen(false)}
                                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                            >
                                <X size={20} className="text-gray-400" />
                            </button>
                        </div>

                        {/* Tabs */}
                        <div className="px-6 pt-4 flex-shrink-0">
                            <div className="flex rounded-lg border border-gray-200 p-1">
                                <button
                                    type="button"
                                    onClick={() => setStudentsTab('list')}
                                    className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${studentsTab === 'list' ? 'bg-[#3D5A80] text-white' : 'text-gray-600 hover:bg-gray-100'}`}
                                >
                                    O'quvchilar ro'yxati
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setStudentsTab('add')}
                                    className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${studentsTab === 'add' ? 'bg-[#3D5A80] text-white' : 'text-gray-600 hover:bg-gray-100'}`}
                                >
                                    O'quvchi qo'shish
                                </button>
                            </div>
                        </div>

                        {/* Content */}
                        <div className="p-6 flex-1 overflow-y-auto">
                            {loadingStudents ? (
                                <div className="text-center py-10 text-gray-500">Yuklanmoqda...</div>
                            ) : studentsTab === 'list' ? (
                                /* Student List Tab */
                                <div className="border border-gray-200 rounded-xl overflow-hidden">
                                    <table className="w-full">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider w-12">#</th>
                                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">F.I.O</th>
                                                <th className="px-4 py-3 w-16"></th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100">
                                            {groupStudents.length === 0 ? (
                                                <tr>
                                                    <td colSpan={3} className="px-4 py-8 text-center text-gray-400">
                                                        Guruhda o'quvchilar yo'q
                                                    </td>
                                                </tr>
                                            ) : (
                                                groupStudents.map((student, index) => (
                                                    <tr key={student.enrollmentId} className="hover:bg-gray-50">
                                                        <td className="px-4 py-3 text-gray-500 font-medium">{index + 1}</td>
                                                        <td className="px-4 py-3 text-gray-900 font-medium uppercase">{student.name}</td>
                                                        <td className="px-4 py-3">
                                                            <button 
                                                                onClick={() => handleRemoveStudent(student.enrollmentId)}
                                                                className="w-8 h-8 flex items-center justify-center bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors"
                                                            >
                                                                <Trash2 size={14} />
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                /* Add Student Tab */
                                <div className="space-y-4">
                                    <div className="relative">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                        <input
                                            type="text"
                                            placeholder="O'quvchi qidirish..."
                                            value={studentSearch}
                                            onChange={(e) => setStudentSearch(e.target.value)}
                                            className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                                        />
                                    </div>
                                    <div className="border border-gray-200 rounded-xl overflow-hidden max-h-80 overflow-y-auto">
                                        {filteredAllStudents.length === 0 ? (
                                            <div className="px-4 py-8 text-center text-gray-400">
                                                {allStudents.length === 0 ? "Qo'shish uchun o'quvchilar yo'q" : "Topilmadi"}
                                            </div>
                                        ) : (
                                            filteredAllStudents.map((student) => (
                                                <div 
                                                    key={student.id} 
                                                    className="flex items-center justify-between px-4 py-3 border-b border-gray-100 last:border-b-0 hover:bg-gray-50"
                                                >
                                                    <span className="text-gray-900 font-medium">{student.name}</span>
                                                    <button 
                                                        onClick={() => handleAddStudent(student.id)}
                                                        className="px-4 py-1.5 bg-[#3D5A80] text-white text-sm rounded-lg hover:bg-[#2d4a6f] transition-colors"
                                                    >
                                                        Qo'shish
                                                    </button>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default GroupList;
