import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
    ChevronLeft, Plus, Grid, Clapperboard, 
    UserSquare, Menu, X, ShoppingBag, Heart, MapPin, Package, Check, Mail, Phone
} from 'lucide-react';
import api from '../../../shared/utils/api';
import toast from 'react-hot-toast';

const CreatorProfile = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    const fileInputRef = useRef(null);

    const rawId = String(id || 'test_user').trim();
    const formattedHandle = rawId.toLowerCase().replace(/\s+/g, '_');
    const displayName = rawId.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

    const [activeTab, setActiveTab] = useState('grid'); // 'grid' | 'reels' | 'tags'
    const [isFollowing, setIsFollowing] = useState(false);
    const [showMenu, setShowMenu] = useState(false);
    const [showContactSheet, setShowContactSheet] = useState(false);
    const [reelsList, setReelsList] = useState([]);
    const [loading, setLoading] = useState(false);

    // Fetch creator's reels from API if available
    useEffect(() => {
        let isMounted = true;
        const fetchCreatorData = async () => {
            setLoading(true);
            try {
                const res = await api.get('/reels/feed', { params: { limit: 12 } });
                const list = res.reels || res.data?.reels || [];
                if (isMounted) setReelsList(list);
            } catch {
                if (isMounted) setReelsList([]);
            } finally {
                if (isMounted) setLoading(false);
            }
        };
        fetchCreatorData();
        return () => { isMounted = false; };
    }, [id]);

    const handleFileSelect = (e) => {
        const file = e.target.files?.[0];
        if (file) {
            toast.success(`Selected ${file.name} for story upload`);
        }
    };

    return (
        <div className="min-h-screen bg-white text-slate-900 font-sans pb-24">
            {/* Hidden File Input */}
            <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept="image/*,video/*" 
                onChange={handleFileSelect}
            />

            {/* Header */}
            <header className="sticky top-0 left-0 right-0 h-14 bg-white/90 backdrop-blur-md border-b border-slate-100 z-50">
                <div className="max-w-[935px] mx-auto h-full flex items-center justify-between px-4 relative">
                    {/* Back Button */}
                    <button 
                        onClick={() => navigate(-1)} 
                        className="p-1 hover:bg-slate-100 rounded-full transition-colors z-10"
                    >
                        <ChevronLeft size={26} className="text-slate-800" />
                    </button>

                    {/* Centered Username */}
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <div className="flex items-center gap-1 pointer-events-auto cursor-pointer">
                            <span className="font-bold text-base md:text-lg text-slate-900 truncate max-w-[180px]">
                                {formattedHandle}
                            </span>
                            <ChevronLeft size={14} className="-rotate-90 text-slate-600 mt-0.5" />
                        </div>
                    </div>

                    {/* Right Actions */}
                    <div className="flex items-center gap-4 z-10">
                        <button 
                            onClick={() => fileInputRef.current?.click()} 
                            className="p-1.5 hover:bg-slate-100 rounded-full transition-colors"
                            title="Add Story / Post"
                        >
                            <Plus size={22} className="text-slate-800" />
                        </button>
                        <button 
                            onClick={() => setShowMenu(true)}
                            className="p-1.5 hover:bg-slate-100 rounded-full transition-colors"
                        >
                            <Menu size={24} className="text-slate-800" />
                        </button>
                    </div>
                </div>
            </header>

            {/* Main Container */}
            <div className="max-w-[935px] mx-auto">
                {/* Profile Header Row */}
                <div className="px-4 pt-6 md:pt-10">
                    <div className="flex flex-col md:flex-row md:items-start gap-6 md:gap-12 mb-6">
                        {/* Profile Image */}
                        <div className="flex justify-center md:justify-start">
                            <div className="relative">
                                <div className="h-24 w-24 md:h-36 md:w-36 rounded-full bg-slate-100 border-2 border-slate-200 overflow-hidden shadow-sm">
                                    <img 
                                        src={`https://api.dicebear.com/7.x/shapes/svg?seed=${formattedHandle}`} 
                                        alt={displayName} 
                                        className="h-full w-full object-cover" 
                                    />
                                </div>
                                <button 
                                    onClick={() => fileInputRef.current?.click()}
                                    className="absolute bottom-1 right-1 bg-purple-600 hover:bg-purple-700 rounded-full border-2 border-white p-1.5 text-white shadow-md transition-transform active:scale-90"
                                >
                                    <Plus size={14} strokeWidth={3} />
                                </button>
                            </div>
                        </div>

                        {/* Stats & Actions Section */}
                        <div className="flex-1 space-y-4">
                            {/* Title & Main Buttons */}
                            <div className="flex flex-wrap items-center gap-3">
                                <h2 className="text-xl md:text-2xl font-light text-slate-800">{displayName}</h2>
                                <div className="flex items-center gap-2 flex-wrap">
                                    <button 
                                        onClick={() => setIsFollowing(!isFollowing)}
                                        className={`px-5 py-1.5 rounded-lg text-xs font-bold transition-all shadow-sm ${
                                            isFollowing 
                                                ? 'bg-slate-100 text-slate-800 border border-slate-200 hover:bg-slate-200' 
                                                : 'bg-purple-600 text-white hover:bg-purple-700'
                                        }`}
                                    >
                                        {isFollowing ? 'Following ✓' : 'Edit Profile'}
                                    </button>
                                    <button 
                                        onClick={() => setShowContactSheet(true)}
                                        className="px-4 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-bold transition-all"
                                    >
                                        Contact
                                    </button>
                                </div>
                            </div>

                            {/* Stats Counter Row */}
                            <div className="flex items-center gap-8 py-1 border-y border-slate-100 md:border-none">
                                <div className="text-center md:text-left">
                                    <span className="font-bold text-base md:text-lg text-slate-900">12 </span>
                                    <span className="text-xs md:text-sm text-slate-600 font-medium">Posts</span>
                                </div>
                                <div className="text-center md:text-left">
                                    <span className="font-bold text-base md:text-lg text-slate-900">10.5K </span>
                                    <span className="text-xs md:text-sm text-slate-600 font-medium">Followers</span>
                                </div>
                                <div className="text-center md:text-left">
                                    <span className="font-bold text-base md:text-lg text-slate-900">482 </span>
                                    <span className="text-xs md:text-sm text-slate-600 font-medium">Following</span>
                                </div>
                            </div>

                            {/* Bio Description */}
                            <div className="space-y-1 text-xs md:text-sm text-slate-700">
                                <div className="font-bold text-slate-900">{displayName}</div>
                                <p className="text-slate-500 font-mono">test@example.com</p>
                                <p className="text-slate-600">Official Creator & Brand Ambassador on Porutkal Marketplace ✨</p>
                            </div>
                        </div>
                    </div>

                    {/* Quick Feature Action Circles */}
                    <div className="flex items-center justify-start gap-6 overflow-x-auto no-scrollbar py-4 mb-4 border-b border-slate-100">
                        <div 
                            onClick={() => navigate('/orders')}
                            className="flex flex-col items-center gap-1.5 cursor-pointer group shrink-0"
                        >
                            <div className="w-14 h-14 rounded-full bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-700 group-hover:scale-105 transition-transform shadow-sm">
                                <Package size={20} />
                            </div>
                            <span className="text-[11px] font-semibold text-slate-700">Orders</span>
                        </div>

                        <div 
                            onClick={() => navigate('/wishlist')}
                            className="flex flex-col items-center gap-1.5 cursor-pointer group shrink-0"
                        >
                            <div className="w-14 h-14 rounded-full bg-pink-50 border border-pink-200 flex items-center justify-center text-pink-700 group-hover:scale-105 transition-transform shadow-sm">
                                <Heart size={20} />
                            </div>
                            <span className="text-[11px] font-semibold text-slate-700">Wishlist</span>
                        </div>

                        <div 
                            onClick={() => navigate('/profile')}
                            className="flex flex-col items-center gap-1.5 cursor-pointer group shrink-0"
                        >
                            <div className="w-14 h-14 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700 group-hover:scale-105 transition-transform shadow-sm">
                                <MapPin size={20} />
                            </div>
                            <span className="text-[11px] font-semibold text-slate-700">Addresses</span>
                        </div>
                    </div>
                </div>

                {/* Grid Tabs */}
                <div className="flex border-t border-slate-200">
                    <button 
                        onClick={() => setActiveTab('grid')}
                        className={`flex-1 py-3.5 flex justify-center items-center gap-2 border-b-2 transition-all ${
                            activeTab === 'grid' ? 'border-purple-600 text-purple-600' : 'border-transparent text-slate-400 hover:text-slate-600'
                        }`}
                    >
                        <Grid size={20} />
                        <span className="hidden md:inline text-xs font-bold uppercase tracking-wider">Posts</span>
                    </button>
                    <button 
                        onClick={() => setActiveTab('reels')}
                        className={`flex-1 py-3.5 flex justify-center items-center gap-2 border-b-2 transition-all ${
                            activeTab === 'reels' ? 'border-purple-600 text-purple-600' : 'border-transparent text-slate-400 hover:text-slate-600'
                        }`}
                    >
                        <Clapperboard size={20} />
                        <span className="hidden md:inline text-xs font-bold uppercase tracking-wider">Reels</span>
                    </button>
                    <button 
                        onClick={() => setActiveTab('tags')}
                        className={`flex-1 py-3.5 flex justify-center items-center gap-2 border-b-2 transition-all ${
                            activeTab === 'tags' ? 'border-purple-600 text-purple-600' : 'border-transparent text-slate-400 hover:text-slate-600'
                        }`}
                    >
                        <UserSquare size={20} />
                        <span className="hidden md:inline text-xs font-bold uppercase tracking-wider">Tagged</span>
                    </button>
                </div>

                {/* Grid Media Display */}
                <div>
                    {activeTab === 'grid' && (
                        <div className="grid grid-cols-3 gap-1 md:gap-2 p-1">
                            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((item) => (
                                <div key={item} className="aspect-square bg-slate-100 overflow-hidden relative group cursor-pointer rounded-lg border border-slate-200/60">
                                    <img 
                                        src={`https://picsum.photos/seed/grid-${item + 30}/400/400`} 
                                        alt="Post" 
                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" 
                                    />
                                </div>
                            ))}
                        </div>
                    )}

                    {activeTab === 'reels' && (
                        <div className="grid grid-cols-3 gap-1 md:gap-2 p-1">
                            {(reelsList.length > 0 ? reelsList : [1, 2, 3, 4, 5, 6]).map((reel, idx) => (
                                <div 
                                    key={reel._id || idx} 
                                    onClick={() => navigate('/reels')}
                                    className="aspect-[9/16] bg-slate-900 overflow-hidden relative group cursor-pointer rounded-xl border border-slate-800"
                                >
                                    <img 
                                        src={reel.thumbnailUrl || `https://picsum.photos/seed/reel-${idx + 50}/300/533`} 
                                        alt="Reel" 
                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" 
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent flex items-end p-2">
                                        <span className="text-white text-[11px] font-extrabold flex items-center gap-1">
                                            <Clapperboard size={12} /> 1.4K
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {activeTab === 'tags' && (
                        <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
                            <div className="w-16 h-16 rounded-full border-2 border-slate-300 flex items-center justify-center mb-3 text-slate-400">
                                <UserSquare size={32} />
                            </div>
                            <h3 className="font-bold text-slate-800 text-base mb-1">Photos & Videos of You</h3>
                            <p className="text-xs text-slate-500 max-w-sm">When creators or customers tag you in shoppable posts and reels, they will appear here.</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Side Menu Drawer */}
            {showMenu && (
                <div className="fixed inset-0 z-[100] flex justify-end">
                    <div 
                        className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" 
                        onClick={() => setShowMenu(false)}
                    />
                    <div className="relative w-4/5 max-w-xs h-full bg-white shadow-2xl flex flex-col z-10 border-l border-slate-200">
                        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
                            <span className="font-bold text-base text-slate-900">Settings & Options</span>
                            <button onClick={() => setShowMenu(false)} className="p-1 hover:bg-slate-100 rounded-full text-slate-600">
                                <X size={22} />
                            </button>
                        </div>
                        <div className="flex-1 p-3 space-y-1">
                            <button 
                                onClick={() => { setShowMenu(false); navigate('/reels'); }}
                                className="w-full text-left px-4 py-3 text-xs font-bold text-slate-700 hover:bg-purple-50 hover:text-purple-700 rounded-xl transition-all flex items-center gap-2.5"
                            >
                                <Clapperboard size={16} /> Explore Reels Marketplace
                            </button>
                            <button 
                                onClick={() => { setShowMenu(false); setShowContactSheet(true); }}
                                className="w-full text-left px-4 py-3 text-xs font-bold text-slate-700 hover:bg-purple-50 hover:text-purple-700 rounded-xl transition-all flex items-center gap-2.5"
                            >
                                <Mail size={16} /> Contact Support
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Contact Bottom Sheet */}
            {showContactSheet && (
                <div className="fixed inset-0 z-[110] flex items-end justify-center">
                    <div 
                        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" 
                        onClick={() => setShowContactSheet(false)}
                    />
                    <div className="relative w-full max-w-lg bg-slate-900 text-white rounded-t-3xl p-6 z-10 shadow-2xl border-t border-slate-800 space-y-4">
                        <div className="flex justify-between items-center pb-3 border-b border-slate-800">
                            <h3 className="font-bold text-base text-purple-400">Contact Creator</h3>
                            <button onClick={() => setShowContactSheet(false)} className="text-slate-400 hover:text-white"><X size={20} /></button>
                        </div>
                        <div className="space-y-3">
                            <a 
                                href="mailto:test@example.com" 
                                className="flex items-center gap-3 p-3 bg-slate-800 rounded-xl hover:bg-slate-700 transition-colors text-xs font-semibold"
                            >
                                <Mail size={16} className="text-purple-400" /> test@example.com
                            </a>
                            <button 
                                onClick={() => { toast.success('Contact request sent!'); setShowContactSheet(false); }}
                                className="w-full flex items-center justify-center gap-2 p-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold shadow-md transition-all"
                            >
                                <Phone size={16} /> Request Direct Callback
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CreatorProfile;
