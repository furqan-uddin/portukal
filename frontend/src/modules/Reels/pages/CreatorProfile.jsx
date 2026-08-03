import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
    ChevronLeft, Clapperboard, 
    Menu, X
} from 'lucide-react';
import api from '../../../shared/utils/api';
import toast from 'react-hot-toast';

import { useAuthStore } from '../../../shared/store/authStore';
import { useInfluencerAuthStore } from '../../Influencer/store/influencerAuthStore';

const CreatorProfile = () => {
    const navigate = useNavigate();
    const { id } = useParams();

    const { user: currentUser } = useAuthStore();
    const { influencer: currentInfluencer } = useInfluencerAuthStore();

    const rawId = String(id || 'nansi_tiwari').trim();
    const formattedHandle = rawId.toLowerCase().replace(/\s+/g, '_');
    const displayName = rawId === 'nansi_tiwari' || rawId === 'nansi' ? 'Nansi Tiwari' : rawId.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

    const checkIsFollowed = () => {
        try {
            const list = JSON.parse(localStorage.getItem('followed_creators') || '[]');
            return list.includes(formattedHandle) || list.includes(rawId);
        } catch {
            return false;
        }
    };

    const [isFollowing, setIsFollowing] = useState(false);
    const [followersCount, setFollowersCount] = useState(0);
    const [showMenu, setShowMenu] = useState(false);
    const [reelsList, setReelsList] = useState([]);
    const [creatorData, setCreatorData] = useState(null);
    const [activeReelModal, setActiveReelModal] = useState(null);
    const [loading, setLoading] = useState(false);

    // Context check ONLY to prevent self-following on public view
    const creatorUserId = String(
        creatorData?.profile?.user?._id || 
        creatorData?.profile?.user?.id || 
        (typeof creatorData?.profile?.user === 'string' ? creatorData.profile.user : '')
    );
    const creatorInfluencerId = String(creatorData?.profile?._id || creatorData?.profile?.id || '');
    const creatorSlug = String(creatorData?.profile?.slug || creatorData?.profile?.username || '').toLowerCase();
    const creatorEmail = String(creatorData?.profile?.email || '').toLowerCase();

    const currentUserId = String(currentUser?._id || currentUser?.id || '');
    const currentInfluencerId = String(currentInfluencer?._id || currentInfluencer?.id || '');
    const currentSlug = String(currentInfluencer?.slug || currentInfluencer?.username || '').toLowerCase();
    const currentEmail = String(currentUser?.email || currentInfluencer?.email || '').toLowerCase();

    const isSelf = Boolean(
        creatorData?.profile && (
            (currentInfluencerId && creatorInfluencerId && currentInfluencerId === creatorInfluencerId) ||
            (currentUserId && creatorUserId && currentUserId === creatorUserId) ||
            (currentSlug && creatorSlug && currentSlug === creatorSlug) ||
            (currentEmail && creatorEmail && currentEmail === creatorEmail) ||
            (rawId && currentSlug && rawId.toLowerCase() === currentSlug)
        )
    );

    const handleToggleFollow = async () => {
        if (!currentUser && !currentInfluencer) {
            toast.error('Please log in to follow creators.');
            navigate('/login');
            return;
        }

        const creatorTargetId = creatorData?.profile?._id || id;
        const prevFollowing = isFollowing;
        const prevCount = followersCount;

        // Optimistic UI Update
        const nextState = !prevFollowing;
        setIsFollowing(nextState);
        setFollowersCount((prev) => (nextState ? prev + 1 : Math.max(0, prev - 1)));

        try {
            const res = await api.post(`/reels/follow/influencer/${creatorTargetId}`);
            const data = res.data || res;
            const payload = data.data || data;
            
            if (typeof payload?.isFollowing === 'boolean') {
                setIsFollowing(payload.isFollowing);
            }
            if (typeof payload?.followersCount === 'number') {
                setFollowersCount(payload.followersCount);
            }
            if (nextState) {
                toast.success(`You are now following @${creatorData?.profile?.slug || displayName}!`);
            } else {
                toast.success(`Unfollowed @${creatorData?.profile?.slug || displayName}`);
            }
        } catch (err) {
            // Rollback on failure
            setIsFollowing(prevFollowing);
            setFollowersCount(prevCount);
            const errorMsg = err.response?.data?.message || err.message || 'Failed to update follow status.';
            toast.error(errorMsg);
        }
    };

    // Fetch creator profile details and reels from dedicated public backend endpoint
    useEffect(() => {
        let isMounted = true;
        const fetchCreatorData = async () => {
            setLoading(true);
            try {
                const res = await api.get(`/creator/${id}`);
                const data = res.data || res;
                if (isMounted && data?.profile) {
                    setCreatorData(data);
                    setReelsList(data.reels || []);
                    if (typeof data.stats?.followersCount === 'number') {
                        setFollowersCount(data.stats.followersCount);
                    }
                    if (typeof data.stats?.isFollowing === 'boolean') {
                        setIsFollowing(data.stats.isFollowing);
                    }
                }
            } catch (err) {
                // Fallback to reels feed filtered strictly by influencerId
                try {
                    const res = await api.get('/reels/feed', { params: { limit: 12, influencerId: id } });
                    const list = res.reels || res.data?.reels || [];
                    if (isMounted) setReelsList(list);
                } catch {
                    if (isMounted) setReelsList([]);
                }
            } finally {
                if (isMounted) setLoading(false);
            }
        };
        fetchCreatorData();
        return () => { isMounted = false; };
    }, [id]);

    return (
        <div className="min-h-screen bg-white text-slate-900 font-sans pb-24">
            {/* Public Header */}
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
                                @{creatorData?.profile?.slug || formattedHandle}
                            </span>
                        </div>
                    </div>

                    {/* Options Menu Button */}
                    <div className="flex items-center gap-3 z-10">
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
                                        src={creatorData?.profile?.profileImage || `https://api.dicebear.com/7.x/shapes/svg?seed=${formattedHandle}`} 
                                        alt={creatorData?.profile?.name || displayName} 
                                        className="h-full w-full object-cover" 
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Stats & Actions Section */}
                        <div className="flex-1 space-y-4">
                            {/* Title & Follow/Message Buttons */}
                            <div className="flex flex-wrap items-center gap-3">
                                <h2 className="text-xl md:text-2xl font-light text-slate-800">{creatorData?.profile?.name || displayName}</h2>
                                <div className="flex items-center gap-2 flex-wrap">
                                    <button 
                                        onClick={handleToggleFollow}
                                        className={`px-5 py-1.5 rounded-xl text-xs font-bold transition-all shadow-sm active:scale-95 cursor-pointer group ${
                                            isFollowing 
                                                ? 'bg-slate-100 text-slate-800 border border-slate-200 hover:bg-red-50 hover:text-red-600 hover:border-red-200' 
                                                : 'bg-purple-600 text-white hover:bg-purple-700'
                                        }`}
                                    >
                                        {isFollowing ? (
                                            <>
                                                <span className="group-hover:hidden">Following ✓</span>
                                                <span className="hidden group-hover:inline">Unfollow</span>
                                            </>
                                        ) : (
                                            'Follow'
                                        )}
                                    </button>
                                </div>
                            </div>

                            {/* Stats Counter Row */}
                            <div className="flex items-center gap-8 py-1 border-y border-slate-100 md:border-none">
                                <div className="text-center md:text-left">
                                    <span className="font-bold text-base md:text-lg text-slate-900">{creatorData?.stats?.totalReels ?? reelsList.length} </span>
                                    <span className="text-xs md:text-sm text-slate-600 font-medium">Reels</span>
                                </div>
                                <div className="text-center md:text-left">
                                    <span className="font-bold text-base md:text-lg text-slate-900">
                                        {followersCount} 
                                    </span>
                                    <span className="text-xs md:text-sm text-slate-600 font-medium">Followers</span>
                                </div>
                                <div className="text-center md:text-left">
                                    <span className="font-bold text-base md:text-lg text-slate-900">{creatorData?.stats?.followingCount ?? 0} </span>
                                    <span className="text-xs md:text-sm text-slate-600 font-medium">Following</span>
                                </div>
                            </div>

                            {/* Bio Description */}
                            <div className="space-y-1 text-xs md:text-sm text-slate-700">
                                <div className="font-bold text-slate-900">{creatorData?.profile?.name || displayName}</div>
                                <p className="text-slate-600">{creatorData?.profile?.bio || 'Official Creator & Brand Ambassador on Porutkal Marketplace ✨'}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Reels Header Bar ([🎬] REELS) */}
                <div className="flex border-t border-slate-200">
                    <div className="flex-1 py-3.5 flex justify-center items-center gap-2 border-b-2 border-purple-600 text-purple-600 font-bold text-xs uppercase tracking-wider">
                        <Clapperboard size={20} />
                        <span>Reels ({reelsList.length})</span>
                    </div>
                </div>

                {/* Reels 3-Column Video Media Grid or Empty State */}
                {reelsList.length === 0 ? (
                    <div className="py-16 text-center space-y-3 bg-slate-50 rounded-2xl border border-dashed border-slate-200 my-4 mx-2">
                        <div className="w-14 h-14 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center mx-auto">
                            <Clapperboard size={28} />
                        </div>
                        <div>
                            <h3 className="font-bold text-slate-800 text-sm">No Reels Uploaded Yet 🎬</h3>
                            <p className="text-xs text-slate-500 max-w-xs mx-auto mt-1">This creator has not uploaded any product reels yet.</p>
                        </div>
                    </div>
                ) : (
                    <div className="grid grid-cols-3 gap-1 md:gap-2 p-1 md:p-2">
                        {reelsList.map((reel, idx) => (
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
                )}
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
                            <span className="font-bold text-base text-slate-900">Explore & Options</span>
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
