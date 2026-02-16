import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

// Utility to parse mixed grade strings into a unified percentage (0-100)
// This is "Antigravity" robustness - handles messy real-world data gracefully.
const parseScore = (scoreStr) => {
    if (!scoreStr) return 0;
    const s = scoreStr.toString().toUpperCase().trim();

    // 1. CEFR Mapping
    const cefr = {
        'A1': 30, 'A2': 50,
        'B1': 65, 'B2': 75,
        'C1': 85, 'C2': 95
    };
    if (cefr[s]) return cefr[s];

    // 2. IELTS (0-9)
    // Assume < 9 is likely IELTS score unless it's a very low percentage
    // But let's check for decimal.
    const num = parseFloat(s);
    if (!isNaN(num)) {
        if (num <= 9) return (num / 9) * 100; // IELTS scale
        if (num <= 10) return (num / 10) * 100; // 10-point scale
        if (num <= 100) return num; // 100-point scale
    }

    return 0; // Fallback
};

export const useGroupStats = (groupId) => {
    const [stats, setStats] = useState({ average: 0, students: 0, trend: 0, loading: true });

    useEffect(() => {
        if (!groupId) return;

        const fetchStats = async () => {
            try {
                // 1. Get Enrollments (Student Count)
                const { count: studentCount } = await supabase
                    .from('enrollments')
                    .select('*', { count: 'exact', head: true })
                    .eq('group_id', groupId);

                // 2. Get Grades (Performance)
                const { data: grades } = await supabase
                    .from('grades')
                    .select('score, date')
                    .eq('group_id', groupId)
                    .order('date', { ascending: false });

                // Calculate Average
                const scores = (grades || []).map(g => parseScore(g.score)).filter(s => s > 0);
                const average = scores.length
                    ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
                    : 0; // Default to 0 if no data

                // Calculate Trend (Recent vs Older)
                // Simple logic: avg of last 5 vs avg of previous 5
                let trend = 0;
                if (scores.length >= 2) {
                    const mid = Math.ceil(scores.length / 2);
                    const recent = scores.slice(0, mid).reduce((a, b) => a + b, 0) / mid;
                    const older = scores.slice(mid).reduce((a, b) => a + b, 0) / (scores.length - mid);
                    trend = Math.round(recent - older);
                }

                setStats({
                    average,
                    students: studentCount || 0,
                    trend,
                    loading: false
                });

            } catch (err) {
                console.error("Error fetching group stats:", err);
                setStats({ average: 0, students: 0, trend: 0, loading: false });
            }
        };

        fetchStats();
    }, [groupId]);

    return stats;
};
