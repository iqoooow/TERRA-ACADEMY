import React, { useState, useEffect } from 'react';
import { Check, X, User, Phone, Calendar, Mail, Filter, MessageSquare } from 'lucide-react';

const RegistrationRequests = () => {
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');
    const [error, setError] = useState('');
    const [selectedUser, setSelectedUser] = useState(null);
    const [actionLoading, setActionLoading] = useState(false);
    const [reason, setReason] = useState('');

    const fetchRequests = async () => {
        setLoading(true);
        try {
            const { supabase } = await import('../../lib/supabase');
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('status', 'pending');

            if (error) throw error;
            setRequests(data || []);
        } catch (err) {
            console.error(err);
            setError('Arizalarni yuklashda xatolik yuz berdi');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRequests();
    }, []);

    const handleAction = async (userId, action) => {
        setActionLoading(true);
        try {
            const { supabase } = await import('../../lib/supabase');
            // Optimistic update logic or just fetch again
            const status = action === 'approve' ? 'approved' : 'rejected';

            const { error } = await supabase
                .from('profiles')
                .update({ status: status })
                .eq('id', userId);

            if (error) throw error;

            setRequests(requests.filter(req => req.id !== userId));
            setSelectedUser(null);
            setReason('');
        } catch (err) {
            console.error(err);
            alert('Xatolik yuz berdi');
        } finally {
            setActionLoading(false);
        }
    };

    const filteredRequests = filter === 'all'
        ? requests
        : requests.filter(req => req.role === filter);

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Registratsiya arizalari</h1>
                    <p className="text-gray-500">Yangi foydalanuvchilarni tasdiqlash yoki rad etish</p>
                </div>

                <div className="flex items-center gap-2 bg-white p-1 rounded-xl shadow-sm border border-gray-100">
                    <button
                        onClick={() => setFilter('all')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${filter === 'all' ? 'bg-blue-600 text-white shadow-md' : 'text-gray-500 hover:bg-gray-50'}`}
                    >
                        Barchasi
                    </button>
                    <button
                        onClick={() => setFilter('teacher')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${filter === 'teacher' ? 'bg-blue-600 text-white shadow-md' : 'text-gray-500 hover:bg-gray-50'}`}
                    >
                        Oʻqituvchilar
                    </button>
                    <button
                        onClick={() => setFilter('student')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${filter === 'student' ? 'bg-blue-600 text-white shadow-md' : 'text-gray-500 hover:bg-gray-50'}`}
                    >
                        Oʻquvchilar
                    </button>
                    <button
                        onClick={() => setFilter('parent')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${filter === 'parent' ? 'bg-blue-600 text-white shadow-md' : 'text-gray-500 hover:bg-gray-50'}`}
                    >
                        Ota-onalar
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
                    <p className="text-gray-500">Barcha yangi foydalanuvchilar koʻrib chiqilgan</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in-up">
                    {filteredRequests.map((req) => (
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
                                    onClick={() => setSelectedUser({ ...req, action: 'approve' })}
                                    className="flex-1 py-2.5 bg-green-500 hover:bg-green-600 text-white rounded-xl shadow-lg shadow-green-500/20 transition-all font-bold text-sm flex items-center justify-center gap-2"
                                >
                                    <Check size={18} /> Approve
                                </button>
                                <button
                                    onClick={() => setSelectedUser({ ...req, action: 'reject' })}
                                    className="flex-1 py-2.5 bg-red-500 hover:bg-red-600 text-white rounded-xl shadow-lg shadow-red-500/20 transition-all font-bold text-sm flex items-center justify-center gap-2"
                                >
                                    <X size={18} /> Reject
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Modal for confirmation and reason */}
            {selectedUser && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm animate-fade-in">
                    <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl animate-scale-in">
                        <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6 ${selectedUser.action === 'approve' ? 'bg-green-50' : 'bg-red-50'}`}>
                            {selectedUser.action === 'approve' ? <Check className="text-green-500" size={32} /> : <X className="text-red-500" size={32} />}
                        </div>

                        <h2 className="text-2xl font-bold text-gray-800 text-center mb-2">
                            {selectedUser.action === 'approve' ? 'Tasdiqlash' : 'Rad etish'}
                        </h2>
                        <p className="text-gray-500 text-center mb-6">
                            <span className="font-bold text-gray-700">{selectedUser.first_name} {selectedUser.last_name}</span> arizasini {selectedUser.action === 'approve' ? 'tasdiqlamoqchimisiz?' : 'rad etmoqchimisiz?'}
                        </p>

                        <div className="mb-8">
                            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                                <MessageSquare size={16} className="text-gray-400" /> {selectedUser.action === 'approve' ? 'Izoh (ixtiyoriy)' : 'Rad etish sababi'}
                            </label>
                            <textarea
                                value={reason}
                                onChange={(e) => setReason(e.target.value)}
                                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all resize-none"
                                placeholder={selectedUser.action === 'approve' ? 'Tabriklaymiz...' : 'Hujjatlar notoʻgʻri...'}
                                rows={3}
                            ></textarea>
                        </div>

                        <div className="flex gap-4">
                            <button
                                onClick={() => { setSelectedUser(null); setReason(''); }}
                                className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-2xl transition-all font-bold"
                            >
                                Bekor qilish
                            </button>
                            <button
                                onClick={() => handleAction(selectedUser.id, selectedUser.action)}
                                disabled={actionLoading}
                                className={`flex-1 py-3 text-white rounded-2xl shadow-lg transition-all font-bold ${selectedUser.action === 'approve'
                                    ? 'bg-green-500 hover:bg-green-600 shadow-green-500/30'
                                    : 'bg-red-500 hover:bg-red-600 shadow-red-500/30'
                                    } ${actionLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                            >
                                {actionLoading ? 'Kutilmoqda...' : (selectedUser.action === 'approve' ? 'Tasdiqlash' : 'Rad etish')}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default RegistrationRequests;
