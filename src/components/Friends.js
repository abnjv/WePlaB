import React, { useContext, useState } from 'react';
import { GameContext } from '../context/GameContext';

const Friends = ({ switchToProfile, sendFriendRequest, acceptFriendRequest, declineFriendRequest, removeFriend }) => {
    const { state } = useContext(GameContext);
    const { friends, friendRequests } = state;
    const [searchId, setSearchId] = useState('');

    const handleSendRequest = () => {
        if (searchId.trim()) {
            sendFriendRequest(searchId.trim());
            setSearchId('');
        }
    };

    return (
        <div className="w-full max-w-4xl p-8 space-y-8 bg-gray-800 rounded-lg shadow-lg text-white">
            <div className="flex justify-between items-center">
                <h2 className="text-3xl font-bold">الأصدقاء</h2>
                <button onClick={switchToProfile} className="py-2 px-4 bg-gray-600 hover:bg-gray-500 rounded-lg font-semibold">
                    العودة للملف الشخصي
                </button>
            </div>

            {/* Add Friend */}
            <div className="p-4 bg-gray-700 rounded-lg">
                <h3 className="text-xl font-semibold mb-2">إضافة صديق</h3>
                <div className="flex space-x-2 rtl:space-x-reverse">
                    <input
                        type="text"
                        placeholder="أدخل ID المستخدم"
                        value={searchId}
                        onChange={(e) => setSearchId(e.target.value)}
                        className="flex-grow p-2 bg-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button onClick={handleSendRequest} className="px-4 bg-blue-600 hover:bg-blue-700 rounded-md font-semibold">إرسال طلب</button>
                </div>
            </div>

            {/* Friend Requests */}
            <div>
                <h3 className="text-xl font-semibold mb-2">طلبات الصداقة الواردة ({friendRequests.length})</h3>
                {friendRequests.length > 0 ? (
                    <ul className="space-y-2">
                        {friendRequests.map(req => (
                            <li key={req.from} className="flex items-center justify-between p-3 bg-gray-700 rounded-lg">
                                <div className="flex items-center space-x-3 rtl:space-x-reverse">
                                    <span className="text-3xl">{req.avatar}</span>
                                    <span className="font-bold">{req.name}</span>
                                </div>
                                <div className="flex space-x-2 rtl:space-x-reverse">
                                    <button onClick={() => acceptFriendRequest(req)} className="px-3 py-1 bg-green-500 hover:bg-green-600 rounded-md text-sm">قبول</button>
                                    <button onClick={() => declineFriendRequest(req)} className="px-3 py-1 bg-red-500 hover:bg-red-600 rounded-md text-sm">رفض</button>
                                </div>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p className="text-gray-400">لا توجد طلبات صداقة جديدة.</p>
                )}
            </div>

            {/* Friends List */}
            <div>
                <h3 className="text-xl font-semibold mb-2">قائمة الأصدقاء ({friends.length})</h3>
                {friends.length > 0 ? (
                    <ul className="space-y-2">
                         {friends.map(friendId => (
                            <li key={friendId} className="flex items-center justify-between p-3 bg-gray-700 rounded-lg">
                                <span className="font-bold">{friendId}</span> {/* In a real app, we'd fetch friend details */}
                                <button onClick={() => removeFriend(friendId)} className="px-3 py-1 bg-red-500 hover:bg-red-600 rounded-md text-sm">إزالة</button>
                            </li>
                         ))}
                    </ul>
                ) : (
                    <p className="text-gray-400">ليس لديك أصدقاء بعد.</p>
                )}
            </div>
        </div>
    );
};

export default Friends;
