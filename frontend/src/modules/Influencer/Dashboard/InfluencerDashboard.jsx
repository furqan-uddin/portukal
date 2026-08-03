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
    ArrowRight,
    BarChart2,
    User,
    Film,
    ShoppingBag,
} from 'lucide-react';
import { useInfluencerAuth } from '../hooks/useInfluencerAuth';
import '../styles/influencerAuth.css';

import { appLogo } from '../../../data/logos';

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
            <header className="bg-white border-b border-slate-200 sticky top-0 z-20 px-6 py-4 flex items-center justify-between shadow-sm">
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-purple-600 flex items-center justify-center p-1.5 overflow-hidden shadow-md shadow-purple-200">
                        <img src={appLogo.src} alt="Porutkal" className="w-full h-full object-contain" />
                    </div>
                    <div>
                        <h1 className="font-extrabold text-lg text-slate-900 leading-tight">Porutkal Influencer Portal</h1>
                        <p className="text-xs text-purple-600 font-semibold">Creator &amp; Affiliate Marketing</p>
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
                                <Award className="w-3.5 h-3.5" /> Creator Portal
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
                            Track your referral metrics, manage affiliate links, promote shoppable video reels, and monitor your commission payouts seamlessly.
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
                            Thank you for joining the Porutkal Influencer Network! Our team is currently reviewing your profile and verification details. Application review usually takes 24-48 hours.
                        </p>
                    </div>
                )}

                {status === 'approved' && (
                    <div className="space-y-6 animate-fade-in">
                        <div className="flex items-center justify-between bg-emerald-50 border border-emerald-200 rounded-2xl p-4">
                            <div className="flex items-center gap-3">
                                <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0" />
                                <div>
                                    <h4 className="font-bold text-emerald-950">Influencer Account Active &amp; Verified</h4>
                                    <p className="text-xs text-emerald-700">Click any card below to open details and manage your creator tools.</p>
                                </div>
                            </div>
                            <span className="influencer-status-badge approved m-0">APPROVED</span>
                        </div>

                        {/* Interactive Feature Cards Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {/* Card 1: Commission Wallet */}
                            <div
                                onClick={() => navigate('/influencer/wallet')}
                                className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md hover:border-purple-300 transition-all cursor-pointer group flex flex-col justify-between"
                            >
                                <div>
                                    <div className="w-12 h-12 rounded-2xl bg-purple-100 text-purple-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                        <Wallet className="w-6 h-6" />
                                    </div>
                                    <h4 className="font-bold text-slate-900 text-lg mb-1 group-hover:text-purple-600 transition-colors">Commission Wallet</h4>
                                    <p className="text-xs text-slate-500 mb-4">Reserved directly from Vendor Wallet for guaranteed payout security.</p>
                                </div>
                                <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                                    <span className="text-xs font-bold text-purple-700 bg-purple-50 px-2.5 py-1 rounded-lg">
                                        Total: ₹{influencer?.wallet?.totalEarned || '0.00'}
                                    </span>
                                    <span className="text-xs font-bold text-purple-600 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                                        View Wallet <ArrowRight className="w-3.5 h-3.5" />
                                    </span>
                                </div>
                            </div>

                            {/* Card 2: Shoppable Reels Marketplace */}
                            <div
                                onClick={() => navigate('/influencer/reels')}
                                className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md hover:border-pink-300 transition-all cursor-pointer group flex flex-col justify-between"
                            >
                                <div>
                                    <div className="w-12 h-12 rounded-2xl bg-pink-100 text-pink-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                        <Film className="w-6 h-6" />
                                    </div>
                                    <h4 className="font-bold text-slate-900 text-lg mb-1 group-hover:text-pink-600 transition-colors">Shoppable Reels</h4>
                                    <p className="text-xs text-slate-500 mb-4">Upload promotional video reviews or accept vendor product invitations.</p>
                                </div>
                                <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                                    <span className="text-xs font-bold text-pink-700 bg-pink-50 px-2.5 py-1 rounded-lg">
                                        Reels Portal
                                    </span>
                                    <span className="text-xs font-bold text-pink-600 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                                        Open Reels <ArrowRight className="w-3.5 h-3.5" />
                                    </span>
                                </div>
                            </div>

                            {/* Card 3: Affiliate Links */}
                            <div
                                onClick={() => navigate('/influencer/affiliate-links')}
                                className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md hover:border-indigo-300 transition-all cursor-pointer group flex flex-col justify-between"
                            >
                                <div>
                                    <div className="w-12 h-12 rounded-2xl bg-indigo-100 text-indigo-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                        <Share2 className="w-6 h-6" />
                                    </div>
                                    <h4 className="font-bold text-slate-900 text-lg mb-1 group-hover:text-indigo-600 transition-colors">Affiliate Referral Links</h4>
                                    <p className="text-xs text-slate-500 mb-4">Your unique referral code for tracking affiliate conversions and link clicks.</p>
                                </div>
                                <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                                    <span className="text-xs font-bold text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-lg font-mono">
                                        {influencer?.referralCode || 'INF12345'}
                                    </span>
                                    <span className="text-xs font-bold text-indigo-600 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                                        My Links <ArrowRight className="w-3.5 h-3.5" />
                                    </span>
                                </div>
                            </div>

                            {/* Card 4: Products Marketplace */}
                            <div
                                onClick={() => navigate('/influencer/marketplace')}
                                className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md hover:border-emerald-300 transition-all cursor-pointer group flex flex-col justify-between"
                            >
                                <div>
                                    <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                        <ShoppingBag className="w-6 h-6" />
                                    </div>
                                    <h4 className="font-bold text-slate-900 text-lg mb-1 group-hover:text-emerald-600 transition-colors">Products Catalog</h4>
                                    <p className="text-xs text-slate-500 mb-4">Browse high-commission products available for affiliate promotion.</p>
                                </div>
                                <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                                    <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg">
                                        Marketplace
                                    </span>
                                    <span className="text-xs font-bold text-emerald-600 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                                        Browse Products <ArrowRight className="w-3.5 h-3.5" />
                                    </span>
                                </div>
                            </div>

                            {/* Card 5: Revenue Analytics BI */}
                            <div
                                onClick={() => navigate('/influencer/analytics')}
                                className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md hover:border-amber-300 transition-all cursor-pointer group flex flex-col justify-between"
                            >
                                <div>
                                    <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                        <BarChart2 className="w-6 h-6" />
                                    </div>
                                    <h4 className="font-bold text-slate-900 text-lg mb-1 group-hover:text-amber-600 transition-colors">Analytics BI</h4>
                                    <p className="text-xs text-slate-500 mb-4">Detailed breakdown of clicks, conversion rates, and geographic reach.</p>
                                </div>
                                <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                                    <span className="text-xs font-bold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-lg">
                                        Performance Metrics
                                    </span>
                                    <span className="text-xs font-bold text-amber-600 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                                        View Analytics <ArrowRight className="w-3.5 h-3.5" />
                                    </span>
                                </div>
                            </div>

                            {/* Card 6: Profile & Social Accounts */}
                            <div
                                onClick={() => navigate('/influencer/profile')}
                                className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md hover:border-blue-300 transition-all cursor-pointer group flex flex-col justify-between"
                            >
                                <div>
                                    <div className="w-12 h-12 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                        <User className="w-6 h-6" />
                                    </div>
                                    <h4 className="font-bold text-slate-900 text-lg mb-1 group-hover:text-blue-600 transition-colors">Profile &amp; Bank Details</h4>
                                    <p className="text-xs text-slate-500 mb-4">Update social media handles, bank account info, and creator bio.</p>
                                </div>
                                <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                                    <span className="text-xs font-bold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-lg">
                                        Account Info
                                    </span>
                                    <span className="text-xs font-bold text-blue-600 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                                        Edit Profile <ArrowRight className="w-3.5 h-3.5" />
                                    </span>
                                </div>
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
                    </div>
                )}
            </main>
        </div>
    );
};

export default InfluencerDashboard;
