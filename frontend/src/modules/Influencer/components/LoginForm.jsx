import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Mail, Loader2, ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';
import { useInfluencerAuth } from '../hooks/useInfluencerAuth';

const LoginForm = ({ initialEmail = '', onSwitchToRegister, onOpenForgotPassword }) => {
    const navigate = useNavigate();
    const { login, isLoading } = useInfluencerAuth();

    const [email, setEmail] = useState(initialEmail || '');
    const [password, setPassword] = useState('');
    const [rememberMe, setRememberMe] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');

    useEffect(() => {
        if (initialEmail) {
            setEmail(initialEmail);
        }
    }, [initialEmail]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setErrorMsg('');

        if (!email.trim()) {
            setErrorMsg('Please enter your registered email address.');
            return;
        }

        if (!password) {
            setErrorMsg('Please enter your password.');
            return;
        }

        try {
            await login(email.trim(), password, rememberMe);
            toast.success('Login successful! Redirecting to portal...');
            navigate('/influence/dashboard');
        } catch (err) {
            const msg = err?.response?.data?.message || err?.message || 'Invalid email or password.';
            setErrorMsg(msg);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="animate-fade-in">
            <h2 className="text-2xl font-bold text-slate-900 mb-1">Welcome back</h2>
            <p className="text-slate-500 text-sm mb-6">
                Log in to access your influencer dashboard and earnings.
            </p>

            {errorMsg && (
                <div className="influencer-error-alert mb-5">
                    <span>{errorMsg}</span>
                </div>
            )}

            <div className="influencer-form-group">
                <label className="influencer-form-label">Email Address</label>
                <div className="influencer-input-wrapper">
                    <input
                        type="email"
                        className="influencer-form-input"
                        placeholder="influencer@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        disabled={isLoading}
                        required
                    />
                    <Mail className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4 pointer-events-none" />
                </div>
            </div>

            <div className="influencer-form-group">
                <div className="influencer-form-label">
                    <span>Password</span>
                    <button
                        type="button"
                        onClick={onOpenForgotPassword}
                        className="text-xs font-semibold text-purple-600 hover:text-purple-700 hover:underline"
                    >
                        Forgot password?
                    </button>
                </div>
                <div className="influencer-input-wrapper">
                    <input
                        type={showPassword ? 'text' : 'password'}
                        className="influencer-form-input"
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        disabled={isLoading}
                        required
                    />
                    <button
                        type="button"
                        className="influencer-toggle-pwd"
                        onClick={() => setShowPassword(!showPassword)}
                        tabIndex={-1}
                    >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                </div>
            </div>

            <div className="flex items-center justify-between my-4">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-600">
                    <input
                        type="checkbox"
                        checked={rememberMe}
                        onChange={(e) => setRememberMe(e.target.checked)}
                        className="rounded border-slate-300 text-purple-600 focus:ring-purple-500 w-4 h-4"
                    />
                    <span>Remember me for 30 days</span>
                </label>
            </div>

            <button
                type="submit"
                className="influencer-btn-primary mt-2"
                disabled={isLoading}
            >
                {isLoading ? (
                    <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span>Signing in...</span>
                    </>
                ) : (
                    <>
                        <span>Login to Portal</span>
                        <ArrowRight className="w-4 h-4" />
                    </>
                )}
            </button>

            <div className="text-center mt-6 text-xs text-slate-500">
                Don't have an influencer account?{' '}
                <button
                    type="button"
                    onClick={onSwitchToRegister}
                    className="font-bold text-purple-600 hover:text-purple-700 hover:underline ml-1"
                >
                    Apply Now
                </button>
            </div>
        </form>
    );
};

export default LoginForm;
