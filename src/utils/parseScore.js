/**
 * Converts any score value to a numeric percentage (0-100).
 * Handles: CEFR levels (A1-C2), IELTS (1-9), numeric strings, percentages.
 */
export const parseScore = (scoreStr) => {
    if (!scoreStr && scoreStr !== 0) return 0;
    const s = scoreStr.toString().toUpperCase().trim();

    // CEFR levels
    const cefrMap = { A1: 30, A2: 50, B1: 65, B2: 75, C1: 85, C2: 95 };
    if (cefrMap[s] !== undefined) return cefrMap[s];

    const num = parseFloat(s);
    if (isNaN(num)) return 0;

    // IELTS scale (1–9)
    if (num > 0 && num <= 9 && s.includes('.')) return Math.round((num / 9) * 100);

    // Out of 10
    if (num > 0 && num <= 10) return num * 10;

    // Out of 100
    if (num <= 100) return num;

    return 0;
};

/**
 * Returns a color class based on score percentage.
 */
export const scoreColorClass = (score) => {
    const n = parseScore(score);
    if (n >= 90) return 'bg-emerald-500 text-white shadow-emerald-500/20';
    if (n >= 70) return 'bg-blue-500 text-white shadow-blue-500/20';
    if (n >= 50) return 'bg-amber-500 text-white shadow-amber-500/20';
    return 'bg-rose-500 text-white shadow-rose-500/20';
};
