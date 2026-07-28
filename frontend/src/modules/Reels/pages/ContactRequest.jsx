import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
    ChevronLeft, Search, PenLine, Send, X, 
    Hand, Star, Flower, Smartphone 
} from 'lucide-react';

const ContactRequest = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    const [phoneNumber, setPhoneNumber] = useState('');

    const stickers = [
        { icon: <Hand size={60} className="text-orange-300" />, label: 'Wave' },
        { icon: <Star size={60} className="text-yellow-400" />, label: 'Star' },
        { icon: <Flower size={60} className="text-orange-500" />, label: 'Flower' },
        { icon: <Smartphone size={60} className="text-purple-500" />, label: 'Phone' }
    ];

    return (
        <div className="flex flex-col h-screen bg-[#0a0514] text-white font-sans overflow-hidden">
            {/* Header */}
            <header className="z-10 flex items-center px-2 py-3 bg-[#0a0514]/80 backdrop-blur-md">
                <button onClick={() => navigate(-1)} className="p-1 hover:bg-white/10 rounded-full transition-colors mr-2">
                    <ChevronLeft size={24} />
                </button>
                <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-full overflow-hidden border border-purple-500/30">
                        <img 
                            src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${id || 'user'}`} 
                            alt="avatar" 
                            className="h-full w-full object-cover" 
                        />
                    </div>
                    <div className="flex flex-col">
                        <span className="font-bold text-sm tracking-wide leading-tight">
                            {id?.replace('_', ' ') || 'CREATOR NAME'}
                        </span>
                        <span className="text-[10px] text-white/50 lowercase">
                            {id || 'username'}
                        </span>
                    </div>
                </div>
            </header>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto no-scrollbar pb-20">
                {/* Profile Large Info */}
                <div className="flex flex-col items-center pt-8 pb-10 px-6 text-center">
                    <div className="h-24 w-24 rounded-full overflow-hidden mb-4 ring-2 ring-purple-500/20">
                        <img 
                            src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${id || 'user'}`} 
                            alt="profile" 
                            className="h-full w-full object-cover" 
                        />
                    </div>
                    <h2 className="text-xl font-bold mb-0.5">{id?.replace('_', ' ') || 'Creator Name'}</h2>
                    <p className="text-sm text-white/60 mb-2">{id || 'username'}</p>
                    <div className="flex gap-2 text-xs text-white/40 mb-4 font-medium">
                        <span>120K followers</span>
                        <span>•</span>
                        <span>220 posts</span>
                    </div>
                    <div className="max-w-[280px] space-y-1">
                        <p className="text-[11px] text-white/50 leading-relaxed">
                            You don't follow each other on Porutkal
                        </p>
                        <p className="text-[11px] text-white/50 leading-relaxed">
                            You both follow style_curator and 12 others
                        </p>
                    </div>
                </div>

                {/* Sticker Section */}
                <div className="border-t border-white/5 py-8">
                    <div className="flex justify-between items-center px-8 mb-6">
                        <span className="text-[11px] font-bold text-white/40 uppercase tracking-widest mx-auto">
                            Say hello by sending a sticker
                        </span>
                        <X size={16} className="text-white/20 absolute right-6" />
                    </div>
                    <div className="grid grid-cols-4 gap-4 px-6">
                        {stickers.map((s, idx) => (
                            <div key={idx} className="aspect-square flex items-center justify-center hover:scale-110 transition-transform cursor-pointer">
                                {s.icon}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Question Section */}
                <div className="px-8 py-10 flex flex-col items-center text-center">
                    <p className="text-[11px] text-white/40 mb-3 font-medium uppercase tracking-widest">
                        Tap to send a question suggested by {id || 'creator'}
                    </p>
                    <p className="text-sm font-medium text-white/90 mb-6 leading-relaxed max-w-[260px]">
                        "Hi, thanks for checking out my account. Let's chat!"
                    </p>
                    <button className="bg-white/10 hover:bg-white/15 transition-colors px-6 py-2.5 rounded-full text-sm font-bold border border-white/5 shadow-lg shadow-black/20">
                        Any
                    </button>
                </div>
            </div>

            {/* Footer Input */}
            <footer className="p-3 bg-[#0a0514] border-t border-white/5">
                <div className="flex items-center gap-3 bg-white/5 rounded-full p-2 px-4 border border-white/10 shadow-inner">
                    <Search size={22} className="text-white/60" />
                    <input 
                        type="text"
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                        placeholder="What is your phone number?"
                        className="flex-1 bg-transparent border-none outline-none text-sm text-white placeholder:text-white/30"
                    />
                    <div className="flex items-center gap-2">
                        <button className="p-2.5 bg-purple-600/20 rounded-full hover:bg-purple-600/30 transition-colors">
                            <PenLine size={18} className="text-purple-400" />
                        </button>
                        <button 
                            className={`p-2.5 rounded-full transition-all ${
                                phoneNumber ? 'bg-purple-600 shadow-lg shadow-purple-600/30 scale-105' : 'bg-white/10 opacity-50'
                            }`}
                        >
                            <Send size={18} className={phoneNumber ? 'text-white' : 'text-white/40'} />
                        </button>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default ContactRequest;
