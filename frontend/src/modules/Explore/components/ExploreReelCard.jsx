import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Play, Heart } from 'lucide-react';

const ExploreReelCard = ({ reel }) => {
    const navigate = useNavigate();

    return (
        <div 
            onClick={() => navigate('/reels')}
            className="relative aspect-[9/16] rounded-2xl overflow-hidden bg-gray-100 group cursor-pointer border border-gray-100 shadow-sm"
        >
            <video
                src={reel.thumbnail}
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                muted
                loop
                playsInline
                autoPlay
                preload="metadata"
            />
            
            {/* Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            
            {/* Stats */}
            <div className="absolute bottom-3 left-3 flex items-center gap-3 text-white">
                <div className="flex items-center gap-1 text-[10px] font-bold">
                    <Play size={12} fill="currentColor" />
                    {reel.views}
                </div>
                <div className="flex items-center gap-1 text-[10px] font-bold">
                    <Heart size={12} fill="currentColor" />
                    {reel.likes}
                </div>
            </div>
        </div>
    );
};

export default ExploreReelCard;
