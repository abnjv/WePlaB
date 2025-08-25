import React, { useContext, useState } from 'react';
import { GameContext } from '../context/GameContext';

const Friends = ({ switchToProfile }) => {
    const { state, sendFriendRequest, acceptFriendRequest, declineFriendRequest, removeFriend } = useContext(GameContext);
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
                <h2 className="text-3xl font-bold">Friends</h2>
                <button onClick={switchToProfile} className="py-2 px-4 bg-gray-600 hover:bg-gray-500 rounded-lg font-semibold">
                    Back to Profile
                </button>
            </div>

            {/* Add Friend */}
            <div className="p-4 bg-gray-700 rounded-lg">
                <h3 className="text-xl font-semibold mb-2">Add Friend</h3>
                <div className="flex space-x-2">
                    <input
                        type="text"
                        placeholder="Enter User ID"
                        value={searchId}
                        onChange={(e) => setSearchId(e.target.value)}
                        className="flex-grow p-2 bg-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button onClick={handleSendRequest} className="px-4 bg-blue-600 hover:bg-blue-700 rounded-md font-semibold">Send Request</button>
                </div>
            </div>

            {/* Friend Requests */}
            <div>
                <h3 className="text-xl font-semibold mb-2">Incoming Friend Requests ({friendRequests.length})</h3>
                {friendRequests.length > 0 ? (
                    <ul className="space-y-2">
                        {friendRequests.map(req => (
                            <li key={req.from} className="flex items-center justify-between p-3 bg-gray-700 rounded-lg">
                                <div className="flex items-center space-x-3">
                                    <span className="text-3xl">{req.avatar}</span>
                                    <span className="font-bold">{req.name}</span>
                                </div>
                                <div className="flex space-x-2">
                                    <button onClick={() => acceptFriendRequest(req)} className="px-3 py-1 bg-green-500 hover:bg-green-600 rounded-md text-sm">Accept</button>
                                    <button onClick={() => declineFriendRequest(req)} className="px-3 py-1 bg-red-500 hover:bg-red-600 rounded-md text-sm">Decline</button>
                                </div>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p className="text-gray-400">No new friend requests.</p>
                )}
            </div>

            {/* Friends List */}
            <div>
                <h3 className="text-xl font-semibold mb-2">Friends List ({friends.length})</h3>
                {friends.length > 0 ? (
                    <ul className="space-y-2">
                         {friends.map(friendId => (
                            <li key={friendId} className="flex items-center justify-between p-3 bg-gray-700 rounded-lg">
                                <span className="font-bold">{friendId}</span> {/* In a real app, we'd fetch friend details */}
                                <button onClick={() => removeFriend(friendId)} className="px-3 py-1 bg-red-500 hover:bg-red-600 rounded-md text-sm">Remove</button>
                            </li>
                         ))}
                    </ul>
                ) : (
                    <p className="text-gray-400">You don't have any friends yet.</p>
                )}
            </div>
        </div>
    );
};

export default Friends;
