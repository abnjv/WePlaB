import React, { useContext } from 'react';
import { GameContext } from '../context/GameContext';

const Chat = ({ handleSendMessage, messagesEndRef }) => {
    const { state, dispatch } = useContext(GameContext);
    const { gameData, messages, newMessage, userId } = state;

    return (
        <div className="flex flex-col h-full">
            <h3 className="text-xl font-semibold mb-2 text-center text-white">الدردشة</h3>
            <div className="flex-grow bg-gray-900/50 rounded-lg p-2 overflow-y-auto space-y-4" ref={messagesEndRef}>
                {messages.length > 0 ? (
                    messages.map((msg) => (
                        <div
                            key={msg.id}
                            className={`flex flex-col ${msg.senderId === userId ? 'items-end' : 'items-start'}`}
                        >
                            <div className={`p-3 rounded-lg max-w-[80%] ${msg.senderId === userId ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-200'}`}>
                                <div className="font-bold text-sm mb-1 flex items-center">
                                    <span className="ml-1">{msg.senderAvatar}</span> {msg.senderName}
                                    {(gameData?.phase === 'results' || gameData?.phase === 'final_results') && msg.senderId === gameData.spy && (
                                        <span className="text-xs font-normal text-yellow-300 mr-1">(جاسوس)</span>
                                    )}
                                </div>
                                <div className="text-base break-words">{msg.text}</div>
                            </div>
                        </div>
                    ))
                ) : (
                    <p className="text-center text-gray-400 mt-4">لا توجد رسائل بعد. ابدأ المحادثة!</p>
                )}
            </div>
            <div className="mt-4 flex">
                <input
                    type="text"
                    className="flex-1 p-3 rounded-l-lg bg-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="اكتب رسالتك..."
                    value={newMessage}
                    onChange={(e) => dispatch({ type: 'SET_NEW_MESSAGE', payload: e.target.value })}
                    onKeyDown={(e) => { if (e.key === 'Enter') handleSendMessage(); }}
                    disabled={gameData?.phase === 'final_results'}
                />
                <button
                    className="p-3 bg-blue-600 text-white rounded-r-lg hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-500"
                    onClick={handleSendMessage}
                    disabled={gameData?.phase === 'final_results' || !newMessage.trim()}
                >
                    إرسال
                </button>
            </div>
        </div>
    );
};

export default Chat;
