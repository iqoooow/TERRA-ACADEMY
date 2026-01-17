import React, { useState, useEffect } from 'react';
import { Check, X, User, Phone, Calendar, Mail, Filter, MessageSquare } from 'lucide-react';

const RegistrationRequests = () => {
    const [requests, setRequests] = useState([]);
    const [parentLinks, setParentLinks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all'); // 'all', 'teacher', 'student', 'parent', 'links'
    const [error, setError] = useState('');
    const [selectedRequest, setSelectedRequest] = useState(null);
    const [actionLoading, setActionLoading] = useState(false);
    const [reason, setReason] = useState('');

    const fetchData = async () => {
        setLoading(true);
        try {
            const { supabase } = await import('../../lib/supabase');

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
            console.log('Fetched parent links:', links);
            setParentLinks(links || []);

        } catch (err) {
            console.error('RegistrationRequests fetchData error:', err);
            setError('Ma’lumotlarni yuklashda xatolik yuz berdi: ' + err.message);
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
            const { supabase } = await import('../../lib/supabase');
            const status = action === 'approve' ? 'approved' : 'rejected';

            const { data, error } = await supabase
                .from('profiles')
                .update({ status: status })
                .eq('id', userId)
                .select();

            if (error) throw error;

            setRequests(requests.filter(req => req.id !== userId));
            setSelectedRequest(null);
            setReason('');
        } catch (err) {
            console.error(err);
            alert('Xatolik yuz berdi: ' + err.message);
        } finally {
            setActionLoading(false);
        }
    };

    const handleLinkAction = async (linkId, action) => {
        setActionLoading(true);
        try {
            const { supabase } = await import('../../lib/supabase');
            const status = action === 'approve' ? 'approved' : 'rejected';

            const { error } = await supabase
                .from('parent_student')
                .update({ status: status })
                .eq('id', linkId);

            if (error) throw error;

            setParentLinks(parentLinks.filter(link => link.id !== linkId));
            setSelectedRequest(null);
            setReason('');
        } catch (err) {
            console.error(err);
            alert('Xatolik yuz berdi: ' + err.message);
        } finally {
            setActionLoading(false);
        }
    };

    const handleAction = (id, action) => {
        if (filter === 'links') {
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

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Registratsiya va Bogʻlanishlar</h1>
                    <p className="text-gray-500">Yangi arizalarni tasdiqlash yoki rad etish</p>
                </div>

                <div className="flex items-center gap-2 bg-white p-1 rounded-xl shadow-sm border border-gray-100 overflow-x-auto">
                    <button
                        onClick={() => setFilter('all')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${filter === 'all' ? 'bg-blue-600 text-white shadow-md' : 'text-gray-500 hover:bg-gray-50'}`}
                    >
                        Barchasi
                    </button>
                    <button
                        onClick={() => setFilter('teacher')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${filter === 'teacher' ? 'bg-blue-600 text-white shadow-md' : 'text-gray-500 hover:bg-gray-50'}`}
                    >
                        Oʻqituvchilar
                    </button>
                    <button
                        onClick={() => setFilter('student')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${filter === 'student' ? 'bg-blue-600 text-white shadow-md' : 'text-gray-500 hover:bg-gray-50'}`}
                    >
                        Oʻquvchilar
                    </button>
                    <button
                        onClick={() => setFilter('parent')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${filter === 'parent' ? 'bg-blue-600 text-white shadow-md' : 'text-gray-500 hover:bg-gray-50'}`}
                    >
                        Ota-onalar
                    </button>
                    <div className="w-px h-6 bg-gray-200 mx-1"></div>
                    <button
                        onClick={() => setFilter('links')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${filter === 'links' ? 'bg-purple-600 text-white shadow-md' : 'text-gray-500 hover:bg-gray-50'}`}
                    >
                        Farzand bogʻlash <span className="ml-1 px-1.5 py-0.5 bg-white/20 rounded text-[10px]">{parentLinks.length}</span>
                    </button>
                </div>
            </div>

            {loading ? (
                <div className="bg-white rounded-2xl p-12 text-center border border-gray-100 shadow-sm transition-all animate-pulse">
                    <div className="w-12 h-12 bg-gray-200 rounded-full mx-auto mb-4"></div>
                    <div className="h-4 w-48 bg-gray-200 mx-auto rounded"></div>
                </div>
            ) : filteredRequests.length === 0 ? (
                <div className="bg-white rounded-2xl p-12 text-center border border-gray-100 shadow-sm transition-all">
                    <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
                        <User className="text-blue-500" size={32} />
                    </div>
                    <h3 className="text-lg font-bold text-gray-800">Hozircha arizalar yoʻq</h3>
                    <p className="text-gray-500">Barcha yangi foydalanuvchilar va bogʻlanishlar koʻrib chiqilgan</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in-up">
                    {filter === 'links' ? (
                        filteredRequests.map((link) => (
                            <div key={link.id} className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-xl transition-all group relative">
                                <div className="absolute top-4 right-4">
                                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full bg-purple-50 text-purple-600">
                                        Link Request
                                    </span>
                                </div>

                                <div className="mb-6">
                                    <p className="text-xs text-gray-400 uppercase font-bold mb-2">Ota-ona</p>
                                    <h3 className="font-bold text-gray-800">{link.parent?.first_name} {link.parent?.last_name}</h3>
                                    <p className="text-sm text-gray-500">{link.parent?.email}</p>
                                </div>

                                <div className="flex items-center justify-center py-2 mb-4 bg-gray-50 rounded-xl">
                                    <Users size={20} className="text-gray-300" />
                                </div>

                                <div className="mb-8">
                                    <p className="text-xs text-gray-400 uppercase font-bold mb-2">Oʻquvchi (Farzand)</p>
                                    <h3 className="font-bold text-gray-800">{link.student?.first_name} {link.student?.last_name}</h3>
                                    <p className="text-sm font-mono text-blue-600 font-bold">{link.student?.student_code}</p>
                                </div>

                                <div className="flex gap-3">
                                    <button
                                        onClick={() => setSelectedRequest({ ...link, type: 'link', action: 'approve' })}
                                        className="flex-1 py-2.5 bg-green-500 hover:bg-green-600 text-white rounded-xl shadow-lg shadow-green-500/20 transition-all font-bold text-sm flex items-center justify-center gap-2"
                                    >
                                        <Check size={18} /> Tasdiqlash
                                    </button>
                                    <button
                                        onClick={() => setSelectedRequest({ ...link, type: 'link', action: 'reject' })}
                                        className="flex-1 py-2.5 bg-red-500 hover:bg-red-600 text-white rounded-xl shadow-lg shadow-red-500/20 transition-all font-bold text-sm flex items-center justify-center gap-2"
                                    >
                                        <X size={18} /> Rad etish
                                    </button>
                                </div>
                            </div>
                        ))
                    ) : (
                        filteredRequests.map((req) => (
                            <div key={req.id} className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-xl hover:shadow-blue-500/5 transition-all group overflow-hidden relative">
                                <div className="absolute top-0 right-0 p-4">
                                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full ${req.role === 'teacher' ? 'bg-blue-50 text-blue-600' :
                                        req.role === 'student' ? 'bg-green-50 text-green-600' : 'bg-purple-50 text-purple-600'
                                        }`}>
                                        {req.role}
                                    </span>
                                </div>

                                <div className="flex items-center gap-4 mb-6">
                                    <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-blue-500 to-indigo-500 flex items-center justify-center text-white font-bold text-lg">
                                        {req.first_name?.[0]}
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-gray-800 text-lg leading-tight">{req.first_name} {req.last_name}</h3>
                                        <p className="text-sm text-gray-400">Yangi ariza</p>
                                    </div>
                                </div>

                                <div className="space-y-3 mb-8">
                                    <div className="flex items-center gap-3 text-sm text-gray-600">
                                        <Mail size={16} className="text-gray-400" />
                                        <span>{req.email}</span>
                                    </div>
                                    <div className="flex items-center gap-3 text-sm text-gray-600">
                                        <Phone size={16} className="text-gray-400" />
                                        <span>{req.phone}</span>
                                    </div>
                                    <div className="flex items-center gap-3 text-sm text-gray-600">
                                        <Calendar size={16} className="text-gray-400" />
                                        <span>{req.birth_date || 'Nomaʼlum'}</span>
                                    </div>
                                </div>

                                <div className="flex gap-3">
                                    <button
                                        onClick={() => setSelectedRequest({ ...req, type: 'profile', action: 'approve' })}
                                        className="flex-1 py-2.5 bg-green-500 hover:bg-green-600 text-white rounded-xl shadow-lg shadow-green-500/20 transition-all font-bold text-sm flex items-center justify-center gap-2"
                                    >
                                        <Check size={18} /> Approve
                                    </button>
                                    <button
                                        onClick={() => setSelectedRequest({ ...req, type: 'profile', action: 'reject' })}
                                        className="flex-1 py-2.5 bg-red-500 hover:bg-red-600 text-white rounded-xl shadow-lg shadow-red-500/20 transition-all font-bold text-sm flex items-center justify-center gap-2"
                                    >
                                        <X size={18} /> Reject
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}

            {/* Modal for confirmation and reason */}
            {selectedRequest && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm animate-fade-in">
                    <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl animate-scale-in">
                        <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6 ${selectedRequest.action === 'approve' ? 'bg-green-50' : 'bg-red-50'}`}>
                            {selectedRequest.action === 'approve' ? <Check className="text-green-500" size={32} /> : <X className="text-red-500" size={32} />}
                        </div>

                        <h2 className="text-2xl font-bold text-gray-800 text-center mb-2">
                            {selectedRequest.action === 'approve' ? 'Tasdiqlash' : 'Rad etish'}
                        </h2>
                        <p className="text-gray-500 text-center mb-6">
                            {selectedRequest.type === 'link' ? (
                                <>
                                    <span className="font-bold text-gray-700">{selectedRequest.parent?.first_name}</span> va <span className="font-bold text-gray-700">{selectedRequest.student?.first_name}</span> bogʻlanishini {selectedRequest.action === 'approve' ? 'tasdiqlamoqchimisiz?' : 'rad etmoqchimisiz?'}
                                </>
                            ) : (
                                <>
                                    <span className="font-bold text-gray-700">{selectedRequest.first_name} {selectedRequest.last_name}</span> arizasini {selectedRequest.action === 'approve' ? 'tasdiqlamoqchimisiz?' : 'rad etmoqchimisiz?'}
                                </>
                            )}
                        </p>

                        <div className="mb-8">
                            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                                <MessageSquare size={16} className="text-gray-400" /> {selectedRequest.action === 'approve' ? 'Izoh (ixtiyoriy)' : 'Rad etish sababi'}
                            </label>
                            <textarea
                                value={reason}
                                onChange={(e) => setReason(e.target.value)}
                                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all resize-none"
                                placeholder={selectedRequest.action === 'approve' ? 'Tabriklaymiz...' : 'Hujjatlar notoʻgʻri...'}
                                rows={3}
                            ></textarea>
                        </div>

                        <div className="flex gap-4">
                            <button
                                onClick={() => { setSelectedRequest(null); setReason(''); }}
                                className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-2xl transition-all font-bold"
                            >
                                Bekor qilish
                            </button>
                            <button
                                onClick={() => handleAction(selectedRequest.id, selectedRequest.action)}
                                disabled={actionLoading}
                                className={`flex-1 py-3 text-white rounded-2xl shadow-lg transition-all font-bold ${selectedRequest.action === 'approve'
                                    ? 'bg-green-500 hover:bg-green-600 shadow-green-500/30'
                                    : 'bg-red-500 hover:bg-red-600 shadow-red-500/30'
                                    } ${actionLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                            >
                                {actionLoading ? 'Kutilmoqda...' : (selectedRequest.action === 'approve' ? 'Tasdiqlash' : 'Rad etish')}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default RegistrationRequests;
