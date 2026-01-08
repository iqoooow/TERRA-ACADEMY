import React from 'react';
import Table, { TableRow, TableCell } from '../../components/ui/Table';

const ChildPerformance = () => {
    const grades = [
        { subject: 'React Frontend', assessment: 'Midterm', score: '95', date: '2026-01-10', feedback: 'Excellent work!' },
        { subject: 'React Frontend', assessment: 'Homework 4', score: '100', date: '2026-01-05', feedback: 'Perfect.' },
        { subject: 'English', assessment: 'Speaking', score: '85', date: '2025-12-28', feedback: 'Good fluency.' },
    ];

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-800">Performance Monitor</h1>
                <p className="text-gray-500 text-sm">Detailed academic report for Azizbek Tursunov</p>
            </div>

            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
                <h3 className="font-bold text-gray-800 mb-4">Recent Grades</h3>
                <Table headers={['Subject', 'Assessment', 'Score', 'Date', 'Teacher Feedback']}>
                    {grades.map((grade, i) => (
                        <TableRow key={i}>
                            <TableCell className="font-medium">{grade.subject}</TableCell>
                            <TableCell>{grade.assessment}</TableCell>
                            <TableCell>
                                <span className="bg-green-100 text-green-700 px-2 py-1 rounded-lg text-xs font-bold">
                                    {grade.score}
                                </span>
                            </TableCell>
                            <TableCell>{grade.date}</TableCell>
                            <TableCell className="text-sm text-gray-500 italic">"{grade.feedback}"</TableCell>
                        </TableRow>
                    ))}
                </Table>
            </div>
        </div>
    );
};

export default ChildPerformance;
