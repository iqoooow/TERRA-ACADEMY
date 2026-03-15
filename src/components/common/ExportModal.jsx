import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, FileText, FileSpreadsheet, Download, CheckCircle2, Loader2 } from 'lucide-react';
import { exportToPDF, exportToExcel } from '../../utils/exportUtils';
import ModalPortal from './ModalPortal';
import toast from 'react-hot-toast';

/**
 * ExportModal — professional format-selection modal for PDF / Excel export.
 *
 * Props:
 *   isOpen    {boolean}   — controls visibility
 *   onClose   {function}  — called when modal dismissed
 *   title     {string}    — report title (e.g. "O'quvchilar")
 *   headers   {string[]}  — column headers
 *   rows      {any[][]}   — data rows (array of arrays, already formatted)
 *   filename  {string}    — base filename without extension
 */
const ExportModal = ({ isOpen, onClose, title, headers, rows, filename }) => {
    const [loadingFormat, setLoadingFormat] = useState(null); // 'pdf' | 'excel' | null
    const [done, setDone] = useState(null);

    const handleExport = async (format) => {
        if (!rows || rows.length === 0) {
            toast.error("Eksport qilish uchun ma'lumot yo'q");
            return;
        }
        setLoadingFormat(format);
        // Give React a tick to render loading state before the sync export
        await new Promise(r => setTimeout(r, 80));
        try {
            if (format === 'pdf') {
                exportToPDF(title, headers, rows, filename);
            } else {
                exportToExcel(title, headers, rows, filename);
            }
            setDone(format);
            toast.success(`${format.toUpperCase()} fayl yuklab olindi!`);
            setTimeout(() => {
                setDone(null);
                onClose();
            }, 1200);
        } catch (err) {
            console.error('Export error:', err);
            toast.error("Eksportda xatolik yuz berdi");
        } finally {
            setLoadingFormat(null);
        }
    };

    const handleClose = () => {
        if (loadingFormat) return;
        setDone(null);
        onClose();
    };

    return (
        <ModalPortal>
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                        onClick={handleClose}
                    />

                    {/* Modal */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        transition={{ type: 'spring', damping: 22, stiffness: 300 }}
                        className="relative z-10 w-full max-w-md bg-white rounded-[2rem] shadow-2xl overflow-hidden"
                    >
                        {/* Decorative top band */}
                        <div className="h-1.5 w-full bg-gradient-to-r from-blue-500 via-indigo-500 to-violet-500" />

                        {/* Header */}
                        <div className="px-8 pt-7 pb-5 flex items-start justify-between">
                            <div>
                                <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-[10px] font-black uppercase tracking-widest mb-3">
                                    <Download size={11} />
                                    Yuklab olish
                                </div>
                                <h2 className="text-2xl font-black text-slate-900 tracking-tight leading-tight">
                                    {title} <br />
                                    <span className="text-slate-400 text-base font-bold tracking-normal">formatni tanlang</span>
                                </h2>
                                {rows?.length > 0 && (
                                    <p className="text-xs text-slate-400 font-medium mt-1">
                                        {rows.length} ta yozuv eksport qilinadi
                                    </p>
                                )}
                            </div>
                            <button
                                onClick={handleClose}
                                disabled={!!loadingFormat}
                                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all disabled:opacity-40"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Format Cards */}
                        <div className="px-8 pb-8 grid grid-cols-2 gap-4">
                            {/* PDF */}
                            <FormatCard
                                format="pdf"
                                label="PDF"
                                ext=".pdf"
                                description="Chop etish va ulashish uchun ideal. Chiroyli jadvalli hisobot."
                                icon={FileText}
                                colorFrom="from-rose-500"
                                colorTo="to-red-600"
                                bgLight="bg-rose-50"
                                textColor="text-rose-600"
                                borderColor="border-rose-100 hover:border-rose-300"
                                loading={loadingFormat === 'pdf'}
                                done={done === 'pdf'}
                                disabled={!!loadingFormat && loadingFormat !== 'pdf'}
                                onClick={() => handleExport('pdf')}
                            />

                            {/* Excel */}
                            <FormatCard
                                format="excel"
                                label="Excel"
                                ext=".xlsx"
                                description="Tahrirlash va tahlil qilish uchun. Microsoft Excel formatida."
                                icon={FileSpreadsheet}
                                colorFrom="from-emerald-500"
                                colorTo="to-green-600"
                                bgLight="bg-emerald-50"
                                textColor="text-emerald-600"
                                borderColor="border-emerald-100 hover:border-emerald-300"
                                loading={loadingFormat === 'excel'}
                                done={done === 'excel'}
                                disabled={!!loadingFormat && loadingFormat !== 'excel'}
                                onClick={() => handleExport('excel')}
                            />
                        </div>

                        {/* Footer note */}
                        <div className="px-8 pb-6 -mt-2">
                            <p className="text-[10px] text-slate-400 font-medium text-center uppercase tracking-widest">
                                Fayl qurilmangizga avtomatik yuklanadi
                            </p>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
        </ModalPortal>
    );
};

// ── Sub-component ──────────────────────────────────────────────────────────
const FormatCard = ({
    label, ext, description, icon: Icon,
    colorFrom, colorTo, bgLight, textColor, borderColor,
    loading, done, disabled, onClick
}) => (
    <button
        onClick={onClick}
        disabled={disabled || loading}
        className={`
            relative flex flex-col items-center text-center p-6 rounded-[1.5rem] border-2
            transition-all duration-200 group
            ${borderColor}
            ${disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer hover:shadow-xl hover:-translate-y-0.5 active:scale-95'}
            ${done ? 'border-current' : ''}
            bg-white
        `}
    >
        {/* Icon container */}
        <div className={`w-16 h-16 rounded-2xl ${bgLight} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
            {loading ? (
                <Loader2 size={32} className={`${textColor} animate-spin`} />
            ) : done ? (
                <CheckCircle2 size={32} className={textColor} />
            ) : (
                <Icon size={32} className={textColor} />
            )}
        </div>

        {/* Label */}
        <div className={`font-black text-xl tracking-tight ${textColor} mb-0.5`}>
            {label}
        </div>
        <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">
            {ext}
        </div>

        {/* Description */}
        <p className="text-[11px] text-slate-500 font-medium leading-relaxed">
            {description}
        </p>

        {/* Download indicator */}
        {!loading && !done && (
            <div className={`mt-4 px-4 py-1.5 rounded-full bg-gradient-to-r ${colorFrom} ${colorTo} text-white text-[9px] font-black uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity duration-200`}>
                Yuklab olish
            </div>
        )}
        {loading && (
            <div className={`mt-4 px-4 py-1.5 rounded-full ${bgLight} ${textColor} text-[9px] font-black uppercase tracking-widest`}>
                Tayyorlanmoqda...
            </div>
        )}
        {done && (
            <div className={`mt-4 px-4 py-1.5 rounded-full ${bgLight} ${textColor} text-[9px] font-black uppercase tracking-widest`}>
                Tayyor ✓
            </div>
        )}
    </button>
);

export default ExportModal;
