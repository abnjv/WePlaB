import React, { useContext, useEffect } from 'react';
import { GameContext } from '../context/GameContext';
import { useSound } from '../hooks/useSound';

const PlayerCard = ({ player, status, hasVoted, onVote, canVote, playSound }) => {
    const isDead = status === 'dead';

    const handleVote = () => {
        onVote(player.id);
        playSound('vote');
    };

    return (
        <div className={`relative flex flex-col items-center p-3 rounded-lg transition-all ${isDead ? 'bg-gray-900 opacity-60' : 'bg-gray-700'}`}>
            {hasVoted && <div className="absolute top-1 right-1 text-lg">✔️</div>}
            <span className="text-5xl mb-2">{isDead ? '👻' : player.avatar}</span>
            <p className={`font-bold text-center text-white ${isDead ? 'line-through' : ''}`}>{player.name}</p>
            {!isDead && canVote && (
                <button
                    className="mt-2 w-full bg-red-600 hover:bg-red-700 text-white text-sm font-bold py-1 rounded disabled:bg-gray-500"
                    onClick={handleVote}
                >
                    Vote
                </button>
            )}
        </div>
    );
};

const Meeting = ({ voteToEject }) => {
    const { state } = useContext(GameContext);
    const { gameData, userId } = state;
    const { playSound } = useSound();

    useEffect(() => {
        playSound('meeting_start');
    }, [playSound]);

    if (!gameData || !gameData.playerStatus) return null;

    const { playerStatus, meetingInfo, players, meetingVotes = {} } = gameData;
    const IHaveVoted = meetingVotes[userId];

    const getMeetingReason = () => {
        if (!meetingInfo) return "An emergency meeting has been called!";

        const reporter = players.find(p => p.id === meetingInfo.reporterId);
        const reporterName = reporter ? reporter.name : 'Someone';

        if (meetingInfo.reason === 'body_reported') {
            const victim = players.find(p => p.id === meetingInfo.victimId);
            const victimName = victim ? victim.name : 'someone';
            return `${reporterName} reported ${victimName}'s body!`;
        }
        return `${reporterName} called an emergency meeting!`;
    };

    return (
        <div className="text-center bg-gray-800 p-6 rounded-lg shadow-2xl border border-red-500/50 w-full max-w-4xl">
            <h2 className="text-4xl font-bold text-red-500 mb-2 animate-pulse">EMERGENCY MEETING</h2>
            <p className="text-xl text-yellow-300 mb-6 font-semibold">
                {getMeetingReason()}
            </p>

            <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {players.map(player => (
                    <PlayerCard
                        key={player.id}
                        player={player}
                        status={playerStatus[player.id]}
                        hasVoted={!!meetingVotes[player.id]}
                        onVote={voteToEject}
                        canVote={!IHaveVoted && playerStatus[userId] === 'alive'}
                        playSound={playSound}
                    />
                ))}
            </div>
            <p className="text-lg text-gray-300 mt-6">
                {IHaveVoted ? `You voted. Waiting for other players...` : 'Discuss and vote someone out!'}
            </p>
        </div>
    );
};

export default Meeting;
