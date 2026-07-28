import React, { useState, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
    ChevronLeft, MoreVertical, Plus, Grid, Clapperboard, 
    UserSquare, Menu, X, ShoppingBag, User, MapPin 
} from 'lucide-react';

const CreatorProfile = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    const fileInputRef = useRef(null);
    const [activeTab, setActiveTab] = useState('grid'); // 'grid', 'reels', 'tags'
    const [showMenu, setShowMenu] = useState(false);
    const [showContactSheet, setShowContactSheet] = useState(false);
    const [showFollowModal, setShowFollowModal] = useState(false);
    const [followModalType, setFollowModalType] = useState('followers'); // 'followers' or 'following'

    const stats = [
        { label: 'Posts', value: '220' },
        { label: 'Followers', value: '120K' },
        { label: 'Following', value: '12K' },
    ];

    const followList = [
        { id: 1, name: 'Aarav Sharma', username: 'aarav_sh', isFollowing: true },
        { id: 2, name: 'Isha Gupta', username: 'isha_g', isFollowing: false },
        { id: 3, name: 'Kabir Singh', username: 'kabir_vibe', isFollowing: true },
        { id: 4, name: 'Meera Reddy', username: 'meera_reddy', isFollowing: false },
        { id: 5, name: 'Rohan Verma', username: 'rohan_v', isFollowing: false },
        { id: 6, name: 'Sanya Malhotra', username: 'sanya_m', isFollowing: true },
    ];

    const highlights = [
        { label: 'News', color: 'bg-gray-200' },
        { label: 'Contest', color: 'bg-gray-200' },
        { label: 'dddi1kk', color: 'bg-gray-200' },
        { label: 'Lorem Ipsum', color: 'bg-gray-200' },
    ];

    const handleFileSelect = (e) => {
        const file = e.target.files?.[0];
        if (file) {
            // Here you would typically handle the upload
            console.log('Selected file for story:', file.name);
            alert(`Selected ${file.name} for upload`);
        }
    };

    const handleStatClick = (label) => {
        if (label === 'Followers' || label === 'Following') {
            navigate(`/followers/${id || '___sakshii.___'}`, { 
                state: { type: label.toLowerCase() } 
            });
        }
    };

    const renderGrid = () => {
        if (activeTab === 'grid') {
            return (
                <div className="grid grid-cols-3 gap-0.5">
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((i) => (
                        <div key={i} className="aspect-square bg-gray-100 relative">
                            {i === 2 && (
                                <div className="absolute top-2 right-2 text-white">
                                    <Grid size={16} className="rotate-45" />
                                </div>
                            )}
                            <img 
                                src={`https://picsum.photos/seed/${i + 10}/300/300`} 
                                alt="post" 
                                className="h-full w-full object-cover" 
                            />
                        </div>
                    ))}
                </div>
            );
        }
        if (activeTab === 'reels') {
            return (
                <div className="grid grid-cols-3 gap-0.5">
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                        <div key={i} className="aspect-[9/16] bg-gray-100 relative overflow-hidden">
                            <div className="absolute bottom-2 left-2 flex items-center gap-1 text-white text-[10px] font-bold">
                                <Clapperboard size={12} />
                                12.4K
                            </div>
                            <img 
                                src={`https://picsum.photos/seed/reel-${i}/300/533`} 
                                alt="reel" 
                                className="h-full w-full object-cover" 
                            />
                        </div>
                    ))}
                </div>
            );
        }
        if (activeTab === 'tags') {
            return (
                <div className="flex flex-col items-center justify-center py-20 px-10 text-center">
                    <div className="h-20 w-20 rounded-full border-2 border-black flex items-center justify-center mb-4">
                        <UserSquare size={40} />
                    </div>
                    <h3 className="text-xl font-bold mb-2">Photos and videos of you</h3>
                    <p className="text-sm text-gray-500">When people tag you in photos and videos, they'll appear here.</p>
                </div>
            );
        }
    };

    return (
        <div className="min-h-screen bg-white text-black font-sans pb-20">
            {/* Hidden File Input */}
            <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept="image/*,video/*" 
                onChange={handleFileSelect}
            />

            {/* Header */}
            <header className="fixed top-0 left-0 right-0 h-14 bg-white border-b border-gray-100 z-50">
                <div className="max-w-[935px] mx-auto h-full flex items-center justify-between px-4 relative">
                    {/* Back Button */}
                    <button onClick={() => navigate(-1)} className="z-10 relative">
                        <ChevronLeft size={28} />
                    </button>

                    {/* Centered Username */}
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <div className="flex items-center gap-1 pointer-events-auto cursor-pointer">
                            <span className="font-bold text-lg md:text-xl truncate max-w-[150px] md:max-w-[300px]">{id || 'UserName'}</span>
                            <ChevronLeft size={14} className="-rotate-90 mt-0.5" />
                        </div>
                    </div>

                    {/* Right Actions */}
                    <div className="flex items-center gap-5 z-10 relative">
                        <button onClick={() => fileInputRef.current?.click()} className="hover:opacity-70 transition-opacity">
                            <Plus className="border-2 border-black rounded-lg p-0.5" size={20} />
                        </button>
                        <button onClick={() => setShowMenu(true)}>
                            <Menu size={24} />
                        </button>
                    </div>
                </div>
            </header>

            <div className="max-w-[935px] mx-auto pt-14">

                {/* Profile Info */}
                <div className="px-4 pt-6 md:pt-10">
                    <div className="flex items-center md:items-start gap-8 md:gap-20 mb-4 md:mb-10">
                        {/* Profile Image */}
                        <div className="relative">
                            <div className="h-20 w-20 md:h-40 md:w-40 rounded-full bg-gray-200 border-2 border-gray-100 overflow-hidden">
                                <img 
                                    src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${id || 'user'}`} 
                                    alt="profile" 
                                    className="h-full w-full object-cover" 
                                />
                            </div>
                            <div 
                                onClick={() => fileInputRef.current?.click()}
                                className="absolute bottom-0 right-0 bg-[#7C3AED] rounded-full border-2 border-white p-1 text-white md:hidden cursor-pointer active:scale-90 transition-all"
                            >
                                <Plus size={14} strokeWidth={3} />
                            </div>
                        </div>

                        {/* Desktop Name & Stats Group */}
                        <div className="flex-1 flex flex-col gap-4">
                            <div className="hidden md:flex items-center gap-5">
                                <h2 className="text-xl font-light">{id || 'UserName'}</h2>
                                <div className="flex gap-2">
                                    <button className="bg-[#7C3AED] text-white px-4 py-1.5 rounded-lg text-sm font-bold active:scale-95 transition-all">Following</button>
                                    <button 
                                        onClick={() => navigate(`/chat/${id || 'style_curator'}`)}
                                        className="bg-gray-100 px-4 py-1.5 rounded-lg text-sm font-bold active:scale-95 transition-all"
                                    >
                                        Message
                                    </button>
                                    <button 
                                        onClick={() => setShowContactSheet(true)}
                                        className="bg-gray-100 px-4 py-1.5 rounded-lg text-sm font-bold active:scale-95 transition-all"
                                    >
                                        Contact
                                    </button>
                                </div>
                            </div>
                            
                            {/* Stats */}
                            <div className="flex justify-between md:justify-start items-center text-center md:text-left gap-0 md:gap-10 mb-0">
                                {stats.map((stat, idx) => (
                                    <div 
                                        key={idx} 
                                        onClick={() => handleStatClick(stat.label)}
                                        className={`flex flex-col md:flex-row md:gap-1 ${stat.label !== 'Posts' ? 'cursor-pointer active:opacity-70' : ''}`}
                                    >
                                        <div className="font-bold text-lg md:text-base leading-tight">{stat.value}</div>
                                        <div className="text-xs md:text-base text-gray-500 md:text-black">{stat.label}</div>
                                    </div>
                                ))}
                            </div>

                            {/* Desktop Bio */}
                            <div className="hidden md:block">
                                <div className="font-bold text-sm mb-1">{id || 'UserName'}</div>
                                <div className="text-sm text-gray-800 leading-tight">
                                    Lorem Ipsum <br />
                                    Lorem Ipsum <br />
                                    <span className="text-[#7C3AED]">Lorem Ipsum</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Mobile Name & Bio */}
                    <div className="mb-6 md:hidden">
                        <div className="font-bold text-sm">{id || 'UserName'}</div>
                        <div className="text-sm text-gray-800 leading-tight">
                            Lorem Ipsum <br />
                            Lorem Ipsum <br />
                            <span className="text-[#7C3AED]">Lorem Ipsum</span>
                        </div>
                    </div>

                    {/* Mobile Action Buttons */}
                    <div className="flex md:hidden gap-2 mb-8">
                        <button className="flex-1 bg-[#7C3AED] text-white rounded-lg py-2 text-sm font-bold shadow-sm active:scale-[0.98] transition-all">
                            Following
                        </button>
                        <button 
                            onClick={() => navigate(`/chat/${id || 'style_curator'}`)}
                            className="flex-1 bg-gray-100 text-black rounded-lg py-2 text-sm font-bold active:scale-[0.98] transition-all"
                        >
                            Message
                        </button>
                        <button 
                            onClick={() => setShowContactSheet(true)}
                            className="flex-1 bg-gray-100 text-black rounded-lg py-2 text-sm font-bold active:scale-[0.98] transition-all"
                        >
                            Contact
                        </button>
                    </div>

                    {/* Highlights */}
                    <div className="flex gap-4 md:gap-10 overflow-x-auto no-scrollbar mb-8 py-1 md:py-4">
                        {highlights.map((h, idx) => (
                            <div key={idx} className="flex flex-col items-center gap-1 md:gap-3 min-w-[70px] md:min-w-[100px]">
                                <div className="h-16 w-16 md:h-20 md:w-20 rounded-full border border-gray-200 p-0.5 md:p-1">
                                    <div className={`h-full w-full rounded-full ${h.color} flex items-center justify-center`} />
                                </div>
                                <span className="text-[10px] md:text-xs font-bold text-gray-800 truncate w-16 md:w-24 text-center">{h.label}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex border-t border-gray-100">
                    <button 
                        onClick={() => setActiveTab('grid')}
                        className={`flex-1 flex justify-center py-3 ${activeTab === 'grid' ? 'border-b-2 border-[#7C3AED] text-[#7C3AED]' : 'text-gray-400'}`}
                    >
                        <Grid size={24} />
                    </button>
                    <button 
                        onClick={() => setActiveTab('reels')}
                        className={`flex-1 flex justify-center py-3 ${activeTab === 'reels' ? 'border-b-2 border-[#7C3AED] text-[#7C3AED]' : 'text-gray-400'}`}
                    >
                        <Clapperboard size={24} />
                    </button>
                    <button 
                        onClick={() => setActiveTab('tags')}
                        className={`flex-1 flex justify-center py-3 ${activeTab === 'tags' ? 'border-b-2 border-[#7C3AED] text-[#7C3AED]' : 'text-gray-400'}`}
                    >
                        <UserSquare size={24} />
                    </button>
                </div>

                {/* Content Area */}
                <div className="md:border-t md:border-gray-200">
                    {renderGrid()}
                </div>
            </div>

            {/* Side Menu Drawer */}
            {showMenu && (
                <div className="fixed inset-0 z-[100] flex justify-end">
                    {/* Backdrop */}
                    <div 
                        className="absolute inset-0 bg-black/40 backdrop-blur-[2px] animate-in fade-in duration-300" 
                        onClick={() => setShowMenu(false)}
                    />
                    {/* Menu Sheet */}
                    <div className="relative w-[75%] max-w-[300px] h-full bg-white shadow-2xl animate-in slide-in-from-right duration-300 flex flex-col">
                        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                            <span className="font-bold text-lg">Settings</span>
                            <button onClick={() => setShowMenu(false)} className="p-1 hover:bg-gray-100 rounded-full transition-colors">
                                <X size={24} />
                            </button>
                        </div>
                        <div className="flex-1 py-2">
                            {[
                                { label: "Creator's Store", icon: <ShoppingBag size={20} />, action: () => navigate(`/store/${id || 'style_curator'}`) },
                                { label: "Contact Info", icon: <User size={20} />, action: () => { setShowContactSheet(true); setShowMenu(false); } },
                                { label: "About Creator", icon: <MapPin size={20} />, action: () => setShowMenu(false) },
                            ].map((item, idx) => (
                                <button 
                                    key={idx}
                                    onClick={() => { item.action(); setShowMenu(false); }}
                                    className="w-full flex items-center gap-4 px-6 py-4 hover:bg-gray-50 transition-all border-b border-gray-50 last:border-0 active:bg-gray-100"
                                >
                                    <div className="text-gray-500 bg-gray-100 p-2 rounded-xl">{item.icon}</div>
                                    <span className="text-[15px] font-semibold text-gray-800">{item.label}</span>
                                </button>
                            ))}
                        </div>
                        <div className="p-6 border-t border-gray-100">
                            <button className="w-full py-3 rounded-xl border border-gray-200 text-sm font-bold text-red-500 hover:bg-red-50 transition-colors">
                                Log Out
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Contact Bottom Sheet */}
            {showContactSheet && (
                <div className="fixed inset-0 z-[110] flex items-end justify-center">
                    {/* Backdrop */}
                    <div 
                        className="absolute inset-0 bg-black/60 backdrop-blur-[2px] animate-in fade-in duration-300" 
                        onClick={() => setShowContactSheet(false)}
                    />
                    {/* Sheet Content */}
                    <div className="relative w-full max-w-[600px] bg-[#1a1a1a] text-white rounded-t-[20px] animate-in slide-in-from-bottom duration-300 overflow-hidden border-t border-white/10 shadow-[0_-10px_40px_rgba(124,58,237,0.15)]">
                        {/* Handle */}
                        <div className="flex justify-center py-3">
                            <div className="w-10 h-1 bg-[#7C3AED] rounded-full shadow-lg shadow-purple-500/40" />
                        </div>
                        
                        {/* Title */}
                        <div className="text-center py-2 border-b border-white/5">
                            <span className="font-bold text-base text-[#7C3AED] tracking-wide">Contact</span>
                        </div>

                        {/* Options */}
                        <div className="flex flex-col">
                            <button 
                                onClick={() => window.location.href = 'mailto:test@porutkal.com'}
                                className="w-full px-6 py-5 text-left hover:bg-white/5 transition-colors border-b border-white/5 active:bg-white/10 group"
                            >
                                <div className="text-[11px] font-bold text-white/40 uppercase tracking-widest mb-1 group-hover:text-[#7C3AED] transition-colors">Email</div>
                                <div className="text-[15px] text-white font-semibold group-hover:translate-x-1 transition-transform">test@porutkal.com</div>
                            </button>
                            <button 
                                onClick={() => navigate(`/contact-request/${id || 'style_curator'}`)}
                                className="w-full px-6 py-5 text-left hover:bg-white/5 transition-colors border-b border-white/5 active:bg-white/10 group"
                            >
                                <div className="text-[11px] font-bold text-white/40 uppercase tracking-widest mb-1 group-hover:text-[#7C3AED] transition-colors">Call</div>
                                <div className="text-[15px] text-white font-semibold group-hover:translate-x-1 transition-transform">Request phone number</div>
                            </button>
                            <button 
                                onClick={() => setShowContactSheet(false)}
                                className="w-full py-6 text-center text-sm font-bold text-white/60 hover:text-white hover:bg-white/5 transition-all active:bg-white/10"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Follow List Modal */}
            {showFollowModal && (
                <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
                    {/* Backdrop */}
                    <div 
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300" 
                        onClick={() => setShowFollowModal(false)}
                    />
                    {/* Modal Content */}
                    <div className="relative w-full max-w-[400px] max-h-[80vh] bg-white rounded-2xl shadow-2xl animate-in zoom-in-95 duration-300 flex flex-col overflow-hidden">
                        {/* Header */}
                        <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                            <div className="w-10" /> {/* Spacer */}
                            <span className="font-bold text-base capitalize">{followModalType}</span>
                            <button onClick={() => setShowFollowModal(false)} className="p-1 hover:bg-gray-100 rounded-full transition-colors">
                                <X size={20} />
                            </button>
                        </div>
                        
                        {/* List */}
                        <div className="flex-1 overflow-y-auto no-scrollbar py-2">
                            {followList.map((user) => (
                                <div key={user.id} className="flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors">
                                    <div className="flex items-center gap-3">
                                        <div className="h-11 w-11 rounded-full overflow-hidden border border-gray-100">
                                            <img 
                                                src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user.username}`} 
                                                alt={user.username} 
                                                className="h-full w-full object-cover"
                                            />
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-sm font-bold leading-tight">{user.username}</span>
                                            <span className="text-xs text-gray-500">{user.name}</span>
                                        </div>
                                    </div>
                                    <button className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                                        user.isFollowing 
                                        ? 'bg-gray-100 text-black hover:bg-gray-200' 
                                        : 'bg-[#7C3AED] text-white hover:bg-[#6D31D1]'
                                    }`}>
                                        {user.isFollowing ? 'Following' : 'Follow'}
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CreatorProfile;
