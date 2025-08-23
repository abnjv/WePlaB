import React, { useContext } from 'react';
import { GameContext } from '../context/GameContext';
import Map from './Map';
import Meeting from './Meeting';

const SpaceWerewolf = ({ completeTask, callEmergencyMeeting, voteToEject }) => {
    const { state, dispatch } = useContext(GameContext);
    const { playerLocations, tasks, userId, isMeetingActive } = state;

    const myLocation = playerLocations[userId];

    const getDistance = (loc1, loc2) => {
        if (!loc1 || !loc2) return Infinity;
        const dx = loc1.x - loc2.x;
        const dy = loc1.y - loc2.y;
        return Math.sqrt(dx * dx + dy * dy);
    };

    const nearbyTask = tasks.find(task =>
        task.status === 'incomplete' && getDistance(myLocation, task.location) < 10
    );

    const openTask = (task) => {
        dispatch({ type: 'SET_ACTIVE_TASK', payload: task });
    };

    if (isMeetingActive) {
        return <Meeting voteToEject={voteToEject} />;
    }

    return (
        <div className="w-full h-full flex flex-col items-center">
            <div className="w-full h-full relative mb-4">
                <Map />
            </div>
            <div className="absolute bottom-10 flex space-x-4">
                {nearbyTask && (
                    <button
                        className="bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-6 rounded-lg shadow-lg animate-pulse"
                        onClick={() => openTask(nearbyTask)}
                    >
                        Use: {nearbyTask.name}
                    </button>
                )}
                <button
                    className="bg-red-500 hover:bg-red-600 text-white font-bold py-3 px-6 rounded-lg shadow-lg"
                    onClick={callEmergencyMeeting}
                >
                    Call Emergency Meeting
                </button>
            </div>
        </div>
    );
};

export default SpaceWerewolf;
