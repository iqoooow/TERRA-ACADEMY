import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Users, GraduationCap, CreditCard, Activity, Download, Calendar, UserPlus, DollarSign, Plus, Shield, CheckCircle2, Clock, AlertTriangle, X } from 'lucide-react';
import StatsCard from '../../components/ui/StatsCard';
import { supabase } from '../../lib/supabase';
import toast from 'react-hot-toast';
import {
    AreaChart,
    Area,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer
} from 'recharts';
import { motion } from 'framer-motion';
import ModalPortal from '../../components/common/ModalPortal';
import { format, subMonths, startOfMonth, endOfMonth } from 'date-fns';
import { uz } from 'date-fns/locale';

// Custom bar shape: reads `fill` from the data payload, replaces deprecated <Cell>
const ColoredBar = ({ x, y, width, height, fill }) => {
    if (!width || height <= 0) return null;
    return <rect x={x} y={y} rx={6} ry={6} width={width} height={height} fill={fill || '#D1FAE5'} />;
};

const AdminDashboard = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const adminName = user?.first_name || user?.name?.split(' ')[0] || 'Admin';
    const [stats, setStats] = useState([
        { title: "O'quvchilar", value: '...', change: '...', icon: GraduationCap, color: 'blue' },
        { title: "O'qituvchilar", value: '...', change: '...', icon: Users, color: 'purple' },
        { title: 'Tushum (Oy)', value: '...', change: '...', icon: CreditCard, color: 'green' },
        { title: 'Guruhlar', value: '...', change: '...', icon: Activity, color: 'orange' },
    ]);
    const [enrollmentData, setEnrollmentData] = useState([]);
    const [financialData, setFinancialData] = useState([]);
    const [recentUsers, setRecentUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showChangelog, setShowChangelog] = useState(false);
    const [exporting, setExporting] = useState(false);

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        try {
            const sixMonthsAgo = format(startOfMonth(subMonths(new Date(), 5)), "yyyy-MM-dd'T'00:00:00");
            const currentMonthStart = format(startOfMonth(new Date()), 'yyyy-MM-dd');
            const currentMonthEnd = format(endOfMonth(new Date()), 'yyyy-MM-dd');

            // 5 parallel queries instead of 17
            const [profilesRes, groupCountRes, txsAllRes, recentUsersRes] = await Promise.all([
                supabase.from('profiles').select('role, created_at').in('role', ['student', 'teacher']),
                supabase.from('groups').select('*', { count: 'exact', head: true }),
                supabase.from('payment_transactions').select('amount, created_at').gte('created_at', sixMonthsAgo),
                supabase.from('profiles').select('id, full_name, role, status, created_at').order('created_at', { ascending: false }).limit(5),
            ]);

            const profiles = profilesRes.data || [];
            const studentCount = profiles.filter(p => p.role === 'student').length;
            const teacherCount = profiles.filter(p => p.role === 'teacher').length;
            const groupCount = groupCountRes.count || 0;
            const allTxs = txsAllRes.data || [];

            // Current month revenue
            const currentRevenue = allTxs
                .filter(t => t.created_at >= `${currentMonthStart}T00:00:00` && t.created_at <= `${currentMonthEnd}T23:59:59`)
                .reduce((sum, t) => sum + Number(t.amount || 0), 0);

            setStats([
                { title: "Jami O'quvchilar", value: studentCount, icon: GraduationCap, color: 'indigo', trendLabel: "tizimda ro'yxatdan o'tgan" },
                { title: "O'qituvchilar", value: teacherCount, icon: Users, color: 'violet', trendLabel: "faol o'qituvchilar" },
                { title: 'Joriy Tushum', value: `${(currentRevenue / 1000000).toFixed(1)}M`, change: format(new Date(), 'MMMM', { locale: uz }), icon: CreditCard, color: 'emerald', trendLabel: "oylik hisobot" },
                { title: 'Faol Guruhlar', value: groupCount, icon: Activity, color: 'amber', trendLabel: "jami guruhlar" },
            ]);

            // Aggregate chart data in JS (no more 12 queries)
            const monthsArr = Array.from({ length: 6 }, (_, i) => subMonths(new Date(), 5 - i));
            const coloredChartData = monthsArr.map((date, i) => {
                const mStart = format(startOfMonth(date), 'yyyy-MM-dd');
                const mEnd = format(endOfMonth(date), 'yyyy-MM-dd');
                const monthName = format(date, 'MMM', { locale: uz });

                const newStudents = profiles.filter(p =>
                    p.role === 'student' && p.created_at >= `${mStart}T00:00:00` && p.created_at <= `${mEnd}T23:59:59`
                ).length;

                const revenue = allTxs
                    .filter(t => t.created_at >= `${mStart}T00:00:00` && t.created_at <= `${mEnd}T23:59:59`)
                    .reduce((sum, t) => sum + Number(t.amount || 0), 0);

                return {
                    name: monthName,
                    students: newStudents,
                    income: revenue,
                    displayIncome: (revenue / 1000000).toFixed(1),
                    fill: i === 5 ? '#10B981' : '#D1FAE5'
                };
            });

            setEnrollmentData(coloredChartData);
            setFinancialData(coloredChartData);
            setRecentUsers(recentUsersRes.data || []);

        } catch (error) {
            console.error('Error fetching dashboard stats:', error);
            toast.error("Dashboard ma'lumotlarini yuklashda xatolik");
        } finally {
            setLoading(false);
        }
    };

    const handleExportReport = async () => {
        if (exporting) return;
        setExporting(true);
        const toastId = toast.loading("Barcha ma'lumotlar yuklanmoqda...");
        try {
            const today = format(new Date(), 'yyyy-MM-dd');
            const dateStr = format(new Date(), 'dd.MM.yyyy HH:mm');
            const fmt = (d) => d ? format(new Date(d), 'dd.MM.yyyy') : '';
            const fmtDt = (d) => d ? format(new Date(d), 'dd.MM.yyyy HH:mm') : '';
            const statusLabel = (s) => s === 'approved' ? 'Faol' : s === 'pending' ? 'Kutmoqda' : 'Bloklangan';
            const METHOD = { cash: 'Naqd', card: 'Karta', transfer: "O'tkazma", online: 'Online' };

            toast.loading("1/4 — Foydalanuvchilar...", { id: toastId });
            const [studentsRes, teachersRes, parentsRes, adminsRes] = await Promise.all([
                supabase.from('profiles').select('full_name, first_name, last_name, phone, email, status, student_code, address, created_at').eq('role', 'student').order('full_name'),
                supabase.from('profiles').select('full_name, phone, email, status, subject_specialty, experience_years, bio, created_at, login_username').eq('role', 'teacher').order('full_name'),
                supabase.from('profiles').select('full_name, phone, email, status, created_at').eq('role', 'parent').order('full_name'),
                supabase.from('profiles').select('full_name, phone, email, role, status, created_at').in('role', ['owner', 'admin']).order('full_name'),
            ]);

            toast.loading("2/4 — Guruhlar va fanlar...", { id: toastId });
            const [groupsRes, subjectsRes, enrollsRes] = await Promise.all([
                supabase.from('groups').select('id, name, price, teacher_id, subject_id, subjects(name)').order('name'),
                supabase.from('subjects').select('id, name, description, created_at').order('name'),
                supabase.from('enrollments').select('student_id, group_id, enrolled_at, status').order('enrolled_at', { ascending: false }),
            ]);

            toast.loading("3/4 — Baholar va davomat...", { id: toastId });
            const [gradesRes, attendanceRes] = await Promise.all([
                supabase.from('grades').select('student_id, group_id, teacher_id, title, score, grade_type, date').order('date', { ascending: false }),
                supabase.from('attendance').select('student_id, group_id, date, status, notes').order('date', { ascending: false }),
            ]);

            toast.loading("4/4 — Moliyaviy ma'lumotlar...", { id: toastId });
            const [allTxsRes, monthlyRes] = await Promise.all([
                supabase.from('payment_transactions').select('amount, method, note, created_at, monthly_payments!payment_id(payment_month, payment_year, amount, paid_amount, status, profiles!student_id(full_name, phone, student_code))').order('created_at', { ascending: false }),
                supabase.from('monthly_payments').select('payment_month, payment_year, amount, paid_amount, status, profiles!student_id(full_name, phone, student_code), groups(name, price)').order('payment_year', { ascending: false }).order('payment_month', { ascending: false }),
            ]);

            toast.loading("Excel fayl yig'ilmoqda...", { id: toastId });

            // Build lookup maps
            const profileMap = {};
            [...(studentsRes.data || []), ...(teachersRes.data || []), ...(parentsRes.data || []), ...(adminsRes.data || [])].forEach(p => { if (p.id) profileMap[p.id] = p; });
            // Re-fetch profiles with IDs for lookup
            const { data: allProfilesData } = await supabase.from('profiles').select('id, full_name, phone, student_code');
            (allProfilesData || []).forEach(p => { profileMap[p.id] = { ...profileMap[p.id], ...p }; });
            const groupMap = {};
            (groupsRes.data || []).forEach(g => { groupMap[g.id] = g; });

            const XLSX = (await import('xlsx')).default ?? await import('xlsx');
            const wb = XLSX.utils.book_new();
            wb.Props = { Title: "Terra Academy — To'liq Hisobot", Author: 'Terra Academy', CreatedDate: new Date() };

            const meta = (title, cols) => [
                [`TERRA ACADEMY — ${title.toUpperCase()}`],
                [`Hisobot sanasi: ${dateStr}  |  Terra Academy Educational Management System`],
                [],
            ];
            const makeSheet = (title, headers, rows, colWidths) => {
                const ws = XLSX.utils.aoa_to_sheet([...meta(title, headers.length), headers, ...rows]);
                ws['!cols'] = colWidths.map(w => ({ wch: w }));
                ws['!merges'] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: headers.length - 1 } }, { s: { r: 1, c: 0 }, e: { r: 1, c: headers.length - 1 } }];
                return ws;
            };

            // ── 1. UMUMIY STATISTIKA ──
            const allTxs = allTxsRes.data || [];
            const totalRevenue = allTxs.reduce((s, t) => s + Number(t.amount || 0), 0);
            const paidCount = (monthlyRes.data || []).filter(m => m.status === 'paid').length;
            const debtCount = (monthlyRes.data || []).filter(m => m.status !== 'paid').length;
            const totalDebt = (monthlyRes.data || []).reduce((s, m) => s + Math.max(0, Number(m.amount || 0) - Number(m.paid_amount || 0)), 0);
            const ws1 = XLSX.utils.aoa_to_sheet([
                ["TERRA ACADEMY — TO'LIQ HISOBOT"],
                [`Hisobot sanasi: ${dateStr}`],
                [],
                ["KO'RSATKICH", "QIYMAT", "IZOH"],
                ["Jami o'quvchilar", studentsRes.data?.length || 0, "Tizimda ro'yxatdan o'tgan"],
                ["Faol o'quvchilar", (studentsRes.data || []).filter(s => s.status === 'approved').length, "Status: approved"],
                ["Jami o'qituvchilar", teachersRes.data?.length || 0, "Barcha mentorlar"],
                ["Faol o'qituvchilar", (teachersRes.data || []).filter(t => t.status === 'approved').length, "Status: approved"],
                ["Jami ota-onalar", parentsRes.data?.length || 0, "Bog'langan ota-onalar"],
                ["Jami guruhlar", groupsRes.data?.length || 0, "Barcha guruhlar"],
                ["Jami fanlar", subjectsRes.data?.length || 0, "O'qitiladigan fanlar"],
                ["Jami yozilishlar", enrollsRes.data?.length || 0, "Guruhga yozilishlar"],
                ["Jami baholar", gradesRes.data?.length || 0, "Kiritilgan baholar"],
                ["Davomat yozuvlari", attendanceRes.data?.length || 0, "Barcha davomat ma'lumotlari"],
                [],
                ["MOLIYAVIY KO'RSATKICHLAR", "", ""],
                ["Jami tushum (UZS)", totalRevenue, "Barcha vaqt uchun"],
                ["To'liq to'langan oylar", paidCount, "status = paid"],
                ["Qarzli yozuvlar", debtCount, "To'lanmagan/qisman"],
                ["Umumiy qarz (UZS)", totalDebt, "Joriy qarz summasi"],
                ["Tranzaksiyalar soni", allTxs.length, "Jami to'lov operatsiyalari"],
            ]);
            ws1['!cols'] = [{ wch: 35 }, { wch: 20 }, { wch: 35 }];
            ws1['!merges'] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 2 } }, { s: { r: 1, c: 0 }, e: { r: 1, c: 2 } }];
            XLSX.utils.book_append_sheet(wb, ws1, "1. Umumiy statistika");

            // ── 2. O'QUVCHILAR ──
            XLSX.utils.book_append_sheet(wb, makeSheet(
                "O'quvchilar ro'yxati",
                ["#", "F.I.O", "Ism", "Familiya", "Telefon", "Email", "O'quvchi kodi", "Manzil", "Holat", "Qo'shilgan sana"],
                (studentsRes.data || []).map((s, i) => [
                    i + 1, s.full_name || '', s.first_name || '', s.last_name || '',
                    s.phone || '', s.email || '', s.student_code || '',
                    s.address || '', statusLabel(s.status), fmt(s.created_at)
                ]),
                [5, 25, 15, 15, 15, 25, 12, 20, 12, 15]
            ), "2. O'quvchilar");

            // ── 3. O'QITUVCHILAR ──
            XLSX.utils.book_append_sheet(wb, makeSheet(
                "O'qituvchilar ro'yxati",
                ["#", "F.I.O", "Login", "Telefon", "Email", "Mutaxassislik", "Tajriba (yil)", "Bio", "Holat", "Qo'shilgan sana"],
                (teachersRes.data || []).map((t, i) => [
                    i + 1, t.full_name || '', t.login_username || '', t.phone || '',
                    t.email || '', t.subject_specialty || '', t.experience_years || '',
                    t.bio || '', statusLabel(t.status), fmt(t.created_at)
                ]),
                [5, 25, 18, 15, 25, 20, 14, 30, 12, 15]
            ), "3. O'qituvchilar");

            // ── 4. OTA-ONALAR ──
            XLSX.utils.book_append_sheet(wb, makeSheet(
                "Ota-onalar ro'yxati",
                ["#", "F.I.O", "Telefon", "Email", "Holat", "Qo'shilgan sana"],
                (parentsRes.data || []).map((p, i) => [
                    i + 1, p.full_name || '', p.phone || '', p.email || '',
                    statusLabel(p.status), fmt(p.created_at)
                ]),
                [5, 25, 15, 25, 12, 15]
            ), "4. Ota-onalar");

            // ── 5. ADMINLAR ──
            XLSX.utils.book_append_sheet(wb, makeSheet(
                "Adminlar ro'yxati",
                ["#", "F.I.O", "Telefon", "Email", "Rol", "Holat", "Qo'shilgan sana"],
                (adminsRes.data || []).map((a, i) => [
                    i + 1, a.full_name || '', a.phone || '', a.email || '',
                    a.role || '', statusLabel(a.status), fmt(a.created_at)
                ]),
                [5, 25, 15, 25, 10, 12, 15]
            ), "5. Adminlar");

            // ── 6. GURUHLAR ──
            const enrollCountMap = {};
            (enrollsRes.data || []).forEach(e => { enrollCountMap[e.group_id] = (enrollCountMap[e.group_id] || 0) + 1; });
            XLSX.utils.book_append_sheet(wb, makeSheet(
                "Guruhlar ro'yxati",
                ["#", "Guruh nomi", "Fan", "O'qituvchi", "O'quvchilar soni", "Narx (UZS)"],
                (groupsRes.data || []).map((g, i) => [
                    i + 1, g.name || '', g.subjects?.name || '',
                    profileMap[g.teacher_id]?.full_name || '',
                    enrollCountMap[g.id] || 0, g.price || 0
                ]),
                [5, 20, 20, 25, 15, 15]
            ), "6. Guruhlar");

            // ── 7. FANLAR ──
            XLSX.utils.book_append_sheet(wb, makeSheet(
                "Fanlar ro'yxati",
                ["#", "Fan nomi", "Tavsif", "Qo'shilgan sana"],
                (subjectsRes.data || []).map((s, i) => [
                    i + 1, s.name || '', s.description || '', fmt(s.created_at)
                ]),
                [5, 25, 40, 15]
            ), "7. Fanlar");

            // ── 8. GURUHGA YOZILISHLAR ──
            XLSX.utils.book_append_sheet(wb, makeSheet(
                "Guruhga yozilishlar",
                ["#", "O'quvchi", "Telefon", "Guruh", "Guruh narxi (UZS)", "Holat", "Yozilgan sana"],
                (enrollsRes.data || []).map((e, i) => [
                    i + 1, profileMap[e.student_id]?.full_name || '',
                    profileMap[e.student_id]?.phone || '',
                    groupMap[e.group_id]?.name || '',
                    groupMap[e.group_id]?.price || 0,
                    e.status || '', fmt(e.enrolled_at)
                ]),
                [5, 25, 15, 20, 18, 12, 15]
            ), "8. Yozilishlar");

            // ── 9. BAHOLAR ──
            XLSX.utils.book_append_sheet(wb, makeSheet(
                "Baholar ro'yxati",
                ["#", "O'quvchi", "Guruh", "Mavzu", "Tur", "Ball (%)", "O'qituvchi", "Sana"],
                (gradesRes.data || []).map((g, i) => [
                    i + 1, profileMap[g.student_id]?.full_name || '',
                    groupMap[g.group_id]?.name || '',
                    g.title || '', g.grade_type || '', g.score ?? '',
                    profileMap[g.teacher_id]?.full_name || '',
                    fmt(g.date)
                ]),
                [5, 25, 20, 25, 15, 10, 25, 12]
            ), "9. Baholar");

            // ── 10. DAVOMAT ──
            const attStatus = { present: 'Keldi', absent: "Kelmadi", late: 'Kech keldi', excused: 'Sababli' };
            XLSX.utils.book_append_sheet(wb, makeSheet(
                "Davomat",
                ["#", "O'quvchi", "Guruh", "Holat", "Izoh", "Sana"],
                (attendanceRes.data || []).map((a, i) => [
                    i + 1, profileMap[a.student_id]?.full_name || '',
                    groupMap[a.group_id]?.name || '',
                    attStatus[a.status] || a.status || '', a.notes || '', fmt(a.date)
                ]),
                [5, 25, 20, 12, 25, 12]
            ), "10. Davomat");

            // ── 11. OYLIK TO'LOVLAR ──
            XLSX.utils.book_append_sheet(wb, makeSheet(
                "Oylik to'lovlar",
                ["#", "O'quvchi", "Telefon", "Kod", "Guruh", "Oy", "Yil", "Kerak (UZS)", "To'landi (UZS)", "Qarz (UZS)", "Holat"],
                (monthlyRes.data || []).map((m, i) => {
                    const expected = Number(m.amount || 0);
                    const paid = Number(m.paid_amount || 0);
                    const statusMap = { paid: "To'langan", partially_paid: 'Qisman', overdue: "Muddati o'tgan", pending: "To'lanmagan" };
                    return [
                        i + 1, m.profiles?.full_name || '', m.profiles?.phone || '',
                        m.profiles?.student_code || '', m.groups?.name || '',
                        m.payment_month, m.payment_year,
                        expected, paid, Math.max(0, expected - paid),
                        statusMap[m.status] || m.status || ''
                    ];
                }),
                [5, 25, 15, 12, 20, 6, 6, 18, 18, 15, 15]
            ), "11. Oylik to'lovlar");

            // ── 12. TRANZAKSIYALAR ──
            XLSX.utils.book_append_sheet(wb, makeSheet(
                "Barcha tranzaksiyalar",
                ["#", "O'quvchi", "Telefon", "Kod", "Summa (UZS)", "Usul", "Oy", "Yil", "Izoh", "Sana va vaqt"],
                allTxs.map((t, i) => [
                    i + 1,
                    t.monthly_payments?.profiles?.full_name || '',
                    t.monthly_payments?.profiles?.phone || '',
                    t.monthly_payments?.profiles?.student_code || '',
                    Number(t.amount || 0),
                    METHOD[t.method] || t.method || '',
                    t.monthly_payments?.payment_month || '',
                    t.monthly_payments?.payment_year || '',
                    t.note || '',
                    fmtDt(t.created_at)
                ]),
                [5, 25, 15, 12, 18, 12, 6, 6, 20, 20]
            ), "12. Tranzaksiyalar");

            // ── 13. OYLIK MOLIYAVIY XULOSA (so'nggi 12 oy) ──
            const monthlyTotals = {};
            allTxs.forEach(t => {
                const key = `${t.monthly_payments?.payment_year}-${String(t.monthly_payments?.payment_month).padStart(2, '0')}`;
                if (key === 'undefined-undefined') return;
                monthlyTotals[key] = (monthlyTotals[key] || 0) + Number(t.amount || 0);
            });
            const monthNames = ['', 'Yanvar', 'Fevral', 'Mart', 'Aprel', 'May', 'Iyun', 'Iyul', 'Avgust', 'Sentabr', 'Oktabr', 'Noyabr', 'Dekabr'];
            const sortedMonths = Object.entries(monthlyTotals).sort((a, b) => b[0].localeCompare(a[0])).slice(0, 24);
            XLSX.utils.book_append_sheet(wb, makeSheet(
                "Oylik moliyaviy xulosa",
                ["#", "Yil", "Oy", "Oy nomi", "Tushum (UZS)"],
                sortedMonths.map(([key, total], i) => {
                    const [yr, mo] = key.split('-');
                    return [i + 1, yr, Number(mo), monthNames[Number(mo)] || mo, total];
                }),
                [5, 8, 6, 15, 20]
            ), "13. Moliyaviy xulosa");

            XLSX.writeFile(wb, `TerraAcademy_ToliqHisobot_${today}.xlsx`);
            toast.success(`✅ Hisobot tayyor! 13 ta sheet, ${(studentsRes.data?.length || 0) + (teachersRes.data?.length || 0) + allTxs.length + (gradesRes.data?.length || 0)} yozuv`, { id: toastId, duration: 5000 });
        } catch (err) {
            console.error(err);
            toast.error("Xatolik: " + err.message, { id: toastId });
        } finally {
            setExporting(false);
        }
    };

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
            {/* Page Header */}
            <div className="relative overflow-hidden rounded-[2.5rem] bg-slate-900 shadow-lg">
                {/* Background */}
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-900 via-slate-800 to-slate-900"></div>
                <div className="absolute -top-20 -right-20 w-64 h-64 bg-indigo-500/10 rounded-full blur-[80px] pointer-events-none" />

                <div className="relative z-10 p-5 sm:p-8 md:p-12 flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div>
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 rounded-full text-[10px] font-black uppercase tracking-widest mb-3 backdrop-blur-md border border-white/10 text-indigo-100"
                        >
                            <Shield size={12} className="text-emerald-400" />
                            Administrator Paneli
                        </motion.div>
                        <h1 className="text-2xl sm:text-3xl md:text-5xl font-black text-white tracking-tight mb-2">
                            Xush kelibsiz, <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-200 to-indigo-100">{adminName}!</span>
                        </h1>
                        <p className="text-slate-400 font-medium text-sm sm:text-base max-w-xl leading-relaxed">
                            {loading
                                ? 'Tizim ma\'lumotlari yuklanmoqda...'
                                : `Tizimda ${stats[0].value} o'quvchi, ${stats[1].value} o'qituvchi faol.`}
                        </p>
                    </div>

                    <div className="flex gap-3 w-full md:w-auto md:shrink-0">
                        <div className="bg-white/5 border border-white/10 backdrop-blur-md px-4 py-3 rounded-2xl flex items-center gap-3 shrink-0">
                            <div className="w-8 h-8 rounded-xl bg-indigo-500/20 flex items-center justify-center text-indigo-300">
                                <Calendar size={16} />
                            </div>
                            <div>
                                <div className="text-[9px] font-bold uppercase tracking-widest text-slate-400">Bugun</div>
                                <div className="font-black text-white text-sm">{format(new Date(), 'dd MMMM', { locale: uz })}</div>
                            </div>
                        </div>
                        <button
                            onClick={handleExportReport}
                            disabled={exporting}
                            className="flex-1 md:flex-none md:w-auto md:px-5 md:py-3 h-12 bg-gradient-to-r from-blue-500 to-indigo-600 shadow-lg shadow-blue-500/30 flex items-center justify-center gap-2 rounded-2xl text-white disabled:opacity-70 active:scale-95 transition-transform"
                        >
                            {exporting
                                ? <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                : <Download size={22} />}
                            <span className="font-bold uppercase tracking-wide text-xs">
                                {exporting ? 'Yuklanmoqda...' : 'Hisobot'}
                            </span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Quick Actions Bar */}
            <div className="grid grid-cols-4 gap-3">
                {[
                    { label: "Yangi O'quvchi", icon: UserPlus, color: 'text-blue-500', bg: 'bg-blue-50 hover:bg-blue-100', path: '/admin/registration-requests' },
                    { label: 'Guruh Yaratish', icon: Plus, color: 'text-purple-500', bg: 'bg-purple-50 hover:bg-purple-100', path: '/admin/groups' },
                    { label: "To'lov Qabul", icon: DollarSign, color: 'text-emerald-500', bg: 'bg-emerald-50 hover:bg-emerald-100', path: '/admin/finance' },
                    { label: "O'quvchilar", icon: GraduationCap, color: 'text-indigo-500', bg: 'bg-indigo-50 hover:bg-indigo-100', path: '/admin/students' },
                ].map((action, i) => (
                    <button
                        key={i}
                        onClick={() => navigate(action.path)}
                        className={`py-3 px-2 rounded-2xl border border-transparent transition-all duration-300 flex flex-col items-center justify-center gap-2 group active:scale-95 ${action.bg}`}
                    >
                        <span className={`p-2 bg-white rounded-xl shadow-sm group-hover:scale-110 transition-transform ${action.color}`}>
                            <action.icon size={18} strokeWidth={2.5} />
                        </span>
                        <span className="font-bold text-slate-700 text-[10px] leading-tight text-center">{action.label}</span>
                    </button>
                ))}
            </div>

            {/* Stats Grid */}
            <motion.div
                variants={container}
                initial="hidden"
                animate="show"
                className="grid grid-cols-2 lg:grid-cols-4 gap-4"
            >
                {stats.map((stat, index) => (
                    <motion.div key={index} variants={item}>
                        <StatsCard {...stat} idx={index} loading={loading} />
                    </motion.div>
                ))}
            </motion.div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Student Growth Chart - Takes 2 cols */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="lg:col-span-2 glass-card p-8 border border-slate-100 bg-white shadow-sm rounded-[2.5rem]"
                >
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h3 className="text-xl font-black text-slate-900 flex items-center gap-3">
                                <span className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                                    <UserPlus size={20} />
                                </span>
                                O'quvchilar O'sishi
                            </h3>
                        </div>
                        <div className="px-3 py-1 bg-slate-50 rounded-lg text-xs font-bold text-slate-500 uppercase tracking-wide">
                            So'nggi 6 oy
                        </div>
                    </div>
                    <div className="w-full">
                        <ResponsiveContainer width="100%" height={350} debounce={50}>
                            <AreaChart data={enrollmentData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="colorStudents" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 12, fontWeight: 700 }} dy={10} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 12, fontWeight: 700 }} />
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: '#1E293B',
                                        borderRadius: '16px',
                                        border: 'none',
                                        padding: '12px 16px',
                                        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)'
                                    }}
                                    labelStyle={{ color: '#94A3B8', fontWeight: 700, marginBottom: '4px' }}
                                    itemStyle={{ color: '#fff', fontWeight: 600 }}
                                    formatter={(value) => [`${value} ta`, 'Yangi o\'quvchilar']}
                                    cursor={{ stroke: '#3B82F6', strokeWidth: 2, strokeDasharray: '5 5' }}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="students"
                                    stroke="#3B82F6"
                                    strokeWidth={4}
                                    fillOpacity={1}
                                    fill="url(#colorStudents)"
                                    animationDuration={2000}
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </motion.div>

                {/* Financial Overview - Takes 1 col */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="glass-card p-8 border border-slate-100 bg-white shadow-sm rounded-[2.5rem] flex flex-col"
                >
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h3 className="text-xl font-black text-slate-900 flex items-center gap-3">
                                <span className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                                    <DollarSign size={20} />
                                </span>
                                Moliya
                            </h3>
                        </div>
                    </div>
                    <div className="w-full">
                        <ResponsiveContainer width="100%" height={320} debounce={50}>
                            <BarChart data={financialData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 11, fontWeight: 700 }} dy={10} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 11, fontWeight: 700 }} />
                                <Tooltip
                                    cursor={{ fill: '#F0FDF4', radius: 8 }}
                                    contentStyle={{
                                        backgroundColor: '#10B981',
                                        color: '#fff',
                                        borderRadius: '12px',
                                        border: 'none',
                                        boxShadow: '0 10px 15px -3px rgba(16, 185, 129, 0.3)'
                                    }}
                                    itemStyle={{ color: '#fff' }}
                                    labelStyle={{ color: '#fff', opacity: 0.8 }}
                                    formatter={(value) => [`${value} mln`, 'Tushum']}
                                />
                                <Bar dataKey="displayIncome" barSize={20} animationDuration={2000} shape={<ColoredBar />} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </motion.div>
            </div>

            {/* Recent Activity Section */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="grid grid-cols-1 lg:grid-cols-2 gap-8"
            >
                <div className="glass-card p-8 rounded-[2.5rem] border border-slate-100 bg-white shadow-xl shadow-slate-200/50">
                    <h3 className="text-xl font-black text-slate-900 mb-6 flex items-center gap-3">
                        <span className="w-10 h-10 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center">
                            <Activity size={20} />
                        </span>
                        So'nggi Faollik
                    </h3>
                    <div className="space-y-4">
                        {recentUsers.map((user, i) => (
                            <motion.div
                                key={user.id}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.1 * i }}
                                className="flex items-center gap-4 p-4 rounded-3xl bg-slate-50 border border-slate-100/50 hover:bg-white hover:border-blue-100 hover:shadow-lg hover:shadow-blue-500/10 transition-all duration-300 group cursor-pointer"
                            >
                                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-lg shadow-sm group-hover:scale-110 transition-transform ${user.role === 'student' ? 'bg-blue-100 text-blue-600' :
                                    user.role === 'teacher' ? 'bg-purple-100 text-purple-600' : 'bg-orange-100 text-orange-600'
                                    }`}>
                                    {user.first_name ? user.first_name.charAt(0) : '?'}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h4 className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors truncate">{user.full_name || 'Noma\'lum F.'}</h4>
                                    <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-slate-400 flex-wrap">
                                        <span className="shrink-0">{user.role === 'student' ? 'O\'quvchi' : user.role === 'teacher' ? 'O\'qituvchi' : user.role}</span>
                                        <span className="w-1 h-1 rounded-full bg-slate-300 shrink-0"></span>
                                        <span className="flex items-center gap-1 shrink-0">
                                            <Clock size={10} />
                                            {format(new Date(user.created_at), 'dd MMM, HH:mm')}
                                        </span>
                                    </div>
                                </div>
                                <div>
                                    {user.status === 'approved' ? (
                                        <div className="p-2 bg-emerald-100 text-emerald-600 rounded-xl" title="Tasdiqlangan">
                                            <CheckCircle2 size={18} />
                                        </div>
                                    ) : user.status === 'pending' ? (
                                        <div className="p-2 bg-amber-100 text-amber-600 rounded-xl" title="Kutilmoqda">
                                            <Clock size={18} />
                                        </div>
                                    ) : (
                                        <div className="p-2 bg-rose-100 text-rose-600 rounded-xl" title="Rad etilgan">
                                            <AlertTriangle size={18} />
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>

                <div className="glass-card p-8 rounded-[2.5rem] bg-slate-900 text-white relative overflow-hidden flex flex-col justify-center items-center text-center shadow-lg">
                    <div className="absolute -top-10 -right-10 w-40 h-40 bg-indigo-500/10 rounded-full blur-[60px] pointer-events-none"></div>
                    <div className="relative z-10">
                        <div className="w-20 h-20 bg-white/10 rounded-3xl mx-auto mb-8 flex items-center justify-center border border-white/10">
                            <Download size={36} className="text-blue-300" />
                        </div>
                        <h3 className="text-3xl font-black mb-3">Tizim Yangilanishlari</h3>
                        <p className="text-slate-400 font-medium mb-8 max-w-sm mx-auto leading-relaxed">
                            Yangi versiya funksiyalari va xavfsizlik yangilanishlari haqida to'liq ma'lumot olish uchun bosing.
                        </p>
                        <button
                            onClick={() => setShowChangelog(true)}
                            className="px-8 py-4 bg-blue-600 hover:bg-blue-500 rounded-2xl font-black uppercase tracking-widest text-xs transition-all hover:shadow-lg hover:shadow-blue-500/40 hover:-translate-y-1 active:scale-95">
                            Batafsil O'qish
                        </button>
                    </div>
                </div>

            {/* Changelog Modal */}
            {showChangelog && (
                <ModalPortal><div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowChangelog(false)} />
                    <motion.div
                        initial={{ scale: 0.95, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.95, opacity: 0 }}
                        className="relative z-10 w-full max-w-lg bg-slate-900 rounded-[2rem] overflow-hidden shadow-2xl border border-white/10 max-h-[85vh] flex flex-col"
                    >
                        {/* Header */}
                        <div className="p-6 border-b border-white/10 flex items-center justify-between shrink-0">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-blue-500/20 rounded-xl flex items-center justify-center">
                                    <Download size={18} className="text-blue-400" />
                                </div>
                                <div>
                                    <h2 className="font-black text-white text-lg">Tizim Yangilanishlari</h2>
                                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Terra Academy v2.0</p>
                                </div>
                            </div>
                            <button onClick={() => setShowChangelog(false)} className="w-9 h-9 bg-white/5 hover:bg-white/10 rounded-xl flex items-center justify-center text-slate-400 hover:text-white transition-all">
                                <X size={18} />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="overflow-y-auto p-6 space-y-6">
                            {[
                                {
                                    version: 'v2.1.0', date: '15 Mart 2026', badge: 'Yangi', badgeColor: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
                                    changes: [
                                        { icon: '🔐', text: "Profilni o'chirish — FK constraint xatolari tuzatildi" },
                                        { icon: '⚡', text: "Sidebar React.memo — keraksiz re-render'lar yo'q qilindi" },
                                        { icon: '🔍', text: "Global qidiruv — endi to'g'ridan profil sahifasiga o'tadi" },
                                        { icon: '🧹', text: "O'qituvchi o'chirishda guruh teacher_id null ga o'rnatiladi" },
                                        { icon: '📱', text: "Mobil versiya: header, dashboard va moliya sahifalari tuzatildi" },
                                    ]
                                },
                                {
                                    version: 'v2.0.0', date: '10 Mart 2026', badge: 'Asosiy', badgeColor: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
                                    changes: [
                                        { icon: '🏗️', text: "Modal overlay arxitekturasi — createPortal orqali to'liq ekran" },
                                        { icon: '📄', text: "Export: PDF va Excel — barcha ro'yxatlar uchun ishga tushirildi" },
                                        { icon: '✅', text: "ConfirmToast — window.confirm o'rniga zamonaviy toast" },
                                        { icon: '👨‍🏫', text: "O'qituvchi profili sahifasi — guruhlar, baholar, tahrirlash" },
                                        { icon: '💰', text: "Moliya markazi — to'lov qabul qilish, tranzaksiyalar, chek chiqarish" },
                                        { icon: '📊', text: "Davomat tizimi — yo'qlama belgilash va hisobotlar" },
                                    ]
                                },
                                {
                                    version: 'v1.5.0', date: '1 Mart 2026', badge: 'Barqaror', badgeColor: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
                                    changes: [
                                        { icon: '👨‍👩‍👧', text: "Ota-ona roli — farzand tanlash, davomat va to'lov ko'rish" },
                                        { icon: '📱', text: "SMS xabarnoma tizimi — DevSMS API integratsiya" },
                                        { icon: '🎓', text: "O'quvchi profili — to'lov tarixi, baholar, davomat" },
                                        { icon: '🔑', text: "Birinchi kirish setup — parol o'zgartirish majburiy" },
                                    ]
                                },
                            ].map((release) => (
                                <div key={release.version}>
                                    <div className="flex items-center gap-3 mb-3">
                                        <span className="font-black text-white text-sm">{release.version}</span>
                                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black border ${release.badgeColor}`}>{release.badge}</span>
                                        <span className="text-[10px] text-slate-600 font-bold ml-auto">{release.date}</span>
                                    </div>
                                    <div className="space-y-2">
                                        {release.changes.map((c, i) => (
                                            <div key={i} className="flex items-start gap-3 p-3 bg-white/5 rounded-xl border border-white/5">
                                                <span className="text-base shrink-0">{c.icon}</span>
                                                <span className="text-slate-300 text-sm font-medium leading-snug">{c.text}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="p-4 border-t border-white/10 shrink-0">
                            <button onClick={() => setShowChangelog(false)} className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-black rounded-xl text-xs uppercase tracking-widest transition-all">
                                Yopish
                            </button>
                        </div>
                    </motion.div>
                </div></ModalPortal>
            )}
            </motion.div>
        </div>
    );
};

export default AdminDashboard;
