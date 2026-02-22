import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    User, Phone, MapPin, Lock, AtSign, Eye, EyeOff,
    Save, Loader2, CheckCircle2, AlertCircle, Settings,
    Camera, BookOpen, Briefcase, FileText
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-hot-toast';

const inputClass = "w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all text-slate-800 placeholder:text-slate-400 font-medium text-sm";
const labelClass = "block text-xs font-black text-slate-500 uppercase tracking-widest mb-1.5";

const TAB_IDS = {
    personal: 'personal',
    login: 'login',
    password: 'password',
};

const ProfileSettings = () => {
    const { user, refreshProfile } = useAuth();
    const role = user?.role || 'student';

    const [activeTab, setActiveTab] = useState(TAB_IDS.personal);
    const [saving, setSaving] = useState(false);

    // Personal info form
    const [personal, setPersonal] = useState({
        first_name: user?.profileData?.first_name || user?.name?.split(' ')[0] || '',
        last_name: user?.profileData?.last_name || user?.name?.split(' ').slice(1).join(' ') || '',
        phone: user?.profileData?.phone || '',
        address: user?.profileData?.address || '',
        bio: user?.profileData?.bio || '',
        subject_specialty: user?.profileData?.subject_specialty || '',
        experience_years: user?.profileData?.experience_years || '',
        birth_date: user?.profileData?.birth_date || '',
    });

    const setP = (field) => (e) => setPersonal(prev => ({ ...prev, [field]: e.target.value }));

    // Login change form
    const [newLogin, setNewLogin] = useState('');
    const [loginConfirm, setLoginConfirm] = useState('');

    // Password change form
    const [passwords, setPasswords] = useState({ current: '', newPass: '', confirm: '' });
    const [showPw, setShowPw] = useState({ current: false, new: false, confirm: false });
    const togglePw = (field) => setShowPw(prev => ({ ...prev, [field]: !prev[field] }));

    // ── Save personal info ─────────────────────────────────────
    const handleSavePersonal = async () => {
        setSaving(true);
        try {
            const updates = {
                first_name: personal.first_name.trim(),
                last_name: personal.last_name.trim(),
                full_name: `${personal.first_name.trim()} ${personal.last_name.trim()}`,
                phone: personal.phone || null,
                address: personal.address || null,
                bio: personal.bio || null,
                birth_date: personal.birth_date || null,
            };

            if (role === 'teacher') {
                updates.subject_specialty = personal.subject_specialty || null;
                updates.experience_years = personal.experience_years ? parseInt(personal.experience_years) : null;
            }

            const { error } = await supabase.from('profiles').update(updates).eq('id', user.id);
            if (error) throw error;

            await refreshProfile();
            toast.success("Shaxsiy ma'lumotlar saqlandi");
        } catch (err) {
            toast.error('Xatolik: ' + err.message);
        } finally {
            setSaving(false);
        }
    };

    // ── Change login ───────────────────────────────────────────
    const handleChangeLogin = async () => {
        const trimmed = newLogin.trim().toLowerCase().replace(/\s+/g, '').replace(/[^a-z0-9]/g, '');
        if (!trimmed) return toast.error("Yangi login kiriting");
        if (trimmed.length < 4) return toast.error("Login kamida 4 ta belgidan iborat bo'lishi kerak");
        if (trimmed !== loginConfirm.trim().toLowerCase()) return toast.error("Loginlar mos emas");

        setSaving(true);
        try {
            // Check uniqueness
            const { data: existing } = await supabase
                .from('profiles')
                .select('id')
                .eq('login_username', trimmed)
                .neq('id', user.id)
                .maybeSingle();

            if (existing) throw new Error("Bu login allaqachon band. Boshqa login tanlang.");

            // Update Supabase auth email
            const { error: authError } = await supabase.auth.updateUser({
                email: `${trimmed}@terra.academy`
            });
            if (authError) throw authError;

            // Update profiles table
            const { error: profileError } = await supabase
                .from('profiles')
                .update({ login_username: trimmed })
                .eq('id', user.id);
            if (profileError) throw profileError;

            await refreshProfile();
            setNewLogin('');
            setLoginConfirm('');
            toast.success(`Login muvaffaqiyatli o'zgartirildi: ${trimmed}`);
        } catch (err) {
            toast.error('Xatolik: ' + err.message);
        } finally {
            setSaving(false);
        }
    };

    // ── Change password ────────────────────────────────────────
    const handleChangePassword = async () => {
        if (!passwords.newPass) return toast.error("Yangi parol kiriting");
        if (passwords.newPass.length < 6) return toast.error("Parol kamida 6 ta belgidan iborat bo'lishi kerak");
        if (passwords.newPass !== passwords.confirm) return toast.error("Parollar mos emas");

        setSaving(true);
        try {
            const { error } = await supabase.auth.updateUser({ password: passwords.newPass });
            if (error) throw error;

            setPasswords({ current: '', newPass: '', confirm: '' });
            toast.success("Parol muvaffaqiyatli o'zgartirildi");
        } catch (err) {
            toast.error('Xatolik: ' + err.message);
        } finally {
            setSaving(false);
        }
    };

    const currentLogin = user?.profileData?.login_username || user?.email?.replace('@terra.academy', '') || '—';

    const tabs = [
        { id: TAB_IDS.personal, label: "Shaxsiy Ma'lumotlar", icon: User },
        { id: TAB_IDS.login, label: "Login O'zgartirish", icon: AtSign },
        { id: TAB_IDS.password, label: "Parol O'zgartirish", icon: Lock },
    ];

    return (
        <div className="space-y-8 max-w-4xl mx-auto pb-10">
            {/* ── Header ────────────────────────────────────────── */}
            <div className="relative overflow-hidden rounded-[2.5rem] bg-slate-900 shadow-2xl">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-600 via-indigo-600 to-slate-900 opacity-80" />
                <div className="absolute -top-20 -right-20 w-80 h-80 bg-blue-500/20 rounded-full blur-[80px]" />

                <div className="relative z-10 p-8 md:p-10 flex items-center gap-6">
                    {/* Avatar */}
                    <div className="relative flex-shrink-0">
                        <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-2xl shadow-blue-500/30 ring-4 ring-white/10">
                            <span className="text-white font-black text-2xl">
                                {user?.name?.charAt(0) || user?.full_name?.charAt(0) || 'U'}
                            </span>
                        </div>
                        <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-emerald-400 border-2 border-slate-900 rounded-full" />
                    </div>

                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <Settings size={14} className="text-blue-300" />
                            <span className="text-[10px] font-black text-blue-300 uppercase tracking-widest">Sozlamalar</span>
                        </div>
                        <h1 className="text-2xl font-black text-white tracking-tight">{user?.name || user?.full_name || 'Foydalanuvchi'}</h1>
                        <p className="text-slate-400 text-sm font-medium mt-0.5">@{currentLogin}</p>
                    </div>
                </div>
            </div>

            {/* ── Tabs ──────────────────────────────────────────── */}
            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
                {/* Tab bar */}
                <div className="flex border-b border-slate-100 overflow-x-auto">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center gap-2 px-6 py-4 text-xs font-black uppercase tracking-widest whitespace-nowrap transition-all border-b-2 ${activeTab === tab.id
                                ? 'border-blue-600 text-blue-600 bg-blue-50/50'
                                : 'border-transparent text-slate-400 hover:text-slate-600 hover:bg-slate-50'
                                }`}
                        >
                            <tab.icon size={14} />
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Tab content */}
                <AnimatePresence mode="wait">
                    {/* ── Personal Info Tab ─────────────────────── */}
                    {activeTab === TAB_IDS.personal && (
                        <motion.div
                            key="personal"
                            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                            className="p-6 md:p-8 space-y-5"
                        >
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className={labelClass}>Ism</label>
                                    <div className="relative">
                                        <User size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                                        <input type="text" value={personal.first_name} onChange={setP('first_name')}
                                            className={inputClass + " pl-11"} placeholder="Asadbek" />
                                    </div>
                                </div>
                                <div>
                                    <label className={labelClass}>Familya</label>
                                    <div className="relative">
                                        <User size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                                        <input type="text" value={personal.last_name} onChange={setP('last_name')}
                                            className={inputClass + " pl-11"} placeholder="Jumanazarov" />
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className={labelClass}>Telefon raqam</label>
                                    <div className="relative">
                                        <Phone size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                                        <input type="tel" value={personal.phone} onChange={setP('phone')}
                                            className={inputClass + " pl-11"} placeholder="+998 90 123 45 67" />
                                    </div>
                                </div>
                                <div>
                                    <label className={labelClass}>Tug'ilgan sana</label>
                                    <input type="date" value={personal.birth_date} onChange={setP('birth_date')} className={inputClass} />
                                </div>
                            </div>

                            <div>
                                <label className={labelClass}>Yashash manzili</label>
                                <div className="relative">
                                    <MapPin size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                                    <input type="text" value={personal.address} onChange={setP('address')}
                                        className={inputClass + " pl-11"} placeholder="Shahar, tuman, ko'cha..." />
                                </div>
                            </div>

                            {/* Teacher-specific fields */}
                            {role === 'teacher' && (
                                <>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div>
                                            <label className={labelClass}>Mutaxassislik / Fan</label>
                                            <div className="relative">
                                                <BookOpen size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                                                <input type="text" value={personal.subject_specialty} onChange={setP('subject_specialty')}
                                                    className={inputClass + " pl-11"} placeholder="Ingliz tili, Matematika..." />
                                            </div>
                                        </div>
                                        <div>
                                            <label className={labelClass}>Ish tajribasi (yil)</label>
                                            <div className="relative">
                                                <Briefcase size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                                                <input type="number" value={personal.experience_years} onChange={setP('experience_years')}
                                                    className={inputClass + " pl-11"} placeholder="5" min="0" max="50" />
                                            </div>
                                        </div>
                                    </div>
                                    <div>
                                        <label className={labelClass}>O'zingiz haqingizda (bio)</label>
                                        <div className="relative">
                                            <FileText size={15} className="absolute left-4 top-3.5 text-slate-400" />
                                            <textarea value={personal.bio} onChange={setP('bio')} rows={4}
                                                className={inputClass + " pl-11 resize-none"}
                                                placeholder="Qisqacha ma'lumot: ta'lim yo'nalishi, yutuqlar..." />
                                        </div>
                                    </div>
                                </>
                            )}

                            {/* Bio for non-teachers */}
                            {role !== 'teacher' && (
                                <div>
                                    <label className={labelClass}>Qo'shimcha ma'lumot</label>
                                    <div className="relative">
                                        <FileText size={15} className="absolute left-4 top-3.5 text-slate-400" />
                                        <textarea value={personal.bio} onChange={setP('bio')} rows={3}
                                            className={inputClass + " pl-11 resize-none"}
                                            placeholder="O'zingiz haqingizda qisqacha..." />
                                    </div>
                                </div>
                            )}

                            <div className="flex justify-end pt-2">
                                <motion.button
                                    whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}
                                    onClick={handleSavePersonal} disabled={saving}
                                    className="flex items-center gap-2 px-8 py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-black rounded-2xl shadow-xl shadow-blue-500/20 transition-all text-xs uppercase tracking-widest disabled:opacity-60"
                                >
                                    {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={15} />}
                                    Saqlash
                                </motion.button>
                            </div>
                        </motion.div>
                    )}

                    {/* ── Login Change Tab ──────────────────────── */}
                    {activeTab === TAB_IDS.login && (
                        <motion.div
                            key="login"
                            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                            className="p-6 md:p-8 space-y-5"
                        >
                            {/* Current login display */}
                            <div className="flex items-center gap-3 p-4 bg-slate-50 border border-slate-200 rounded-2xl">
                                <div className="w-9 h-9 rounded-xl bg-slate-200 flex items-center justify-center flex-shrink-0">
                                    <AtSign size={15} className="text-slate-500" />
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Hozirgi login</p>
                                    <p className="text-sm font-black text-slate-800 font-mono">{currentLogin}</p>
                                </div>
                            </div>

                            {/* Info note */}
                            <div className="flex items-start gap-3 p-4 bg-blue-50 border border-blue-200 rounded-2xl">
                                <AlertCircle size={16} className="text-blue-500 flex-shrink-0 mt-0.5" />
                                <p className="text-xs text-blue-700 font-medium leading-relaxed">
                                    Login faqat lotin harflari va raqamlardan iborat bo'lishi kerak. O'zgartirgandan so'ng yangi login bilan tizimga kirishingiz kerak bo'ladi.
                                </p>
                            </div>

                            <div>
                                <label className={labelClass}>Yangi login</label>
                                <div className="relative">
                                    <AtSign size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                                    <input
                                        type="text"
                                        value={newLogin}
                                        onChange={(e) => setNewLogin(e.target.value.toLowerCase().replace(/[^a-z0-9]/g, ''))}
                                        className={inputClass + " pl-11 font-mono"}
                                        placeholder="yangilogin"
                                    />
                                </div>
                                {newLogin && (
                                    <p className="text-xs text-slate-500 mt-1.5 font-medium">
                                        Login ko'rinishi: <span className="font-mono text-blue-600">{newLogin}</span>
                                    </p>
                                )}
                            </div>

                            <div>
                                <label className={labelClass}>Yangi loginni tasdiqlang</label>
                                <div className="relative">
                                    <AtSign size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                                    <input
                                        type="text"
                                        value={loginConfirm}
                                        onChange={(e) => setLoginConfirm(e.target.value.toLowerCase().replace(/[^a-z0-9]/g, ''))}
                                        className={inputClass + " pl-11 font-mono"}
                                        placeholder="yangilogin"
                                    />
                                </div>
                                {loginConfirm && newLogin && loginConfirm !== newLogin && (
                                    <p className="text-xs text-red-500 mt-1.5 font-bold flex items-center gap-1">
                                        <AlertCircle size={12} /> Loginlar mos emas
                                    </p>
                                )}
                                {loginConfirm && newLogin && loginConfirm === newLogin && (
                                    <p className="text-xs text-emerald-600 mt-1.5 font-bold flex items-center gap-1">
                                        <CheckCircle2 size={12} /> Loginlar mos
                                    </p>
                                )}
                            </div>

                            <div className="flex justify-end pt-2">
                                <motion.button
                                    whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}
                                    onClick={handleChangeLogin} disabled={saving || !newLogin || newLogin !== loginConfirm}
                                    className="flex items-center gap-2 px-8 py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-black rounded-2xl shadow-xl shadow-blue-500/20 transition-all text-xs uppercase tracking-widest disabled:opacity-50"
                                >
                                    {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={15} />}
                                    Loginni O'zgartirish
                                </motion.button>
                            </div>
                        </motion.div>
                    )}

                    {/* ── Password Change Tab ───────────────────── */}
                    {activeTab === TAB_IDS.password && (
                        <motion.div
                            key="password"
                            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                            className="p-6 md:p-8 space-y-5"
                        >
                            {/* Info note */}
                            <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-2xl">
                                <AlertCircle size={16} className="text-amber-500 flex-shrink-0 mt-0.5" />
                                <p className="text-xs text-amber-700 font-medium leading-relaxed">
                                    Standart parol <span className="font-mono font-black">terraAcademy</span> dan foydalanayotgan bo'lsangiz, xavfsizlik uchun yangi parol o'rnating.
                                </p>
                            </div>

                            <div>
                                <label className={labelClass}>Yangi parol</label>
                                <div className="relative">
                                    <Lock size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                                    <input
                                        type={showPw.new ? 'text' : 'password'}
                                        value={passwords.newPass}
                                        onChange={(e) => setPasswords(prev => ({ ...prev, newPass: e.target.value }))}
                                        className={inputClass + " pl-11 pr-11"}
                                        placeholder="Kamida 6 ta belgi"
                                    />
                                    <button type="button" onClick={() => togglePw('new')}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors">
                                        {showPw.new ? <EyeOff size={15} /> : <Eye size={15} />}
                                    </button>
                                </div>
                                {passwords.newPass && (
                                    <div className="mt-2 flex items-center gap-2">
                                        <div className="flex gap-1 flex-1">
                                            {[1, 2, 3, 4].map(i => (
                                                <div key={i} className={`h-1 flex-1 rounded-full transition-all ${passwords.newPass.length >= i * 2
                                                    ? passwords.newPass.length >= 8 ? 'bg-emerald-500' : passwords.newPass.length >= 6 ? 'bg-amber-400' : 'bg-red-400'
                                                    : 'bg-slate-200'
                                                    }`} />
                                            ))}
                                        </div>
                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-wide">
                                            {passwords.newPass.length < 6 ? 'Zaif' : passwords.newPass.length < 8 ? 'O\'rtacha' : 'Kuchli'}
                                        </span>
                                    </div>
                                )}
                            </div>

                            <div>
                                <label className={labelClass}>Parolni tasdiqlang</label>
                                <div className="relative">
                                    <Lock size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                                    <input
                                        type={showPw.confirm ? 'text' : 'password'}
                                        value={passwords.confirm}
                                        onChange={(e) => setPasswords(prev => ({ ...prev, confirm: e.target.value }))}
                                        className={inputClass + " pl-11 pr-11"}
                                        placeholder="Parolni qayta kiriting"
                                    />
                                    <button type="button" onClick={() => togglePw('confirm')}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors">
                                        {showPw.confirm ? <EyeOff size={15} /> : <Eye size={15} />}
                                    </button>
                                </div>
                                {passwords.confirm && passwords.newPass && (
                                    <p className={`text-xs mt-1.5 font-bold flex items-center gap-1 ${passwords.confirm === passwords.newPass ? 'text-emerald-600' : 'text-red-500'}`}>
                                        {passwords.confirm === passwords.newPass
                                            ? <><CheckCircle2 size={12} /> Parollar mos</>
                                            : <><AlertCircle size={12} /> Parollar mos emas</>
                                        }
                                    </p>
                                )}
                            </div>

                            <div className="flex justify-end pt-2">
                                <motion.button
                                    whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}
                                    onClick={handleChangePassword}
                                    disabled={saving || !passwords.newPass || passwords.newPass !== passwords.confirm || passwords.newPass.length < 6}
                                    className="flex items-center gap-2 px-8 py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-black rounded-2xl shadow-xl shadow-blue-500/20 transition-all text-xs uppercase tracking-widest disabled:opacity-50"
                                >
                                    {saving ? <Loader2 size={16} className="animate-spin" /> : <Lock size={15} />}
                                    Parolni O'zgartirish
                                </motion.button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};

export default ProfileSettings;
