import React, { useContext, useEffect, useRef, useState, useCallback } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, onAuthStateChanged, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { getFirestore, doc, onSnapshot, collection, addDoc, serverTimestamp, setDoc, getDoc, updateDoc, query, where, orderBy, limit, runTransaction, writeBatch, arrayUnion, arrayRemove } from 'firebase/firestore';
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
import TaskModal from './components/TaskModal';
import Login from './components/Login';
import Signup from './components/Signup';
import Profile from './components/Profile';
import Friends from './components/Friends';
import { avatars } from './constants';

const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
const firebaseConfig = typeof __firebase_config !== 'undefined' ? JSON.parse(__firebase_config) : {};

const App = () => {
    const { state, dispatch, handleLogout } = useContext(GameContext);
    const {
        db, auth, userId, userName, loading, errorMessage, currentRoomId,
        currentView, authView
    } = state;

    // LISTENERS
    useEffect(() => {
        const app = initializeApp(firebaseConfig);
        const authService = getAuth(app);
        const firestoreDb = getFirestore(app);
        dispatch({ type: 'SET_FIREBASE_SERVICES', payload: { db: firestoreDb, auth: authService } });
    }, [dispatch]);

    useEffect(() => {
        if (!auth) return;
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (user) {
                const userDocRef = doc(db, 'users', user.uid);
                const userDocSnap = await getDoc(userDocRef);
                if (userDocSnap.exists()) {
                    const userData = userDocSnap.data();
                    dispatch({ type: 'SET_USER_DETAILS', payload: { name: userData.displayName, avatar: userData.avatar } });
                }
                dispatch({ type: 'SET_USER', payload: { uid: user.uid } });
            } else {
                dispatch({ type: 'SET_USER', payload: null });
            }
            dispatch({ type: 'SET_AUTH_READY' });
        });
        return () => unsubscribe();
    }, [auth, db, dispatch]);

    useEffect(() => {
        if (!userId || !db) return;
        const userDocRef = doc(db, 'users', userId);
        const unsubscribe = onSnapshot(userDocRef, (docSnap) => {
            if (docSnap.exists()) {
                const userData = docSnap.data();
                dispatch({ type: 'SET_FRIENDS', payload: userData.friends || [] });
                dispatch({ type: 'SET_FRIEND_REQUESTS', payload: userData.friendRequests || [] });
            }
        });
        return () => unsubscribe();
    }, [userId, db, dispatch]);

    // Room listener
    useEffect(() => {
        if (!db || !currentRoomId || !userId) return;

        const roomRef = doc(db, 'rooms', currentRoomId);
        const unsubscribe = onSnapshot(roomRef, (docSnap) => {
            if (docSnap.exists()) {
                const roomData = docSnap.data();
                // Check if player is still in the room's player list
                if (!roomData.players.some(p => p.id === userId)) {
                    // We've been kicked or have left, so exit the room view
                    dispatch({ type: 'LEAVE_ROOM' });
                    // Optionally, show a message
                    dispatch({ type: 'SET_ERROR_MESSAGE', payload: 'You have been removed from the room.' });
                } else {
                    // This is where we receive real-time game state updates
                    dispatch({ type: 'SET_GAME_DATA', payload: roomData });
                }
            } else {
                // Room has been deleted
                dispatch({ type: 'LEAVE_ROOM' });
                dispatch({ type: 'SET_ERROR_MESSAGE', payload: 'The room has been closed.' });
            }
        });

        return () => unsubscribe();

    }, [db, currentRoomId, userId, dispatch]);

    // RENDER LOGIC
    if (loading) {
        return <div className="flex items-center justify-center min-h-screen bg-gray-950 text-gray-200">Loading...</div>;
    }

    if (!userId) {
        return (
            <main className="h-screen bg-gray-900 text-gray-200 font-sans flex items-center justify-center p-4">
                {errorMessage && <p className="text-red-500">{errorMessage}</p>}
                {authView === 'login' ? <Login /> : <Signup />}
            </main>
        );
    }

    const renderMainView = () => {
        if (currentRoomId) {
            return <GameRoom /* props */ />;
        }
        switch (currentView) {
            case 'profile':
                return <Profile />;
            case 'friends':
                return <Friends switchToProfile={() => dispatch({ type: 'SET_CURRENT_VIEW', payload: 'profile' })} />;
            default:
                // createGame and joinGame are now in context, so Lobby can access them directly
                return <Lobby switchToProfile={() => dispatch({ type: 'SET_CURRENT_VIEW', payload: 'profile' })} />;
        }
    };

    return (
        <main className="h-screen bg-gray-900 text-gray-200 font-sans">
            <AudioRenderer />
            {currentRoomId && <VoiceChat />}
            <div className="absolute top-4 right-4 z-50 flex items-center space-x-4">
                <span className="text-white">Welcome, {userName}</span>
                <button onClick={() => dispatch({ type: 'SET_CURRENT_VIEW', payload: 'profile' })}>Profile</button>
                <button onClick={handleLogout}>Logout</button>
            </div>
            <div className="h-full w-full flex items-center justify-center p-4 pt-20">
                {renderMainView()}
            </div>
        </main>
    );
};

export default App;
