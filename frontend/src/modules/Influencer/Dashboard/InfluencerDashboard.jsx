import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Sparkles,
    Clock,
    CheckCircle2,
    XCircle,
    AlertTriangle,
    LogOut,
    Store,
    Wallet,
    Share2,
    Award,
    Tag,
} from 'lucide-react';
import { useInfluencerAuth } from '../hooks/useInfluencerAuth';
import '../styles/influencerAuth.css';

const InfluencerDashboard = () => {
    const navigate = useNavigate();
    const { influencer, status, fetchProfile, logout } = useInfluencerAuth();

    useEffect(() => {
        fetchProfile();
    }, []);

    const handleLogout = () => {
        logout();
        navigate('/influence');
    };

    return (
        <div className="min-h-screen bg-slate-50 text-slate-900 font-sans flex flex-col">
            {/* Top Navigation Header */}
            <header className="bg-white border-b border-slate-200 sticky top-0 z-40 px-6 py-4 flex items-center justify-between shadow-sm">
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-purple-600 flex items-center justify-center text-white font-bold shadow-md shadow-purple-200">
                        <Sparkles className="w-5 h-5" />
                    </div>
                    <div>
                        <h1 className="font-extrabold text-lg text-slate-900 leading-tight">Porutkal Influencer Portal</h1>
                        <p className="text-xs text-purple-600 font-semibold">Creator & Affiliate Marketing</p>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-3 bg-slate-100 px-3 py-1.5 rounded-full">
                        {influencer?.profileImage ? (
                            <img
                                src={influencer.profileImage}
                                alt={influencer.name}
                                className="w-7 h-7 rounded-full object-cover border border-purple-300"
                            />
                        ) : (
                            <div className="w-7 h-7 rounded-full bg-purple-600 text-white flex items-center justify-center text-xs font-bold">
                                {influencer?.name ? influencer.name.charAt(0).toUpperCase() : 'I'}
                            </div>
                        )}
                        <span className="text-sm font-bold text-slate-800">{influencer?.name || 'Influencer'}</span>
                        <span className="text-xs bg-purple-100 text-purple-700 px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider">
                            {influencer?.referralCode || 'INF'}
                        </span>
                    </div>

                    <button
                        onClick={handleLogout}
                        className="flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-red-600 bg-slate-100 hover:bg-red-50 px-3 py-2 rounded-xl transition-all"
                    >
                        <LogOut className="w-4 h-4" />
                        <span className="hidden sm:inline">Logout</span>
                    </button>
                </div>
            </header>

            {/* Main Content Area */}
            <main className="flex-1 max-w-6xl w-full mx-auto p-6">
                {/* Welcome Card */}
                <div className="bg-gradient-to-r from-purple-900 via-indigo-900 to-purple-950 rounded-3xl p-8 text-white mb-8 shadow-xl relative overflow-hidden">
                    <div className="absolute right-0 top-0 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />
                    <div className="relative z-10">
                        <div className="flex items-center gap-2 mb-3">
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-500/20 text-purple-200 text-xs font-bold border border-purple-400/30">
                                <Award className="w-3.5 h-3.5" /> Phase 1 Portal
                            </span>
                            {influencer?.referralCode && (
                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-pink-500/20 text-pink-200 text-xs font-bold border border-pink-400/30">
                                    <Tag className="w-3.5 h-3.5" /> Code: {influencer.referralCode}
                                </span>
                            )}
                        </div>
                        <h2 className="text-3xl font-black mb-2">
                            Welcome back, {influencer?.name || 'Influencer'}! 👋
                        </h2>
                        <p className="text-purple-200 text-sm max-w-xl">
                            Track your referral metrics, manage affiliate links, and monitor your commission wallet reservations seamlessly.
                        </p>
                    </div>
                </div>

                {/* Status-Based Display */}
                {status === 'pending' && (
                    <div className="influencer-dashboard-status-card animate-fade-in">
                        <div className="influencer-status-badge pending">
                            <Clock className="w-4 h-4" />
                            <span>Application Pending Review</span>
                        </div>
                        <h3 className="text-2xl font-bold text-slate-900 mb-3">
                            Your application is under review.
                        </h3>
                        <p className="text-slate-600 text-sm leading-relaxed max-w-md mx-auto mb-6">
                            Thank you for joining the Porutkal Influencer Network! Our team is currently reviewing your profile, social handles, and verification documents. Application review usually takes 24-48 hours.
                        </p>
                        <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl text-amber-900 text-xs font-medium text-left max-w-md mx-auto flex items-start gap-3">
                            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                            <div>
                                <span className="font-bold">Next Steps:</span> Once approved by our administrators, your storefront handle <span className="font-bold underline text-purple-800">porutkal.com/@{influencer?.slug || 'yourhandle'}</span> and referral code <span className="font-bold text-purple-900 font-mono bg-purple-100 px-1.5 py-0.5 rounded">{influencer?.referralCode || 'INF12345'}</span> will be activated.
                            </div>
                        </div>
                    </div>
                )}

                {status === 'approved' && (
                    <div className="space-y-6 animate-fade-in">
                        <div className="flex items-center justify-between bg-emerald-50 border border-emerald-200 rounded-2xl p-4">
                            <div className="flex items-center gap-3">
                                <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0" />
                                <div>
                                    <h4 className="font-bold text-emerald-950">Influencer Dashboard (Currently Coming Soon)</h4>
                                    <p className="text-xs text-emerald-700">Your account is verified and ready for affiliate program integration.</p>
                                </div>
                            </div>
                            <span className="influencer-status-badge approved m-0">APPROVED</span>
                        </div>

                        {/* Coming Soon Feature Previews */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                                <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center mb-4">
                                    <Wallet className="w-5 h-5" />
                                </div>
                                <h4 className="font-bold text-slate-900 text-lg mb-1">Commission Wallet</h4>
                                <p className="text-xs text-slate-500 mb-4">Reserved directly from Vendor Wallet for guaranteed payout security.</p>
                                <span className="text-xs font-bold text-purple-600 bg-purple-50 px-2.5 py-1 rounded-lg">Total Earned: ₹{influencer?.wallet?.totalEarned || '0.00'}</span>
                            </div>

                            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                                <div className="w-10 h-10 rounded-xl bg-pink-100 text-pink-600 flex items-center justify-center mb-4">
                                    <Store className="w-5 h-5" />
                                </div>
                                <h4 className="font-bold text-slate-900 text-lg mb-1">Personal Storefront</h4>
                                <p className="text-xs text-slate-500 mb-4">Your customized creator storefront for sharing curated product lists.</p>
                                <span className="text-xs font-bold text-pink-600 bg-pink-50 px-2.5 py-1 rounded-lg">porutkal.com/@{influencer?.slug || 'creator'}</span>
                            </div>

                            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                                <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center mb-4">
                                    <Share2 className="w-5 h-5" />
                                </div>
                                <h4 className="font-bold text-slate-900 text-lg mb-1">Affiliate Referral Code</h4>
                                <p className="text-xs text-slate-500 mb-4">Your unique referral code for tracking affiliate conversions.</p>
                                <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-lg font-mono">{influencer?.referralCode || 'INF12345'}</span>
                            </div>
                        </div>
                    </div>
                )}

                {status === 'rejected' && (
                    <div className="influencer-dashboard-status-card animate-fade-in">
                        <div className="influencer-status-badge rejected">
                            <XCircle className="w-4 h-4" />
                            <span>Application Rejected</span>
                        </div>
                        <h3 className="text-2xl font-bold text-slate-900 mb-3">
                            Your application was not approved.
                        </h3>
                        <p className="text-slate-600 text-sm max-w-md mx-auto mb-4">
                            Reason for rejection: <strong className="text-red-700">{influencer?.rejectionReason || 'Profile details did not meet marketplace minimum guidelines.'}</strong>
                        </p>
                        <p className="text-xs text-slate-500">Please contact support at support@porutkal.com if you believe this was an error.</p>
                    </div>
                )}

                {status === 'suspended' && (
                    <div className="influencer-dashboard-status-card animate-fade-in">
                        <div className="influencer-status-badge suspended">
                            <AlertTriangle className="w-4 h-4" />
                            <span>Account Suspended</span>
                        </div>
                        <h3 className="text-2xl font-bold text-slate-900 mb-3">
                            Your account has been suspended.
                        </h3>
                        <p className="text-slate-600 text-sm max-w-md mx-auto">
                            Please contact administrator support for account restoration.
                        </p>
                    </div>
                )}
            </main>
        </div>
    );
};

export default InfluencerDashboard;
