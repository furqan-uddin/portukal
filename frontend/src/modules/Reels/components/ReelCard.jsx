import React, { useRef, useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShoppingBag, X, Heart, Send, MessageCircle, Bookmark, Flag, MoreHorizontal, Music } from 'lucide-react';
import api from '../../../shared/utils/api';
import toast from 'react-hot-toast';

// ─── Comment Section ────────────────────────────────────────────────────────
const CommentSection = ({ reelId, onClose }) => {
    const [comments, setComments] = useState([]);
    const [text, setText] = useState('');
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    const fetchComments = useCallback(async () => {
        setLoading(true);
        try {
            const data = await api.get(`/reels/${reelId}/comments`);
            setComments(data.comments || []);
        } catch {} finally { setLoading(false); }
    }, [reelId]);

    useEffect(() => { fetchComments(); }, [fetchComments]);

    const handleSubmit = async () => {
        if (!text.trim()) return;
        setSubmitting(true);
        try {
            const data = await api.post(`/reels/${reelId}/comments`, { comment: text.trim() });
            setComments((prev) => [data, ...prev]);
            setText('');
        } catch {} finally { setSubmitting(false); }
    };

    const handleLikeComment = async (commentId) => {
        try { await api.post(`/reels/comments/${commentId}/like`); } catch {}
    };

    return (
        <div className="absolute inset-0 z-[60] flex items-end">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] pointer-events-auto" onClick={onClose} />
            <div className="relative w-full h-[75%] bg-neutral-900 rounded-t-[2.5rem] flex flex-col shadow-2xl border-t border-white/10 pointer-events-auto">
                <div className="w-full flex justify-center py-3"><div className="w-10 h-1 rounded-full bg-white/20" /></div>
                <div className="flex items-center justify-between px-6 pb-4 border-b border-white/10">
                    <span className="text-white font-bold text-lg">Comments {comments.length > 0 && `(${comments.length})`}</span>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-white/10 text-white/70"><X size={22} /></button>
                </div>

                {/* Comments List */}
                <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4 no-scrollbar">
                    {loading && <div className="text-white/40 text-sm text-center py-4">Loading...</div>}
                    {!loading && comments.length === 0 && (
                        <div className="text-center py-8 text-white/40">
                            <MessageCircle size={32} className="mx-auto mb-2 opacity-50" />
                            <p className="text-sm">No comments yet. Be the first!</p>
                        </div>
                    )}
                    {comments.map((c) => (
                        <div key={c._id} className="flex gap-3">
                            <div className="h-9 w-9 rounded-full bg-neutral-800 flex-shrink-0 overflow-hidden">
                                {c.userId?.profileImage
                                    ? <img src={c.userId.profileImage} alt="" className="w-full h-full object-cover" />
                                    : <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${c.userId?._id}`} alt="" className="w-full h-full" />
                                }
                            </div>
                            <div className="flex-1">
                                <div className="flex items-center gap-2">
                                    <span className="text-white font-semibold text-xs">{c.userId?.name || 'User'}</span>
                                    <span className="text-white/30 text-[10px]">{new Date(c.createdAt).toLocaleDateString()}</span>
                                </div>
                                <p className="text-white/90 text-sm mt-0.5 leading-relaxed">{c.comment}</p>
                                <div className="flex items-center gap-4 mt-1">
                                    <button onClick={() => handleLikeComment(c._id)} className="text-white/40 text-[11px] font-semibold hover:text-red-400 transition-colors">❤️ Like</button>
                                    <button className="text-white/40 text-[11px] font-semibold hover:text-white/70 transition-colors">Reply</button>
                                </div>
                                {/* Replies */}
                                {c.replies?.map((r) => (
                                    <div key={r._id} className="flex gap-2 mt-2 ml-2">
                                        <div className="w-6 h-6 rounded-full bg-neutral-700 flex-shrink-0 overflow-hidden">
                                            <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${r.userId?._id}`} alt="" className="w-full h-full" />
                                        </div>
                                        <div>
                                            <span className="text-white/60 text-[11px] font-semibold">{r.userId?.name || 'User'} </span>
                                            <span className="text-white/80 text-[11px]">{r.comment}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Input */}
                <div className="p-4 border-t border-white/10 bg-neutral-900 pb-8">
                    <div className="flex items-center gap-3 bg-neutral-800 rounded-full px-4 py-2 border border-white/5">
                        <input
                            value={text} onChange={(e) => setText(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
                            placeholder="Add a comment..."
                            className="flex-1 bg-transparent text-white text-sm outline-none placeholder:text-white/30"
                        />
                        <button onClick={handleSubmit} disabled={submitting || !text.trim()} className="text-purple-400 font-bold text-sm px-2 disabled:opacity-40">
                            {submitting ? '…' : 'Post'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

// ─── ReelActions ────────────────────────────────────────────────────────────
const ReelActions = ({ reel, onLike, onShare, onSave, onReport, onComment }) => {
    const [showMore, setShowMore] = useState(false);
    const reelId = reel._id || reel.id;

    return (
        <div className="flex flex-col items-center gap-5 text-white">
            {/* Like */}
            <button onClick={() => onLike(reelId)} className="flex flex-col items-center group">
                <Heart size={30} fill={reel.isLiked ? 'currentColor' : 'none'} strokeWidth={2.5}
                    className={`${reel.isLiked ? 'text-red-500' : 'text-white'} drop-shadow-lg transition-all`} />
                <span className="text-[10px] font-bold drop-shadow-md">{(reel.likesCount || reel.likes || 0).toLocaleString()}</span>
            </button>

            {/* Comment */}
            <button onClick={onComment} className="flex flex-col items-center group">
                <MessageCircle size={30} strokeWidth={2.5} className="drop-shadow-lg" />
                <span className="text-[10px] font-bold drop-shadow-md">{(reel.commentsCount || 0).toLocaleString()}</span>
            </button>

            {/* Share */}
            <button onClick={() => onShare(reelId)} className="flex flex-col items-center group">
                <Send size={30} strokeWidth={2.5} className="drop-shadow-lg -rotate-12 mb-1" />
                <span className="text-[10px] font-bold drop-shadow-md">Share</span>
            </button>

            {/* More */}
            <div className="relative">
                <button onClick={() => setShowMore(!showMore)} className="flex flex-col items-center group">
                    <MoreHorizontal size={30} strokeWidth={2.5} className="drop-shadow-lg" />
                </button>
                {showMore && (
                    <div className="absolute right-full mr-4 bottom-0 bg-black/80 backdrop-blur-xl rounded-2xl p-2 flex flex-col gap-1 border border-white/20 shadow-2xl min-w-[140px] z-50 text-white">
                        <button onClick={() => { onSave(reelId); setShowMore(false); }}
                            className="flex items-center gap-3 px-4 py-2.5 hover:bg-white/10 rounded-xl transition-colors text-sm font-medium">
                            <Bookmark size={16} /> {reel.isSaved ? 'Unsave' : 'Save'}
                        </button>
                        <div className="h-px bg-white/10 mx-2" />
                        <button onClick={() => { onReport(reelId); setShowMore(false); }}
                            className="flex items-center gap-3 px-4 py-2.5 hover:bg-white/10 rounded-xl transition-colors text-sm font-medium text-red-400">
                            <Flag size={16} /> Report
                        </button>
                    </div>
                )}
            </div>

            {/* Audio */}
            <button className="flex flex-col items-center group mt-2">
                <Music size={22} strokeWidth={2.5} className="drop-shadow-lg animate-spin-slow" />
            </button>
        </div>
    );
};

// ─── ReelCard ────────────────────────────────────────────────────────────────
const ReelCard = ({ reel, toggleLike, shareReel, saveReel, reportReel, onView, onProductClick }) => {
    const [showComments, setShowComments] = useState(false);
    const videoRef = useRef(null);
    const navigate = useNavigate();
    const viewTrackedRef = useRef(false);
    const watchStartRef = useRef(null);
    const reelId = reel._id || reel.id;

    // Auto-play / Pause + view tracking
    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    videoRef.current?.play().catch(() => {});
                    if (!viewTrackedRef.current) {
                        viewTrackedRef.current = true;
                        watchStartRef.current = Date.now();
                        // Track view after 1 second
                        setTimeout(() => {
                            if (onView) onView(reelId, { reached3s: false });
                        }, 1000);
                    }
                } else {
                    videoRef.current?.pause();
                    if (videoRef.current) videoRef.current.currentTime = 0;
                    // Track watch duration on leave
                    if (watchStartRef.current && onView) {
                        const watchDuration = Math.round((Date.now() - watchStartRef.current) / 1000);
                        const duration = videoRef.current?.duration || 1;
                        const completed = watchDuration >= duration * 0.9;
                        onView(reelId, {
                            watchDuration,
                            completed,
                            reached3s: watchDuration >= 3,
                            reached10s: watchDuration >= 10,
                        });
                        watchStartRef.current = null;
                    }
                }
            },
            { threshold: 0.5 }
        );
        if (videoRef.current) observer.observe(videoRef.current);
        return () => observer.disconnect();
    }, [reelId, onView]);

    const handleViewProduct = (productId) => {
        const pid = productId || reel.productId?._id || reel.productId;
        if (pid && onProductClick) onProductClick(reelId, pid);
        const slug = reel.productId?.slug || pid;
        if (slug) navigate(`/product/${slug}`);
    };

    // Resolve profile details
    const displayName = reel.influencerId?.name || reel.vendorId?.storeName || reel.creatorName || 'Nansi Tiwari';
    const avatarUrl = reel.influencerId?.profileImage || reel.influencerId?.avatar || reel.vendorId?.logoUrl || reel.creatorAvatar || '';
    const rawHandle = reel.influencerId?.slug || displayName.toLowerCase().replace(/\s+/g, '_');
    const creatorHandle = rawHandle.replace(/[^a-zA-Z0-9_]/g, '');

    const profileStoreLink = reel.influencerId
        ? `/creator/${creatorHandle}`
        : reel.vendorId?.storefrontId?.slug
        ? `/store/${reel.vendorId.storefrontId.slug}`
        : reel.vendorId?._id || reel.vendorId?.id
        ? `/store/${reel.vendorId.slug || (reel.vendorId._id || reel.vendorId.id)}`
        : `/creator/${creatorHandle}`;

    // Read initial follow status from localStorage
    const getIsFollowed = () => {
        try {
            const followedList = JSON.parse(localStorage.getItem('followed_creators') || '[]');
            return followedList.includes(creatorHandle) || followedList.includes(reel.influencerId?._id);
        } catch {
            return false;
        }
    };

    const [isFollowing, setIsFollowing] = useState(() => reel.isFollowing || getIsFollowed());

    const handleToggleFollow = (e) => {
        e.stopPropagation();
        const nextState = !isFollowing;
        setIsFollowing(nextState);
        try {
            let followedList = JSON.parse(localStorage.getItem('followed_creators') || '[]');
            if (nextState) {
                if (!followedList.includes(creatorHandle)) followedList.push(creatorHandle);
                if (reel.influencerId?._id && !followedList.includes(reel.influencerId._id)) {
                    followedList.push(reel.influencerId._id);
                }
                toast.success(`You are now following ${displayName}!`);
            } else {
                followedList = followedList.filter(item => item !== creatorHandle && item !== reel.influencerId?._id);
                toast.success(`Unfollowed ${displayName}`);
            }
            localStorage.setItem('followed_creators', JSON.stringify(followedList));
        } catch {}
    };

    const handleOpenProfile = (e) => {
        e.stopPropagation();
        if (profileStoreLink && profileStoreLink !== '#') {
            navigate(profileStoreLink);
        }
    };

    const videoSrc = reel.video?.secureUrl || reel.videoUrl;

    return (
        <div className="relative h-screen w-full md:max-w-[calc(100vh*9/16)] bg-black snap-start overflow-hidden shrink-0 mx-auto">
            {/* Background Video */}
            <video
                ref={videoRef}
                className="h-full w-full object-cover cursor-pointer"
                src={videoSrc}
                poster={reel.thumbnailUrl}
                loop muted autoPlay playsInline preload="auto"
                onClick={() => {
                    if (videoRef.current) {
                        if (videoRef.current.paused) videoRef.current.play().catch(() => {});
                        else videoRef.current.pause();
                    }
                }}
            />

            {/* Gradient Overlay */}
            <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/80 to-transparent pointer-events-none" />

            {/* Actions */}
            <div className="absolute right-4 bottom-20 z-30">
                <ReelActions
                    reel={reel}
                    onLike={toggleLike}
                    onShare={shareReel}
                    onSave={saveReel}
                    onReport={reportReel}
                    onComment={() => setShowComments(true)}
                />
            </div>

            {/* Vendor/Creator info + caption */}
            <div className="absolute left-4 right-20 bottom-20 z-10 flex flex-col gap-3">
                <div className="flex items-center gap-3">
                    <button 
                        onClick={handleOpenProfile}
                        className="h-10 w-10 rounded-full border border-white/50 overflow-hidden shadow-lg flex-shrink-0 bg-neutral-800 cursor-pointer hover:scale-105 transition-all"
                        title={`View ${displayName}'s profile`}
                    >
                        {avatarUrl ? (
                            <img src={avatarUrl} alt={displayName} className="w-full h-full object-cover" />
                        ) : (
                            <img src={`https://api.dicebear.com/7.x/shapes/svg?seed=${displayName}`} alt={displayName} className="w-full h-full" />
                        )}
                    </button>
                    <div className="flex items-center gap-2 flex-wrap">
                        <button 
                            onClick={handleOpenProfile}
                            className="font-bold text-white text-sm drop-shadow-md hover:underline cursor-pointer text-left flex items-center gap-1.5"
                        >
                            <span>{displayName}</span>
                            {(reel.influencerId || displayName === 'Nansi Tiwari') && (
                                <span className="text-[10px] bg-purple-600/90 text-white font-extrabold px-1.5 py-0.5 rounded-md shadow-sm">
                                    Creator ✨
                                </span>
                            )}
                        </button>
                        <button 
                            onClick={handleToggleFollow}
                            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all shadow-md active:scale-95 cursor-pointer ${
                                isFollowing 
                                    ? 'bg-white/20 text-white border border-white/30 backdrop-blur-md' 
                                    : 'bg-purple-600 hover:bg-purple-700 text-white'
                            }`}
                        >
                            {isFollowing ? 'Following ✓' : 'Follow'}
                        </button>
                    </div>
                </div>


                {/* Caption */}
                {reel.caption && (
                    <p className="text-white text-[14px] leading-snug font-medium line-clamp-2 drop-shadow-lg">{reel.caption}</p>
                )}

                {/* Tagged Products */}
                {(reel.taggedProducts?.length > 0 || reel.productId) && (
                    <div className="flex gap-2 flex-wrap">
                        {/* Primary product */}
                        {reel.productId && (
                            <button
                                onClick={() => handleViewProduct(reel.productId?._id || reel.productId)}
                                className="flex items-center gap-2 bg-white/15 backdrop-blur-md border border-white/20 rounded-full px-3 py-1.5 text-white text-xs font-semibold hover:bg-white/25 transition-all active:scale-95"
                            >
                                <ShoppingBag size={12} />
                                <span className="line-clamp-1 max-w-[120px]">{reel.productId?.name || 'View Product'}</span>
                                {reel.productId?.price && <span className="text-purple-300">₹{reel.productId.price}</span>}
                            </button>
                        )}
                        {/* Additional tagged products */}
                        {reel.taggedProducts?.slice(0, 2).map((tp) => (
                            <button key={tp.productId?._id || tp.productId}
                                onClick={() => handleViewProduct(tp.productId?._id || tp.productId)}
                                className="flex items-center gap-1 bg-white/10 backdrop-blur border border-white/15 rounded-full px-2.5 py-1 text-white text-[11px] font-medium hover:bg-white/20 transition-all"
                            >
                                <ShoppingBag size={10} />
                                <span className="line-clamp-1 max-w-[80px]">{tp.label || 'Product'}</span>
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* Comments Sheet */}
            {showComments && (
                <CommentSection reelId={reelId} onClose={() => setShowComments(false)} />
            )}

            <style>{`
                .no-scrollbar::-webkit-scrollbar { display: none; }
                .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
                @keyframes spin-slow { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
                .animate-spin-slow { animation: spin-slow 4s linear infinite; }
            `}</style>
        </div>
    );
};

export default ReelCard;
