import React, { useContext, useState, useEffect } from 'react';
import { GameContext } from '../context/GameContext';
import { avatars } from '../constants';

const Profile = () => {
    const { state, dispatch, handleUpdateProfile } = useContext(GameContext);
    const { userName, userAvatar, auth } = state;

    const [newUserName, setNewUserName] = useState(userName);
    const [newUserAvatar, setNewUserAvatar] = useState(userAvatar);

    useEffect(() => {
        setNewUserName(userName);
        setNewUserAvatar(userAvatar);
    }, [userName, userAvatar]);

    const handleSave = () => {
        handleUpdateProfile(newUserName, newUserAvatar);
        // The context now handles the navigation back to the lobby
    };

    return (
        <div className="w-full max-w-2xl p-8 space-y-6 bg-gray-800 rounded-lg shadow-lg text-white">
            <h2 className="text-3xl font-bold text-center">Profile</h2>
            <div className="flex flex-col items-center space-y-4">
                <span className="text-8xl">{newUserAvatar}</span>
                <p className="text-xl text-gray-400">{auth?.currentUser?.email}</p>
            </div>

            <div className="space-y-4">
                <div>
                    <label className="block mb-2 text-sm font-medium text-gray-300">Change Display Name</label>
                    <input
                        type="text"
                        value={newUserName}
                        onChange={(e) => setNewUserName(e.target.value)}
                        className="w-full p-3 bg-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>
                <div>
                    <label className="block mb-2 text-sm font-medium text-gray-300">Change Avatar</label>
                     <select
                        className="w-full p-3 bg-gray-700 rounded-lg text-center appearance-none cursor-pointer"
                        value={newUserAvatar}
                        onChange={(e) => setNewUserAvatar(e.target.value)}
                    >
                        {avatars.map((ava, index) => (
                            <option key={index} value={ava}>{ava}</option>
                        ))}
                    </select>
                </div>
            </div>

            <div className="flex justify-center space-x-4 pt-4">
                <button onClick={() => dispatch({ type: 'SET_CURRENT_VIEW', payload: 'lobby' })} className="py-3 px-6 bg-gray-600 hover:bg-gray-500 rounded-lg text-white font-semibold">
                    Back to Lobby
                </button>
                <button onClick={() => dispatch({ type: 'SET_CURRENT_VIEW', payload: 'friends' })} className="py-3 px-6 bg-blue-600 hover:bg-blue-700 rounded-lg text-white font-semibold">
                    Friends
                </button>
                <button onClick={handleSave} className="py-3 px-6 bg-green-600 hover:bg-green-700 rounded-lg text-white font-semibold">
                    Save Changes
                </button>
            </div>
        </div>
    );
};

export default Profile;
