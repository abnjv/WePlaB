import React, { createContext, useReducer } from 'react';
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { doc, updateDoc, arrayUnion, arrayRemove, writeBatch, setDoc, serverTimestamp, addDoc, collection, getDoc, runTransaction } from 'firebase/firestore';
import { avatars, words as spyWords, gameWords, drawAndGuessWords, spaceWerewolfTasks } from '../constants';

export const GameContext = createContext();

export const initialState = {
    // Space Werewolf State
    playerLocations: {}, // { [userId]: { x: number, y: number } }
    playerRoles: {}, // { [userId]: 'crewmate' | 'impostor' }
    tasks: [], // { id: string, location: { x, y }, status: 'incomplete' | 'complete' }[]
    isMeetingActive: false,
    meetingInfo: null, // { reason: 'body_reported' | 'emergency_button', reporterId: 'some_user_id' }
    activeTask: null, // or a task object

    // Draw & Guess State
    gameType: 'who_is_the_spy', // 'who_is_the_spy', 'draw_and_guess', or 'space_werewolf'
    currentDrawerId: null,
    wordToDraw: '',
    drawingData: [],
    guesses: [],

    // Voice Chat State
    peer: null,
    myStream: null,
    audioStreams: {},
    isMuted: false,

    // Firebase and user state
    db: null,
    auth: null,
    friends: [],
    friendRequests: [],
    userId: null,
    userName: '',
    userAvatar: avatars[0],
    loading: true,
    errorMessage: '',
    isAuthReady: false,

    // App navigation state
    currentView: 'lobby', // 'lobby', 'profile', 'friends'
    authView: 'signup', // 'login', 'signup'

    // Game state
    currentRoomId: '',
    roomList: [],
    joinRoomInput: '',
    gameData: null,
    isHost: false,
    showWord: false,
    playerVote: null,
    spyGuessInput: '',
    showInstructions: false,
    votingTimer: 0,
    discussionTimer: 0,
    showSettings: false,
    showEndGameModal: false,

    // Chat and game log state
    messages: [],
    newMessage: '',
    gameLog: [],
};

export const gameReducer = (state, action) => {
    switch (action.type) {
        case 'SET_FIREBASE_SERVICES':
            return { ...state, db: action.payload.db, auth: action.payload.auth };
        case 'SET_USER':
            // Note: We are not setting user details like name/avatar here.
            // That happens in the onAuthStateChanged listener in App.js which fetches from the 'users' doc.
            return { ...state, userId: action.payload ? action.payload.uid : null };
        case 'SET_AUTH_READY':
            return { ...state, isAuthReady: true, loading: false };
        case 'SET_LOADING':
            return { ...state, loading: action.payload };
        case 'SET_ERROR_MESSAGE':
            return { ...state, errorMessage: action.payload };
        case 'SET_CURRENT_ROOM_ID':
            return { ...state, currentRoomId: action.payload };
        case 'SET_ROOM_LIST':
            return { ...state, roomList: action.payload };
        case 'SET_JOIN_ROOM_INPUT':
            return { ...state, joinRoomInput: action.payload };
        case 'SET_GAME_DATA':
            const gameData = action.payload;
            const isHost = gameData ? gameData.players.some(p => p.id === state.userId && p.isHost) : false;
            return { ...state, gameData, isHost };
        case 'SET_SHOW_WORD':
            return { ...state, showWord: action.payload };
        case 'SET_PLAYER_VOTE':
            return { ...state, playerVote: action.payload };
        case 'SET_SPY_GUESS_INPUT':
            return { ...state, spyGuessInput: action.payload };
        case 'SET_SHOW_INSTRUCTIONS':
            return { ...state, showInstructions: action.payload };
        case 'SET_SHOW_SETTINGS':
            return { ...state, showSettings: action.payload };
        case 'SET_SHOW_END_GAME_MODAL':
             return { ...state, showEndGameModal: action.payload };
        case 'SET_DISCUSSION_TIMER':
            return { ...state, discussionTimer: action.payload };
        case 'SET_VOTING_TIMER':
            return { ...state, votingTimer: action.payload };
        case 'SET_MESSAGES':
            return { ...state, messages: action.payload };
        case 'SET_NEW_MESSAGE':
            return { ...state, newMessage: action.payload };
        case 'SET_GAME_LOG':
            return { ...state, gameLog: action.payload };
        case 'LEAVE_ROOM':
            return { ...state, currentRoomId: '', gameData: null, isHost: false, showWord: false, playerVote: null, spyGuessInput: '' };
        case 'SET_USER_DETAILS':
            return { ...state, userName: action.payload.name, userAvatar: action.payload.avatar };

        // Navigation Actions
        case 'SET_CURRENT_VIEW':
            return { ...state, currentView: action.payload };
        case 'SET_AUTH_VIEW':
            return { ...state, authView: action.payload };

        // Voice Chat Actions
        case 'SET_PEER':
            return { ...state, peer: action.payload };
        case 'SET_MY_STREAM':
            return { ...state, myStream: action.payload };
        case 'ADD_AUDIO_STREAM':
            return { ...state, audioStreams: { ...state.audioStreams, [action.payload.peerId]: action.payload.stream } };
        case 'REMOVE_AUDIO_STREAM':
            const newStreams = { ...state.audioStreams };
            delete newStreams[action.payload.peerId];
            return { ...state, audioStreams: newStreams };
        case 'RESET_VOICE_CHAT':
             return { ...state, peer: null, myStream: null, audioStreams: {} };
        case 'TOGGLE_MUTE':
            return { ...state, isMuted: !state.isMuted };

        // Draw & Guess Actions
        case 'SET_GAME_TYPE':
            return { ...state, gameType: action.payload };
        case 'START_DRAW_ROUND':
            return {
                ...state,
                currentDrawerId: action.payload.drawerId,
                wordToDraw: action.payload.word,
                drawingData: [],
                guesses: [],
            };
        case 'UPDATE_DRAWING':
            return { ...state, drawingData: [...state.drawingData, action.payload] };
        case 'ADD_GUESS':
            return { ...state, guesses: [...state.guesses, action.payload] };
        case 'RESET_DRAW_GAME':
            return {
                ...state,
                currentDrawerId: null,
                wordToDraw: '',
                drawingData: [],
                guesses: []
            };

        // Space Werewolf Actions
        case 'SET_PLAYER_ROLES':
            return { ...state, playerRoles: action.payload };
        case 'UPDATE_PLAYER_LOCATION':
            return {
                ...state,
                playerLocations: {
                    ...state.playerLocations,
                    [action.payload.userId]: action.payload.location
                }
            };
        case 'COMPLETE_TASK':
            return {
                ...state,
                tasks: state.tasks.map(task =>
                    task.id === action.payload.taskId ? { ...task, status: 'complete' } : task
                )
            };
        case 'SET_MEETING_STATUS':
            return { ...state, isMeetingActive: action.payload };
        case 'SET_ACTIVE_TASK':
            return { ...state, activeTask: action.payload };

        // Friends Actions
        case 'SET_FRIENDS':
            return { ...state, friends: action.payload };
        case 'SET_FRIEND_REQUESTS':
            return { ...state, friendRequests: action.payload };

        default:
            return state;
    }
};

export const GameProvider = ({ children }) => {
    const [state, dispatch] = useReducer(gameReducer, initialState);
    const { db, userId, userName, userAvatar } = state;

    // Friends System Logic
    const sendFriendRequest = async (targetId) => {
        if (!db || !userId || !targetId || userId === targetId) return;
        const targetUserRef = doc(db, 'users', targetId);
        const request = { from: userId, name: userName, avatar: userAvatar };
        await updateDoc(targetUserRef, { friendRequests: arrayUnion(request) });
    };

    const acceptFriendRequest = async (request) => {
        if (!db || !userId) return;
        const currentUserRef = doc(db, 'users', userId);
        const requestorUserRef = doc(db, 'users', request.from);
        const batch = writeBatch(db);
        batch.update(currentUserRef, { friends: arrayUnion(request.from), friendRequests: arrayRemove(request) });
        batch.update(requestorUserRef, { friends: arrayUnion(userId) });
        await batch.commit();
    };

    const declineFriendRequest = async (request) => {
        if (!db || !userId) return;
        const currentUserRef = doc(db, 'users', userId);
        await updateDoc(currentUserRef, { friendRequests: arrayRemove(request) });
    };

    const removeFriend = async (friendId) => {
        if (!db || !userId) return;
        const currentUserRef = doc(db, 'users', userId);
        const friendUserRef = doc(db, 'users', friendId);
        const batch = writeBatch(db);
        batch.update(currentUserRef, { friends: arrayRemove(friendId) });
        batch.update(friendUserRef, { friends: arrayRemove(userId) });
        await batch.commit();
    };

    // Auth & Profile Logic
    const handleSignup = async (email, password, displayName) => {
        try {
            const userCredential = await createUserWithEmailAndPassword(state.auth, email, password);
            await createUserDocument(userCredential.user, displayName);
        } catch (error) { dispatch({ type: 'SET_ERROR_MESSAGE', payload: error.message }); }
    };

    const handleLogin = async (email, password) => {
        try {
            await signInWithEmailAndPassword(state.auth, email, password);
        } catch (error) { dispatch({ type: 'SET_ERROR_MESSAGE', payload: error.message }); }
    };

    const handleLogout = async () => {
        try {
            await signOut(state.auth);
            dispatch({ type: 'LEAVE_ROOM' });
            dispatch({ type: 'SET_CURRENT_VIEW', payload: 'lobby' });
        } catch (error) { dispatch({ type: 'SET_ERROR_MESSAGE', payload: error.message }); }
    };

    const createUserDocument = async (user, displayName) => {
        const userDocRef = doc(db, 'users', user.uid);
        await setDoc(userDocRef, {
            uid: user.uid, email: user.email, displayName,
            avatar: avatars[Math.floor(Math.random() * avatars.length)],
            createdAt: serverTimestamp(), friends: [], friendRequests: []
        });
    };

    const handleUpdateProfile = async (newName, newAvatar) => {
        if (!db || !userId) return;
        const userDocRef = doc(db, 'users', userId);
        try {
            await updateDoc(userDocRef, { displayName: newName, avatar: newAvatar });
            dispatch({ type: 'SET_USER_DETAILS', payload: { name: newName, avatar: newAvatar } });
            dispatch({ type: 'SET_CURRENT_VIEW', payload: 'lobby' });
        } catch (error) { dispatch({ type: 'SET_ERROR_MESSAGE', payload: "Failed to update profile." }); }
    };

    // Game Management Logic
    const createGame = async (gameType, isPublic = true) => {
        if (!db || !userId || !userName) return;
        try {
            const roomRef = await addDoc(collection(db, 'rooms'), {
                gameType,
                isPublic,
                hostId: userId,
                createdAt: serverTimestamp(),
                players: [{ id: userId, name: userName, avatar: userAvatar, isHost: true }],
                gameData: { status: 'waiting' },
            });
            dispatch({ type: 'SET_CURRENT_ROOM_ID', payload: roomRef.id });
        } catch (error) {
            dispatch({ type: 'SET_ERROR_MESSAGE', payload: 'Error creating room.' });
            console.error("Error creating room: ", error);
        }
    };

    const joinGame = async (roomId) => {
        if (!db || !userId || !userName) return;
        const roomRef = doc(db, 'rooms', roomId);
        try {
            await runTransaction(db, async (transaction) => {
                const roomDoc = await transaction.get(roomRef);
                if (!roomDoc.exists()) {
                    throw new Error("Room does not exist!");
                }

                const data = roomDoc.data();
                if (data.players.length >= 8) {
                    throw new Error("Room is full!");
                }

                if (data.players.some(p => p.id === userId)) {
                    // Player is already in the room, just let them enter
                    dispatch({ type: 'SET_CURRENT_ROOM_ID', payload: roomId });
                    return;
                }

                const newPlayer = { id: userId, name: userName, avatar: userAvatar, isHost: false };
                transaction.update(roomRef, { players: arrayUnion(newPlayer) });
            });

            dispatch({ type: 'SET_CURRENT_ROOM_ID', payload: roomId });
            console.log("Transaction successfully committed!");

        } catch (error) {
            dispatch({ type: 'SET_ERROR_MESSAGE', payload: `Error joining room: ${error.message}` });
            console.error("Error joining room: ", error);
        }
    };

    const startGame = async (roomId, gameType, players) => {
        if (!db) return;
        const roomRef = doc(db, 'rooms', roomId);
        let initialGameData = { status: 'in-progress' };

        if (gameType === 'who_is_the_spy') {
            const spyIndex = Math.floor(Math.random() * players.length);
            const word = spyWords[Math.floor(Math.random() * spyWords.length)];
            const spyWord = gameWords[word];
            initialGameData = {
                ...initialGameData,
                word: word,
                spyWord: spyWord,
                votes: {},
                playerRoles: Object.fromEntries(players.map((p, i) => [p.id, i === spyIndex ? 'spy' : 'citizen']))
            };
        } else if (gameType === 'draw_and_guess') {
            const firstDrawer = players[Math.floor(Math.random() * players.length)].id;
            const wordToDraw = drawAndGuessWords[Math.floor(Math.random() * drawAndGuessWords.length)];
            initialGameData = {
                ...initialGameData,
                currentDrawerId: firstDrawer,
                wordToDraw: wordToDraw,
                drawingData: [],
                guesses: [],
                scores: Object.fromEntries(players.map(p => [p.id, 0])),
            };
        } else if (gameType === 'space_werewolf') {
            const numImpostors = players.length < 7 ? 1 : 2;
            const shuffledPlayers = [...players].sort(() => 0.5 - Math.random());
            const impostorIds = shuffledPlayers.slice(0, numImpostors).map(p => p.id);

            const playerRoles = {};
            players.forEach(p => {
                playerRoles[p.id] = impostorIds.includes(p.id) ? 'impostor' : 'crewmate';
            });

            const initialLocations = {};
            players.forEach(p => {
                initialLocations[p.id] = { x: 50, y: 15 }; // Start in Cafeteria
            });

            const playerStatus = {};
            players.forEach(p => {
                playerStatus[p.id] = 'alive';
            });

            const crewmateIds = players.filter(p => playerRoles[p.id] === 'crewmate').map(p => p.id);
            const playerTasks = {};
            crewmateIds.forEach(crewmateId => {
                // Assign 2 random tasks to each crewmate
                const shuffledTasks = [...spaceWerewolfTasks].sort(() => 0.5 - Math.random());
                playerTasks[crewmateId] = shuffledTasks.slice(0, 2).map(task => ({ ...task, completed: false }));
            });

            initialGameData = {
                ...initialGameData,
                playerRoles: playerRoles,
                playerLocations: initialLocations,
                playerStatus: playerStatus,
                playerTasks: playerTasks, // New field for per-player tasks
                deadBodies: [],
            };
        }

        try {
            await updateDoc(roomRef, { gameData: initialGameData });
        } catch (error) {
            console.error("Error starting game: ", error);
        }
    };

    const killPlayer = async (roomId, targetId) => {
        if (!db || !state.gameData) return;
        const roomRef = doc(db, 'rooms', roomId);
        const { playerLocations, playerStatus } = state.gameData;

        const newStatus = { ...playerStatus, [targetId]: 'dead' };
        const deadBody = {
            userId: targetId,
            location: playerLocations[targetId],
        };

        try {
            await updateDoc(roomRef, {
                'gameData.playerStatus': newStatus,
                'gameData.deadBodies': arrayUnion(deadBody)
            });
        } catch (error) {
            console.error("Error killing player: ", error);
        }
    };

    const callEmergencyMeeting = async (roomId, reporterId) => {
        if (!db) return;
        const roomRef = doc(db, 'rooms', roomId);
        try {
            await updateDoc(roomRef, {
                'gameData.isMeetingActive': true,
                'gameData.meetingInfo': {
                    reason: 'emergency_button',
                    reporterId: reporterId
                }
            });
        } catch (error) {
            console.error("Error calling meeting: ", error);
        }
    };

    const reportBody = async (roomId, reporterId, body) => {
        if (!db) return;
        const roomRef = doc(db, 'rooms', roomId);

        // Remove the reported body from the map
        const updatedBodies = state.gameData.deadBodies.filter(b => b.userId !== body.userId);

        try {
            await updateDoc(roomRef, {
                'gameData.isMeetingActive': true,
                'gameData.meetingInfo': {
                    reason: 'body_reported',
                    reporterId: reporterId,
                    victimId: body.userId
                },
                'gameData.deadBodies': updatedBodies
            });
        } catch (error) {
            console.error("Error reporting body: ", error);
        }
    };


    const contextValue = {
        state,
        dispatch,
        sendFriendRequest,
        acceptFriendRequest,
        declineFriendRequest,
        removeFriend,
        handleSignup,
        handleLogin,
        handleLogout,
        handleUpdateProfile,
        createGame,
        joinGame,
        startGame,
        killPlayer,
        callEmergencyMeeting,
        reportBody
    };

    return (
        <GameContext.Provider value={contextValue}>
            {children}
        </GameContext.Provider>
    );
};
