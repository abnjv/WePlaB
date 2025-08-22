import React from 'react';

const SettingsModal = ({
    userName,
    setUserName,
    userAvatar,
    setUserAvatar,
    avatars,
    onClose,
    onSave,
}) => {
    return (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-90 flex items-center justify-center z-50 animate-fade-in">
            <div className="bg-gray-800 rounded-lg p-6 max-w-lg mx-auto shadow-lg text-right transform scale-95 md:scale-100 transition-transform">
                <h3 className="text-2xl font-bold mb-4">إعدادات المستخدم</h3>
                <div className="mb-4">
                    <label className="block text-gray-400 mb-2">اسم المستخدم</label>
                    <input
                        type="text"
                        className="w-full p-3 bg-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                        value={userName}
                        onChange={(e) => setUserName(e.target.value)}
                    />
                </div>
                <div className="mb-4">
                    <label className="block text-gray-400 mb-2">الصورة الرمزية</label>
                    <select
                        className="w-full p-3 bg-gray-700 rounded-lg text-center appearance-none cursor-pointer"
                        value={userAvatar}
                        onChange={(e) => setUserAvatar(e.target.value)}
                    >
                        {avatars.map((ava, index) => (
                            <option key={index} value={ava}>{ava}</option>
                        ))}
                    </select>
                </div>
                <div className="flex justify-end space-x-2 mt-4">
                    <button onClick={onClose} className="px-6 py-2 bg-gray-600 rounded-lg hover:bg-gray-500">إلغاء</button>
                    <button onClick={onSave} className="px-6 py-2 bg-teal-600 rounded-lg hover:bg-teal-700">حفظ</button>
                </div>
            </div>
        </div>
    );
};

export default SettingsModal;
