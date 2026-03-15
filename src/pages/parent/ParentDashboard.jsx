import { BookOpen, Clock, AlertTriangle, ChevronRight, Zap, Target, TrendingUp, DollarSign } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import LoadingScreen from '../../components/common/LoadingScreen';
import { useAuth } from '../../context/AuthContext';
import { useParent } from '../../context/ParentContext';

const ParentDashboard = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const { children, selectedChild, selectChild, loading } = useParent();

    const parentName = user?.profileData?.first_name || user?.name || 'Ota-ona';

    const handleChildClick = (child) => {
        selectChild(child);
        navigate(`/parent/children?id=${child.id}`);
    };

    if (loading) return <LoadingScreen />;

    return (
        <div className="space-y-6 animate-fade-in max-w-[1600px] mx-auto pb-10">
            {/* Premium Header */}
            <div className="relative overflow-hidden rounded-[2.5rem] bg-slate-900 shadow-lg">
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-700 via-teal-700 to-slate-900"></div>
                <div className="absolute -top-16 -right-16 w-52 h-52 bg-emerald-400/10 rounded-full blur-[60px] pointer-events-none"></div>

                <div className="relative z-10 p-5 md:p-10">
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 rounded-full text-[10px] font-black uppercase tracking-widest mb-4 backdrop-blur-md border border-white/10 text-emerald-100 shadow-inner"
                    >
                        <Zap size={12} className="text-emerald-300 fill-emerald-300" />
                        Ota-ona Nazorati
                    </motion.div>
                    <h1 className="text-2xl md:text-4xl font-black text-white tracking-tight mb-3">
                        Xayrli kun, <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-200 to-teal-100">{parentName}</span>!
                    </h1>
                    <p className="text-teal-50/80 font-medium text-sm md:text-base max-w-xl leading-relaxed">
                        Farzandlaringizning ta'lim jarayoni va yutuqlarini doimiy kuzatib boring.
                    </p>
                    {children.length > 0 && (
                        <div className="inline-flex items-center gap-2 mt-4 px-4 py-2 bg-white/10 rounded-full border border-white/10 backdrop-blur-sm">
                            <div className="flex -space-x-2">
                                {children.slice(0, 3).map((c, i) => (
                                    <div key={i} className="w-6 h-6 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 border-2 border-white/20 flex items-center justify-center text-white font-black text-[9px]">
                                        {c.shortName?.charAt(0)}
                                    </div>
                                ))}
                            </div>
                            <span className="text-[10px] font-black text-emerald-200 uppercase tracking-widest">
                                {children.length} ta farzand kuzatilmoqda
                            </span>
                        </div>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {children.length === 0 ? (
                    <div className="lg:col-span-2 glass-card p-12 md:p-20 text-center flex flex-col items-center justify-center rounded-[3rem]">
                        <div className="w-20 h-20 bg-emerald-50 rounded-[2rem] flex items-center justify-center mb-6">
                            <Target size={40} className="text-emerald-300" />
                        </div>
                        <h3 className="text-xl md:text-2xl font-black text-slate-900 mb-2">Farzandlar bog'lanmagan</h3>
                        <p className="text-slate-500 font-medium max-w-sm mb-6 text-sm">
                            Hozircha tizimda sizga biriktirilgan o'quvchilar yo'q. Administrator bilan bog'laning.
                        </p>
                    </div>
                ) : (
                    children.map((child, idx) => (
                        <motion.div
                            key={child.id}
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: idx * 0.1 }}
                            className={`bg-white p-6 md:p-8 rounded-[2rem] border relative overflow-hidden group shadow-sm hover:shadow-md transition-all duration-200 ${
                                selectedChild?.id === child.id
                                    ? 'border-emerald-300 ring-2 ring-emerald-100'
                                    : 'border-slate-100 hover:border-emerald-100'
                            }`}
                        >
                            {selectedChild?.id === child.id && (
                                <div className="absolute top-4 right-4 px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-full text-[9px] font-black uppercase tracking-widest">
                                    Tanlangan
                                </div>
                            )}
                            <div className="flex items-center gap-4 md:gap-6 mb-6">
                                <div className="w-14 h-14 md:w-16 md:h-16 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-[1.5rem] flex items-center justify-center text-white font-black text-2xl shadow-lg shadow-emerald-500/20 group-hover:scale-110 transition-transform duration-500 shrink-0">
                                    {child.shortName?.charAt(0) || child.name?.charAt(0)}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-0.5">{child.code}</div>
                                    <h2 className="text-lg md:text-xl font-black text-slate-900 tracking-tight truncate">{child.name}</h2>
                                    <p className="text-slate-500 font-medium text-xs mt-0.5 truncate">{child.groups}</p>
                                </div>
                                <button
                                    onClick={() => handleChildClick(child)}
                                    className="w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl bg-slate-50 text-slate-400 flex items-center justify-center hover:bg-emerald-600 hover:text-white transition-all shadow-sm hover:shadow-lg hover:shadow-emerald-500/20 shrink-0"
                                >
                                    <ChevronRight size={20} />
                                </button>
                            </div>

                            <div className="grid grid-cols-2 gap-3 mb-5">
                                <div className="p-4 bg-slate-50 rounded-[1.5rem] border border-slate-100 flex flex-col items-center group-hover:bg-white transition-colors">
                                    <TrendingUp className="text-emerald-500 mb-1.5" size={18} />
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">O'rtacha Baho</p>
                                    <p className="text-xl font-black text-slate-900 mt-1">{child.gpa}</p>
                                </div>
                                <div className="p-4 bg-slate-50 rounded-[1.5rem] border border-slate-100 flex flex-col items-center group-hover:bg-white transition-colors">
                                    <Clock className="text-blue-500 mb-1.5" size={18} />
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Davomat</p>
                                    <p className="text-xl font-black text-slate-900 mt-1">{child.attendance}</p>
                                </div>
                            </div>

                            <div className="flex items-center justify-between gap-3">
                                {child.isPaymentDue ? (
                                    <div className="flex-1 flex items-center gap-2 p-3 bg-amber-50 text-amber-700 rounded-xl text-xs font-bold border border-amber-100">
                                        <AlertTriangle size={16} className="text-amber-500 shrink-0" />
                                        <span>To'lov kutilmoqda!</span>
                                    </div>
                                ) : (
                                    <div className="flex-1 flex items-center gap-2 p-3 bg-emerald-50 text-emerald-700 rounded-xl text-xs font-bold border border-emerald-100">
                                        <BookOpen size={16} className="text-emerald-500 shrink-0" />
                                        <span>To'lovlar to'langan</span>
                                    </div>
                                )}
                                <Link
                                    to={`/parent/payments?id=${child.id}`}
                                    onClick={() => selectChild(child)}
                                    className="p-3 bg-slate-900 text-white rounded-xl hover:bg-emerald-600 transition-all shadow-sm hover:shadow-lg hover:shadow-emerald-500/20 shrink-0"
                                >
                                    <DollarSign size={18} />
                                </Link>
                            </div>
                        </motion.div>
                    ))
                )}
            </div>
        </div>
    );
};

export default ParentDashboard;
