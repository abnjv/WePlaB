import React, { useContext } from 'react';
import { GameContext } from '../context/GameContext';

const Lobby = ({ createGame, joinGame }) => {
    const { state, dispatch } = useContext(GameContext);
    const { joinRoomInput, roomList } = state;

    const handleJoinGame = () => {
        joinGame(joinRoomInput);
    };

    return (
        <div className="flex flex-col items-center justify-center w-full">
            <h1 className="text-4xl md:text-5xl font-bold mb-6 text-white">من هو الجاسوس؟</h1>

            <div className="w-full max-w-md space-y-4">
                <p className="text-lg font-semibold text-gray-300 mb-2">لعبة "من هو الجاسوس؟"</p>
                <button
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-xl transition-colors duration-200 shadow-lg transform hover:scale-105"
                    onClick={() => createGame('who_is_the_spy', true)}
                >
                    أنشئ غرفة عامة
                </button>
                <p className="text-lg font-semibold text-gray-300 mt-6 mb-2">لعبة "ارسم وخمن"</p>
                 <button
                    className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-xl transition-colors duration-200 shadow-lg transform hover:scale-105"
                    onClick={() => createGame('draw_and_guess', true)}
                >
                    أنشئ غرفة
                </button>
                <p className="text-lg font-semibold text-gray-300 mt-6 mb-2">لعبة "ذئب الفضاء"</p>
                 <button
                    className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-6 rounded-xl transition-colors duration-200 shadow-lg transform hover:scale-105"
                    onClick={() => createGame('space_werewolf', true)}
                >
                    أنشئ غرفة (قريباً)
                </button>

                <div className="relative pt-4">
                    <div className="absolute inset-0 flex items-center" aria-hidden="true">
                        <div className="w-full border-t border-gray-600" />
                    </div>
                    <div className="relative flex justify-center">
                        <span className="bg-gray-800 px-2 text-sm text-gray-400">أو</span>
                    </div>
                </div>

                <div className="flex w-full space-x-2 rtl:space-x-reverse">
                    <input
                        type="text"
                        className="flex-1 p-4 bg-gray-700 text-white placeholder-gray-400 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 text-center font-mono tracking-widest"
                        placeholder="أدخل رمز الغرفة"
                        value={joinRoomInput}
                        onChange={(e) => dispatch({ type: 'SET_JOIN_ROOM_INPUT', payload: e.target.value.toUpperCase() })}
                        onKeyDown={(e) => { if (e.key === 'Enter') handleJoinGame(); }}
                        maxLength="6"
                    />
                    <button
                        className="px-6 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl transition-colors duration-200 shadow-lg transform hover:scale-105 disabled:bg-gray-500 disabled:cursor-not-allowed"
                        onClick={handleJoinGame}
                        disabled={!joinRoomInput}
                    >
                        انضمام
                    </button>
                </div>
            </div>

            {roomList.length > 0 && (
                <div className="mt-10 w-full max-w-md">
                    <h3 className="text-xl font-bold mb-4 text-center text-gray-300">غرف متاحة للانضمام</h3>
                    <ul className="space-y-3 max-h-48 overflow-y-auto pr-2">
                        {roomList.map(room => (
                            <li
                                key={room.id}
                                className="p-4 bg-gray-700 rounded-lg flex justify-between items-center cursor-pointer hover:bg-gray-600 transition-all"
                                onClick={() => joinGame(room.id)}
                            >
                                <div className="flex flex-col text-right">
                                    <span className="font-bold text-white">غرفة {room.players[0]?.name || 'عامة'}</span>
                                    <span className="font-mono text-sm text-cyan-400">{room.id.substring(0, 6)}</span>
                                </div>
                                <div className="text-sm text-gray-400">
                                    <span className="font-bold text-white">{room.players.length}</span>/8 لاعبين
                                </div>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
};

export default Lobby;
