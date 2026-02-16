import React, { useState, useEffect } from 'react';
import { Check, X, User, Phone, Calendar, Mail, Filter, MessageSquare, ListFilter, ShieldCheck, UserCheck, Users, Link as LinkIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../../lib/supabase';
import { toast } from 'react-hot-toast';

const RegistrationRequests = () => {
    const [requests, setRequests] = useState([]);
    const [parentLinks, setParentLinks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all'); // 'all', 'teacher', 'student', 'parent', 'links'
    const [selectedRequest, setSelectedRequest] = useState(null);
    const [actionLoading, setActionLoading] = useState(false);
    const [reason, setReason] = useState('');

    const fetchData = async () => {
        setLoading(true);
        try {
            // Fetch profile requests
            const { data: profiles, error: profileError } = await supabase
                .from('profiles')
                .select('*')
                .eq('status', 'pending');

            if (profileError) throw profileError;
            setRequests(profiles || []);

            // Fetch parent-student link requests
            const { data: links, error: linkError } = await supabase
                .from('parent_student')
                .select(`
                    *,
                    parent:parent_id(first_name, last_name, email),
                    student:student_id(first_name, last_name, student_code)
                `)
                .eq('status', 'pending');

            if (linkError) throw linkError;
            setParentLinks(links || []);

        } catch (err) {
            console.error('RegistrationRequests fetchData error:', err);
            toast.error('Ma’lumotlarni yuklashda xatolik yuz berdi');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleProfileAction = async (userId, action) => {
        setActionLoading(true);
        try {
            const status = action === 'approve' ? 'approved' : 'rejected';
            const { error } = await supabase
                .from('profiles')
                .update({ status: status })
                .eq('id', userId);

            if (error) throw error;

            setRequests(requests.filter(req => req.id !== userId));
            setSelectedRequest(null);
            setReason('');
            toast.success(action === 'approve' ? 'Foydalanuvchi tasdiqlandi' : 'Foydalanuvchi rad etildi');
        } catch (err) {
            console.error(err);
            toast.error('Xatolik yuz berdi');
        } finally {
            setActionLoading(false);
        }
    };

    const handleLinkAction = async (linkId, action) => {
        setActionLoading(true);
        try {
            const status = action === 'approve' ? 'approved' : 'rejected';
            const { error } = await supabase
                .from('parent_student')
                .update({ status: status })
                .eq('id', linkId);

            if (error) throw error;

            setParentLinks(parentLinks.filter(link => link.id !== linkId));
            setSelectedRequest(null);
            setReason('');
            toast.success(action === 'approve' ? 'Bog\'lanish tasdiqlandi' : 'Bog\'lanish rad etildi');
        } catch (err) {
            console.error(err);
            toast.error('Xatolik yuz berdi');
        } finally {
            setActionLoading(false);
        }
    };

    const handleAction = (id, action) => {
        if (selectedRequest.type === 'link') {
            handleLinkAction(id, action);
        } else {
            handleProfileAction(id, action);
        }
    };

    const filteredRequests = filter === 'all'
        ? requests
        : filter === 'links'
            ? parentLinks
            : requests.filter(req => req.role === filter);

    const container = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: { staggerChildren: 0.1 }
        }
    };

    const item = {
        hidden: { y: 20, opacity: 0 },
        show: { y: 0, opacity: 1 }
    };

    return (
        <div className="space-y-8 animate-fade-in pb-10 max-w-[1600px] mx-auto">
            {/* Header */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/40 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-[500px] h-full bg-gradient-to-l from-indigo-50 to-transparent"></div>
                <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-2">
                        <span className="p-2 bg-indigo-600 text-white rounded-xl">
                            <ShieldCheck size={24} />
                        </span>
                        <h1 className="text-3xl font-black text-slate-900 tracking-tight">
                            Registratsiya va Bogʻlanishlar
                        </h1>
                    </div>
                    <p className="text-slate-500 font-medium ml-1">Yangi arizalarni tasdiqlash yoki rad etish markazi</p>
                </div>

                <div className="relative z-10 flex gap-2 bg-slate-100 p-1.5 rounded-2xl overflow-x-auto">
                    {[
                        { id: 'all', label: 'Barchasi', icon: ListFilter },
                        { id: 'teacher', label: 'Oʻqituvchilar', icon: UserCheck },
                        { id: 'student', label: 'Oʻquvchilar', icon: User },
                        { id: 'parent', label: 'Ota-onalar', icon: Users },
                        { id: 'links', label: 'Bogʻlanishlar', icon: LinkIcon, count: parentLinks.length }
                    ].map((f) => (
                        <button
                            key={f.id}
                            onClick={() => setFilter(f.id)}
                            className={`px-4 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2 whitespace-nowrap ${filter === f.id
                                    ? 'bg-white text-indigo-600 shadow-md shadow-slate-200'
                                    : 'text-slate-500 hover:bg-white/50 hover:text-slate-700'
                                }`}
                        >
                            <f.icon size={16} />
                            {f.label}
                            {f.count > 0 && (
                                <span className={`ml-1 px-1.5 py-0.5 rounded text-[10px] ${filter === f.id ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-200 text-slate-600'
                                    }`}>{f.count}</span>
                            )}
                        </button>
                    ))}
                </div>
            </div>

            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="glass-card h-64 animate-pulse bg-slate-100/50"></div>
                    ))}
                </div>
            ) : filteredRequests.length === 0 && filter !== 'links' ? (
                <div className="glass-card p-16 text-center flex flex-col items-center justify-center">
                    <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-6">
                        <Check size={40} className="text-slate-300" />
                    </div>
                    <h3 className="text-2xl font-black text-slate-900 mb-2">Arizalar mavjud emas</h3>
                    <p className="text-slate-500 font-medium max-w-sm">Hozirda ko'rib chiqish uchun yangi arizalar yo'q.</p>
                </div>
            ) : (
                <motion.div
                    variants={container}
                    initial="hidden"
                    animate="show"
                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                >
                    {/* Render Link Requests if filter is links or all (but logic above handles specific filter) */}
                    {filter === 'links' ? (
                        filteredRequests.map((link) => (
                            <motion.div key={link.id} variants={item} className="glass-card p-6 border border-slate-100 relative group overflow-hidden">
                                <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/10 rounded-bl-[4rem] -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
                                <div className="absolute top-4 right-4 bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider">
                                    Link Request
                                </div>

                                <div className="mb-6 relative z-10">
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 font-bold">
                                            {link.parent?.first_name?.[0]}
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Ota-ona</p>
                                            <h3 className="font-bold text-slate-900">{link.parent?.first_name} {link.parent?.last_name}</h3>
                                        </div>
                                    </div>

                                    <div className="flex justify-center my-2">
                                        <div className="p-1.5 bg-slate-50 rounded-full text-slate-300">
                                            <LinkIcon size={16} />
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold">
                                            {link.student?.first_name?.[0]}
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Farzand</p>
                                            <h3 className="font-bold text-slate-900">{link.student?.first_name} {link.student?.last_name}</h3>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex gap-3 relative z-10">
                                    <button
                                        onClick={() => setSelectedRequest({ ...link, type: 'link', action: 'approve' })}
                                        className="flex-1 py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl shadow-lg shadow-emerald-500/20 transition-all font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-2"
                                    >
                                        <Check size={16} /> Tasdiqlash
                                    </button>
                                    <button
                                        onClick={() => setSelectedRequest({ ...link, type: 'link', action: 'reject' })}
                                        className="flex-1 py-3 bg-white border border-rose-200 text-rose-500 hover:bg-rose-50 rounded-xl transition-all font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-2"
                                    >
                                        <X size={16} /> Rad etish
                                    </button>
                                </div>
                            </motion.div>
                        ))
                    ) : (
                        filteredRequests.map((req) => (
                            <motion.div key={req.id} variants={item} className="glass-card p-6 border border-slate-100 group relative overflow-hidden hover:scale-[1.02] transition-transform duration-300">
                                <div className={`absolute top-0 left-0 w-1 h-full ${req.role === 'teacher' ? 'bg-blue-500' :
                                        req.role === 'student' ? 'bg-emerald-500' : 'bg-purple-500'
                                    }`}></div>

                                <div className="flex justify-between items-start mb-6 pl-4">
                                    <div className="flex items-center gap-4">
                                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-white font-black text-xl shadow-lg ${req.role === 'teacher' ? 'bg-gradient-to-br from-blue-500 to-indigo-600' :
                                                req.role === 'student' ? 'bg-gradient-to-br from-emerald-500 to-teal-600' : 'bg-gradient-to-br from-purple-500 to-violet-600'
                                            }`}>
                                            {req.first_name?.[0]}
                                        </div>
                                        <div>
                                            <h3 className="font-black text-slate-900 text-lg leading-tight">{req.first_name} {req.last_name}</h3>
                                            <span className={`inline-block mt-1 px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest ${req.role === 'teacher' ? 'bg-blue-50 text-blue-600' :
                                                    req.role === 'student' ? 'bg-emerald-50 text-emerald-600' : 'bg-purple-50 text-purple-600'
                                                }`}>
                                                {req.role}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-3 mb-8 pl-4">
                                    <div className="flex items-center gap-3 text-sm font-medium text-slate-600 group-hover:text-slate-900 transition-colors">
                                        <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400 group-hover:text-blue-500 transition-colors">
                                            <Mail size={16} />
                                        </div>
                                        <span>{req.email || 'Email yo\'q'}</span>
                                    </div>
                                    <div className="flex items-center gap-3 text-sm font-medium text-slate-600 group-hover:text-slate-900 transition-colors">
                                        <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400 group-hover:text-blue-500 transition-colors">
                                            <Phone size={16} />
                                        </div>
                                        <span>{req.phone || 'Telefon yo\'q'}</span>
                                    </div>
                                    <div className="flex items-center gap-3 text-sm font-medium text-slate-600 group-hover:text-slate-900 transition-colors">
                                        <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400 group-hover:text-blue-500 transition-colors">
                                            <Calendar size={16} />
                                        </div>
                                        <span>{req.birth_date || 'Nomaʼlum'}</span>
                                    </div>
                                </div>

                                <div className="flex gap-3 pl-4">
                                    <button
                                        onClick={() => setSelectedRequest({ ...req, type: 'profile', action: 'approve' })}
                                        className="flex-1 py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl shadow-lg shadow-slate-900/20 transition-all font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-2"
                                    >
                                        <Check size={16} /> Tasdiqlash
                                    </button>
                                    <button
                                        onClick={() => setSelectedRequest({ ...req, type: 'profile', action: 'reject' })}
                                        className="w-12 h-12 flex items-center justify-center bg-white border border-rose-200 text-rose-500 hover:bg-rose-50 rounded-xl transition-all"
                                        title="Rad etish"
                                    >
                                        <X size={20} />
                                    </button>
                                </div>
                            </motion.div>
                        ))
                    )}
                </motion.div>
            )}

            {/* Premium Modal */}
            <AnimatePresence>
                {selectedRequest && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
                            onClick={() => setSelectedRequest(null)}
                        />
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            className="bg-white rounded-[2rem] p-8 max-w-md w-full shadow-2xl relative z-10"
                        >
                            <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl ${selectedRequest.action === 'approve' ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'}`}>
                                {selectedRequest.action === 'approve' ? <Check size={40} strokeWidth={3} /> : <X size={40} strokeWidth={3} />}
                            </div>

                            <h2 className="text-2xl font-black text-slate-900 text-center mb-2 tracking-tight">
                                {selectedRequest.action === 'approve' ? 'Tasdiqlashni yakunlash' : 'Arizani rad etish'}
                            </h2>
                            <p className="text-slate-500 text-center mb-8 font-medium leading-relaxed">
                                {selectedRequest.type === 'link' ? (
                                    <>
                                        <span className="text-slate-900 font-bold">{selectedRequest.parent?.first_name}</span> va <span className="text-slate-900 font-bold">{selectedRequest.student?.first_name}</span> o'rtasidagi bog'lanishni tasdiqlaysizmi?
                                    </>
                                ) : (
                                    <>
                                        Haqiqatan ham <span className="text-slate-900 font-bold">{selectedRequest.first_name}</span> ismli foydalanuvchini platformaga qo'shmoqchimisiz?
                                    </>
                                )}
                            </p>

                            <div className="mb-8">
                                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 block ml-1">
                                    {selectedRequest.action === 'approve' ? 'Qo\'shimcha izoh (ixtiyoriy)' : 'Rad etish sababi'}
                                </label>
                                <textarea
                                    value={reason}
                                    onChange={(e) => setReason(e.target.value)}
                                    className="w-full px-4 py-3 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500/20 focus:bg-white transition-all resize-none text-slate-700 font-medium"
                                    placeholder={selectedRequest.action === 'approve' ? 'Xush kelibsiz...' : 'Hujjatlardagi xatolik sababli...'}
                                    rows={3}
                                ></textarea>
                            </div>

                            <div className="flex gap-4">
                                <button
                                    onClick={() => { setSelectedRequest(null); setReason(''); }}
                                    className="flex-1 py-4 bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-xl transition-all font-bold text-xs uppercase tracking-widest"
                                >
                                    Bekor qilish
                                </button>
                                <button
                                    onClick={() => handleAction(selectedRequest.id, selectedRequest.action)}
                                    disabled={actionLoading}
                                    className={`flex-1 py-4 text-white rounded-xl shadow-lg transition-all font-bold text-xs uppercase tracking-widest ${selectedRequest.action === 'approve'
                                        ? 'bg-emerald-500 hover:bg-emerald-600 shadow-emerald-500/30'
                                        : 'bg-rose-500 hover:bg-rose-600 shadow-rose-500/30'
                                        } ${actionLoading ? 'opacity-70 cursor-wait' : ''}`}
                                >
                                    {actionLoading ? 'Bajarilmoqda...' : (selectedRequest.action === 'approve' ? 'Tasdiqlash' : 'Rad etish')}
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default RegistrationRequests;
