import React, { useState, useContext } from 'react';
import { GameContext } from '../context/GameContext';

const Login = () => {
    const { handleLogin, dispatch } = useContext(GameContext);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        handleLogin(email, password);
    };

    return (
        <div className="w-full max-w-md p-8 space-y-6 bg-gray-800 rounded-lg shadow-lg">
            <h2 className="text-2xl font-bold text-center text-white">Login</h2>
            <form className="space-y-6" onSubmit={handleSubmit}>
                <div>
                    <label className="block mb-2 text-sm font-medium text-gray-300">Email</label>
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full p-3 bg-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                    />
                </div>
                <div>
                    <label className="block mb-2 text-sm font-medium text-gray-300">Password</label>
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full p-3 bg-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                    />
                </div>
                <button type="submit" className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 rounded-lg text-white font-semibold">
                    Login
                </button>
            </form>
            <p className="text-center text-gray-400">
                Don't have an account? <button onClick={() => dispatch({ type: 'SET_AUTH_VIEW', payload: 'signup' })} className="text-blue-400 hover:underline">Sign up</button>
            </p>
        </div>
    );
};

export default Login;
