import { useState } from 'react';
import { X, Mail, CheckCircle2, RefreshCw, Loader2, ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';
import { useInfluencerAuth } from '../hooks/useInfluencerAuth';

const EmailVerificationModal = ({ isOpen, email, onClose, onSuccess }) => {
    const { verifyEmailOtp, resendEmailOtp, isLoading } = useInfluencerAuth();

    const [otp, setOtp] = useState('');
    const [errorMsg, setErrorMsg] = useState('');
    const [isResending, setIsResending] = useState(false);

    if (!isOpen) return null;

    const handleVerify = async (e) => {
        e.preventDefault();
        setErrorMsg('');

        if (!otp.trim() || otp.trim().length !== 6) {
            setErrorMsg('Please enter a valid 6-digit OTP code.');
            return;
        }

        try {
            await verifyEmailOtp(email, otp.trim());
            toast.success('Email verified successfully! Please log in to check your application status.');
            onSuccess();
        } catch (err) {
            setErrorMsg(err?.response?.data?.message || err?.message || 'Verification failed.');
        }
    };

    const handleResend = async () => {
        setErrorMsg('');
        setIsResending(true);
        try {
            await resendEmailOtp(email);
            toast.success('New OTP sent to your email inbox.');
        } catch (err) {
            setErrorMsg(err?.response?.data?.message || err?.message || 'Resend failed.');
        } finally {
            setIsResending(false);
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
                        <Mail className="w-5 h-5" />
                    </div>
                    <div>
                        <h3 className="font-bold text-lg text-slate-900">Verify Your Email</h3>
                        <p className="text-xs text-slate-500">
                            We sent a 6-digit OTP code to <strong className="text-slate-700">{email}</strong>
                        </p>
                    </div>
                </div>

                {errorMsg && (
                    <div className="influencer-error-alert mb-4">
                        <span>{errorMsg}</span>
                    </div>
                )}

                <form onSubmit={handleVerify}>
                    <div className="influencer-form-group">
                        <label className="influencer-form-label">Enter 6-Digit Email OTP</label>
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
                                <span>Verify Email & Proceed</span>
                                <CheckCircle2 className="w-4 h-4" />
                            </>
                        )}
                    </button>
                </form>

                <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between text-xs">
                    <span className="text-slate-500">Didn't receive code?</span>
                    <button
                        type="button"
                        onClick={handleResend}
                        disabled={isResending || isLoading}
                        className="font-bold text-purple-600 hover:text-purple-700 hover:underline flex items-center gap-1"
                    >
                        {isResending ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                            <RefreshCw className="w-3.5 h-3.5" />
                        )}
                        <span>Resend OTP</span>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default EmailVerificationModal;
