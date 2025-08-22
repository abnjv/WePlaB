import React, { useContext, useEffect, useRef } from 'react';
import { GameContext } from '../context/GameContext';

const AudioRenderer = () => {
    const { state } = useContext(GameContext);
    const { audioStreams } = state;

    return (
        <div style={{ display: 'none' }}>
            {Object.keys(audioStreams).map(peerId => (
                <AudioStream key={peerId} stream={audioStreams[peerId]} />
            ))}
        </div>
    );
};

const AudioStream = ({ stream }) => {
    const ref = useRef();
    useEffect(() => {
        if (stream) {
            ref.current.srcObject = stream;
        }
    }, [stream]);
    return <audio ref={ref} autoPlay />;
};

export default AudioRenderer;
