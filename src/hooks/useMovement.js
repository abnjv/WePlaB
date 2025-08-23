import { useEffect, useRef } from 'react';

export const useMovement = (onMove) => {
    const keys = useRef({
        ArrowUp: false,
        ArrowDown: false,
        ArrowLeft: false,
        ArrowRight: false,
    });
    const speed = 1; // Movement speed (percentage per frame)

    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key in keys.current) {
                e.preventDefault();
                keys.current[e.key] = true;
            }
        };

        const handleKeyUp = (e) => {
            if (e.key in keys.current) {
                e.preventDefault();
                keys.current[e.key] = false;
            }
        };

        let animationFrameId;
        const moveLoop = () => {
            let dx = 0;
            let dy = 0;
            if (keys.current.ArrowUp) dy -= speed;
            if (keys.current.ArrowDown) dy += speed;
            if (keys.current.ArrowLeft) dx -= speed;
            if (keys.current.ArrowRight) dx += speed;

            if (dx !== 0 || dy !== 0) {
                onMove({ dx, dy });
            }
            animationFrameId = requestAnimationFrame(moveLoop);
        };

        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);
        moveLoop();

        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('keyup', handleKeyUp);
            cancelAnimationFrame(animationFrameId);
        };
    }, [onMove]);
};
