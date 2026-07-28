import React from 'react';
import { FiAlertCircle, FiX, FiCheck } from 'react-icons/fi';

const ReportedReelCard = ({ reel, onUpdateStatus }) => {
    return (
        <div className="bg-white rounded-3xl border-2 border-red-50 shadow-sm overflow-hidden flex flex-col h-full group hover:shadow-xl transition-all">
            <div className="relative aspect-[9/16] overflow-hidden bg-gray-900">
                <img src={reel.thumbnail} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                <div className="absolute top-4 left-4">
                    <span className="flex items-center gap-1.5 px-3 py-1.5 bg-red-600 text-white rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg animate-pulse">
                        <FiAlertCircle /> Priority Review
                    </span>
                </div>
                <div className="absolute bottom-4 left-4 right-4">
                    <p className="text-white font-black drop-shadow-md text-sm truncate">@{reel.creatorName}</p>
                    <p className="text-white/70 text-[10px] uppercase font-bold tracking-widest mt-0.5">{reel.reportsCount} Reports received</p>
                </div>
            </div>
            <div className="p-4 grid grid-cols-2 gap-2 bg-gray-50/50">
                <button 
                    onClick={() => onUpdateStatus(reel.reelId, 'removed')}
                    className="flex items-center justify-center gap-2 py-3 bg-red-50 text-red-600 rounded-2xl text-xs font-black uppercase tracking-wider hover:bg-red-600 hover:text-white transition-all"
                >
                    <FiX /> Remove
                </button>
                <button 
                    onClick={() => onUpdateStatus(reel.reelId, 'active')}
                    className="flex items-center justify-center gap-2 py-3 bg-white text-gray-500 rounded-2xl text-xs font-black uppercase tracking-wider border border-gray-100 hover:border-green-500 hover:text-green-600 transition-all"
                >
                    <FiCheck /> Ignore
                </button>
            </div>
        </div>
    );
};

export default ReportedReelCard;
