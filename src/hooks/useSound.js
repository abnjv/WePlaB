// A simple hook for playing sound effects.
// In a real application, this would use a library like Howler.js or the Web Audio API.
// For now, it just logs to the console to simulate the effect.

const playSound = (soundName) => {
    console.log(`🔊 Playing sound: ${soundName}`);
};

export const useSound = () => {
    return { playSound };
};
