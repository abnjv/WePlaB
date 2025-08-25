import React from 'react';

const Task = ({ task, isPlayerTask }) => {
    const isComplete = task.completed; // Use 'completed' from the playerTasks object

    // Base classes
    let classes = "w-8 h-8 rounded-md flex items-center justify-center";

    if (isComplete) {
        classes += " bg-green-500 opacity-50";
    } else if (isPlayerTask) {
        // Add a glowing effect for the player's own tasks
        classes += " bg-yellow-500 border-2 border-yellow-300 shadow-lg shadow-yellow-500/50 animate-pulse";
    } else {
        // Style for other players' tasks if we were to show them
        classes += " bg-gray-600";
    }

    return (
        <div
            className="absolute transition-all duration-300 ease-in-out"
            style={{
                left: `${task.location.x}%`,
                top: `${task.location.y}%`,
                transform: 'translate(-50%, -50%)'
            }}
        >
            <div className={classes}>
                <span className="text-xl">🔧</span>
            </div>
        </div>
    );
};

export default Task;
