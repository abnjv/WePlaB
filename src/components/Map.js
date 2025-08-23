import React, { useContext } from 'react';
import { GameContext } from '../context/GameContext';
import Player from './Player';
import Task from './Task';

const Map = () => {
    const { state } = useContext(GameContext);
    const { playerLocations, gameData, tasks } = state;

    if (!gameData || !playerLocations) {
        return <div>Loading Map...</div>;
    }

    return (
        <div className="w-full h-full bg-gray-600 rounded-lg relative overflow-hidden">
            {/* Render tasks */}
            {tasks.map(task => (
                <Task key={task.id} task={task} />
            ))}

            {/* Render players */}
            {gameData.players.map(player => {
                const location = playerLocations[player.id];
                if (!location) return null;
                return <Player key={player.id} player={player} location={location} />;
            })}
        </div>
    );
};

export default Map;
