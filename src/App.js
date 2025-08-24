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

const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
const firebaseConfig = typeof __firebase_config !== 'undefined' ? JSON.parse(__firebase_config) : {};

export const gameWords = { 'مدينة': 'عاصمة', 'حيوان': 'طائر', 'فاكهة': 'خضروات', 'أداة': 'آلة', 'رياضة': 'هواية', 'مهنة': 'وظيفة', 'مشروب': 'سائل', 'فيلم': 'مسلسل', 'كوكب': 'قمر', 'لعبة': 'رياضة', 'عملة': 'بضاعة', 'طعام': 'بهار', 'مركبة': 'وسيلة نقل', 'معدن': 'عنصر', 'سلاح': 'دفاع' };
export const words = Object.keys(gameWords);
export const drawAndGuessWords = ['سيارة', 'شجرة', 'منزل', 'قطة', 'كلب', 'شمس', 'قمر', 'نجمة', 'كتاب', 'قلم', 'طاولة', 'كرسي', 'هاتف', 'حاسوب', 'مفتاح', 'باب', 'نافذة', 'ساعة', 'نظارة', 'كرة'];
export const spaceWerewolfTasks = [ { id: 'task1', name: 'إصلاح الأسلاك', room: 'Engine Room', location: { x: 20, y: 85 } }, { id: 'task2', name: 'تنزيل البيانات', room: 'Cafeteria', location: { x: 50, y: 15 } }, { id: 'task3', name: 'تفعيل الدروع', room: 'Security', location: { x: 80, y: 85 } }, { id: 'task4', name: 'تفريغ القمامة', room: 'Cafeteria', location: { x: 60, y: 15 } }, { id: 'task5', name: 'فحص طبي', room: 'MedBay', location: { x: 80, y: 15 } }, ];
export const avatars = ['😊', '😎', '🤩', '🥳', '🤓', '🤖', '👻', '👽', '👑'];
const DISCUSSION_TIMER = 120;
const VOTING_TIMER = 30;

const App = () => {
    const { state, dispatch } = useContext(GameContext);
    const {
        db, auth, userId, userName, userAvatar, loading, errorMessage, currentRoomId,
        gameData, isHost, playerLocations
    } = state;

    const [authView, setAuthView] = useState('signup');
    const [currentView, setCurrentView] = useState('lobby');
    const messagesEndRef = useRef(null);
    const gameLogRef = useRef(null);

    // AUTH & PROFILE
    const handleSignup = async (email, password, displayName) => {
        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            await createUserDocument(userCredential.user, displayName);
        } catch (error) { dispatch({ type: 'SET_ERROR_MESSAGE', payload: error.message }); }
    };
    const handleLogin = async (email, password) => {
        try {
            await signInWithEmailAndPassword(auth, email, password);
        } catch (error) { dispatch({ type: 'SET_ERROR_MESSAGE', payload: error.message }); }
    };
    const handleLogout = async () => {
        try {
            await signOut(auth);
            dispatch({ type: 'LEAVE_ROOM' });
            setCurrentView('lobby');
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
            setCurrentView('lobby');
        } catch (error) { dispatch({ type: 'SET_ERROR_MESSAGE', payload: "Failed to update profile." }); }
    };

    // FRIENDS SYSTEM
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

    // LISTENERS & Game Logic
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

    // ... all other game logic from previous versions ...

    // RENDER LOGIC
    if (loading) {
        return <div className="flex items-center justify-center min-h-screen bg-gray-950 text-gray-200">Loading...</div>;
    }

    if (!userId) {
        return (
            <main className="h-screen bg-gray-900 text-gray-200 font-sans flex items-center justify-center p-4">
                {errorMessage && <p className="text-red-500">{errorMessage}</p>}
                {authView === 'login' ? <Login handleLogin={handleLogin} switchToSignup={() => setAuthView('signup')} /> : <Signup handleSignup={handleSignup} switchToLogin={() => setAuthView('login')} />}
            </main>
        );
    }

    const renderMainView = () => {
        if (currentRoomId) {
            return <GameRoom /* props */ />;
        }
        switch (currentView) {
            case 'profile':
                return <Profile handleUpdateProfile={handleUpdateProfile} switchToLobby={() => setCurrentView('lobby')} switchToFriends={() => setCurrentView('friends')} />;
            case 'friends':
                return <Friends switchToProfile={() => setCurrentView('profile')} sendFriendRequest={sendFriendRequest} acceptFriendRequest={acceptFriendRequest} declineFriendRequest={declineFriendRequest} removeFriend={removeFriend} />;
            default:
                return <Lobby createGame={()=>{}} joinGame={()=>{}} switchToProfile={() => setCurrentView('profile')} />;
        }
    };

    return (
        <main className="h-screen bg-gray-900 text-gray-200 font-sans">
            <AudioRenderer />
            {currentRoomId && <VoiceChat />}
            <div className="absolute top-4 right-4 z-50 flex items-center space-x-4">
                <span className="text-white">Welcome, {userName}</span>
                <button onClick={() => setCurrentView('profile')}>Profile</button>
                <button onClick={handleLogout}>Logout</button>
            </div>
            <div className="h-full w-full flex items-center justify-center p-4 pt-20">
                {renderMainView()}
            </div>
        </main>
    );
};

export default App;
