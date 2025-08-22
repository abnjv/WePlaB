import React from 'react';

const FinalResultsModal = ({ players, onBackToLobby }) => {
    const sortedPlayers = [...players].sort((a, b) => (b.score || 0) - (a.score || 0));
    return (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-90 flex items-center justify-center z-50 animate-fade-in">
            <div className="bg-gray-800 rounded-lg p-8 max-w-xl mx-auto shadow-lg text-right transform scale-95 md:scale-100 transition-transform">
                <h3 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-amber-600 mb-6 text-center animate-bounce-slow">
                    انتهت اللعبة!
                </h3>
                <h4 className="text-2xl font-bold text-gray-200 mb-4 text-center">النتائج النهائية</h4>
                <ul className="space-y-4">
                    {sortedPlayers.map((p, index) => (
                        <li
                            key={p.id}
                            className={`flex items-center justify-between p-4 rounded-lg shadow-md transition-transform transform hover:scale-105 ${
                                index === 0 ? 'bg-amber-400 text-gray-900 font-bold text-lg' : 'bg-gray-700 text-gray-200'
                            }`}
                        >
                            <div className="flex items-center">
                                <span className="text-2xl ml-2">{p.avatar}</span>
                                <span>{p.name}</span>
                            </div>
                            <span className="text-lg">{p.score || 0} نقطة</span>
                        </li>
                    ))}
                </ul>
                <button
                    onClick={onBackToLobby}
                    className="w-full mt-8 p-4 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
                >
                    العودة إلى القائمة الرئيسية
                </button>
            </div>
        </div>
    );
};

export default FinalResultsModal;
