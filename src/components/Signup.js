import React, { useState } from 'react';

const Signup = ({ handleSignup, switchToLogin }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [displayName, setDisplayName] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        handleSignup(email, password, displayName);
    };

    return (
        <div className="w-full max-w-md p-8 space-y-6 bg-gray-800 rounded-lg shadow-lg">
            <h2 className="text-2xl font-bold text-center text-white">إنشاء حساب جديد</h2>
            <form className="space-y-6" onSubmit={handleSubmit}>
                <div>
                    <label className="block mb-2 text-sm font-medium text-gray-300">اسم العرض</label>
                    <input
                        type="text"
                        value={displayName}
                        onChange={(e) => setDisplayName(e.target.value)}
                        className="w-full p-3 bg-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                    />
                </div>
                <div>
                    <label className="block mb-2 text-sm font-medium text-gray-300">البريد الإلكتروني</label>
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full p-3 bg-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                    />
                </div>
                <div>
                    <label className="block mb-2 text-sm font-medium text-gray-300">كلمة المرور</label>
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full p-3 bg-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                    />
                </div>
                <button type="submit" className="w-full py-3 px-4 bg-green-600 hover:bg-green-700 rounded-lg text-white font-semibold">
                    إنشاء حساب
                </button>
            </form>
            <p className="text-center text-gray-400">
                لديك حساب بالفعل؟ <button onClick={switchToLogin} className="text-blue-400 hover:underline">سجل الدخول</button>
            </p>
        </div>
    );
};

export default Signup;
