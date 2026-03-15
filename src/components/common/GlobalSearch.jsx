import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Search, User, Users, GraduationCap, X, Loader2, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';

const GlobalSearch = () => {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState({ students: [], teachers: [], parents: [], groups: [] });
    const [loading, setLoading] = useState(false);
    const [isOpen, setIsOpen] = useState(false);
    const wrapperRef = useRef(null);
    const inputRef = useRef(null);
    const navigate = useNavigate();

    // Ctrl+K shortcut & Escape to close
    useEffect(() => {
        const handleKeyDown = (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                e.preventDefault();
                inputRef.current?.focus();
            }
            if (e.key === 'Escape') {
                setIsOpen(false);
                inputRef.current?.blur();
            }
        };
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, []);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const performSearch = useCallback(async () => {
        setLoading(true);
        setIsOpen(true);
        try {
            const searchTerm = `%${query}%`;

            // Parallel search
            const [profilesRes, groupsRes] = await Promise.all([
                supabase
                    .from('profiles')
                    .select('id, full_name, role, phone, first_name, last_name')
                    .or(`full_name.ilike.${searchTerm},first_name.ilike.${searchTerm},last_name.ilike.${searchTerm},phone.ilike.${searchTerm}`)
                    .limit(10),
                supabase
                    .from('groups')
                    .select('id, name')
                    .ilike('name', searchTerm)
                    .limit(5)
            ]);

            const profiles = profilesRes.data || [];
            const groups = groupsRes.data || [];

            setResults({
                students: profiles.filter(p => p.role === 'student'),
                teachers: profiles.filter(p => p.role === 'teacher'),
                parents: profiles.filter(p => p.role === 'parent'),
                groups: groups
            });

        } catch (error) {
            console.error('Search error:', error);
        } finally {
            setLoading(false);
        }
    }, [query]);

    useEffect(() => {
        if (query.length < 2) {
            setResults({ students: [], teachers: [], parents: [], groups: [] });
            return;
        }
        const timer = setTimeout(performSearch, 300);
        return () => clearTimeout(timer);
    }, [query, performSearch]);

    const handleSelect = useCallback((type, item) => {
        setIsOpen(false);
        setQuery('');
        switch (type) {
            case 'student': navigate(`/admin/students/${item.id}`); break;
            case 'teacher': navigate(`/admin/teachers/${item.id}`); break;
            case 'parent': navigate(`/admin/parents/${item.id}`); break;
            case 'group': navigate('/admin/groups'); break;
            default: break;
        }
    }, [navigate]);

    const hasResults = Object.values(results).some(arr => arr.length > 0);

    return (
        <div ref={wrapperRef} className="relative w-full max-w-md hidden md:block z-50">
            <div className={`relative flex items-center gap-3 bg-slate-100/50 px-4 py-2.5 rounded-2xl border transition-all group ${isOpen ? 'bg-white shadow-lg border-blue-500/30' : 'border-transparent focus-within:border-blue-500/30 focus-within:bg-white focus-within:shadow-lg focus-within:shadow-blue-500/5'}`}>
                <Search size={18} className={`transition-colors ${isOpen ? 'text-blue-500' : 'text-slate-400 group-focus-within:text-blue-500'}`} />
                <input
                    ref={inputRef}
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onFocus={() => query.length >= 2 && setIsOpen(true)}
                    placeholder="Qidirish (Ctrl+K)"
                    className="bg-transparent border-none outline-none text-sm w-full font-medium text-slate-700 placeholder:text-slate-400"
                />
                {loading ? (
                    <Loader2 size={16} className="text-blue-500 animate-spin" />
                ) : query && (
                    <button onClick={() => { setQuery(''); setIsOpen(false); }} className="text-slate-400 hover:text-slate-600">
                        <X size={16} />
                    </button>
                )}
                {!query && <div className="text-xs font-bold text-slate-400 border border-slate-200 rounded px-1.5 py-0.5 bg-white">Ctrl K</div>}
            </div>

            <AnimatePresence>
                {isOpen && (query.length >= 2) && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden max-h-[80vh] overflow-y-auto custom-scrollbar"
                    >
                        {!hasResults && !loading ? (
                            <div className="p-8 text-center text-slate-400">
                                <Search size={32} className="mx-auto mb-3 opacity-20" />
                                <p className="text-sm font-medium">Hech narsa topilmadi</p>
                            </div>
                        ) : (
                            <div className="py-2">
                                {/* Students */}
                                {results.students.length > 0 && (
                                    <div className="mb-2">
                                        <div className="px-4 py-2 text-[10px] font-black uppercase tracking-widest text-slate-400 bg-slate-50/50">O'quvchilar</div>
                                        {results.students.map(student => (
                                            <button
                                                key={student.id}
                                                onClick={() => handleSelect('student', student)}
                                                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-blue-50 transition-colors text-left group"
                                            >
                                                <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-xs group-hover:bg-blue-600 group-hover:text-white transition-colors">
                                                    {student.first_name?.[0]}
                                                </div>
                                                <div className="flex-1">
                                                    <div className="text-sm font-bold text-slate-700 group-hover:text-blue-700">{student.full_name}</div>
                                                    <div className="text-xs text-slate-400 font-mono">{student.phone}</div>
                                                </div>
                                                <ChevronRight size={14} className="text-slate-300 group-hover:text-blue-500 opacity-0 group-hover:opacity-100" />
                                            </button>
                                        ))}
                                    </div>
                                )}

                                {/* Teachers */}
                                {results.teachers.length > 0 && (
                                    <div className="mb-2">
                                        <div className="px-4 py-2 text-[10px] font-black uppercase tracking-widest text-slate-400 bg-slate-50/50">O'qituvchilar</div>
                                        {results.teachers.map(teacher => (
                                            <button
                                                key={teacher.id}
                                                onClick={() => handleSelect('teacher', teacher)}
                                                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-purple-50 transition-colors text-left group"
                                            >
                                                <div className="w-8 h-8 rounded-lg bg-purple-100 text-purple-600 flex items-center justify-center font-bold text-xs group-hover:bg-purple-600 group-hover:text-white transition-colors">
                                                    {teacher.first_name?.[0]}
                                                </div>
                                                <div className="flex-1">
                                                    <div className="text-sm font-bold text-slate-700 group-hover:text-purple-700">{teacher.full_name}</div>
                                                    <div className="text-xs text-slate-400 font-mono">{teacher.phone}</div>
                                                </div>
                                                <ChevronRight size={14} className="text-slate-300 group-hover:text-purple-500 opacity-0 group-hover:opacity-100" />
                                            </button>
                                        ))}
                                    </div>
                                )}

                                {/* Parents */}
                                {results.parents.length > 0 && (
                                    <div className="mb-2">
                                        <div className="px-4 py-2 text-[10px] font-black uppercase tracking-widest text-slate-400 bg-slate-50/50">Ota-onalar</div>
                                        {results.parents.map(parent => (
                                            <button
                                                key={parent.id}
                                                onClick={() => handleSelect('parent', parent)}
                                                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-orange-50 transition-colors text-left group"
                                            >
                                                <div className="w-8 h-8 rounded-lg bg-orange-100 text-orange-600 flex items-center justify-center font-bold text-xs group-hover:bg-orange-600 group-hover:text-white transition-colors">
                                                    {parent.first_name?.[0]}
                                                </div>
                                                <div className="flex-1">
                                                    <div className="text-sm font-bold text-slate-700 group-hover:text-orange-700">{parent.full_name}</div>
                                                    <div className="text-xs text-slate-400 font-mono">{parent.phone}</div>
                                                </div>
                                                <ChevronRight size={14} className="text-slate-300 group-hover:text-orange-500 opacity-0 group-hover:opacity-100" />
                                            </button>
                                        ))}
                                    </div>
                                )}

                                {/* Groups */}
                                {results.groups.length > 0 && (
                                    <div className="mb-2">
                                        <div className="px-4 py-2 text-[10px] font-black uppercase tracking-widest text-slate-400 bg-slate-50/50">Guruhlar</div>
                                        {results.groups.map(group => (
                                            <button
                                                key={group.id}
                                                onClick={() => handleSelect('group', group)}
                                                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-emerald-50 transition-colors text-left group"
                                            >
                                                <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold text-xs group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                                                    <Users size={14} />
                                                </div>
                                                <div className="flex-1">
                                                    <div className="text-sm font-bold text-slate-700 group-hover:text-emerald-700">{group.name}</div>
                                                    <div className="text-xs text-slate-400">Guruh</div>
                                                </div>
                                                <ChevronRight size={14} className="text-slate-300 group-hover:text-emerald-500 opacity-0 group-hover:opacity-100" />
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default React.memo(GlobalSearch);
