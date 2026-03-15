import toast from 'react-hot-toast';
import { AlertTriangle, Trash2, RefreshCw } from 'lucide-react';

/**
 * confirmToast — window.confirm() replacement using react-hot-toast.
 * Returns a Promise<boolean>: true = confirmed, false = cancelled.
 *
 * @param {string} message   — question text
 * @param {object} options
 *   @param {'danger'|'warning'} options.type  — color scheme
 *   @param {string} options.confirmLabel      — confirm button label (default: "Ha, o'chirish")
 *   @param {string} options.cancelLabel       — cancel button label (default: "Bekor")
 */
export const confirmToast = (message, options = {}) => {
    const {
        type = 'danger',
        confirmLabel = "Ha, bajarish",
        cancelLabel = "Bekor",
    } = options;

    return new Promise((resolve) => {
        toast.custom(
            (t) => (
                <div
                    className={`
                        flex flex-col gap-3 bg-white rounded-2xl shadow-2xl border p-4 w-80
                        ${t.visible ? 'animate-enter' : 'animate-leave'}
                        ${type === 'danger' ? 'border-rose-100' : 'border-amber-100'}
                    `}
                >
                    <div className="flex items-start gap-3">
                        <div className={`p-2 rounded-xl shrink-0 ${type === 'danger' ? 'bg-rose-50 text-rose-500' : 'bg-amber-50 text-amber-500'}`}>
                            {type === 'danger' ? <Trash2 size={16} /> : <AlertTriangle size={16} />}
                        </div>
                        <p className="text-sm font-semibold text-slate-800 leading-snug pt-0.5">{message}</p>
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={() => { toast.dismiss(t.id); resolve(false); }}
                            className="flex-1 py-2 text-xs font-black uppercase tracking-widest bg-slate-100 text-slate-500 rounded-xl hover:bg-slate-200 transition-all"
                        >
                            {cancelLabel}
                        </button>
                        <button
                            onClick={() => { toast.dismiss(t.id); resolve(true); }}
                            className={`flex-1 py-2 text-xs font-black uppercase tracking-widest text-white rounded-xl transition-all
                                ${type === 'danger'
                                    ? 'bg-rose-500 hover:bg-rose-600 shadow-lg shadow-rose-500/30'
                                    : 'bg-amber-500 hover:bg-amber-600 shadow-lg shadow-amber-500/30'
                                }
                            `}
                        >
                            {confirmLabel}
                        </button>
                    </div>
                </div>
            ),
            { duration: Infinity, position: 'top-center' }
        );
    });
};
