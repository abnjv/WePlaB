import React, { useRef, useEffect, useContext, useState } from 'react';
import { GameContext } from '../context/GameContext';

const Canvas = () => {
    const { state, dispatch } = useContext(GameContext);
    const { drawingData, currentDrawerId, userId } = state;
    const canvasRef = useRef(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [currentPath, setCurrentPath] = useState([]);

    const canDraw = userId === currentDrawerId;

    // Effect to draw paths from global state
    useEffect(() => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');

        const resizeCanvas = () => {
            canvas.width = canvas.offsetWidth;
            canvas.height = canvas.offsetHeight;
            redrawAllPaths();
        };

        const redrawAllPaths = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            [...drawingData, currentPath].forEach(path => {
                if (path.points.length < 2) return;
                ctx.beginPath();
                ctx.strokeStyle = path.color || 'white';
                ctx.lineWidth = path.lineWidth || 5;
                ctx.lineCap = 'round';
                ctx.lineJoin = 'round';
                ctx.moveTo(path.points[0].x * canvas.width, path.points[0].y * canvas.height);
                for (let i = 1; i < path.points.length; i++) {
                    ctx.lineTo(path.points[i].x * canvas.width, path.points[i].y * canvas.height);
                }
                ctx.stroke();
            });
        };

        window.addEventListener('resize', resizeCanvas);
        resizeCanvas();
        // Redraw whenever drawingData or the locally drawn path changes
        redrawAllPaths();

        return () => {
            window.removeEventListener('resize', resizeCanvas);
        };
    }, [drawingData, currentPath]);

    const getRelativeCoords = (e) => {
        const rect = canvasRef.current.getBoundingClientRect();
        // Handle both mouse and touch events
        const clientX = e.clientX || e.touches[0].clientX;
        const clientY = e.clientY || e.touches[0].clientY;
        return {
            x: (clientX - rect.left) / rect.width,
            y: (clientY - rect.top) / rect.height,
        };
    };

    const startDrawing = (e) => {
        if (!canDraw) return;
        e.preventDefault();
        const { x, y } = getRelativeCoords(e);
        setIsDrawing(true);
        setCurrentPath({
            points: [{ x, y }],
            color: 'white',
            lineWidth: 5,
        });
    };

    const draw = (e) => {
        if (!isDrawing || !canDraw) return;
        e.preventDefault();
        const { x, y } = getRelativeCoords(e);
        setCurrentPath(prevPath => ({
            ...prevPath,
            points: [...prevPath.points, { x, y }],
        }));
    };

    const stopDrawing = () => {
        if (!isDrawing || !canDraw) return;
        setIsDrawing(false);
        // Dispatch the completed path to the global state
        if (currentPath.points.length > 1) {
            dispatch({ type: 'UPDATE_DRAWING', payload: currentPath });
        }
        // Clear the local path
        setCurrentPath([]);
    };

    return (
        <canvas
            ref={canvasRef}
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={stopDrawing}
            onMouseLeave={stopDrawing}
            onTouchStart={startDrawing}
            onTouchMove={draw}
            onTouchEnd={stopDrawing}
            className={`w-full h-full bg-gray-700 rounded-lg ${canDraw ? 'cursor-crosshair' : 'cursor-not-allowed'}`}
        />
    );
};

export default Canvas;
