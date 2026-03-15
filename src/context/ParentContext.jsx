import { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';
import { parseScore } from '../utils/parseScore';

const ParentContext = createContext({
    children: [],
    selectedChild: null,
    selectChild: () => {},
    loading: false,
    refreshChildren: () => {}
});

export const useParent = () => useContext(ParentContext);

export const ParentProvider = ({ children: componentChildren }) => {
    const { user } = useAuth();
    const [childrenList, setChildrenList] = useState([]);
    const [selectedChild, setSelectedChild] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (user?.id && user?.role === 'parent') {
            fetchChildren();
        } else {
            setLoading(false);
        }
    }, [user?.id]);

    const fetchChildren = async () => {
        try {
            const { data: linkedChildren, error } = await supabase
                .from('parent_student')
                .select(`
                    student_id,
                    status,
                    student:student_id (
                        id,
                        full_name,
                        first_name,
                        student_code,
                        enrollments (
                            group_id,
                            groups ( name )
                        )
                    )
                `)
                .eq('parent_id', user.id)
                .eq('status', 'approved');

            if (error) throw error;

            const childrenData = await Promise.all((linkedChildren || []).map(async (item) => {
                const child = item.student;
                if (!child) return null;

                const [gradesResult, attendanceResult, paymentsResult] = await Promise.all([
                    supabase.from('grades').select('score').eq('student_id', child.id),
                    supabase.from('attendance').select('status').eq('student_id', child.id),
                    supabase.from('monthly_payments').select('status')
                        .eq('student_id', child.id)
                        .order('payment_year', { ascending: false })
                        .order('payment_month', { ascending: false })
                        .limit(1)
                ]);

                let scoreSum = 0, scoreCount = 0;
                (gradesResult.data || []).forEach(g => {
                    if (g.score !== null && g.score !== undefined && g.score !== '') {
                        scoreSum += parseScore(g.score);
                        scoreCount++;
                    }
                });

                const totalDays = attendanceResult.data?.length || 0;
                const presentDays = attendanceResult.data?.filter(a => a.status === 'present').length || 0;

                return {
                    id: child.id,
                    name: child.full_name,
                    shortName: child.first_name,
                    code: child.student_code,
                    groups: child.enrollments?.map(e => e.groups?.name).filter(Boolean).join(', ') || "Kurslar yo'q",
                    gpa: scoreCount > 0 ? Math.round(scoreSum / scoreCount) + '%' : '—',
                    attendance: totalDays > 0 ? Math.round((presentDays / totalDays) * 100) + '%' : '—',
                    isPaymentDue: !paymentsResult.data?.[0] || ['pending', 'overdue', 'partially_paid'].includes(paymentsResult.data[0]?.status)
                };
            }));

            const validChildren = childrenData.filter(Boolean);
            setChildrenList(validChildren);

            // Restore selected child from sessionStorage or auto-select if only one child
            const savedId = sessionStorage.getItem('terra_selected_child_id');
            if (savedId) {
                const found = validChildren.find(c => c.id === savedId);
                if (found) {
                    setSelectedChild(found);
                } else if (validChildren.length === 1) {
                    setSelectedChild(validChildren[0]);
                    sessionStorage.setItem('terra_selected_child_id', validChildren[0].id);
                }
            } else if (validChildren.length === 1) {
                setSelectedChild(validChildren[0]);
                sessionStorage.setItem('terra_selected_child_id', validChildren[0].id);
            }
        } catch (err) {
            console.error('ParentContext: error fetching children', err);
        } finally {
            setLoading(false);
        }
    };

    const selectChild = (child) => {
        setSelectedChild(child);
        if (child?.id) {
            sessionStorage.setItem('terra_selected_child_id', child.id);
        } else {
            sessionStorage.removeItem('terra_selected_child_id');
        }
    };

    return (
        <ParentContext.Provider value={{
            children: childrenList,
            selectedChild,
            selectChild,
            loading,
            refreshChildren: fetchChildren
        }}>
            {componentChildren}
        </ParentContext.Provider>
    );
};
