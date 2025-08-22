import React, { useContext } from 'react';
import { GameContext } from '../context/GameContext';

const GameLog = ({ gameLogRef }) => {
    const { state } = useContext(GameContext);
    const { gameLog } = state;

    return (
        <div className="flex flex-col h-full">
            <h3 className="text-xl font-semibold mb-2 text-center text-white">سجل الأحداث</h3>
            <div className="flex-grow bg-gray-900/50 rounded-lg p-2 overflow-y-auto" ref={gameLogRef}>
                {gameLog.map((log, index) => (
                    <div key={index} className="text-sm text-gray-300 mb-1 animate-fade-in">
                        <span className="text-gray-500">[{new Date(log.timestamp?.toDate()).toLocaleTimeString()}]</span> {log.text}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default GameLog;
