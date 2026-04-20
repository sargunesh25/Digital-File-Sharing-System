import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Login = () => {
    const { login } = useAuth();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await login(email, password);
            navigate('/dashboard');
        } catch (error) {
            alert(error.response?.data?.message || 'Login failed');
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-mesh bg-surface-50 py-12 px-4 sm:px-6 lg:px-8 z-0 relative">
            <div className="bg-mesh-blob-3"></div>

            <div className="max-w-md w-full glass-strong p-10 rounded-3xl space-y-8 relative z-10 animate-fade-in shadow-xl border border-white/60">
                <div>
                    <h2 className="mt-2 text-center text-4xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-brand-600 to-accent-500">
                        Sign in to your account
                    </h2>
                    <p className="mt-4 text-center text-sm text-surface-600">
                        Or{' '}
                        <Link to="/register" className="font-semibold text-brand-600 hover:text-brand-500 transition-colors">
                            create a new account
                        </Link>
                    </p>
                </div>
                <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                    <input type="hidden" name="remember" defaultValue="true" />
                    <div className="space-y-4">
                        <div>
                            <label htmlFor="email-address" className="sr-only">
                                Email address
                            </label>
                            <input
                                id="email-address"
                                name="email"
                                type="email"
                                autoComplete="email"
                                required
                                className="appearance-none rounded-xl relative block w-full px-4 py-3 border border-surface-200 placeholder-surface-400 text-surface-900 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all shadow-sm bg-white/50 hover:bg-white sm:text-sm"
                                placeholder="Email address"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />
                        </div>
                        <div>
                            <label htmlFor="password" className="sr-only">
                                Password
                            </label>
                            <input
                                id="password"
                                name="password"
                                type="password"
                                autoComplete="current-password"
                                required
                                className="appearance-none rounded-xl relative block w-full px-4 py-3 border border-surface-200 placeholder-surface-400 text-surface-900 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all shadow-sm bg-white/50 hover:bg-white sm:text-sm"
                                placeholder="Password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="flex items-center justify-between">
                        <div className="flex items-center">
                            <input
                                id="remember-me"
                                name="remember-me"
                                type="checkbox"
                                className="h-4 w-4 text-brand-600 focus:ring-brand-500 border-surface-300 rounded cursor-pointer transition-colors"
                            />
                            <label htmlFor="remember-me" className="ml-2 block text-sm font-medium text-surface-700 cursor-pointer">
                                Remember me
                            </label>
                        </div>

                        <div className="text-sm">
                            <a href="#" className="font-semibold text-brand-600 hover:text-brand-500 transition-colors">
                                Forgot your password?
                            </a>
                        </div>
                    </div>

                    <div>
                        <button
                            type="submit"
                            className="group relative w-full flex justify-center py-3.5 px-4 text-sm font-semibold rounded-2xl text-white bg-gradient-to-r from-brand-600 to-accent-500 hover:shadow-glow hover:-translate-y-1 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500 transition-all duration-300 overflow-hidden"
                        >
                            Sign in
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default Login;
