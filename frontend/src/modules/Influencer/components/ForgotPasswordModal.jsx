import { useState } from 'react';
import { X, Mail, KeyRound, Lock, Loader2, CheckCircle2, ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';
import { useInfluencerAuth } from '../hooks/useInfluencerAuth';

const ForgotPasswordModal = ({ isOpen, onClose }) => {
    const { forgotPassword, verifyOtp, resetPassword, isLoading } = useInfluencerAuth();

    const [step, setStep] = useState(1); // 1: Email, 2: OTP, 3: New Password
    const [email, setEmail] = useState('');
    const [otp, setOtp] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [errorMsg, setErrorMsg] = useState('');

    if (!isOpen) return null;

    const handleSendOtp = async (e) => {
        e.preventDefault();
        setErrorMsg('');
        if (!email.trim()) {
            setErrorMsg('Please enter your registered email address.');
            return;
        }

        try {
            await forgotPassword(email.trim());
            toast.success('6-digit OTP sent to your email!');
            setStep(2);
        } catch (err) {
            setErrorMsg(err?.response?.data?.message || err?.message || 'Failed to send OTP.');
        }
    };

    const handleVerifyOtp = async (e) => {
        e.preventDefault();
        setErrorMsg('');
        if (!otp.trim() || otp.trim().length !== 6) {
            setErrorMsg('Please enter a valid 6-digit OTP code.');
            return;
        }

        try {
            await verifyOtp(email.trim(), otp.trim());
            toast.success('OTP verified successfully!');
            setStep(3);
        } catch (err) {
            setErrorMsg(err?.response?.data?.message || err?.message || 'Invalid OTP.');
        }
    };

    const handleResetPassword = async (e) => {
        e.preventDefault();
        setErrorMsg('');

        if (password.length < 8) {
            setErrorMsg('Password must be at least 8 characters long.');
            return;
        }

        if (password !== confirmPassword) {
            setErrorMsg('Passwords do not match.');
            return;
        }

        try {
            await resetPassword(email.trim(), otp.trim(), password, confirmPassword);
            toast.success('Password reset successfully! Please login with your new password.');
            onClose();
        } catch (err) {
            setErrorMsg(err?.response?.data?.message || err?.message || 'Failed to reset password.');
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 relative shadow-2xl border border-slate-100">
                <button
                    onClick={onClose}
                    className="absolute right-4 top-4 text-slate-400 hover:text-slate-600 transition-colors p-1 rounded-lg"
                >
                    <X className="w-5 h-5" />
                </button>

                <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center font-bold">
                        <KeyRound className="w-5 h-5" />
                    </div>
                    <div>
                        <h3 className="font-bold text-lg text-slate-900">Reset Password</h3>
                        <p className="text-xs text-slate-500">
                            {step === 1 && 'Enter your email to receive a reset code.'}
                            {step === 2 && 'Enter the 6-digit OTP sent to your email.'}
                            {step === 3 && 'Create a new secure password for your account.'}
                        </p>
                    </div>
                </div>

                {errorMsg && (
                    <div className="influencer-error-alert mb-4">
                        <span>{errorMsg}</span>
                    </div>
                )}

                {step === 1 && (
                    <form onSubmit={handleSendOtp}>
                        <div className="influencer-form-group">
                            <label className="influencer-form-label">Registered Email</label>
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
                                <Mail className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                            </div>
                        </div>

                        <button
                            type="submit"
                            className="influencer-btn-primary mt-4"
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    <span>Sending OTP...</span>
                                </>
                            ) : (
                                <>
                                    <span>Send OTP Code</span>
                                    <ArrowRight className="w-4 h-4" />
                                </>
                            )}
                        </button>
                    </form>
                )}

                {step === 2 && (
                    <form onSubmit={handleVerifyOtp}>
                        <div className="influencer-form-group">
                            <label className="influencer-form-label">Enter 6-Digit OTP Code</label>
                            <input
                                type="text"
                                maxLength={6}
                                className="influencer-form-input tracking-widest text-center text-xl font-bold"
                                placeholder="123456"
                                value={otp}
                                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                                disabled={isLoading}
                                required
                            />
                        </div>

                        <button
                            type="submit"
                            className="influencer-btn-primary mt-4"
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    <span>Verifying OTP...</span>
                                </>
                            ) : (
                                <>
                                    <span>Verify OTP</span>
                                    <CheckCircle2 className="w-4 h-4" />
                                </>
                            )}
                        </button>
                    </form>
                )}

                {step === 3 && (
                    <form onSubmit={handleResetPassword}>
                        <div className="influencer-form-group">
                            <label className="influencer-form-label">New Password</label>
                            <input
                                type="password"
                                className="influencer-form-input"
                                placeholder="At least 8 characters"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                disabled={isLoading}
                                required
                            />
                        </div>

                        <div className="influencer-form-group">
                            <label className="influencer-form-label">Confirm New Password</label>
                            <input
                                type="password"
                                className="influencer-form-input"
                                placeholder="Re-enter new password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                disabled={isLoading}
                                required
                            />
                        </div>

                        <button
                            type="submit"
                            className="influencer-btn-primary mt-4"
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    <span>Updating Password...</span>
                                </>
                            ) : (
                                <>
                                    <span>Reset & Save Password</span>
                                    <Lock className="w-4 h-4" />
                                </>
                            )}
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
};

export default ForgotPasswordModal;
