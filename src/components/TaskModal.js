import React, { useContext, useState, useEffect, useRef } from 'react';
import { GameContext } from '../context/GameContext';
import { useSound } from '../hooks/useSound';

// A simple "Fix Wiring" minigame component
const FixWiringTask = ({ onComplete }) => {
    const colors = ['red', 'blue', 'yellow'];
    const [leftWires, setLeftWires] = useState(colors.sort(() => Math.random() - 0.5));
    const [rightWires, setRightWires] = useState(colors.sort(() => Math.random() - 0.5));

    const [connections, setConnections] = useState({}); // { red: true, blue: false, ... }
    const [selectedWire, setSelectedWire] = useState(null); // { side: 'left', color: 'red' }

    const leftWireRefs = useRef({});
    const rightWireRefs = useRef({});

    useEffect(() => {
        const allConnected = Object.values(connections).length === colors.length && Object.values(connections).every(Boolean);
        if (allConnected) {
            // Wait a moment to show the final connection, then complete
            setTimeout(() => {
                onComplete();
            }, 500);
        }
    }, [connections, onComplete]);

    const handleWireClick = (side, color) => {
        if (connections[color]) return; // Already connected

        if (!selectedWire) {
            setSelectedWire({ side, color });
        } else {
            // Can't connect a wire to same-side wire
            if (selectedWire.side === side) {
                setSelectedWire({ side, color }); // Select this new wire instead
                return;
            }

            // If colors match, create connection
            if (selectedWire.color === color) {
                setConnections(prev => ({ ...prev, [color]: true }));
            }
            setSelectedWire(null); // Reset selection
        }
    };

    return (
        <div>
            <h3 className="text-2xl font-bold mb-4">Fix Wiring</h3>
            <p className="text-gray-400 mb-4">Connect the wires from left to right by color.</p>
            <div className="relative h-48">
                <svg className="absolute w-full h-full" style={{ zIndex: 0 }}>
                    {Object.keys(connections).map(color => {
                        const leftY = leftWireRefs.current[color]?.offsetTop + (leftWireRefs.current[color]?.offsetHeight / 2);
                        const rightY = rightWireRefs.current[color]?.offsetTop + (rightWireRefs.current[color]?.offsetHeight / 2);
                        return (
                             <line key={color} x1="16" y1={leftY} x2="100%" y2={rightY} stroke={color} strokeWidth="4" />
                        )
                    })}
                </svg>

                <div className="flex justify-between items-center h-full relative" style={{ zIndex: 1 }}>
                    {/* Left Wires */}
                    <div className="flex flex-col justify-around h-full">
                        {leftWires.map(color => (
                            <div
                                key={color}
                                ref={el => leftWireRefs.current[color] = el}
                                onClick={() => handleWireClick('left', color)}
                                className={`w-8 h-4 rounded-r-full cursor-pointer border-2 ${selectedWire?.color === color && selectedWire?.side === 'left' ? 'border-white' : 'border-transparent'}`}
                                style={{ backgroundColor: color }}
                            ></div>
                        ))}
                    </div>
                    {/* Right Wires */}
                    <div className="flex flex-col justify-around h-full">
                        {rightWires.map(color => (
                            <div
                                key={color}
                                ref={el => rightWireRefs.current[color] = el}
                                onClick={() => handleWireClick('right', color)}
                                className={`w-8 h-4 rounded-l-full cursor-pointer border-2 ${selectedWire?.color === color && selectedWire?.side === 'right' ? 'border-white' : 'border-transparent'}`}
                                style={{ backgroundColor: color }}
                            ></div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};


const TaskModal = ({ completeTask }) => {
    const { state, dispatch } = useContext(GameContext);
    const { activeTask } = state;
    const { playSound } = useSound();

    if (!activeTask) return null;

    const handleComplete = () => {
        completeTask(activeTask.id);
        playSound('task_complete');
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
