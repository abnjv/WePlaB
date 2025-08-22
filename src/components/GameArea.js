import React, { useContext } from 'react';
import { GameContext } from '../context/GameContext';

const GameArea = ({ myPlayer, startGame, viewMyWord, startVotingPhase, voteFor, handleSpyGuess, startNewRound, endGame, getPlayerNameById }) => {
    const { state, dispatch } = useContext(GameContext);
    const { gameData, isHost, discussionTimer, showWord, votingTimer, playerVote, spyGuessInput } = state;

    if (!gameData) return null;

    // Waiting Phase
    if (gameData.status === 'waiting') {
        return (
            <div className="text-center">
                <h2 className="text-3xl font-bold mb-4 text-gray-200">في انتظار اللاعبين...</h2>
                <p className="text-lg text-gray-400 mb-6">سيتمكن المضيف من بدء اللعبة عندما ينضم 3 لاعبين على الأقل.</p>
                {isHost && (
                    <button
                        className="w-full max-w-xs mx-auto bg-purple-600 hover:bg-purple-700 text-white font-bold py-4 px-6 rounded-xl transition-colors duration-200 shadow-lg transform hover:scale-105 disabled:bg-gray-500 disabled:cursor-not-allowed"
                        onClick={startGame}
                        disabled={gameData.players.length < 3}
                    >
                        بدء اللعبة ({gameData.players.length}/8)
                    </button>
                )}
            </div>
        );
    }

    // Discussion & Voting Phases
    if (gameData.status === 'in-progress') {
        return (
            <div className="text-center">
                <h2 className="text-3xl font-bold mb-2">
                    {gameData.phase === 'discussion' ? 'مرحلة النقاش' : 'مرحلة التصويت'}
                </h2>
                <p className="text-lg text-gray-400 mb-4">
                    {gameData.phase === 'discussion' ? `الوقت المتبقي: ${discussionTimer} ثانية` : `الوقت المتبقي: ${votingTimer} ثانية`}
                </p>

                {gameData.phase === 'discussion' && (
                    <div className="p-4 bg-gray-800 rounded-lg mb-4 animate-fade-in-up">
                        {showWord ? (
                            <>
                                <p className="text-gray-400">دورك هو: <span className="font-bold text-yellow-400">{myPlayer?.role}</span></p>
                                <p className="mt-2 text-xl font-bold">كلمتك هي: <span className="text-green-400">{myPlayer?.word}</span></p>
                            </>
                        ) : (
                            <p className="text-lg">انقر لرؤية كلمتك ودورك</p>
                        )}
                    </div>
                )}
                {gameData.phase === 'discussion' && (
                    <button className="w-full max-w-xs mx-auto bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-6 rounded-xl transition-colors duration-200 shadow-md" onClick={viewMyWord}>
                        أظهر كلمتي
                    </button>
                )}

                {gameData.phase === 'voting' && (
                     <div className="w-full p-4">
                        <h3 className="text-2xl font-bold mb-4">صوت لمن تعتقد أنه الجاسوس</h3>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                            {gameData.players.map(p => (
                                <button
                                    key={p.id}
                                    className={`p-4 rounded-lg transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed ${
                                        playerVote === p.id ? 'bg-red-600 ring-4 ring-red-400' : 'bg-gray-700 hover:bg-gray-600'
                                    }`}
                                    onClick={() => {
                                        dispatch({ type: 'SET_PLAYER_VOTE', payload: p.id });
                                        voteFor(p.id);
                                    }}
                                    disabled={playerVote !== null || p.id === myPlayer.id}
                                >
                                    <span className="text-3xl">{p.avatar}</span>
                                    <p className="font-bold mt-2">{p.name}</p>
                                </button>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        );
    }

    // Spy Guessing Phase
    if (gameData.phase === 'spy_guessing') {
        return (
            <div className="text-center animate-fade-in-up">
                <h2 className="text-3xl font-bold text-yellow-400 mb-4">الفرصة الأخيرة للجاسوس!</h2>
                {myPlayer?.id === gameData.suspectedSpy ? (
                    <>
                        <p className="text-lg mb-4">لقد تم كشفك! ولكن لا يزال لديك فرصة للفوز.</p>
                        <p className="text-lg text-gray-400 mb-4">خمن الكلمة السرية للاعبين.</p>
                        <input
                            type="text"
                            className="w-full max-w-sm p-3 bg-gray-700 text-white placeholder-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 text-center"
                            placeholder="أدخل تخمينك"
                            value={spyGuessInput}
                            onChange={(e) => dispatch({ type: 'SET_SPY_GUESS_INPUT', payload: e.target.value })}
                            onKeyDown={(e) => { if (e.key === 'Enter') handleSpyGuess(); }}
                        />
                        <button
                            className="mt-4 w-full max-w-sm bg-yellow-600 hover:bg-yellow-700 text-white font-bold py-3 px-6 rounded-xl transition-colors"
                            onClick={handleSpyGuess}
                        >
                            تأكيد التخمين
                        </button>
                    </>
                ) : (
                    <p className="text-lg text-gray-300">نحن في انتظار الجاسوس ({getPlayerNameById(gameData.suspectedSpy)}) لتخمين الكلمة...</p>
                )}
            </div>
        );
    }

    // Results Phase
    if (gameData.phase === 'results') {
        return (
            <div className="text-center animate-fade-in-up">
                <h2 className="text-3xl font-bold text-green-400 mb-4">انتهت الجولة!</h2>
                <div className="space-y-3 text-lg bg-gray-800 p-4 rounded-lg">
                    <p>الجاسوس كان: <span className="font-bold text-red-400">{getPlayerNameById(gameData.spy)}</span></p>
                    <p>الكلمة السرية: <span className="font-bold text-blue-400">{gameData.word}</span></p>
                    <p>كلمة الجاسوس: <span className="font-bold text-orange-400">{gameData.undercoverWord}</span></p>
                </div>
                {isHost && (
                    <div className="flex justify-center space-x-4 rtl:space-x-reverse mt-6">
                        <button onClick={startNewRound} className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                            جولة جديدة
                        </button>
                        <button onClick={endGame} className="px-8 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700">
                            إنهاء اللعبة
                        </button>
                    </div>
                )}
            </div>
        );
    }

    return null;
};

export default GameArea;
