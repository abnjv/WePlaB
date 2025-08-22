import React, { useContext } from 'react';
import { GameContext } from '../context/GameContext';

const PlayerList = ({ removePlayer }) => {
    const { state, dispatch } = useContext(GameContext);
    const { gameData, userId, isHost, isMuted } = state;

    if (!gameData || !gameData.players) return null;

    return (
        <div className="w-full">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-2xl font-semibold text-gray-200">
                    اللاعبون ({gameData.players.length}/8)
                </h3>
                <button
                    onClick={() => dispatch({ type: 'TOGGLE_MUTE' })}
                    className={`p-2 rounded-full transition-colors ${isMuted ? 'bg-red-600' : 'bg-gray-600 hover:bg-gray-500'}`}
                >
                    {isMuted ? '🔇' : '🎤'}
                </button>
            </div>
            <ul className="space-y-3">
                {gameData.players.sort((a, b) => (b.score || 0) - (a.score || 0)).map((p) => (
                    <li key={p.id} className="bg-gray-700 p-3 rounded-lg flex justify-between items-center transition-all duration-200">
                        <div className="flex items-center space-x-3 rtl:space-x-reverse">
                            <span className="text-2xl">{p.avatar}</span>
                            <div className="flex flex-col items-start">
                                <span className="font-bold text-white">{p.name}{p.id === userId && ' (أنت)'}</span>
                                <span className="text-xs text-yellow-400">النقاط: {p.score || 0}</span>
                            </div>
                        </div>
                        <div className="flex items-center space-x-2 rtl:space-x-reverse">
                            {p.isHost && <span className="bg-yellow-500 text-yellow-900 text-xs font-bold px-2 py-1 rounded-full">المضيف</span>}
                            {isHost && p.id !== userId && gameData.status === 'waiting' && (
                                <button onClick={() => removePlayer(p.id)} className="text-xs text-red-400 hover:text-red-300">إزالة</button>
                            )}
                        </div>
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default PlayerList;
