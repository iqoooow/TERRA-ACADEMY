import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { GraduationCap, Users, UserRound, ArrowLeft, CheckCircle2, Shield } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const Register = () => {
    const navigate = useNavigate();
    const { register } = useAuth();
    const [step, setStep] = useState(1);
    const [selectedRole, setSelectedRole] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    const [formData, setFormData] = useState({
        first_name: '',
        last_name: '',
        email: '',
        phone: '',
        birth_date: '',
        password: '',
        password_confirm: ''
    });

    const roles = [
        { id: 'teacher', title: 'Teacher', icon: GraduationCap, description: 'Manage classes, students and grades', color: 'blue' },
        { id: 'student', title: 'Student', icon: UserRound, description: 'Learn, complete tasks and track progress', color: 'indigo' },
        { id: 'parent', title: 'Parent', icon: Users, description: 'Monitor child performance and payments', color: 'purple' }
    ];

    const handleRoleSelect = (roleId) => {
        setSelectedRole(roleId);
        setStep(2);
    };

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        if (formData.password !== formData.password_confirm) {
            setError('Parollar bir-biriga mos kelmadi');
            setIsLoading(false);
            return;
        }

        try {
            const { supabase } = await import('../../lib/supabase');

            // If role is parent, verify student_code exists first
            let studentToLink = null;
            if (selectedRole === 'parent' && formData.student_code) {
                const { data: studentData, error: studentError } = await supabase
                    .from('profiles')
                    .select('id, first_name, last_name')
                    .eq('student_code', formData.student_code.toUpperCase())
                    .eq('role', 'student')
                    .single();

                if (studentError || !studentData) {
                    setError('Farzand kodi notoʻgʻri yoki bunday oʻquvchi topilmadi');
                    setIsLoading(false);
                    return;
                }
                studentToLink = studentData;
            }

            // Register with Supabase
            const metadata = {
                full_name: `${formData.first_name} ${formData.last_name}`,
                role: selectedRole,
            };

            const { success, user, error: regError } = await register(formData.email, formData.password, metadata);

            if (success) {
                console.log('User registered successfully:', user.id);
                // Update profile with extra fields
                const { error: profileError } = await supabase
                    .from('profiles')
                    .update({
                        first_name: formData.first_name,
                        last_name: formData.last_name,
                        phone: formData.phone,
                        birth_date: formData.birth_date,
                        status: 'pending'
                    })
                    .eq('id', user.id);

                if (profileError) {
                    console.error('Profile update error:', profileError);
                } else {
                    console.log('Profile updated successfully');
                }

                // Create link if student code was provided
                if (studentToLink) {
                    console.log('Attempting to link parent to student:', studentToLink.id);
                    const { error: linkError } = await supabase
                        .from('parent_student')
                        .insert({
                            parent_id: user.id,
                            student_id: studentToLink.id,
                            status: 'pending'
                        });

                    if (linkError) {
                        console.error('Link creation error:', linkError);
                        alert('Xatolik: Talabani bogʻlashda xato yuz berdi: ' + linkError.message);
                    } else {
                        console.log('Parent-student link created successfully');
                    }
                }

                setSuccess(true);
            } else {
                setError(regError || 'Roʻyxatdan oʻtishda xatolik yuz berdi');
            }
        } catch (err) {
            console.error('Unexpected error in handleSubmit:', err);
            setError('Tizim xatoligi: ' + err.message);
        } finally {
            setIsLoading(false);
        }
    };

    if (success) {
        return (
            <div className="flex min-h-screen bg-gray-900 items-center justify-center p-4">
                <div className="max-w-md w-full bg-white/10 backdrop-blur-lg border border-white/10 p-8 rounded-2xl shadow-2xl text-center animate-fade-in">
                    <div className="flex justify-center mb-6">
                        <div className="p-4 bg-green-500 rounded-full shadow-lg shadow-green-500/50">
                            <CheckCircle2 size={48} className="text-white" />
                        </div>
                    </div>
                    <h2 className="text-3xl font-bold text-white mb-4">Muvaffaqiyatli!</h2>
                    <p className="text-gray-300 mb-8">
                        Roʻyxatdan oʻtish arizangiz qabul qilindi. Admin tasdiqlamaguncha tizimga kira olmaysiz.
                    </p>
                    <Link
                        to="/login"
                        className="inline-block w-full py-3 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold rounded-lg transition-all"
                    >
                        Kirish sahifasiga qaytish
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="flex min-h-screen bg-gray-900 overflow-hidden relative font-sans text-gray-100 p-4">
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600 rounded-full blur-[120px] opacity-20"></div>
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-600 rounded-full blur-[120px] opacity-20"></div>

            <div className="z-10 w-full max-w-4xl m-auto">
                <div className="text-center mb-8">
                    <h1 className="text-4xl font-bold tracking-tight text-white mb-2">TERRA ACADEMY</h1>
                    <p className="text-gray-400">Roʻyxatdan oʻtish va ta’limni boshlang</p>
                </div>

                {step === 1 ? (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-fade-in-up">
                        {roles.map((role) => (
                            <button
                                key={role.id}
                                onClick={() => handleRoleSelect(role.id)}
                                className="group relative bg-white/5 backdrop-blur-md border border-white/10 p-8 rounded-2xl hover:border-blue-500/50 hover:bg-white/10 transition-all text-center flex flex-col items-center cursor-pointer"
                            >
                                <div className={`p-4 bg-${role.color}-500/20 rounded-2xl mb-6 group-hover:scale-110 transition-transform`}>
                                    <role.icon size={48} className={`text-${role.color}-400`} />
                                </div>
                                <h3 className="text-xl font-bold text-white mb-2">{role.title}</h3>
                                <p className="text-sm text-gray-400 leading-relaxed">{role.description}</p>
                                <div className="mt-6 px-4 py-2 bg-white/5 rounded-full text-xs font-medium text-gray-300 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                                    Tanlash
                                </div>
                            </button>
                        ))}
                    </div>
                ) : (
                    <div className="max-w-2xl mx-auto bg-white/10 backdrop-blur-lg border border-white/10 p-8 rounded-2xl shadow-2xl animate-fade-in-right">
                        <button
                            onClick={() => setStep(1)}
                            className="flex items-center text-gray-400 hover:text-white mb-6 transition-colors"
                        >
                            <ArrowLeft size={18} className="mr-2" />
                            Rolni qayta tanlash
                        </button>

                        <h2 className="text-2xl font-bold text-white mb-6 capitalize">{selectedRole} Roʻyxatdan oʻtish</h2>

                        {error && (
                            <div className="mb-6 p-3 bg-red-500/10 border border-red-500/50 rounded text-red-400 text-sm text-center">
                                {error}
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1">Ism</label>
                                <input
                                    name="first_name"
                                    type="text"
                                    required
                                    onChange={handleChange}
                                    className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-white"
                                    placeholder="Ismingiz"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1">Familya</label>
                                <input
                                    name="last_name"
                                    type="text"
                                    required
                                    onChange={handleChange}
                                    className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-white"
                                    placeholder="Familyangiz"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1">Email</label>
                                <input
                                    name="email"
                                    type="email"
                                    required
                                    onChange={handleChange}
                                    className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-white"
                                    placeholder="email@example.com"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1">Telefon raqam</label>
                                <input
                                    name="phone"
                                    type="tel"
                                    required
                                    onChange={handleChange}
                                    className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-white"
                                    placeholder="+998 90 123 45 67"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1">Tugʻilgan sana</label>
                                <input
                                    name="birth_date"
                                    type="date"
                                    required
                                    onChange={handleChange}
                                    className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-white"
                                />
                            </div>
                            <div className="hidden md:block"></div>
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1">Parol</label>
                                <input
                                    name="password"
                                    type="password"
                                    required
                                    onChange={handleChange}
                                    className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-white"
                                    placeholder="••••••••"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1">Parolni tasdiqlash</label>
                                <input
                                    name="password_confirm"
                                    type="password"
                                    required
                                    onChange={handleChange}
                                    className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-white"
                                    placeholder="••••••••"
                                />
                            </div>

                            {selectedRole === 'parent' && (
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-blue-400 mb-1 flex items-center gap-2">
                                        <Shield size={16} /> Farzand kodi (Student Code)
                                    </label>
                                    <input
                                        name="student_code"
                                        type="text"
                                        required
                                        onChange={handleChange}
                                        className="w-full px-4 py-3 bg-blue-500/10 border border-blue-500/30 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-white font-mono uppercase tracking-widest"
                                        placeholder="STU-XXXXXX"
                                    />
                                    <p className="text-xs text-gray-500 mt-2">
                                        Oʻquvchiga berilgan maxsus kodni kiriting. Bu farzandingizni profilingizga bogʻlash uchun kerak.
                                    </p>
                                </div>
                            )}

                            <div className="md:col-span-2 mt-4">
                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className={`w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold rounded-lg shadow-lg shadow-blue-600/30 transition-all transform hover:scale-[1.01] active:scale-[0.99] ${isLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
                                >
                                    {isLoading ? 'Yuborilmoqda...' : 'Roʻyxatdan oʻtish'}
                                </button>
                            </div>
                        </form>
                    </div>
                )}

                <div className="mt-8 text-center">
                    <p className="text-gray-500 text-sm">
                        Akkauntingiz bormi? <Link to="/login" className="text-blue-400 hover:text-blue-300 font-medium">Kirish</Link>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Register;
