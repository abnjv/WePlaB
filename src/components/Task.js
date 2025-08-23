import React from 'react';

const Task = ({ task }) => {
    const isComplete = task.status === 'complete';

    return (
        <div
            className="absolute transition-all duration-300 ease-in-out"
            style={{
                left: `${task.location.x}%`,
                top: `${task.location.y}%`,
                transform: 'translate(-50%, -50%)'
            }}
        >
            <div className={`w-8 h-8 rounded-md flex items-center justify-center ${isComplete ? 'bg-green-500' : 'bg-yellow-500'}`}>
                <span className="text-xl">🔧</span>
            </div>
        </div>
    );
};

export default Task;
