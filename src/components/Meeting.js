import React from 'react';

const Meeting = () => {
    return (
        <div className="text-center">
            <h2 className="text-4xl font-bold text-red-500 mb-4 animate-pulse">EMERGENCY MEETING</h2>
            <p className="text-lg text-gray-300">Discuss and vote out the impostor!</p>
            {/* Voting UI will go here */}
        </div>
    );
};

export default Meeting;
