import React, { useContext, useEffect, useRef, useState, useCallback } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInWithCustomToken, signInAnonymously } from 'firebase/auth';
import { getFirestore, doc, onSnapshot, collection, addDoc, serverTimestamp, setDoc, getDoc, updateDoc, query, where, orderBy, limit, runTransaction } from 'firebase/firestore';
import { throttle } from 'lodash';
import Lobby from './components/Lobby';
import GameRoom from './components/GameRoom';
import FinalResultsModal from './components/FinalResultsModal';
import InstructionsModal from './components/InstructionsModal';
import SettingsModal from './components/SettingsModal';
import { GameContext } from './context/GameContext';
import VoiceChat from './components/VoiceChat';
import AudioRenderer from './components/AudioRenderer';
import { useMovement } from './hooks/useMovement';

// DO NOT change these variables. They are provided by the environment.
const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
const firebaseConfig = typeof __firebase_config !== 'undefined' ? JSON.parse(__firebase_config) : {};
const initialAuthToken = typeof __initial_auth_token !== 'undefined' ? __initial_auth_token : null;

// Game words & tasks
export const gameWords = { 'مدينة': 'عاصمة', 'حيوان': 'طائر', 'فاكهة': 'خضروات', 'أداة': 'آلة', 'رياضة': 'هواية', 'مهنة': 'وظيفة', 'مشروب': 'سائل', 'فيلم': 'مسلسل', 'كوكب': 'قمر', 'لعبة': 'رياضة', 'عملة': 'بضاعة', 'طعام': 'بهار', 'مركبة': 'وسيلة نقل', 'معدن': 'عنصر', 'سلاح': 'دفاع' };
export const words = Object.keys(gameWords);
export const drawAndGuessWords = ['سيارة', 'شجرة', 'منزل', 'قطة', 'كلب', 'شمس', 'قمر', 'نجمة', 'كتاب', 'قلم', 'طاولة', 'كرسي', 'هاتف', 'حاسوب', 'مفتاح', 'باب', 'نافذة', 'ساعة', 'نظارة', 'كرة'];
export const spaceWerewolfTasks = [{ id: 'task1', name: 'إصلاح الأسلاك', location: { x: 10, y: 20 } }, { id: 'task2', name: 'تنزيل البيانات', location: { x: 80, y: 50 } }, { id: 'task3', name: 'تفعيل الدروع', location: { x: 50, y: 80 } }, { id: 'task4', name: 'تفريغ القمامة', location: { x: 20, y: 70 } }, { id: 'task5', name: 'مسح الكويكبات', location: { x: 90, y: 10 } }];
export const avatars = ['😊', '😎', '🤩', '🥳', '🤓', '🤖', '👻', '👽', '👑'];
const DISCUSSION_TIMER = 120;
const VOTING_TIMER = 30;

const App = () => {
    const { state, dispatch } = useContext(GameContext);
    const {
        db, userId, userName, userAvatar, loading, errorMessage, currentRoomId,
        gameData, isHost, playerLocations
    } = state;

    // Local state for modal inputs
    const [tempUserName, setTempUserName] = useState(userName);
    const [tempUserAvatar, setTempUserAvatar] = useState(userAvatar);

    const messagesEndRef = useRef(null);
    const gameLogRef = useRef(null);

    // Throttled Firestore update for player location
    const updateLocationInFirestore = useCallback(throttle((newLocation) => {
        if (!db || !currentRoomId || !userId) return;
        const roomDocRef = doc(db, 'artifacts', appId, 'public', 'data', 'gameRooms', currentRoomId);
        updateDoc(roomDocRef, {
            [`playerLocations.${userId}`]: newLocation
        });
    }, 200), [db, currentRoomId, userId]);

    // Movement handler
    const handleMove = useCallback(({ dx, dy }) => {
        if (!playerLocations || !playerLocations[userId]) return;

        const oldLocation = playerLocations[userId];
        const newLocation = {
            x: Math.max(0, Math.min(100, oldLocation.x + dx)),
            y: Math.max(0, Math.min(100, oldLocation.y + dy)),
        };

        dispatch({ type: 'UPDATE_PLAYER_LOCATION', payload: { userId, location: newLocation } });
        updateLocationInFirestore(newLocation);
    }, [userId, playerLocations, dispatch, updateLocationInFirestore]);

    const isSpaceWerewolfActive = gameData?.gameType === 'space_werewolf' && gameData?.status === 'in-progress';
    useMovement(isSpaceWerewolfActive ? handleMove : () => {});

    // Effect to update temp settings when modal is opened
    useEffect(() => {
        if (state.showSettings) {
            setTempUserName(userName);
            setTempUserAvatar(userAvatar);
        }
    }, [state.showSettings, userName, userAvatar]);

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
                if (data.playerLocations) {
                    Object.keys(data.playerLocations).forEach(pId => {
                        dispatch({ type: 'UPDATE_PLAYER_LOCATION', payload: { userId: pId, location: data.playerLocations[pId] } });
                    });
                }
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
        if (gameData?.phase === 'voting' && state.votingTimer > 0) {
            timer = setInterval(() => dispatch({ type: 'SET_VOTING_TIMER', payload: state.votingTimer - 1 }), 1000);
        } else if (gameData?.phase === 'discussion' && state.discussionTimer > 0) {
            timer = setInterval(() => dispatch({ type: 'SET_DISCUSSION_TIMER', payload: state.discussionTimer - 1 }), 1000);
        }
        return () => clearInterval(timer);
    }, [gameData?.phase, state.votingTimer, state.discussionTimer, dispatch]);

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

    useEffect(() => { if (messagesEndRef.current) messagesEndRef.current.scrollTop = messagesEndRef.current.scrollHeight; }, [state.messages]);
    useEffect(() => { if (gameLogRef.current) gameLogRef.current.scrollTop = gameLogRef.current.scrollHeight; }, [state.gameLog]);

    const updateGameLog = async (logMessage) => {
        if (!db || !currentRoomId) return;
        const roomDocRef = doc(db, 'artifacts', appId, 'public', 'data', 'gameRooms', currentRoomId);
        try {
            await updateDoc(roomDocRef, { gameLog: [...(gameData?.gameLog || []), { text: logMessage, timestamp: serverTimestamp() }] });
        } catch (error) { console.error("Error updating game log:", error); }
    };

    const createGame = async (gameType = 'who_is_the_spy', isPublicRoom = true) => {
        if (!db || !userId || !userName) return;
        dispatch({ type: 'SET_LOADING', payload: true });
        try {
            const newRoomRef = doc(collection(db, 'artifacts', appId, 'public', 'data', 'gameRooms'));
            await setDoc(newRoomRef, {
                gameType: gameType, status: 'waiting',
                players: [{ id: userId, name: userName, isHost: true, avatar: userAvatar, score: 0 }],
                createdAt: serverTimestamp(), isPublic: isPublicRoom,
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
                if (!roomSnap.exists()) { throw new Error("هذه الغرفة غير موجودة أو انتهت."); }
                const roomData = roomSnap.data();
                if (roomData.players.some(p => p.id === userId)) {
                    playerAlreadyInRoom = true;
                    return;
                }
                if (roomData.status !== 'waiting') { throw new Error("لا يمكن الانضمام، اللعبة بدأت بالفعل."); }
                if (roomData.players.length >= 8) { throw new Error("الغرفة ممتلئة. لا يمكن الانضمام."); }
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
        if (!db || !currentRoomId || !isHost || gameData.players.length < 2) {
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
                await updateDoc(roomDocRef, { status: 'in-progress', round: (gameData.round || 0) + 1, currentDrawerId: drawer.id, wordToDraw: word, drawingData: [], guesses: [] });
                await updateGameLog(`بدأت جولة "ارسم وخمن"! ${drawer.name} هو الرسام.`);
            } else if (gameData.gameType === 'space_werewolf') {
                const players = [...gameData.players];
                const impostorIndex = Math.floor(Math.random() * players.length);
                const playerRoles = {};
                const playerTasks = {};
                const playerLocations = {};
                players.forEach((p, index) => {
                    const isImpostor = index === impostorIndex;
                    playerRoles[p.id] = isImpostor ? 'impostor' : 'crewmate';
                    playerLocations[p.id] = { x: 50, y: 50 };
                    if (!isImpostor) {
                        playerTasks[p.id] = [...spaceWerewolfTasks].sort(() => 0.5 - Math.random()).slice(0, 2);
                    }
                });
                await updateDoc(roomDocRef, { status: 'in-progress', round: (gameData.round || 0) + 1, playerRoles, playerTasks, playerLocations, isMeetingActive: false });
                await updateGameLog(`بدأت جولة "ذئب الفضاء"! هناك محتال واحد بيننا.`);
            } else {
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
                await updateDoc(roomDocRef, { status: 'in-progress', players, spy: players[spyIndex].id, word: words[wordIndex], undercoverWord: gameWords[words[wordIndex]], votes: {}, phase: 'discussion', round: (gameData.round || 0) + 1, discussionStartTime: serverTimestamp() });
                await updateGameLog(`بدأت جولة "من هو الجاسوس" رقم ${gameData.round || 1}.`);
            }
        } catch (error) {
            console.error("Error starting game:", error);
            dispatch({ type: 'SET_ERROR_MESSAGE', payload: "فشل في بدء اللعبة." });
        }
    };

    // ... all other handler functions (startVotingPhase, voteFor, etc.)
    const startVotingPhase = async () => {};
    const voteFor = async () => {};
    const autoVote = async () => {};
    const handleSpyGuess = async () => {};
    const startNewRound = async () => {};
    const endGame = async () => {};
    const removePlayer = async () => {};
    const handleSaveSettings = async () => {};
    const viewMyWord = async () => {};
    const getPlayerNameById = (id) => gameData?.players?.find(p => p.id === id)?.name || id.substring(0, 4);

    const callEmergencyMeeting = async () => {
        if (!db || !currentRoomId) return;
        await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'gameRooms', currentRoomId), {
            isMeetingActive: true
        });
        updateGameLog(`${userName} called an emergency meeting!`);
    };

    const completeTask = (taskId) => {
        dispatch({ type: 'COMPLETE_TASK', payload: { taskId } });
        // In a real implementation, this would also update Firestore
        // and likely award points or check for game end conditions.
        updateGameLog(`${userName} completed a task!`);
    };

    const handleSendMessage = async () => {
        if (state.newMessage.trim() === '' || !db || !currentRoomId) return;
        const messageText = state.newMessage.trim();
        dispatch({ type: 'SET_NEW_MESSAGE', payload: '' });
        if (gameData.gameType === 'draw_and_guess' && userId !== gameData.currentDrawerId) {
            if (messageText.toLowerCase() === gameData.wordToDraw.toLowerCase()) {
                await updateGameLog(`${userName} خمن الكلمة الصحيحة!`);
                const roomDocRef = doc(db, 'artifacts', appId, 'public', 'data', 'gameRooms', currentRoomId);
                const newPlayers = gameData.players.map(p => {
                    if (p.id === userId) return { ...p, score: (p.score || 0) + 2 };
                    if (p.id === gameData.currentDrawerId) return { ...p, score: (p.score || 0) + 1 };
                    return p;
                });
                await updateDoc(roomDocRef, { players: newPlayers });
                await startGame();
                return;
            }
        }
        try {
            await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'gameRooms', currentRoomId, 'chat'), {
                text: messageText, senderName: userName, senderId: userId, senderAvatar: userAvatar, createdAt: serverTimestamp(),
            });
        } catch (error) { console.error("Error sending message:", error); }
    };

    if (loading) {
        return <div className="flex items-center justify-center min-h-screen bg-gray-950 text-gray-200"><div className="text-xl animate-pulse">جاري تحميل التطبيق...</div></div>;
    }

    const myPlayer = gameData?.players?.find(p => p.id === userId);

    return (
        <main className="h-screen bg-gray-900 text-gray-200 font-sans">
            <AudioRenderer />
            {currentRoomId && <VoiceChat />}
            {state.errorMessage && (
                 <div className="fixed inset-0 bg-red-950 bg-opacity-75 flex items-center justify-center z-50">
                    <div className="p-4 bg-red-800 rounded-lg text-center shadow-lg">
                        <p className="font-bold">حدث خطأ:</p>
                        <p>{state.errorMessage}</p>
                        <button onClick={() => dispatch({ type: 'SET_ERROR_MESSAGE', payload: '' })} className="mt-4 px-4 py-2 bg-red-600 rounded-lg hover:bg-red-500">إغلاق</button>
                    </div>
                </div>
            )}
            {state.showInstructions && <InstructionsModal onClose={() => dispatch({ type: 'SET_SHOW_INSTRUCTIONS', payload: false })} />}
            {state.showSettings && (
                <SettingsModal
                    userName={tempUserName} setUserName={setTempUserName}
                    userAvatar={tempUserAvatar} setUserAvatar={setTempUserAvatar}
                    avatars={avatars} onClose={() => dispatch({ type: 'SET_SHOW_SETTINGS', payload: false })}
                    onSave={handleSaveSettings}
                />
            )}
            {state.showEndGameModal && gameData?.phase === 'final_results' && (
                <FinalResultsModal
                    players={gameData.players}
                    onBackToLobby={() => {
                        dispatch({ type: 'SET_SHOW_END_GAME_MODAL', payload: false });
                        dispatch({ type: 'LEAVE_ROOM' });
                    }}
                />
            )}
            <div className="h-full w-full">
                {!currentRoomId ? (
                    <div className="flex items-center justify-center h-full p-4">
                        <Lobby createGame={createGame} joinGame={joinGame} />
                    </div>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 h-full p-4">
                        <GameRoom
                            myPlayer={myPlayer} startGame={startGame}
                            viewMyWord={viewMyWord} startVotingPhase={startVotingPhase}
                            voteFor={voteFor} handleSpyGuess={handleSpyGuess}
                            startNewRound={startNewRound} endGame={endGame}
                            removePlayer={removePlayer} handleSendMessage={handleSendMessage}
                            completeTask={completeTask}
                            callEmergencyMeeting={callEmergencyMeeting}
                            messagesEndRef={messagesEndRef} gameLogRef={gameLogRef}
                            getPlayerNameById={getPlayerNameById}
                        />
                    </div>
                )}
            </div>
        </main>
    );
};

export default App;
