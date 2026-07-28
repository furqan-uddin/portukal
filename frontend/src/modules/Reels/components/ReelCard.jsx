import React, { useRef, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShoppingBag, X, Star, Minus, Plus } from 'lucide-react';
import ReelActions from './ReelActions';
import { useAffiliate } from '../../Affiliate/hooks/useAffiliate';

const ReelCard = ({ reel, toggleLike, shareReel, saveReel, reportReel }) => {
    const [showComments, setShowComments] = useState(false);
    const videoRef = useRef(null);
    const navigate = useNavigate();
    const { trackClick } = useAffiliate();

    // Auto-play / Pause logic based on visibility
    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    videoRef.current?.play().catch(e => console.log('Autoplay blocked:', e));
                } else {
                    videoRef.current?.pause();
                    if (videoRef.current) videoRef.current.currentTime = 0;
                }
            },
            { threshold: 0.5 }
        );

        if (videoRef.current) {
            observer.observe(videoRef.current);
        }

        return () => observer.disconnect();
    }, []);

    const handleViewProduct = () => {
        trackClick(reel.productId, reel.id, 'creator_99'); // Track affiliate click
        navigate(`/product/${reel.productId}`);
    };

    return (
        <div className="relative h-screen w-full md:max-w-[calc(100vh*9/16)] bg-black snap-start overflow-hidden group shrink-0">
            {/* Background Video */}
            <video
                ref={videoRef}
                className="h-full w-full object-cover"
                src={reel.videoUrl}
                loop
                muted
                autoPlay
                playsInline
                preload="auto"
            />

            {/* Bottom Gradient Overlay */}
            <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/80 to-transparent pointer-events-none" />

            {/* Interactions Overlay */}
            <div className="absolute right-4 bottom-20 z-30">
                <ReelActions 
                    reel={reel} 
                    onLike={toggleLike} 
                    onShare={shareReel} 
                    onSave={saveReel} 
                    onReport={reportReel}
                    onComment={() => setShowComments(true)}
                    onCartClick={handleViewProduct}
                />
            </div>

            {/* Content & Creator Info */}
            <div className="absolute left-4 right-20 bottom-20 z-10 flex flex-col gap-3">
                {/* Creator Profile Section */}
                <div className="flex items-center gap-3">
                    <div 
                        onClick={() => navigate(`/creator/${reel.creatorName || 'style_curator'}`)}
                        className="h-10 w-10 rounded-full border border-white/50 overflow-hidden shadow-lg flex-shrink-0 bg-neutral-800 cursor-pointer active:scale-90 transition-all"
                    >
                        <img 
                            src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${reel.id}`} 
                            alt="creator" 
                            className="h-full w-full object-cover" 
                        />
                    </div>
                    <div className="flex items-center gap-3">
                        <span 
                            onClick={() => navigate(`/creator/${reel.creatorName || 'style_curator'}`)}
                            className="font-bold text-white text-sm drop-shadow-md tracking-tight cursor-pointer active:opacity-70 transition-all"
                        >
                            {reel.creatorName || "style_curator"}
                        </span>
                        <button className="px-4 py-1.5 rounded-lg border border-white/40 bg-white/10 backdrop-blur-md text-xs font-bold text-white transition-all active:scale-95 hover:bg-white/20">
                            Follow
                        </button>
                    </div>
                </div>

                {/* Caption / Description */}
                <div className="text-white drop-shadow-lg max-w-full">
                    <p className="text-[15px] leading-snug font-medium line-clamp-2">
                        {reel.caption}
                    </p>
                </div>

            </div>
            
            {/* Comments Section Modal */}
            {showComments && (
                <div className="absolute inset-0 z-[60] flex items-end">
                    {/* Backdrop */}
                    <div 
                        className="absolute inset-0 bg-black/40 backdrop-blur-[2px] pointer-events-auto" 
                        onClick={() => setShowComments(false)}
                    />
                    {/* Comment Sheet */}
                    <div className="relative w-full h-[70%] bg-neutral-900 rounded-t-[2.5rem] flex flex-col shadow-2xl animate-in slide-in-from-bottom duration-300 border-t border-white/10 pointer-events-auto">
                        {/* Drag Handle */}
                        <div className="w-full flex justify-center py-3">
                            <div className="w-10 h-1 rounded-full bg-white/20" />
                        </div>
                        {/* Header */}
                        <div className="flex items-center justify-between px-6 pb-4 border-b border-white/10">
                            <span className="text-white font-bold text-lg">Comments</span>
                            <button 
                                onClick={() => setShowComments(false)}
                                className="p-1 rounded-full hover:bg-white/10 text-white/70"
                            >
                                <X size={24} />
                            </button>
                        </div>
                        {/* Comments List */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-6 no-scrollbar">
                            {[1,2,3,4,5,6].map((i) => (
                                <div key={i} className="flex gap-3">
                                    <div className="h-9 w-9 rounded-full bg-neutral-800 flex-shrink-0">
                                        <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=user${i}`} alt="user" className="h-full w-full rounded-full" />
                                    </div>
                                    <div className="flex flex-col gap-1">
                                        <div className="flex items-center gap-2">
                                            <span className="text-white font-bold text-xs">user_{i}</span>
                                            <span className="text-white/40 text-[10px]">2h</span>
                                        </div>
                                        <p className="text-white/90 text-sm leading-relaxed">This looks absolutely amazing! Where can I find more? 🔥</p>
                                        <button className="text-white/40 text-[10px] font-bold mt-1">Reply</button>
                                    </div>
                                </div>
                            ))}
                        </div>
                        {/* Input Area */}
                        <div className="p-4 border-t border-white/10 bg-neutral-900 pb-8">
                            <div className="flex items-center gap-3 bg-neutral-800 rounded-full px-4 py-2 border border-white/5 shadow-inner">
                                <input 
                                    placeholder="Add a comment..." 
                                    className="flex-1 bg-transparent text-white text-sm outline-none placeholder:text-white/30"
                                />
                                <button className="text-blue-400 font-bold text-sm px-2">Post</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ReelCard;
