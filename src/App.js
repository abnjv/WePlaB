import React, { useContext, useEffect, useRef, useState } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInWithCustomToken, signInAnonymously } from 'firebase/auth';
import { getFirestore, doc, onSnapshot, collection, addDoc, serverTimestamp, setDoc, getDoc, updateDoc, query, where, orderBy, limit, runTransaction } from 'firebase/firestore';
import Lobby from './components/Lobby';
import GameRoom from './components/GameRoom';
import FinalResultsModal from './components/FinalResultsModal';
import InstructionsModal from './components/InstructionsModal';
import SettingsModal from './components/SettingsModal';
import { GameContext } from './context/GameContext';
import VoiceChat from './components/VoiceChat';
import AudioRenderer from './components/AudioRenderer';

// DO NOT change these variables. They are provided by the environment.
const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
const firebaseConfig = typeof __firebase_config !== 'undefined' ? JSON.parse(__firebase_config) : {};
const initialAuthToken = typeof __initial_auth_token !== 'undefined' ? __initial_auth_token : null;

// Game words for "Who is the Spy?"
export const gameWords = {
    'مدينة': 'عاصمة', 'حيوان': 'طائر', 'فاكهة': 'خضروات', 'أداة': 'آلة',
    'رياضة': 'هواية', 'مهنة': 'وظيفة', 'مشروب': 'سائل', 'فيلم': 'مسلسل',
    'كوكب': 'قمر', 'لعبة': 'رياضة', 'عملة': 'بضاعة', 'طعام': 'بهار',
    'مركبة': 'وسيلة نقل', 'معدن': 'عنصر', 'سلاح': 'دفاع',
};
export const words = Object.keys(gameWords);
export const drawAndGuessWords = [
    'سيارة', 'شجرة', 'منزل', 'قطة', 'كلب', 'شمس', 'قمر', 'نجمة', 'كتاب', 'قلم',
    'طاولة', 'كرسي', 'هاتف', 'حاسوب', 'مفتاح', 'باب', 'نافذة', 'ساعة', 'نظارة', 'كرة'
];
export const avatars = ['😊', '😎', '🤩', '🥳', '🤓', '🤖', '👻', '👽', '👑'];
const DISCUSSION_TIMER = 120;
const VOTING_TIMER = 30;

const App = () => {
    const { state, dispatch } = useContext(GameContext);
    const {
        db, auth, userId, userName, userAvatar, loading, errorMessage, currentRoomId,
        gameData, isHost, roomList, joinRoomInput, messages, newMessage, gameLog,
        showInstructions, showSettings, showEndGameModal, discussionTimer, votingTimer,
        showWord, playerVote, spyGuessInput
    } = state;

    // Local state for modal inputs
    const [tempUserName, setTempUserName] = useState(userName);
    const [tempUserAvatar, setTempUserAvatar] = useState(userAvatar);

    const messagesEndRef = useRef(null);
    const gameLogRef = useRef(null);

    // Effect to update temp settings when modal is opened
    useEffect(() => {
        if (showSettings) {
            setTempUserName(userName);
            setTempUserAvatar(userAvatar);
        }
    }, [showSettings, userName, userAvatar]);

    // Initial Firebase and auth setup
    useEffect(() => {
        const initFirebase = async () => {
            try {
                const app = initializeApp(firebaseConfig);
                const firestoreDb = getFirestore(app);
                const authService = getAuth(app);
                dispatch({ type: 'SET_FIREBASE_SERVICES', payload: { db: firestoreDb, auth: authService } });

                if (initialAuthToken) {
                    await signInWithCustomToken(authService, initialAuthToken);
                } else {
                    await signInAnonymously(authService);
                }

                const user = authService.currentUser;
                if (user) {
                    dispatch({ type: 'SET_USER', payload: { uid: user.uid } });
                }
                dispatch({ type: 'SET_AUTH_READY' });
            } catch (error) {
                console.error("Firebase initialization failed:", error);
                dispatch({ type: 'SET_ERROR_MESSAGE', payload: "فشل في تهيئة Firebase. يرجى المحاولة لاحقًا." });
                dispatch({ type: 'SET_AUTH_READY' });
            }
        };
        initFirebase();
    }, [dispatch]);

    // Listen for real-time game state changes and chat messages
    useEffect(() => {
        if (!db || !currentRoomId) return;

        const roomDocRef = doc(db, 'artifacts', appId, 'public', 'data', 'gameRooms', currentRoomId);
        const unsubscribeGame = onSnapshot(roomDocRef, (docSnap) => {
            if (docSnap.exists()) {
                const data = docSnap.data();
                dispatch({ type: 'SET_GAME_DATA', payload: data });
                dispatch({ type: 'SET_GAME_LOG', payload: data.gameLog || [] });

                // Timer logic remains here as it depends on host status and server time
                if (data.phase === 'discussion' && data.discussionStartTime) {
                    const timeElapsed = Math.floor((Date.now() - data.discussionStartTime.toDate().getTime()) / 1000);
                    const remainingTime = Math.max(0, DISCUSSION_TIMER - timeElapsed);
                    dispatch({ type: 'SET_DISCUSSION_TIMER', payload: remainingTime });
                    if (remainingTime <= 0 && data.players.find(p => p.id === userId && p.isHost)) {
                        startVotingPhase();
                    }
                } else {
                    dispatch({ type: 'SET_DISCUSSION_TIMER', payload: 0 });
                }

                if (data.phase === 'voting' && data.votingStartTime) {
                    const timeElapsed = Math.floor((Date.now() - data.votingStartTime.toDate().getTime()) / 1000);
                    const remainingTime = Math.max(0, VOTING_TIMER - timeElapsed);
                    dispatch({ type: 'SET_VOTING_TIMER', payload: remainingTime });
                     if (remainingTime <= 0 && data.players.find(p => p.id === userId && p.isHost)) {
                        autoVote();
                    }
                } else {
                    dispatch({ type: 'SET_VOTING_TIMER', payload: 0 });
                }
            } else {
                dispatch({ type: 'LEAVE_ROOM' });
                dispatch({ type: 'SET_ERROR_MESSAGE', payload: "انتهت اللعبة أو تم حذف الغرفة." });
            }
        });

        const messagesColRef = collection(db, 'artifacts', appId, 'public', 'data', 'gameRooms', currentRoomId, 'chat');
        const messagesQuery = query(messagesColRef, orderBy('createdAt', 'asc'));
        const unsubscribeChat = onSnapshot(messagesQuery, (snapshot) => {
            const fetchedMessages = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            dispatch({ type: 'SET_MESSAGES', payload: fetchedMessages });
        });

        return () => {
            unsubscribeGame();
            unsubscribeChat();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [db, currentRoomId, userId, dispatch]);

    // Client-side timer countdown effect
    useEffect(() => {
        let timer;
        if (gameData?.phase === 'voting' && votingTimer > 0) {
            timer = setInterval(() => dispatch({ type: 'SET_VOTING_TIMER', payload: votingTimer - 1 }), 1000);
        } else if (gameData?.phase === 'discussion' && discussionTimer > 0) {
            timer = setInterval(() => dispatch({ type: 'SET_DISCUSSION_TIMER', payload: discussionTimer - 1 }), 1000);
        }
        return () => clearInterval(timer);
    }, [gameData?.phase, votingTimer, discussionTimer, dispatch]);

    // Listen for real-time list of joinable public rooms
    useEffect(() => {
        if (!db) return;
        const roomsColRef = collection(db, 'artifacts', appId, 'public', 'data', 'gameRooms');
        const roomsQuery = query(roomsColRef, where("isPublic", "==", true), orderBy('createdAt', 'desc'), limit(10));
        const unsubscribe = onSnapshot(roomsQuery, (snapshot) => {
            const fetchedRooms = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            dispatch({ type: 'SET_ROOM_LIST', payload: fetchedRooms.filter(room => room.status === 'waiting' && room.players.length < 8) });
        });
        return () => unsubscribe();
    }, [db, dispatch]);

    // Scroll to the latest message and game log entry
    useEffect(() => { if (messagesEndRef.current) messagesEndRef.current.scrollTop = messagesEndRef.current.scrollHeight; }, [messages]);
    useEffect(() => { if (gameLogRef.current) gameLogRef.current.scrollTop = gameLogRef.current.scrollHeight; }, [gameLog]);

    // Helper function to update the game log
    const updateGameLog = async (logMessage) => {
        if (!db || !currentRoomId) return;
        const roomDocRef = doc(db, 'artifacts', appId, 'public', 'data', 'gameRooms', currentRoomId);
        try {
            await updateDoc(roomDocRef, { gameLog: [...(gameData?.gameLog || []), { text: logMessage, timestamp: serverTimestamp() }] });
        } catch (error) { console.error("Error updating game log:", error); }
    };

    // Game Actions
    const createGame = async (gameType = 'who_is_the_spy', isPublicRoom = true) => {
        if (!db || !userId || !userName) return;
        dispatch({ type: 'SET_LOADING', payload: true });
        try {
            const newRoomRef = doc(collection(db, 'artifacts', appId, 'public', 'data', 'gameRooms'));
            await setDoc(newRoomRef, {
                gameType: gameType,
                status: 'waiting',
                players: [{ id: userId, name: userName, isHost: true, avatar: userAvatar, score: 0 }],
                createdAt: serverTimestamp(),
                isPublic: isPublicRoom,
                gameLog: [{ text: `تم إنشاء غرفة ${gameType === 'draw_and_guess' ? 'ارسم وخمن' : 'من هو الجاسوس'} بواسطة ${userName}`, timestamp: serverTimestamp() }]
            });
            dispatch({ type: 'SET_GAME_TYPE', payload: gameType });
            dispatch({ type: 'SET_CURRENT_ROOM_ID', payload: newRoomRef.id });
        } catch (error) {
            console.error("Error creating game:", error);
            dispatch({ type: 'SET_ERROR_MESSAGE', payload: "فشل في إنشاء الغرفة." });
        } finally {
            dispatch({ type: 'SET_LOADING', payload: false });
        }
    };

    const joinGame = async (roomId) => {
        if (!db || !userId || !userName || !roomId) {
            dispatch({ type: 'SET_ERROR_MESSAGE', payload: "يرجى إدخال رمز الغرفة." });
            setTimeout(() => dispatch({ type: 'SET_ERROR_MESSAGE', payload: '' }), 3000);
            return;
        }
        dispatch({ type: 'SET_LOADING', payload: true });
        try {
            const roomDocRef = doc(db, 'artifacts', appId, 'public', 'data', 'gameRooms', roomId);
            let playerAlreadyInRoom = false;

            await runTransaction(db, async (transaction) => {
                const roomSnap = await transaction.get(roomDocRef);
                if (!roomSnap.exists()) {
                    throw new Error("هذه الغرفة غير موجودة أو انتهت.");
                }

                const roomData = roomSnap.data();
                if (roomData.players.some(p => p.id === userId)) {
                    playerAlreadyInRoom = true;
                    return; // Already in room, no need to update
                }
                if (roomData.status !== 'waiting') {
                    throw new Error("لا يمكن الانضمام، اللعبة بدأت بالفعل.");
                }
                if (roomData.players.length >= 8) {
                    throw new Error("الغرفة ممتلئة. لا يمكن الانضمام.");
                }

                const newPlayers = [...roomData.players, { id: userId, name: userName, isHost: false, avatar: userAvatar, score: 0 }];
                transaction.update(roomDocRef, { players: newPlayers });
            });

            if (playerAlreadyInRoom) {
                dispatch({ type: 'SET_CURRENT_ROOM_ID', payload: roomId });
            } else {
                await updateGameLog(`${userName} انضم إلى الغرفة.`);
                dispatch({ type: 'SET_CURRENT_ROOM_ID', payload: roomId });
            }

        } catch (error) {
            console.error("Error joining game:", error);
            dispatch({ type: 'SET_ERROR_MESSAGE', payload: error.message || "فشل في الانضمام للغرفة." });
        } finally {
            dispatch({ type: 'SET_LOADING', payload: false });
        }
    };

    const startGame = async () => {
        if (!db || !currentRoomId || !isHost || gameData.players.length < 2) { // Draw & Guess can start with 2 players
             dispatch({ type: 'SET_ERROR_MESSAGE', payload: "يجب أن يكون هناك لاعبان على الأقل لبدء اللعبة." });
             setTimeout(() => dispatch({ type: 'SET_ERROR_MESSAGE', payload: '' }), 3000);
            return;
        }
        try {
            const roomDocRef = doc(db, 'artifacts', appId, 'public', 'data', 'gameRooms', currentRoomId);

            if (gameData.gameType === 'draw_and_guess') {
                const drawer = gameData.players[Math.floor(Math.random() * gameData.players.length)];
                const word = drawAndGuessWords[Math.floor(Math.random() * drawAndGuessWords.length)];

                dispatch({ type: 'START_DRAW_ROUND', payload: { drawerId: drawer.id, word } });
                await updateDoc(roomDocRef, {
                    status: 'in-progress',
                    round: (gameData.round || 0) + 1,
                    currentDrawerId: drawer.id,
                    wordToDraw: word,
                    drawingData: [],
                    guesses: [],
                });
                await updateGameLog(`بدأت جولة "ارسم وخمن"! ${drawer.name} هو الرسام.`);

            } else { // 'who_is_the_spy'
                if (gameData.players.length < 3) {
                    dispatch({ type: 'SET_ERROR_MESSAGE', payload: "لعبة من هو الجاسوس تحتاج 3 لاعبين على الأقل." });
                    return;
                }
                const players = [...gameData.players];
                const spyIndex = Math.floor(Math.random() * players.length);
                const wordIndex = Math.floor(Math.random() * words.length);
                players.forEach((player, index) => {
                    player.word = index === spyIndex ? gameWords[words[wordIndex]] : words[wordIndex];
                    player.role = index === spyIndex ? 'الجاسوس' : 'اللاعب';
                });
                await updateDoc(roomDocRef, {
                    status: 'in-progress', players, spy: players[spyIndex].id,
                    word: words[wordIndex], undercoverWord: gameWords[words[wordIndex]],
                    votes: {}, phase: 'discussion', round: (gameData.round || 0) + 1,
                    discussionStartTime: serverTimestamp(),
                });
                await updateGameLog(`بدأت جولة "من هو الجاسوس" رقم ${gameData.round || 1}.`);
            }
        } catch (error) {
            console.error("Error starting game:", error);
            dispatch({ type: 'SET_ERROR_MESSAGE', payload: "فشل في بدء اللعبة." });
        }
    };

    const startVotingPhase = async () => {
        if (!db || !currentRoomId || !isHost) return;
        try {
            await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'gameRooms', currentRoomId), {
                phase: 'voting', votingStartTime: serverTimestamp(),
            });
            await updateGameLog('انتهى وقت النقاش! بدأت مرحلة التصويت.');
        } catch (error) { console.error("Error starting voting phase:", error); }
    };

    const viewMyWord = () => {
        dispatch({ type: 'SET_SHOW_WORD', payload: true });
        setTimeout(() => dispatch({ type: 'SET_SHOW_WORD', payload: false }), 5000);
    };

    const voteFor = async (votedPlayerId) => {
        if (!db || !currentRoomId || gameData.phase !== 'voting') return;

        const roomDocRef = doc(db, 'artifacts', appId, 'public', 'data', 'gameRooms', currentRoomId);
        try {
            await runTransaction(db, async (transaction) => {
                const roomSnap = await transaction.get(roomDocRef);
                if (!roomSnap.exists()) {
                    throw new Error("Room does not exist!");
                }

                const roomData = roomSnap.data();
                const currentVotes = roomData.votes || {};

                // Player can't vote twice
                if (currentVotes[userId]) {
                    return;
                }

                const newVotes = { ...currentVotes, [userId]: votedPlayerId };
                transaction.update(roomDocRef, { votes: newVotes });

                // If this is the last vote, calculate results and update phase
                if (Object.keys(newVotes).length === roomData.players.length) {
                    const voteCounts = {};
                    Object.values(newVotes).forEach(votedId => { voteCounts[votedId] = (voteCounts[votedId] || 0) + 1; });
                    const suspectedSpy = Object.keys(voteCounts).reduce((a, b) => (voteCounts[a] > voteCounts[b] ? a : b));

                    // This update must also be part of the transaction
                    const phase = suspectedSpy === roomData.spy ? 'spy_guessing' : 'results';
                    transaction.update(roomDocRef, { phase, suspectedSpy });

                    // We can't use await inside the transaction for the log, so we do it outside if successful
                }
            });

            // Check if all votes are in to log the message
            // We need to re-read the data post-transaction to be sure
            const finalRoomSnap = await getDoc(roomDocRef);
            if (finalRoomSnap.exists()) {
                const finalRoomData = finalRoomSnap.data();
                if (finalRoomData.phase === 'spy_guessing' || finalRoomData.phase === 'results') {
                     await updateGameLog(`انتهى التصويت! ${getPlayerNameById(finalRoomData.suspectedSpy)} هو أكثر من تم التصويت عليه.`);
                }
            }

        } catch (error) {
            console.error("Error casting vote:", error);
            dispatch({ type: 'SET_ERROR_MESSAGE', payload: "فشل في التصويت." });
        }
    };

    const autoVote = async () => {
        if (!isHost || gameData.phase !== 'voting') return;
        const roomDocRef = doc(db, 'artifacts', appId, 'public', 'data', 'gameRooms', currentRoomId);
        const playersWithoutVote = gameData.players.filter(p => !gameData.votes[p.id]);
        let newVotes = { ...gameData.votes };
        playersWithoutVote.forEach(p => {
            const randomPlayer = gameData.players[Math.floor(Math.random() * gameData.players.length)];
            newVotes[p.id] = randomPlayer.id;
        });
        const voteCounts = {};
        Object.values(newVotes).forEach(votedId => { voteCounts[votedId] = (voteCounts[votedId] || 0) + 1; });
        const suspectedSpy = Object.keys(voteCounts).reduce((a, b) => (voteCounts[a] > voteCounts[b] ? a : b));
        await updateGameLog('انتهى الوقت! تم التصويت تلقائياً.');
        await updateGameLog(`انتهى التصويت! ${getPlayerNameById(suspectedSpy)} هو أكثر من تم التصويت عليه.`);
        const phase = suspectedSpy === gameData.spy ? 'spy_guessing' : 'results';
        await updateDoc(roomDocRef, { phase, suspectedSpy, votes: newVotes });
    };

    const handleSpyGuess = async () => {
        if (!db || !currentRoomId || gameData.phase !== 'spy_guessing' || spyGuessInput.trim() === '') return;
        try {
            const roomDocRef = doc(db, 'artifacts', appId, 'public', 'data', 'gameRooms', currentRoomId);
            const guessedWord = spyGuessInput.trim();
            const isCorrectGuess = guessedWord.toLowerCase() === gameData.word.toLowerCase();
            let winMessage = '';
            const newPlayers = gameData.players.map(p => {
                let updatedPlayer = { ...p };
                if ((isCorrectGuess && p.id === gameData.spy) || (!isCorrectGuess && p.id !== gameData.spy)) {
                    updatedPlayer.score = (p.score || 0) + 1;
                }
                return updatedPlayer;
            });
            if(isCorrectGuess) {
                winMessage = `الجاسوس ${getPlayerNameById(gameData.spy)} خمن الكلمة بشكل صحيح! الجاسوس يفوز!`;
            } else {
                winMessage = `الجاسوس خمن خطأ. اللاعبون يفوزون!`;
            }
            await updateGameLog(`الجاسوس خمن الكلمة: "${guessedWord}".`);
            await updateGameLog(winMessage);
            await updateDoc(roomDocRef, { phase: 'results', spyGuessedCorrectly: isCorrectGuess, guessedWord, players: newPlayers });
        } catch (error) { console.error("Error handling spy guess:", error); }
    };

    const startNewRound = async () => {
        if (!db || !currentRoomId || !isHost) return;
        try {
            await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'gameRooms', currentRoomId), {
                status: 'waiting',
                players: gameData.players.map(p => ({ ...p, word: null, role: null })),
                spy: null, word: null, undercoverWord: null, votes: {}, phase: null,
                suspectedSpy: null, spyGuessedCorrectly: null, guessedWord: null,
                votingStartTime: null, discussionStartTime: null,
            });
            dispatch({ type: 'SET_PLAYER_VOTE', payload: null });
            dispatch({ type: 'SET_SPY_GUESS_INPUT', payload: '' });
            await updateGameLog('بدأت جولة جديدة. في انتظار بدء اللعبة.');
        } catch (error) { console.error("Error starting new round:", error); }
    };

    const endGame = async () => {
        if (!db || !currentRoomId || !isHost) return;
        try {
            await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'gameRooms', currentRoomId), { phase: 'final_results', status: 'ended' });
            await updateGameLog('قام المدير بإنهاء اللعبة. عرض النتائج النهائية.');
            dispatch({ type: 'SET_SHOW_END_GAME_MODAL', payload: true });
        } catch (error) { console.error("Error ending game:", error); }
    };

    const removePlayer = async (playerId) => {
        if (!db || !currentRoomId || !isHost || gameData.status !== 'waiting') return;
        try {
            const roomDocRef = doc(db, 'artifacts', appId, 'public', 'data', 'gameRooms', currentRoomId);
            const updatedPlayers = gameData.players.filter(p => p.id !== playerId);
            await updateDoc(roomDocRef, { players: updatedPlayers });
            await updateGameLog(`تم إزالة ${getPlayerNameById(playerId)} من الغرفة.`);
        } catch (error) { console.error("Error removing player:", error); }
    };

    const handleSendMessage = async () => {
        if (newMessage.trim() === '' || !db || !currentRoomId) return;
        const messageText = newMessage.trim();
        dispatch({ type: 'SET_NEW_MESSAGE', payload: '' });

        // Handle Guessing for Draw & Guess
        if (gameData.gameType === 'draw_and_guess' && userId !== gameData.currentDrawerId) {
            if (messageText.toLowerCase() === gameData.wordToDraw.toLowerCase()) {
                await updateGameLog(`${userName} خمن الكلمة الصحيحة!`);

                const roomDocRef = doc(db, 'artifacts', appId, 'public', 'data', 'gameRooms', currentRoomId);
                const newPlayers = gameData.players.map(p => {
                    if (p.id === userId) { // The guesser
                        return { ...p, score: (p.score || 0) + 2 };
                    }
                    if (p.id === gameData.currentDrawerId) { // The drawer
                        return { ...p, score: (p.score || 0) + 1 };
                    }
                    return p;
                });
                await updateDoc(roomDocRef, { players: newPlayers });

                // Start a new round
                await startGame();
                return; // Stop further execution
            }
        }

        // Default: Add as a regular chat message
        try {
            await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'gameRooms', currentRoomId, 'chat'), {
                text: messageText, senderName: userName, senderId: userId, senderAvatar: userAvatar, createdAt: serverTimestamp(),
            });
        } catch (error) { console.error("Error sending message:", error); }
    };

    const getPlayerNameById = (id) => gameData?.players?.find(p => p.id === id)?.name || id.substring(0, 4);

    const handleSaveSettings = async () => {
        dispatch({ type: 'SET_USER_DETAILS', payload: { name: tempUserName, avatar: tempUserAvatar } });
        if (currentRoomId) {
            const myPlayerIndex = gameData.players.findIndex(p => p.id === userId);
            if (myPlayerIndex !== -1) {
                const updatedPlayers = [...gameData.players];
                updatedPlayers[myPlayerIndex] = { ...updatedPlayers[myPlayerIndex], name: tempUserName, avatar: tempUserAvatar };
                try {
                    await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'gameRooms', currentRoomId), { players: updatedPlayers });
                } catch (error) { console.error("Error saving user settings:", error); }
            }
        }
        dispatch({ type: 'SET_SHOW_SETTINGS', payload: false });
    };

    if (loading) {
        return <div className="flex items-center justify-center min-h-screen bg-gray-950 text-gray-200"><div className="text-xl animate-pulse">جاري تحميل التطبيق...</div></div>;
    }

    const myPlayer = gameData?.players?.find(p => p.id === userId);

    return (
        <main className="h-screen bg-gray-900 text-gray-200 font-sans">
            {/* Voice Chat Components (non-visual) */}
            <AudioRenderer />
            {currentRoomId && <VoiceChat />}

            {/* Modals */}
            {errorMessage && (
                <div className="fixed inset-0 bg-red-950 bg-opacity-75 flex items-center justify-center z-50">
                    <div className="p-4 bg-red-800 rounded-lg text-center shadow-lg">
                        <p className="font-bold">حدث خطأ:</p>
                        <p>{errorMessage}</p>
                        <button onClick={() => dispatch({ type: 'SET_ERROR_MESSAGE', payload: '' })} className="mt-4 px-4 py-2 bg-red-600 rounded-lg hover:bg-red-500">إغلاق</button>
                    </div>
                </div>
            )}
            {showInstructions && <InstructionsModal onClose={() => dispatch({ type: 'SET_SHOW_INSTRUCTIONS', payload: false })} />}
            {showSettings && (
                <SettingsModal
                    userName={tempUserName}
                    setUserName={setTempUserName}
                    userAvatar={tempUserAvatar}
                    setUserAvatar={setTempUserAvatar}
                    avatars={avatars}
                    onClose={() => dispatch({ type: 'SET_SHOW_SETTINGS', payload: false })}
                    onSave={handleSaveSettings}
                />
            )}
            {showEndGameModal && gameData?.phase === 'final_results' && (
                <FinalResultsModal
                    players={gameData.players}
                    onBackToLobby={() => {
                        dispatch({ type: 'SET_SHOW_END_GAME_MODAL', payload: false });
                        dispatch({ type: 'LEAVE_ROOM' });
                    }}
                />
            )}

            {/* Main Content */}
            <div className="h-full w-full">
                {!currentRoomId ? (
                    <div className="flex items-center justify-center h-full p-4">
                        <Lobby
                            createGame={createGame}
                            joinGame={joinGame}
                        />
                    </div>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 h-full p-4">
                        <GameRoom
                            myPlayer={myPlayer}
                            startGame={startGame}
                            viewMyWord={viewMyWord}
                            startVotingPhase={startVotingPhase}
                            voteFor={voteFor}
                            handleSpyGuess={handleSpyGuess}
                            startNewRound={startNewRound}
                            endGame={endGame}
                            removePlayer={removePlayer}
                            handleSendMessage={handleSendMessage}
                            messagesEndRef={messagesEndRef}
                            gameLogRef={gameLogRef}
                            getPlayerNameById={getPlayerNameById}
                        />
                    </div>
                )}
            </div>
        </main>
    );
};

export default App;
