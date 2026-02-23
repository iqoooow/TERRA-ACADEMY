import { uz } from 'date-fns/locale';

/**
 * Converts integer month (1-12) and year to a formatted string.
 * @param {number} month 
 * @param {number} year 
 * @returns {string} e.g., "Fevral, 2026"
 */
export const formatMonthYear = (month, year) => {
    if (!month) return '—';
    const date = new Date(year || new Date().getFullYear(), month - 1, 1);
    const monthName = date.toLocaleString('uz-UZ', { month: 'long' });
    // Capitalize first letter
    const capitalized = monthName.charAt(0).toUpperCase() + monthName.slice(1);
    return year ? `${capitalized}, ${year}` : capitalized;
};

/**
 * Standard sorting configuration for payment queries.
 * Usage: .order('payment_year', { ascending: false }).order('payment_month', { ascending: false })
 */
export const paymentSort = (query) => {
    return query
        .order('payment_year', { ascending: false })
        .order('payment_month', { ascending: false });
};

/**
 * Map of payment status IDs to display labels and styles.
 */
export const STATUS_CONFIG = {
    paid: { label: "To'langan", bg: 'bg-emerald-500', text: 'text-white', color: 'text-emerald-600' },
    partially_paid: { label: 'Qisman to\'langan', bg: 'bg-blue-500', text: 'text-white', color: 'text-blue-600' },
    overdue: { label: "Muddati o'tgan", bg: 'bg-rose-500', text: 'text-white', color: 'text-rose-600' },
    pending: { label: "Kutilmoqda", bg: 'bg-amber-500', text: 'text-white', color: 'text-amber-600' },
    cancelled: { label: "Bekor qilingan", bg: 'bg-slate-500', text: 'text-white', color: 'text-slate-600' },
};
