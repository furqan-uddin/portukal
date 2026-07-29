import { useLocation, useNavigate } from 'react-router-dom';
import {
    FiHome,
    FiShoppingBag,
    FiLink,
    FiUser,
    FiHelpCircle,
    FiDollarSign,
    FiBarChart2,
    FiLock,
    FiLogOut,
    FiAward,
} from 'react-icons/fi';
import { useInfluencerAuth } from '../hooks/useInfluencerAuth';
import toast from 'react-hot-toast';

const InfluencerSidebar = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { influencer, logout } = useInfluencerAuth();

    const isApproved = influencer?.status === 'approved' && influencer?.isActive !== false;

    const navItems = [
        { title: 'Dashboard', route: '/influencer/dashboard', icon: FiHome, requiresApproval: false },
        { title: 'Marketplace', route: '/influencer/marketplace', icon: FiShoppingBag, requiresApproval: true },
        { title: 'My Affiliate Links', route: '/influencer/affiliate-links', icon: FiLink, requiresApproval: true },
        { title: 'Wallet & Withdrawals', route: '/influencer/wallet', icon: FiDollarSign, requiresApproval: true },
        { title: 'Profile', route: '/influencer/profile', icon: FiUser, requiresApproval: false },
        { title: 'Support', route: '/influencer/support', icon: FiHelpCircle, requiresApproval: false },
        { title: 'Analytics', route: '#', icon: FiBarChart2, isComingSoon: true },
    ];

    const handleNavigation = (item) => {
        if (item.isComingSoon) {
            toast.success(`${item.title} feature is coming soon in Phase 2 Part 2!`);
            return;
        }

        if (item.requiresApproval && !isApproved) {
            toast.error('Marketplace access is restricted until your influencer account is approved by Admin.');
            return;
        }

        navigate(item.route);
    };

    const handleLogout = () => {
        logout();
        navigate('/influence');
    };

    return (
        <aside className="w-64 bg-slate-900 text-white min-h-screen flex flex-col flex-shrink-0 border-r border-slate-800">
            {/* Header / Logo */}
            <div className="p-6 border-b border-slate-800 flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-purple-600 flex items-center justify-center text-white font-bold shadow-md shadow-purple-500/30">
                    <FiAward className="w-5 h-5" />
                </div>
                <div>
                    <h2 className="font-extrabold text-sm text-white leading-tight">Porutkal Influencers</h2>
                    <p className="text-[11px] text-purple-400 font-semibold">Creator Portal</p>
                </div>
            </div>

            {/* Creator Profile Info */}
            <div className="p-4 bg-slate-800/60 m-3 rounded-2xl border border-slate-800 flex items-center gap-3">
                {influencer?.profileImage ? (
                    <img
                        src={influencer.profileImage}
                        alt={influencer.name}
                        className="w-10 h-10 rounded-full object-cover border border-purple-400"
                    />
                ) : (
                    <div className="w-10 h-10 rounded-full bg-purple-600 text-white flex items-center justify-center font-bold text-sm">
                        {influencer?.name ? influencer.name.charAt(0) : 'I'}
                    </div>
                )}
                <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-xs text-white truncate">{influencer?.name || 'Influencer'}</h4>
                    <span className="text-[10px] font-mono text-purple-400 block truncate">
                        @{influencer?.slug || 'handle'}
                    </span>
                </div>
            </div>

            {/* Navigation Menu */}
            <nav className="flex-1 p-3 space-y-1">
                {navItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = location.pathname === item.route;
                    const isDisabled = item.requiresApproval && !isApproved;

                    return (
                        <button
                            key={item.title}
                            onClick={() => handleNavigation(item)}
                            className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-xs font-bold transition-all ${
                                isActive
                                    ? 'bg-purple-600 text-white shadow-md shadow-purple-500/20'
                                    : isDisabled
                                    ? 'text-slate-500 hover:bg-slate-800/40 cursor-not-allowed opacity-60'
                                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                            }`}
                        >
                            <div className="flex items-center gap-3">
                                <Icon className="w-4 h-4" />
                                <span>{item.title}</span>
                            </div>

                            {item.isComingSoon && (
                                <span className="text-[9px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded font-mono">
                                    Soon
                                </span>
                            )}

                            {isDisabled && !item.isComingSoon && (
                                <FiLock className="w-3.5 h-3.5 text-amber-500" title="Approval Required" />
                            )}
                        </button>
                    );
                })}
            </nav>

            {/* Logout Button */}
            <div className="p-4 border-t border-slate-800">
                <button
                    onClick={handleLogout}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-rose-900/40 text-slate-300 hover:text-rose-400 font-bold text-xs transition-all border border-slate-700"
                >
                    <FiLogOut className="w-4 h-4" /> Logout
                </button>
            </div>
        </aside>
    );
};

export default InfluencerSidebar;
