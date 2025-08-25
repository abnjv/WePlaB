import React, { useContext } from 'react';
import { GameContext } from '../context/GameContext';
import Player from './Player';
import Task from './Task';
import { spaceWerewolfTasks } from '../constants'; // Import tasks to display them

const Room = ({ name, className, children }) => (
    <div className={`border-2 border-gray-500 rounded-lg flex items-center justify-center relative ${className}`}>
        <span className="absolute top-2 text-white font-bold opacity-50">{name}</span>
        {children}
    </div>
);

const Hallway = ({ className }) => (
    <div className={`bg-gray-700/50 ${className}`}></div>
);

const Map = () => {
    const { state } = useContext(GameContext);
    const { playerLocations, gameData, userId } = state;

    if (!gameData || !playerLocations) {
        return <div>Loading Map...</div>;
    }

    const myRole = gameData.playerRoles ? gameData.playerRoles[userId] : null;
    const myTasks = (myRole === 'crewmate' && gameData.playerTasks) ? gameData.playerTasks[userId] : [];

    return (
        <div className="w-full h-full bg-gray-900 rounded-lg relative overflow-hidden grid grid-cols-3 grid-rows-3 gap-2 p-2">
            {/* Rooms */}
            <Room name="Cafeteria" className="bg-blue-900/50 col-span-1 row-span-1"></Room>
            <Room name="MedBay" className="bg-red-900/50 col-start-3 row-start-1"></Room>
            <Room name="Engine Room" className="bg-yellow-900/50 col-start-1 row-start-3"></Room>
            <Room name="Security" className="bg-purple-900/50 col-start-3 row-start-3"></Room>

            {/* Hallways */}
            <Hallway className="col-start-2 row-start-1" />
            <Hallway className="col-start-1 row-start-2" />
            <Hallway className="col-start-2 row-start-2" />
            <Hallway className="col-start-3 row-start-2" />
            <Hallway className="col-start-2 row-start-3" />

            {/* Absolute container for tasks and players */}
            <div className="absolute top-0 left-0 w-full h-full">
                {/* Render player's tasks */}
                {myTasks && myTasks.map(task => (
                    <Task key={task.id} task={task} isPlayerTask={true} />
                ))}

                {/* Render dead bodies */}
                {gameData.deadBodies && gameData.deadBodies.map((body, index) => (
                    <div
                        key={`body-${index}`}
                        className="absolute text-4xl"
                        style={{
                            left: `${body.location.x}%`,
                            top: `${body.location.y}%`,
                            transform: 'translate(-50%, -50%)',
                        }}
                    >
                        💀
                    </div>
                ))}

                {/* Render players */}
                {gameData.players.map(player => {
                    // Don't render dead players
                    if (gameData.playerStatus && gameData.playerStatus[player.id] === 'dead') {
                        return null;
                    }
                    const location = playerLocations[player.id];
                    if (!location) return null;
                    return <Player key={player.id} player={player} location={location} />;
                })}
            </div>
        </div>
    );
};

export default Map;
