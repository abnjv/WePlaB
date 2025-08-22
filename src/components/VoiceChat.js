import React, { useEffect, useContext, useRef } from 'react';
import Peer from 'peerjs';
import { GameContext } from '../context/GameContext';
import { doc, updateDoc } from 'firebase/firestore';

const VoiceChat = () => {
    const { state, dispatch } = useContext(GameContext);
    const { db, userId, currentRoomId, gameData, peer, myStream } = state;

    const callsRef = useRef({});

    // 1. Initialize Peer and get user media
    useEffect(() => {
        const initialize = async () => {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ video: false, audio: true });
                dispatch({ type: 'SET_MY_STREAM', payload: stream });

                const newPeer = new Peer();
                dispatch({ type: 'SET_PEER', payload: newPeer });

                newPeer.on('open', (peerId) => {
                    const roomDocRef = doc(db, 'artifacts', appId, 'public', 'data', 'gameRooms', currentRoomId);
                    const updatedPlayers = gameData.players.map(p =>
                        p.id === userId ? { ...p, peerId } : p
                    );
                    updateDoc(roomDocRef, { players: updatedPlayers });
                });

            } catch (err) {
                console.error("Failed to get local stream or initialize peer", err);
            }
        };

        if (db && userId && currentRoomId && gameData && !peer) {
            initialize();
        }

        // Cleanup
        return () => {
            if (peer) {
                peer.destroy();
                dispatch({ type: 'RESET_VOICE_CHAT' });
            }
            if (myStream) {
                myStream.getTracks().forEach(track => track.stop());
            }
        };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [db, userId, currentRoomId, gameData]);


    // 2. Handle incoming calls
    useEffect(() => {
        if (!peer || !myStream) return;

        peer.on('call', (call) => {
            call.answer(myStream);
            call.on('stream', (remoteStream) => {
                dispatch({ type: 'ADD_AUDIO_STREAM', payload: { peerId: call.peer, stream: remoteStream } });
            });
            callsRef.current[call.peer] = call;
        });

        return () => {
            if (peer) peer.off('call');
        }
    }, [peer, myStream, dispatch]);


    // 3. Call other users and manage connections
    useEffect(() => {
        if (!peer || !myStream || !gameData) return;

        gameData.players.forEach(player => {
            if (player.id !== userId && player.peerId && !callsRef.current[player.peerId]) {
                console.log(`Calling ${player.name} at ${player.peerId}`);
                const call = peer.call(player.peerId, myStream);
                if (call) {
                    call.on('stream', (remoteStream) => {
                        dispatch({ type: 'ADD_AUDIO_STREAM', payload: { peerId: player.peerId, stream: remoteStream } });
                    });
                    callsRef.current[player.peerId] = call;
                }
            }
        });

        // Cleanup for leaving players
        const currentPeerIds = new Set(gameData.players.map(p => p.peerId));
        Object.keys(callsRef.current).forEach(peerId => {
            if (!currentPeerIds.has(peerId)) {
                console.log(`Closing call with ${peerId}`);
                callsRef.current[peerId].close();
                delete callsRef.current[peerId];
                dispatch({ type: 'REMOVE_AUDIO_STREAM', payload: { peerId } });
            }
        });

    }, [peer, myStream, gameData, userId, dispatch]);

    // 4. Handle Muting
    useEffect(() => {
        if (myStream) {
            myStream.getAudioTracks().forEach(track => {
                track.enabled = !state.isMuted;
            });
        }
    }, [myStream, state.isMuted]);

    // This component is headless, it just manages connections.
    // The audio elements will be rendered elsewhere.
    return null;
};

// The appId needs to be accessible here, I will pass it from App.js
const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';

export default VoiceChat;
