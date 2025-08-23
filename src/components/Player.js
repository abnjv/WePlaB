import React from 'react';

const Player = ({ player, location }) => {
    return (
        <div
            className="absolute transition-all duration-300 ease-in-out"
            style={{
                left: `${location.x}%`,
                top: `${location.y}%`,
                transform: 'translate(-50%, -50%)'
            }}
        >
            <div className="flex flex-col items-center">
                <span className="text-4xl">{player.avatar}</span>
                <span className="bg-gray-900/50 text-white text-xs font-bold px-2 py-1 rounded-full -mt-2">{player.name}</span>
            </div>
        </div>
    );
};

export default Player;
