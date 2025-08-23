import React, { useContext } from 'react';
import { GameContext } from '../context/GameContext';

// A simple "Fix Wiring" minigame component
const FixWiringTask = ({ onComplete }) => {
    // In a real game, this would have interactive logic.
    // For now, it's a simple placeholder.
    return (
        <div>
            <h3 className="text-2xl font-bold mb-4">Fix Wiring</h3>
            <p className="text-gray-400 mb-4">Connect the wires from left to right by color.</p>
            <div className="flex justify-between items-center h-48">
                {/* Left Wires */}
                <div className="flex flex-col justify-around h-full">
                    <div className="w-8 h-4 bg-red-500 rounded-r-full"></div>
                    <div className="w-8 h-4 bg-blue-500 rounded-r-full"></div>
                    <div className="w-8 h-4 bg-yellow-500 rounded-r-full"></div>
                </div>
                {/* Right Wires */}
                <div className="flex flex-col justify-around h-full">
                    <div className="w-8 h-4 bg-blue-500 rounded-l-full"></div>
                    <div className="w-8 h-4 bg-yellow-500 rounded-l-full"></div>
                    <div className="w-8 h-4 bg-red-500 rounded-l-full"></div>
                </div>
            </div>
            <button
                onClick={onComplete}
                className="mt-6 w-full bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-6 rounded-lg"
            >
                Complete
            </button>
        </div>
    );
};


const TaskModal = ({ completeTask }) => {
    const { state, dispatch } = useContext(GameContext);
    const { activeTask } = state;

    if (!activeTask) return null;

    const handleComplete = () => {
        completeTask(activeTask.id);
        dispatch({ type: 'SET_ACTIVE_TASK', payload: null });
    };

    const handleClose = () => {
        dispatch({ type: 'SET_ACTIVE_TASK', payload: null });
    };

    const renderTaskContent = () => {
        // This can be expanded for different tasks
        switch (activeTask.id) {
            case 'task1': // Fix Wiring
                return <FixWiringTask onComplete={handleComplete} />;
            default:
                return (
                    <div>
                        <h3 className="text-2xl font-bold mb-4">{activeTask.name}</h3>
                        <p className="text-gray-400 mb-4">This is a placeholder for the task.</p>
                        <button onClick={handleComplete} className="mt-6 w-full bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-6 rounded-lg">
                            Complete
                        </button>
                    </div>
                );
        }
    };

    return (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-80 flex items-center justify-center z-50">
            <div className="bg-gray-800 rounded-lg p-8 max-w-md w-full shadow-lg relative">
                <button onClick={handleClose} className="absolute top-2 right-2 text-gray-400 hover:text-white text-2xl">&times;</button>
                {renderTaskContent()}
            </div>
        </div>
    );
};

export default TaskModal;
