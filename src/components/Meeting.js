import React, { useContext } from 'react';
import { GameContext } from '../context/GameContext';

const Meeting = ({ voteToEject }) => {
    const { state } = useContext(GameContext);
    const { gameData, userId } = state;
    const meetingVotes = gameData.meetingVotes || {};
    const hasVoted = meetingVotes[userId];

    return (
        <div className="text-center bg-gray-800 p-6 rounded-lg w-full max-w-3xl">
            <h2 className="text-4xl font-bold text-red-500 mb-4 animate-pulse">EMERGENCY MEETING</h2>
            <p className="text-lg text-gray-300 mb-6">
                {hasVoted ? `You voted for ${gameData.players.find(p => p.id === hasVoted)?.name}.` : 'Discuss and vote out the impostor!'}
            </p>

            <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {gameData.players.map(player => (
                    <div key={player.id} className={`flex flex-col items-center p-2 rounded-lg ${player.isEjected ? 'bg-gray-900 opacity-50' : 'bg-gray-700'}`}>
                        <span className="text-4xl">{player.isEjected ? '👻' : player.avatar}</span>
                        <p className="font-bold mt-1 text-white">{player.name}</p>
                        {!player.isEjected && (
                            <button
                                className="mt-2 w-full bg-red-600 hover:bg-red-700 text-white text-sm py-1 rounded disabled:bg-gray-500 disabled:cursor-not-allowed"
                                onClick={() => voteToEject(player.id)}
                                disabled={hasVoted}
                            >
                                {hasVoted === player.id ? 'Voted' : 'Vote'}
                            </button>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default Meeting;
