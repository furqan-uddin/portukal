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

    const rawId = String(id || 'nansi_tiwari').trim();
    const formattedHandle = rawId.toLowerCase().replace(/\s+/g, '_');
    const displayName = rawId === 'nansi_tiwari' || rawId === 'nansi' ? 'Nansi Tiwari' : rawId.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

    const [activeTab, setActiveTab] = useState('grid'); // 'grid' | 'reels' | 'tags'

    const checkIsFollowed = () => {
        try {
            const list = JSON.parse(localStorage.getItem('followed_creators') || '[]');
            return list.includes(formattedHandle) || list.includes(rawId);
        } catch {
            return false;
        }
    };

    const [isFollowing, setIsFollowing] = useState(checkIsFollowed);
    const [followersCount, setFollowersCount] = useState(() => (checkIsFollowed() ? 10501 : 10500));
    const [showMenu, setShowMenu] = useState(false);
    const [showContactSheet, setShowContactSheet] = useState(false);
    const [reelsList, setReelsList] = useState([]);
    const [activeReelModal, setActiveReelModal] = useState(null);
    const [loading, setLoading] = useState(false);

    const handleToggleFollow = () => {
        const nextState = !isFollowing;
        setIsFollowing(nextState);
        setFollowersCount((prev) => (nextState ? prev + 1 : prev - 1));
        try {
            let list = JSON.parse(localStorage.getItem('followed_creators') || '[]');
            if (nextState) {
                if (!list.includes(formattedHandle)) list.push(formattedHandle);
                toast.success(`You are now following ${displayName}!`);
            } else {
                list = list.filter((item) => item !== formattedHandle && item !== rawId);
                toast.success(`Unfollowed ${displayName}`);
            }
            localStorage.setItem('followed_creators', JSON.stringify(list));
        } catch {}
    };

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
                            {/* Title & Follow Button */}
                            <div className="flex flex-wrap items-center gap-3">
                                <h2 className="text-xl md:text-2xl font-light text-slate-800">{displayName}</h2>
                                <div className="flex items-center gap-2 flex-wrap">
                                    <button 
                                        onClick={handleToggleFollow}
                                        className={`px-5 py-1.5 rounded-xl text-xs font-bold transition-all shadow-sm active:scale-95 cursor-pointer ${
                                            isFollowing 
                                                ? 'bg-slate-100 text-slate-800 border border-slate-200 hover:bg-slate-200' 
                                                : 'bg-purple-600 text-white hover:bg-purple-700'
                                        }`}
                                    >
                                        {isFollowing ? 'Following ✓' : 'Follow'}
                                    </button>
                                    <button 
                                        onClick={() => navigate(`/vendor/creator-collaborations?influencer=${creatorHandle}`)}
                                        className="px-4 py-1.5 bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 rounded-xl text-xs font-bold transition-all active:scale-95 cursor-pointer flex items-center gap-1.5 shadow-sm"
                                    >
                                        💬 Message
                                    </button>
                                </div>
                            </div>

                            {/* Stats Counter Row */}
                            <div className="flex items-center gap-8 py-1 border-y border-slate-100 md:border-none">
                                <div className="text-center md:text-left">
                                    <span className="font-bold text-base md:text-lg text-slate-900">12 </span>
                                    <span className="text-xs md:text-sm text-slate-600 font-medium">Reels</span>
                                </div>
                                <div className="text-center md:text-left">
                                    <span className="font-bold text-base md:text-lg text-slate-900">
                                        {(followersCount / 1000).toFixed(1)}K 
                                    </span>
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

                {/* Reels Header Bar ([🎬] REELS) */}
                <div className="flex border-t border-slate-200">
                    <div className="flex-1 py-3.5 flex justify-center items-center gap-2 border-b-2 border-purple-600 text-purple-600 font-bold text-xs uppercase tracking-wider">
                        <Clapperboard size={20} />
                        <span>Reels</span>
                    </div>
                </div>

                {/* Reels 3-Column Video Media Grid */}
                <div className="grid grid-cols-3 gap-1 md:gap-2 p-1 md:p-2">
                    {(reelsList.length > 0 ? reelsList : [
                        { id: 1, title: 'Summer Fashion Styling & OOTD Review ✨', views: '2.4K', videoUrl: 'https://cdn.pixabay.com/video/2025/03/25/267242_large.mp4', thumbnail: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=600&auto=format&fit=crop&q=80' },
                        { id: 2, title: 'Trendy Ethnic Outfit Haul & Try-On 🛍️', views: '1.8K', videoUrl: 'https://cdn.pixabay.com/video/2025/03/25/267241_large.mp4', thumbnail: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600&auto=format&fit=crop&q=80' },
                        { id: 3, title: 'Luxury Accessories & Watch Unboxing ⌚', views: '3.1K', videoUrl: 'https://cdn.pixabay.com/video/2024/03/29/206029_large.mp4', thumbnail: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&auto=format&fit=crop&q=80' },
                        { id: 4, title: 'Streetwear Styling Hacks for Autumn 🍂', views: '1.4K', videoUrl: 'https://cdn.pixabay.com/video/2024/05/06/210846_large.mp4', thumbnail: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?w=600&auto=format&fit=crop&q=80' },
                        { id: 5, title: 'Shoppable Footwear & Sneakers Showcase 👟', views: '4.2K', videoUrl: 'https://cdn.pixabay.com/video/2023/03/07/153579-805688725_large.mp4', thumbnail: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&auto=format&fit=crop&q=80' },
                        { id: 6, title: 'Minimalist Festive Wear Lookbook ✨', views: '2.9K', videoUrl: 'https://cdn.pixabay.com/video/2025/03/25/267242_large.mp4', thumbnail: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=600&auto=format&fit=crop&q=80' }
                    ]).map((reel, idx) => (
                        <div 
                            key={reel._id || reel.id || idx} 
                            onClick={() => setActiveReelModal(reel)}
                            className="aspect-[9/16] bg-slate-900 overflow-hidden relative group cursor-pointer rounded-xl border border-slate-800 hover:border-purple-500 transition-all"
                        >
                            <img 
                                src={reel.thumbnailUrl || reel.thumbnail || reel.image || `https://picsum.photos/seed/reel-${idx + 50}/300/533`} 
                                alt="Reel" 
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" 
                            />
                            <div className="absolute inset-0 bg-black/30 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                                <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-md border border-white/40 flex items-center justify-center text-white group-hover:scale-110 transition-transform">
                                    <Clapperboard size={18} className="fill-white" />
                                </div>
                            </div>
                            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent p-2">
                                <span className="text-white text-[11px] font-extrabold flex items-center gap-1 drop-shadow">
                                    <Clapperboard size={12} /> {reel.viewsCount || reel.views || '1.4K'}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Video Reel Player Popup Modal */}
            {activeReelModal && (
                <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-[150] flex items-center justify-center p-4">
                    <div className="relative w-full max-w-sm aspect-[9/16] max-h-[85vh] bg-slate-950 rounded-3xl overflow-hidden shadow-2xl border border-slate-800 flex flex-col">
                        {/* Header */}
                        <div className="absolute top-0 inset-x-0 p-4 bg-gradient-to-b from-black/80 to-transparent z-20 flex items-center justify-between text-white">
                            <div className="flex items-center gap-2.5">
                                <div className="w-9 h-9 rounded-full bg-purple-600 overflow-hidden border border-white/40 font-bold flex items-center justify-center text-sm">
                                    {displayName.charAt(0)}
                                </div>
                                <div>
                                    <h4 className="font-bold text-xs leading-none">{displayName}</h4>
                                    <span className="text-[10px] text-purple-300 font-semibold">{activeReelModal.views || '1.4K'} views</span>
                                </div>
                            </div>
                            <button 
                                onClick={() => setActiveReelModal(null)}
                                className="w-8 h-8 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-white/20 transition-colors"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Video Element */}
                        <video
                            src={activeReelModal.videoUrl || activeReelModal.video?.secureUrl || 'https://cdn.pixabay.com/video/2025/03/25/267242_large.mp4'}
                            autoPlay
                            loop
                            controls
                            className="w-full h-full object-cover"
                        />

                        {/* Caption Overlay */}
                        <div className="absolute bottom-12 inset-x-0 p-4 bg-gradient-to-t from-black/90 via-black/40 to-transparent z-20 text-white space-y-1 pointer-events-none">
                            <p className="text-xs font-bold leading-snug drop-shadow">{activeReelModal.title || 'Creator Reel Video'}</p>
                        </div>
                    </div>
                </div>
            )}

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
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CreatorProfile;
