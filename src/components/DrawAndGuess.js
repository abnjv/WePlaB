import React, { useContext } from 'react';
import { GameContext } from '../context/GameContext';
import Canvas from './Canvas';

const DrawAndGuess = () => {
    const { state } = useContext(GameContext);
    const { wordToDraw, currentDrawerId, userId } = state;

    const isDrawer = userId === currentDrawerId;

    return (
        <div className="w-full h-full flex flex-col items-center justify-center p-4">
            <div className="w-full bg-gray-800 p-2 rounded-lg mb-4">
                <h2 className="text-2xl text-center font-bold text-white">
                    {isDrawer ? `ارسم: ${wordToDraw}` : 'خمّن الكلمة!'}
                </h2>
                {!isDrawer && (
                     <p className="text-center text-gray-400">
                        الكلمة من {wordToDraw.length} حروف
                    </p>
                )}
            </div>
            <div className="w-full flex-grow rounded-lg overflow-hidden">
                <Canvas />
            </div>
        </div>
    );
};

export default DrawAndGuess;
