import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Sparkles,
    TrendingUp,
    Store,
    BarChart3,
    Wallet,
    LogIn,
    UserPlus,
} from 'lucide-react';
import LoginForm from '../components/LoginForm';
import RegisterForm from '../components/RegisterForm';
import ForgotPasswordModal from '../components/ForgotPasswordModal';
import EmailVerificationModal from '../components/EmailVerificationModal';
import { useInfluencerAuth } from '../hooks/useInfluencerAuth';
import '../styles/influencerAuth.css';

const AuthPage = () => {
    const navigate = useNavigate();
    const { isAuthenticated } = useInfluencerAuth();

    const [activeTab, setActiveTab] = useState('login'); // 'login' | 'register'
    const [initialLoginEmail, setInitialLoginEmail] = useState('');
    const [isForgotModalOpen, setIsForgotModalOpen] = useState(false);

    // Email verification state
    const [isVerifyModalOpen, setIsVerifyModalOpen] = useState(false);
    const [verifyingEmail, setVerifyingEmail] = useState('');

    useEffect(() => {
        if (isAuthenticated) {
            navigate('/influence/dashboard', { replace: true });
        }
    }, [isAuthenticated, navigate]);

    const handleSwitchToLogin = (email = '') => {
        if (email) setInitialLoginEmail(email);
        setActiveTab('login');
    };

    const handleRequireEmailVerification = (email) => {
        setVerifyingEmail(email);
        setIsVerifyModalOpen(true);
    };

    const handleVerificationSuccess = () => {
        setIsVerifyModalOpen(false);
        handleSwitchToLogin(verifyingEmail);
    };

    return (
        <div className="influencer-portal-root">
            <div className="influencer-auth-container">
                {/* LEFT HERO & BRANDING SECTION */}
                <div className="influencer-hero-section">
                    <div className="influencer-hero-bg-glow" />

                    <div className="influencer-brand-logo">
                        <div className="w-10 h-10 rounded-xl bg-purple-600/30 border border-purple-400/40 flex items-center justify-center text-purple-300">
                            <Sparkles className="w-5 h-5 text-purple-300" />
                        </div>
                        <div>
                            <span>Porutkal</span> <span className="text-white font-normal opacity-90 text-lg">Influencers</span>
                        </div>
                    </div>

                    <div className="influencer-hero-content">
                        <h1 className="influencer-hero-title">
                            Become a Porutkal Influencer
                        </h1>
                        <p className="influencer-hero-desc">
                            Earn commissions by promoting thousands of products from verified marketplace vendors. Build your storefront and scale your creator income.
                        </p>

                        <div className="influencer-features-grid">
                            <div className="influencer-feature-card">
                                <div className="influencer-feature-icon">
                                    <TrendingUp className="w-5 h-5" />
                                </div>
                                <span className="influencer-feature-text">Earn Commission</span>
                            </div>

                            <div className="influencer-feature-card">
                                <div className="influencer-feature-icon">
                                    <Store className="w-5 h-5" />
                                </div>
                                <span className="influencer-feature-text">Personal Storefront</span>
                            </div>

                            <div className="influencer-feature-card">
                                <div className="influencer-feature-icon">
                                    <BarChart3 className="w-5 h-5" />
                                </div>
                                <span className="influencer-feature-text">Performance Analytics</span>
                            </div>

                            <div className="influencer-feature-card">
                                <div className="influencer-feature-icon">
                                    <Wallet className="w-5 h-5" />
                                </div>
                                <span className="influencer-feature-text">Fast Withdrawals</span>
                            </div>
                        </div>
                    </div>

                    <div className="influencer-stats-row">
                        <div className="influencer-stat-item">
                            <span className="influencer-stat-num">500+</span>
                            <span className="influencer-stat-label">Active Influencers</span>
                        </div>
                        <div className="w-px h-8 bg-purple-500/20 hidden sm:block" />
                        <div className="influencer-stat-item">
                            <span className="influencer-stat-num">15K+</span>
                            <span className="influencer-stat-label">Listed Products</span>
                        </div>
                        <div className="w-px h-8 bg-purple-500/20 hidden sm:block" />
                        <div className="influencer-stat-item">
                            <span className="influencer-stat-num">₹50L+</span>
                            <span className="influencer-stat-label">Commission Paid</span>
                        </div>
                    </div>
                </div>

                {/* RIGHT AUTH CARD SECTION */}
                <div className="influencer-auth-right">
                    <div className="influencer-auth-card">
                        {/* Tab Headers */}
                        <div className="influencer-tab-header">
                            <button
                                type="button"
                                className={`influencer-tab-btn ${activeTab === 'login' ? 'active' : ''}`}
                                onClick={() => setActiveTab('login')}
                            >
                                <LogIn className="w-4 h-4" />
                                <span>Login</span>
                            </button>
                            <button
                                type="button"
                                className={`influencer-tab-btn ${activeTab === 'register' ? 'active' : ''}`}
                                onClick={() => setActiveTab('register')}
                            >
                                <UserPlus className="w-4 h-4" />
                                <span>Register</span>
                            </button>
                        </div>

                        {/* Form Content */}
                        {activeTab === 'login' ? (
                            <LoginForm
                                initialEmail={initialLoginEmail}
                                onSwitchToRegister={() => setActiveTab('register')}
                                onOpenForgotPassword={() => setIsForgotModalOpen(true)}
                            />
                        ) : (
                            <RegisterForm
                                onSwitchToLogin={handleSwitchToLogin}
                                onRequireEmailVerification={handleRequireEmailVerification}
                            />
                        )}
                    </div>
                </div>
            </div>

            {/* Email Verification Modal */}
            <EmailVerificationModal
                isOpen={isVerifyModalOpen}
                email={verifyingEmail}
                onClose={() => setIsVerifyModalOpen(false)}
                onSuccess={handleVerificationSuccess}
            />

            {/* Forgot Password Modal */}
            <ForgotPasswordModal
                isOpen={isForgotModalOpen}
                onClose={() => setIsForgotModalOpen(false)}
            />
        </div>
    );
};

export default AuthPage;
