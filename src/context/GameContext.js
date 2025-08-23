import React, { createContext, useReducer } from 'react';
import { avatars } from '../App';

export const GameContext = createContext();

export const initialState = {
    // Space Werewolf State
    playerLocations: {}, // { [userId]: { x: number, y: number } }
    playerRoles: {}, // { [userId]: 'crewmate' | 'impostor' }
    tasks: [], // { id: string, location: { x, y }, status: 'incomplete' | 'complete' }[]
    isMeetingActive: false,

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
    userId: null,
    userName: '',
    userAvatar: avatars[0],
    loading: true,
    errorMessage: '',
    isAuthReady: false,

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
            return { ...state, userId: action.payload.uid, userName: `اللاعب-${action.payload.uid.substring(0, 4)}`, userAvatar: avatars[Math.floor(Math.random() * avatars.length)] };
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

        default:
            return state;
    }
};

export const GameProvider = ({ children }) => {
    const [state, dispatch] = useReducer(gameReducer, initialState);

    return (
        <GameContext.Provider value={{ state, dispatch }}>
            {children}
        </GameContext.Provider>
    );
};
