import React, { useState } from 'react';
import { Heart, Send, MessageCircle, ShoppingCart, MoreHorizontal, Music, Bookmark, Flag } from 'lucide-react';

const ReelActions = ({ reel, onLike, onShare, onSave, onReport, onComment, onCartClick }) => {
    const [showMore, setShowMore] = useState(false);

    return (
        <div className="flex flex-col items-center gap-5 text-white">
            {/* Cart Option */}
            <button 
                className="flex flex-col items-center group"
                onClick={onCartClick}
            >
                <ShoppingCart size={28} strokeWidth={2.5} className="drop-shadow-lg" />
            </button>

            {/* Like */}
            <button
                onClick={() => onLike(reel.id)}
                className="flex flex-col items-center group"
            >
                <Heart 
                    size={30} 
                    fill={reel.isLiked ? "currentColor" : "none"} 
                    strokeWidth={2.5} 
                    className={`${reel.isLiked ? 'text-red-500' : 'text-white'} drop-shadow-lg`}
                />
                <span className="text-[10px] font-bold drop-shadow-md">{reel.likes.toLocaleString()}</span>
            </button>

            {/* Comment */}
            <button 
                onClick={onComment}
                className="flex flex-col items-center group"
            >
                <MessageCircle size={30} strokeWidth={2.5} className="drop-shadow-lg" />
                <span className="text-[10px] font-bold drop-shadow-md">3,822</span>
            </button>

            {/* Share (Plane Icon) */}
            <button
                onClick={() => onShare(reel.id)}
                className="flex flex-col items-center group"
            >
                <Send size={30} strokeWidth={2.5} className="drop-shadow-lg -rotate-12 mb-1" />
                <span className="text-[10px] font-bold drop-shadow-md">4,524</span>
            </button>

            {/* More Options (3 Dots) */}
            <div className="relative">
                <button 
                    onClick={() => setShowMore(!showMore)}
                    className="flex flex-col items-center group"
                >
                    <MoreHorizontal size={30} strokeWidth={2.5} className="drop-shadow-lg" />
                </button>

                {showMore && (
                    <div className="absolute right-full mr-4 bottom-0 bg-black/80 backdrop-blur-xl rounded-2xl p-2 flex flex-col gap-1 border border-white/20 shadow-2xl min-w-[140px] z-50 text-white">
                        <button 
                            onClick={() => { onSave(reel.id); setShowMore(false); }}
                            className="flex items-center gap-3 px-4 py-2.5 hover:bg-white/10 rounded-xl transition-colors text-sm font-medium"
                        >
                            <Bookmark size={18} /> Save Reel
                        </button>
                        <div className="h-px bg-white/10 mx-2" />
                        <button 
                            onClick={() => { onReport(reel.id); setShowMore(false); }}
                            className="flex items-center gap-3 px-4 py-2.5 hover:bg-white/10 rounded-xl transition-colors text-sm font-medium text-red-400"
                        >
                            <Flag size={18} /> Report
                        </button>
                    </div>
                )}
            </div>

            {/* Audio Icon */}
            <button className="flex flex-col items-center group mt-2">
                <Music size={24} strokeWidth={2.5} className="drop-shadow-lg" />
            </button>
        </div>
    );
};

export default ReelActions;
