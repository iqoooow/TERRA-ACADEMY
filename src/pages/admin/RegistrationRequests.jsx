import { useState, useEffect } from 'react';
import { X, User, Phone, ShieldCheck, UserCheck, Users, Link as RLink, CheckCircle, Clock, FileText, Download } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../../lib/supabase';
import { toast } from 'react-hot-toast';
import Table, { TableRow, TableCell } from '../../components/ui/Table';
import StatsCard from '../../components/ui/StatsCard';
import EmptyState from '../../components/ui/EmptyState';

const RegistrationRequests = () => {
    const [requests, setRequests] = useState([]);
    const [parentLinks, setParentLinks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all'); // 'all', 'teacher', 'student', 'parent', 'links'
    const [selectedRequest, setSelectedRequest] = useState(null);
    const [actionLoading, setActionLoading] = useState(false);

    const handleExport = () => {
        const data = filter === 'links' ? parentLinks : filteredRequests;
        if (!data.length) return toast.error("Eksport qilish uchun ma'lumot yo'q");

        const escapeCSV = (val) => {
            if (val === null || val === undefined) return '';
            const str = String(val);
            return str.includes(',') || str.includes('"') || str.includes('\n')
                ? `"${str.replace(/"/g, '""')}"` : str;
        };

        let csvContent;
        if (filter === 'links') {
            const headers = ['Ota-ona', 'Farzand', 'Farzand kodi', 'Sana'];
            const rows = data.map(l => [
                `${l.parent?.first_name || ''} ${l.parent?.last_name || ''}`.trim(),
                `${l.student?.first_name || ''} ${l.student?.last_name || ''}`.trim(),
                l.student?.student_code || '',
                new Date(l.created_at).toLocaleDateString()
            ]);
            csvContent = headers.map(escapeCSV).join(',') + '\n' + rows.map(r => r.map(escapeCSV).join(',')).join('\n');
        } else {
            const headers = ['Ism', 'Familya', 'Rol', 'Email', 'Telefon', 'Sana'];
            const rows = data.map(r => [r.first_name, r.last_name, r.role, r.email, r.phone, new Date(r.created_at).toLocaleDateString()]);
            csvContent = headers.map(escapeCSV).join(',') + '\n' + rows.map(r => r.map(escapeCSV).join(',')).join('\n');
        }

        const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `arizalar_${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        toast.success('Hisobot yuklab olindi');
    };

    const fetchData = async () => {
        setLoading(true);
        try {
            const { data: apps, error: appError } = await supabase
                .from('applications')
                .select('*')
                .eq('status', 'pending')
                .order('created_at', { ascending: false });

            if (appError) throw appError;
            setRequests(apps || []);

            try {
                const { data: links, error: linkError } = await supabase
                    .from('parent_student')
                    .select(`
                        *,
                        parent:parent_id(id, first_name, last_name, phone),
                        student:student_id(id, first_name, last_name, student_code)
                    `)
                    .eq('status', 'pending');

                if (!linkError) {
                    setParentLinks(links || []);
                }
            } catch {
                setParentLinks([]);
            }

        } catch (err) {
            console.error('RegistrationRequests fetchData error:', err);
            toast.error("Ma'lumotlarni yuklashda xatolik");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
        const channel = supabase.channel('requests-realtime')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'applications' }, () => fetchData())
            .on('postgres_changes', { event: '*', schema: 'public', table: 'parent_student' }, () => fetchData())
            .subscribe();
        return () => supabase.removeChannel(channel);
    }, []);

    // Generate unique STU-XXXXXX code for students
    const generateStudentCode = () => {
        const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
        let code = 'STU-';
        for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
        return code;
    };

    const handleProfileAction = async (application, action) => {
        setActionLoading(true);
        try {
            if (action === 'approve') {
                // For students: auto-generate unique student code
                const studentCode = application.role === 'student'
                    ? generateStudentCode()
                    : application.student_code;

                const { error: profileError } = await supabase
                    .from('profiles')
                    .upsert({
                        id: application.id,
                        role: application.role,
                        full_name: application.full_name,
                        first_name: application.first_name,
                        last_name: application.last_name,
                        phone: application.phone,
                        birth_date: application.birth_date,
                        status: 'approved',
                        student_code: studentCode
                    }, { onConflict: 'id' });

                if (profileError) throw profileError;

                const { error: appError } = await supabase
                    .from('applications')
                    .update({ status: 'approved' })
                    .eq('id', application.id);

                if (appError) throw appError;

                // For parents: parse student codes and create pending parent_student links
                if (application.role === 'parent' && application.student_code) {
                    let entries = [];
                    try {
                        const parsed = JSON.parse(application.student_code);
                        if (Array.isArray(parsed)) {
                            entries = parsed.map(e =>
                                typeof e === 'string' ? { code: e, type: 'guardian' } : e
                            );
                        } else {
                            entries = [{ code: application.student_code, type: 'guardian' }];
                        }
                    } catch {
                        entries = [{ code: application.student_code, type: 'guardian' }];
                    }

                    for (const entry of entries.filter(e => e.code)) {
                        const { data: student } = await supabase
                            .from('profiles')
                            .select('id')
                            .eq('student_code', entry.code)
                            .eq('role', 'student')
                            .single();

                        if (student) {
                            await supabase.from('parent_student').upsert({
                                parent_id: application.id,
                                student_id: student.id,
                                status: 'pending',
                                relationship_type: entry.type || 'guardian',
                            }, { onConflict: 'parent_id,student_id', ignoreDuplicates: true });
                        }
                    }
                }

                toast.success('Foydalanuvchi tasdiqlandi');
            } else {
                const { error: appError } = await supabase
                    .from('applications')
                    .update({ status: 'rejected' })
                    .eq('id', application.id);
                if (appError) throw appError;
                toast.success('Foydalanuvchi rad etildi');
            }
            setSelectedRequest(null);
            fetchData();
        } catch (err) {
            toast.error('Xatolik: ' + err.message);
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
            toast.success(action === 'approve' ? 'Bog\'lanish tasdiqlandi' : 'Bog\'lanish rad etildi');
            setSelectedRequest(null);
            fetchData();
        } catch (err) {
            toast.error('Xatolik yuz berdi');
        } finally {
            setActionLoading(false);
        }
    };

    const handleAction = (id, action) => {
        if (selectedRequest.type === 'link') {
            handleLinkAction(id, action);
        } else {
            handleProfileAction(selectedRequest, action);
        }
    };

    const filteredRequests = filter === 'all'
        ? requests
        : filter === 'links'
            ? parentLinks
            : requests.filter(req => req.role === filter);

    const getRoleBadge = (role) => {
        switch (role) {
            case 'teacher': return 'bg-purple-100 text-purple-700 border-purple-200';
            case 'student': return 'bg-blue-100 text-blue-700 border-blue-200';
            case 'parent': return 'bg-orange-100 text-orange-700 border-orange-200';
            default: return 'bg-slate-100 text-slate-700 border-slate-200';
        }
    };

    return (
        <div className="space-y-8 animate-fade-in max-w-[1600px] mx-auto pb-10">
            {/* Intelligence Header */}
            <div className="relative group overflow-hidden rounded-[2.5rem] bg-slate-900 shadow-2xl">
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-600 via-violet-600 to-slate-900 opacity-90 group-hover:scale-105 transition-transform duration-1000"></div>
                <div className="absolute inset-0 opacity-20 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] blend-overlay"></div>

                <div className="relative z-10 p-8 md:p-12 flex flex-col md:flex-row md:items-center justify-between gap-8">
                    <div>
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 rounded-full text-[10px] font-black uppercase tracking-widest mb-4 backdrop-blur-md border border-white/10 text-indigo-200 shadow-inner"
                        >
                            <ShieldCheck size={12} className="text-emerald-400" />
                            Xavfsizlik va Verifikatsiya
                        </motion.div>
                        <h1 className="text-3xl md:text-5xl font-black text-white tracking-tight mb-3 italic">
                            Arizalar <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-200 to-violet-100 not-italic">Markazi</span>
                        </h1>
                        <p className="text-indigo-100/80 font-medium text-lg max-w-xl leading-relaxed">
                            Yangi foydalanuvchilarni tasdiqlash va ota-ona-bola bog'lanishlarini boshqarish.
                        </p>
                    </div>
                </div>
            </div>

            {/* Matrix Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <StatsCard title="Jami Arizalar" value={requests.length} icon={FileText} color="indigo" trend="Kutmoqda" />
                <StatsCard title="O'qituvchilar" value={requests.filter(r => r.role === 'teacher').length} icon={UserCheck} color="purple" trend="Verify" />
                <StatsCard title="O'quvchilar" value={requests.filter(r => r.role === 'student').length} icon={Users} color="blue" trend="Review" />
                <StatsCard title="Bog'lanishlar" value={parentLinks.length} icon={RLink} color="amber" trend="Pending" />
            </div>

            {/* Controls Bar & Filter */}
            <div className="glass-card p-2 flex flex-col md:flex-row md:items-center justify-between gap-4 sticky top-24 z-30">
                <div className="flex bg-slate-100 p-1 rounded-2xl overflow-x-auto no-scrollbar">
                    {[
                        { id: 'all', label: 'Barchasi', icon: CheckCircle, count: requests.length },
                        { id: 'teacher', label: 'Oʻqituvchilar', icon: UserCheck, count: requests.filter(r => r.role === 'teacher').length },
                        { id: 'student', label: 'Oʻquvchilar', icon: User, count: requests.filter(r => r.role === 'student').length },
                        { id: 'parent', label: 'Ota-onalar', icon: Users, count: requests.filter(r => r.role === 'parent').length },
                        { id: 'links', label: 'Bogʻlanishlar', icon: RLink, count: parentLinks.length }
                    ].map((f) => (
                        <button
                            key={f.id}
                            onClick={() => setFilter(f.id)}
                            className={`flex items-center gap-3 px-6 py-2.5 rounded-xl transition-all duration-500 whitespace-nowrap ${filter === f.id
                                ? 'bg-white text-indigo-600 shadow-xl shadow-indigo-500/10 scale-105'
                                : 'text-slate-500 hover:text-indigo-600 hover:bg-white/50'
                                }`}
                        >
                            <f.icon size={16} className={filter === f.id ? 'text-indigo-600' : 'text-slate-400'} />
                            <span className="text-[10px] font-black uppercase tracking-widest">{f.label}</span>
                            {f.count > 0 && (
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${filter === f.id ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-200 text-slate-500 text-opacity-70'}`}>
                                    {f.count}
                                </span>
                            )}
                        </button>
                    ))}
                </div>

                <div className="flex gap-2 p-1">
                    <button
                        onClick={handleExport}
                        className="flex items-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-xl hover:bg-slate-800 transition-all font-black text-[10px] uppercase tracking-widest shadow-lg shadow-slate-900/20 active:scale-95"
                    >
                        <Download size={16} />
                        Eksport
                    </button>
                </div>
            </div>

            {loading ? (
                <div className="flex flex-col items-center justify-center py-40 space-y-4">
                    <div className="w-12 h-12 border-4 border-indigo-600/20 border-t-indigo-600 rounded-full animate-spin"></div>
                    <p className="text-slate-400 font-bold uppercase tracking-[0.2em] text-[10px] animate-pulse">Arizalar yuklanmoqda...</p>
                </div>
            ) : filteredRequests.length === 0 ? (
                <EmptyState
                    icon={CheckCircle}
                    title="Yangi arizalar yo'q"
                    description="Hozirda barcha so'rovlar ko'rib chiqilgan. Hammasi a'lo darajada!"
                />
            ) : (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="pt-4"
                >
                    <Table headers={filter === 'links' ? ['Ota-ona', 'Farzand', 'Status', 'Amallar'] : ['Foydalanuvchi', 'Rol', 'Aloqa', 'Amallar']}>
                        {filteredRequests.map((req) => (
                            <TableRow key={req.id} className="group cursor-default">
                                <TableCell>
                                    <div className="flex items-center gap-4">
                                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white font-black text-lg shadow-lg ${filter === 'links' ? 'bg-gradient-to-br from-orange-400 to-amber-600' :
                                            req.role === 'teacher' ? 'bg-gradient-to-br from-purple-500 to-fuchsia-600' :
                                                req.role === 'student' ? 'bg-gradient-to-br from-blue-500 to-indigo-600' :
                                                    'bg-gradient-to-br from-orange-500 to-amber-600'
                                            }`}>
                                            {(filter === 'links' ? req.parent?.first_name : req.first_name)?.[0]?.toUpperCase()}
                                        </div>
                                        <div>
                                            <div className="font-bold text-slate-900">
                                                {filter === 'links' ? `${req.parent?.first_name} ${req.parent?.last_name}` : `${req.first_name} ${req.last_name}`}
                                            </div>
                                            <div className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-0.5">
                                                {filter === 'links' ? 'Ota-ona (Link Request)' : req.email}
                                            </div>
                                        </div>
                                    </div>
                                </TableCell>

                                <TableCell>
                                    {filter === 'links' ? (
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600 font-black text-xs">
                                                {req.student?.first_name?.[0]}
                                            </div>
                                            <div>
                                                <div className="text-xs font-bold text-slate-700">{req.student?.first_name} {req.student?.last_name}</div>
                                                <div className="text-[9px] text-blue-500 font-black uppercase tracking-wider">#{req.student?.student_code}</div>
                                            </div>
                                        </div>
                                    ) : (
                                        <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border ${getRoleBadge(req.role)}`}>
                                            {req.role}
                                        </span>
                                    )}
                                </TableCell>

                                <TableCell>
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-2 text-xs font-medium text-slate-600">
                                            <Phone size={12} className="text-slate-400" />
                                            {filter === 'links' ? req.parent?.phone : req.phone}
                                        </div>
                                        <div className="flex items-center gap-2 text-[10px] text-slate-400 font-bold">
                                            <Clock size={10} />
                                            {new Date(req.created_at).toLocaleDateString()}
                                        </div>
                                    </div>
                                </TableCell>

                                <TableCell>
                                    <div className="flex items-center gap-3">
                                        <button
                                            onClick={() => setSelectedRequest({ ...req, type: filter === 'links' ? 'link' : 'profile', action: 'approve' })}
                                            className="px-4 py-2 bg-emerald-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-600 hover:scale-105 transition-all shadow-lg shadow-emerald-500/20"
                                        >
                                            Tasdiqlash
                                        </button>
                                        <button
                                            onClick={() => setSelectedRequest({ ...req, type: filter === 'links' ? 'link' : 'profile', action: 'reject' })}
                                            className="p-2 bg-rose-50 text-rose-500 rounded-xl hover:bg-rose-500 hover:text-white transition-all hover:rotate-90"
                                            title="Rad etish"
                                        >
                                            <X size={16} />
                                        </button>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))}
                    </Table>
                </motion.div>
            )}

            {/* Premium Confirmation Modal */}
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
                            className="bg-white rounded-[3rem] p-10 max-w-md w-full shadow-2xl relative z-10 border border-white/20"
                        >
                            <div className={`w-24 h-24 rounded-[2rem] flex items-center justify-center mx-auto mb-8 shadow-2xl ${selectedRequest.action === 'approve' ? 'bg-emerald-500 text-white shadow-emerald-200' : 'bg-rose-500 text-white shadow-rose-200'
                                }`}>
                                {selectedRequest.action === 'approve' ? <CheckCircle size={48} /> : <X size={48} />}
                            </div>

                            <h2 className="text-3xl font-black text-slate-900 text-center mb-2 tracking-tight">
                                {selectedRequest.action === 'approve' ? 'Tasdiqlaysizmi?' : 'Rad etasizmi?'}
                            </h2>
                            <p className="text-slate-500 text-center mb-8 font-medium leading-relaxed">
                                {selectedRequest.type === 'link' ? (
                                    <>
                                        <span className="text-slate-900 font-bold">{selectedRequest.parent?.first_name}</span> va <span className="text-slate-900 font-bold">{selectedRequest.student?.first_name}</span> o'rtasidagi bog'lanishni qayta ishlaymiz.
                                    </>
                                ) : (
                                    <>
                                        <span className="text-slate-900 font-bold">{selectedRequest.first_name}</span> ismli foydalanuvchiga platforma uchun ruxsat beramiz.
                                    </>
                                )}
                            </p>

                            <div className="flex gap-4 pt-4">
                                <button
                                    onClick={() => setSelectedRequest(null)}
                                    className="flex-1 py-4 bg-slate-100 text-slate-400 hover:bg-slate-200 hover:text-slate-600 rounded-2xl transition-all font-black text-[10px] uppercase tracking-widest"
                                >
                                    Bekor qilish
                                </button>
                                <button
                                    onClick={() => handleAction(selectedRequest.id, selectedRequest.action)}
                                    disabled={actionLoading}
                                    className={`flex-1 py-4 text-white rounded-2xl shadow-xl transition-all font-black text-[10px] uppercase tracking-widest ${selectedRequest.action === 'approve' ? 'bg-emerald-500 hover:bg-emerald-600 shadow-emerald-500/30' : 'bg-rose-500 hover:bg-rose-600 shadow-rose-500/30'
                                        } ${actionLoading ? 'opacity-70 cursor-wait' : ''}`}
                                >
                                    {actionLoading ? 'Kutilmoqda...' : 'Tasdiqlash'}
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

