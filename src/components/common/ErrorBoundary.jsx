import React from 'react';
import { AlertTriangle, RefreshCcw, Home } from 'lucide-react';
import { motion } from 'framer-motion';

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        console.error('ErrorBoundary caught an error:', error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="max-w-md w-full glass-card p-10 text-center bg-white border border-slate-200 shadow-2xl rounded-[3rem]"
                    >
                        <div className="w-20 h-20 bg-rose-50 text-rose-600 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-inner">
                            <AlertTriangle size={40} />
                        </div>
                        <h1 className="text-3xl font-black text-slate-900 mb-4 tracking-tight">Kutilmagan xatolik!</h1>
                        <p className="text-slate-500 font-medium mb-10 leading-relaxed">
                            Tizimda nosozlik yuz berdi. Iltimos, sahifani yangilang yoki asosiy sahifaga qayting.
                        </p>

                        <div className="space-y-4">
                            <button
                                onClick={() => window.location.reload()}
                                className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest text-xs flex items-center justify-center gap-3 hover:bg-slate-800 transition-all shadow-lg active:scale-95"
                            >
                                <RefreshCcw size={18} />
                                Sahifani yangilash
                            </button>
                            <a
                                href="/"
                                className="w-full py-4 bg-white text-slate-600 border border-slate-200 rounded-2xl font-black uppercase tracking-widest text-xs flex items-center justify-center gap-3 hover:bg-slate-50 transition-all active:scale-95"
                            >
                                <Home size={18} />
                                Bosh sahifaga
                            </a>
                        </div>

                        {process.env.NODE_ENV === 'development' && (
                            <div className="mt-8 pt-8 border-t border-slate-100">
                                <p className="text-[10px] font-black text-rose-400 uppercase tracking-widest mb-2 text-left">Texnik tafsilotlar:</p>
                                <div className="bg-slate-50 p-4 rounded-xl text-left overflow-auto max-h-40">
                                    <code className="text-[10px] text-slate-600 break-all font-mono">
                                        {this.state.error?.toString()}
                                    </code>
                                </div>
                            </div>
                        )}
                    </motion.div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
