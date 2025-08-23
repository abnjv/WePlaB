import React, { useContext } from 'react';
import { GameContext } from '../context/GameContext';
import PlayerList from './PlayerList';
import Chat from './Chat';
import GameLog from './GameLog';
import GameArea from './GameArea'; // For "Who is the Spy?"
import DrawAndGuess from './DrawAndGuess'; // For "Draw & Guess"
import SpaceWerewolf from './SpaceWerewolf'; // For "Space Werewolf"

const GameRoom = (props) => {
    const { state } = useContext(GameContext);
    const { gameType } = state;

    const renderGameContent = () => {
        switch (gameType) {
            case 'who_is_the_spy':
                return <GameArea {...props} />;
            case 'draw_and_guess':
                return <DrawAndGuess {...props} />;
            case 'space_werewolf':
                return <SpaceWerewolf {...props} />;
            default:
                return <div>Error: Unknown game type!</div>;
        }
    };

    return (
        <>
            {/* Left Column: Players & Game Log */}
            <div className="lg:col-span-1 bg-gray-800 rounded-2xl p-4 flex flex-col space-y-4 overflow-hidden">
                <PlayerList removePlayer={props.removePlayer} />
                <div className="flex-grow min-h-0">
                   <GameLog gameLogRef={props.gameLogRef} />
                </div>
            </div>

            {/* Center Column: Main Game Area */}
            <div className="lg:col-span-2 bg-gray-800 rounded-2xl p-6 flex items-center justify-center">
                {renderGameContent()}
            </div>

            {/* Right Column: Chat */}
            <div className="lg:col-span-1 bg-gray-800 rounded-2xl p-4 flex flex-col">
                <Chat
                    handleSendMessage={props.handleSendMessage}
                    messagesEndRef={props.messagesEndRef}
                />
            </div>
        </>
    );
};

export default GameRoom;
