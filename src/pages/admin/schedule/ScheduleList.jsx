import React, { useState, useEffect } from 'react';
import { Calendar, Clock, Users, ChevronDown, ChevronUp, BookOpen } from 'lucide-react';
import { supabase } from '../../../lib/supabase';

const ScheduleList = () => {
    const [groups, setGroups] = useState([]);
    const [loading, setLoading] = useState(true);
    const [expandedGroups, setExpandedGroups] = useState({});
    const [searchQuery, setSearchQuery] = useState('');

    const days = [
        { key: 'Mon', name: 'Dushanba', short: 'Du' },
        { key: 'Tue', name: 'Seshanba', short: 'Se' },
        { key: 'Wed', name: 'Chorshanba', short: 'Ch' },
        { key: 'Thu', name: 'Payshanba', short: 'Pa' },
        { key: 'Fri', name: 'Juma', short: 'Ju' },
        { key: 'Sat', name: 'Shanba', short: 'Sh' },
        { key: 'Sun', name: 'Yakshanba', short: 'Ya' }
    ];

    const dayColors = {
        'Mon': 'bg-blue-500',
        'Tue': 'bg-green-500',
        'Wed': 'bg-purple-500',
        'Thu': 'bg-orange-500',
        'Fri': 'bg-pink-500',
        'Sat': 'bg-teal-500',
        'Sun': 'bg-red-500'
    };

    useEffect(() => {
        fetchGroups();
    }, []);

    const fetchGroups = async () => {
        try {
            const { data, error } = await supabase
                .from('groups')
                .select(`
                    *,
                    subjects (name),
                    profiles (full_name, first_name, last_name)
                `)
                .order('name', { ascending: true });

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
                subject: g.subjects?.name || 'Noma\'lum',
                teacher: g.profiles?.full_name || `${g.profiles?.first_name || ''} ${g.profiles?.last_name || ''}`.trim() || 'Biriktirilmagan',
                studentCount: studentCounts[g.id] || 0,
                startTime: g.time ? String(g.time).substring(0, 5) : '',
                endTime: g.end_time ? String(g.end_time).substring(0, 5) : ''
            })) || [];

            setGroups(formattedGroups);
            
            // Expand all groups by default
            const expanded = {};
            formattedGroups.forEach(g => { expanded[g.id] = true; });
            setExpandedGroups(expanded);
        } catch (err) {
            console.error('Error fetching groups:', err);
        } finally {
            setLoading(false);
        }
    };

    const toggleGroup = (groupId) => {
        setExpandedGroups(prev => ({
            ...prev,
            [groupId]: !prev[groupId]
        }));
    };

    const expandAll = () => {
        const expanded = {};
        groups.forEach(g => { expanded[g.id] = true; });
        setExpandedGroups(expanded);
    };

    const collapseAll = () => {
        setExpandedGroups({});
    };

    const filteredGroups = groups.filter(g => 
        g.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        g.subject?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        g.teacher?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                            <Calendar className="text-blue-500" size={28} />
                            Dars jadvali
                        </h1>
                        <p className="text-gray-500 mt-1">Guruhlar va ularning haftalik jadvali</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <input
                            type="text"
                            placeholder="Qidirish..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                        />
                        <button
                            onClick={expandAll}
                            className="px-3 py-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors text-sm"
                        >
                            Hammasini ochish
                        </button>
                        <button
                            onClick={collapseAll}
                            className="px-3 py-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors text-sm"
                        >
                            Hammasini yopish
                        </button>
                    </div>
                </div>
            </div>

            {/* Groups List */}
            <div className="space-y-4">
                {filteredGroups.length === 0 ? (
                    <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
                        <Calendar size={48} className="mx-auto mb-4 text-gray-300" />
                        <p className="text-gray-500 text-lg">Guruhlar topilmadi</p>
                    </div>
                ) : (
                    filteredGroups.map(group => (
                        <div key={group.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                            {/* Group Header */}
                            <div 
                                onClick={() => toggleGroup(group.id)}
                                className="flex items-center justify-between p-5 cursor-pointer hover:bg-gray-50 transition-colors"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg">
                                        {group.name?.charAt(0)?.toUpperCase() || 'G'}
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-gray-900 text-lg">{group.name}</h3>
                                        <div className="flex items-center gap-3 text-sm text-gray-500">
                                            <span className="flex items-center gap-1">
                                                <BookOpen size={14} />
                                                {group.subject}
                                            </span>
                                            <span>•</span>
                                            <span className="flex items-center gap-1">
                                                <Users size={14} />
                                                {group.teacher}
                                            </span>
                                            <span>•</span>
                                            <span className="text-blue-600 font-medium">
                                                {group.studentCount} o'quvchi
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4">
                                    {/* Mini day indicators */}
                                    <div className="hidden md:flex gap-1">
                                        {days.map(day => (
                                            <div
                                                key={day.key}
                                                className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-medium ${
                                                    group.schedule_days?.includes(day.key)
                                                        ? `${dayColors[day.key]} text-white`
                                                        : 'bg-gray-100 text-gray-400'
                                                }`}
                                            >
                                                {day.short}
                                            </div>
                                        ))}
                                    </div>
                                    <div className="p-2 rounded-lg hover:bg-gray-100">
                                        {expandedGroups[group.id] ? (
                                            <ChevronUp size={20} className="text-gray-400" />
                                        ) : (
                                            <ChevronDown size={20} className="text-gray-400" />
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Group Schedule Table */}
                            {expandedGroups[group.id] && (
                                <div className="border-t border-gray-100">
                                    <div className="overflow-x-auto">
                                        <table className="w-full">
                                            <thead>
                                                <tr className="bg-gray-50">
                                                    {days.map(day => (
                                                        <th 
                                                            key={day.key} 
                                                            className="px-4 py-3 text-center text-sm font-semibold text-gray-600 border-r border-gray-100 last:border-r-0"
                                                        >
                                                            {day.name}
                                                        </th>
                                                    ))}
                                                </tr>
                                            </thead>
                                            <tbody>
                                                <tr>
                                                    {days.map(day => {
                                                        const hasClass = group.schedule_days?.includes(day.key);
                                                        return (
                                                            <td 
                                                                key={day.key} 
                                                                className="px-4 py-6 text-center border-r border-gray-100 last:border-r-0"
                                                            >
                                                                {hasClass ? (
                                                                    <div className="space-y-2">
                                                                        <div className={`${dayColors[day.key]} text-white text-sm font-medium px-3 py-2 rounded-lg inline-block`}>
                                                                            <div className="flex items-center gap-2 justify-center">
                                                                                <Clock size={14} />
                                                                                <span>
                                                                                    {group.startTime || '--:--'}
                                                                                    {group.endTime ? ` - ${group.endTime}` : ''}
                                                                                </span>
                                                                            </div>
                                                                        </div>
                                                                        <div className="text-xs text-gray-500">
                                                                            Dars bor
                                                                        </div>
                                                                    </div>
                                                                ) : (
                                                                    <div className="text-gray-300">
                                                                        <div className="w-8 h-8 rounded-full bg-gray-100 mx-auto flex items-center justify-center">
                                                                            <span className="text-gray-400">—</span>
                                                                        </div>
                                                                        <div className="text-xs text-gray-400 mt-2">Dam olish</div>
                                                                    </div>
                                                                )}
                                                            </td>
                                                        );
                                                    })}
                                                </tr>
                                            </tbody>
                                        </table>
                                    </div>
                                    
                                    {/* Group Summary */}
                                    <div className="bg-gray-50 px-5 py-3 flex items-center justify-between text-sm">
                                        <div className="flex items-center gap-6 text-gray-600">
                                            <span>
                                                <strong className="text-gray-900">{group.schedule_days?.length || 0}</strong> kun dars
                                            </span>
                                            <span>
                                                <strong className="text-gray-900">{group.studentCount}</strong> o'quvchi
                                            </span>
                                            {(group.startTime && group.endTime) && (
                                                <span>
                                                    Davomiyligi: <strong className="text-gray-900">
                                                        {(() => {
                                                            const [sh, sm] = group.startTime.split(':').map(Number);
                                                            const [eh, em] = group.endTime.split(':').map(Number);
                                                            const diff = (eh * 60 + em) - (sh * 60 + sm);
                                                            const hours = Math.floor(diff / 60);
                                                            const mins = diff % 60;
                                                            return `${hours > 0 ? hours + ' soat ' : ''}${mins > 0 ? mins + ' daqiqa' : ''}`;
                                                        })()}
                                                    </strong>
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex gap-1">
                                            {group.schedule_days?.map(dayKey => (
                                                <span 
                                                    key={dayKey}
                                                    className={`${dayColors[dayKey]} text-white text-xs px-2 py-1 rounded-md font-medium`}
                                                >
                                                    {days.find(d => d.key === dayKey)?.short}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    ))
                )}
            </div>

            {/* Overall Statistics */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h3 className="font-semibold text-gray-900 mb-4">Umumiy statistika</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-blue-50 rounded-xl p-4">
                        <div className="text-3xl font-bold text-blue-600">{groups.length}</div>
                        <div className="text-gray-600 text-sm">Jami guruhlar</div>
                    </div>
                    <div className="bg-green-50 rounded-xl p-4">
                        <div className="text-3xl font-bold text-green-600">
                            {groups.reduce((acc, g) => acc + (g.schedule_days?.length || 0), 0)}
                        </div>
                        <div className="text-gray-600 text-sm">Haftalik darslar</div>
                    </div>
                    <div className="bg-purple-50 rounded-xl p-4">
                        <div className="text-3xl font-bold text-purple-600">
                            {groups.reduce((acc, g) => acc + g.studentCount, 0)}
                        </div>
                        <div className="text-gray-600 text-sm">Jami o'quvchilar</div>
                    </div>
                    <div className="bg-orange-50 rounded-xl p-4">
                        <div className="text-3xl font-bold text-orange-600">
                            {new Set(groups.map(g => g.teacher)).size}
                        </div>
                        <div className="text-gray-600 text-sm">O'qituvchilar</div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ScheduleList;
