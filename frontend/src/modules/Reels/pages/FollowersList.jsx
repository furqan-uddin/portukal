import React, { useState } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { ChevronLeft, UserPlus, MoreVertical, ArrowUpDown, X } from 'lucide-react';

const FollowersList = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    const location = useLocation();
    const [activeTab, setActiveTab] = useState(location.state?.type || 'following');

    const followersData = [
        { id: 1, username: 'theabhi__21', name: '', posts: '' },
        { id: 2, username: 'priyank__4uu', name: 'Priyank Patel', posts: '' },
        { id: 3, username: '_sagar__chouhan', name: 'Sagar Chouhan', posts: '' },
        { id: 4, username: 'prateek.yadav06', name: 'प्रतीक यदुवंशी ❤️', posts: '' },
        { id: 5, username: 'vickyy_maratha', name: 'VICKY 🖤', posts: '', hasStory: true },
        { id: 6, username: 'shashwatgupta16675', name: 'Shashwat Gupta', posts: '' },
        { id: 7, username: '_deep_panwar_2611', name: 'दीपक सिंह पंवार', posts: '' },
        { id: 8, username: 'sachin_dwivedi_807', name: 'dubey__(❤️)💌', posts: '' },
        { id: 9, username: 'sisodiya_42', name: 'Payal Sisodiya', posts: '' },
    ];

    const followingData = [
        { id: 1, username: '_creative_cast', name: 'CREATIVE CAST 🎬', posts: '1 new post' },
        { id: 2, username: 'pinkythakur011', name: 'Pinky Thakur', posts: '1 new post' },
        { id: 3, username: '__singh_nikhil', name: 'Nikhil Singh', posts: '1 new post' },
        { id: 4, username: '_anu__tiwari_', name: 'Anu 💫', posts: '1 new post' },
        { id: 5, username: 'mishra_jii2.9', name: 'Mishra Ji', posts: '2 new posts' },
        { id: 6, username: 'sanjanaa_146', name: 'Sanjana Patel', posts: '' },
        { id: 7, username: '__isha_267', name: 'Isha ♡', posts: '' },
        { id: 8, username: 'mayank__16__', name: 'MAYANK YADAV', posts: '' },
        { id: 9, username: '_jat_sahab29_', name: '~Ronakjat', posts: '' },
    ];

    const currentData = activeTab === 'followers' ? followersData : followingData;

    const tabs = [
        { id: 'followers', label: '197 Followers' },
        { id: 'following', label: '261 Following' },
    ];

    return (
        <div className="flex flex-col h-screen bg-white text-black font-sans overflow-hidden">
            {/* Header */}
            <header className="z-10 bg-white border-b border-gray-100">
                <div className="max-w-[600px] mx-auto px-4 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-6">
                        <button onClick={() => navigate(-1)} className="hover:opacity-70 transition-opacity">
                            <ChevronLeft size={28} />
                        </button>
                        <span className="font-bold text-lg tracking-tight">{id || '___sakshii.___'}</span>
                    </div>
                    <button className="hover:opacity-70 transition-opacity">
                        <UserPlus size={24} />
                    </button>
                </div>
            </header>

            {/* Tabs */}
            <div className="border-b border-gray-100 bg-white">
                <div className="max-w-[600px] mx-auto flex">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex-1 py-4 text-[13px] font-bold transition-all relative ${
                                activeTab === tab.id ? 'text-black' : 'text-gray-400'
                            }`}
                        >
                            {tab.label}
                            {activeTab === tab.id && (
                                <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#7C3AED]" />
                            )}
                        </button>
                    ))}
                </div>
            </div>

            {/* Content Title */}
            {activeTab === 'followers' && (
                <div className="max-w-[600px] mx-auto w-full px-4 py-4">
                    <h3 className="text-[15px] font-bold text-gray-800">All followers</h3>
                </div>
            )}

            {/* User List */}
            <div className="flex-1 overflow-y-auto no-scrollbar pb-10">
                <div className="max-w-[600px] mx-auto px-4">
                    {currentData.map((user) => (
                        <div key={user.id} className="flex items-center justify-between py-4 group border-b border-gray-50 last:border-0">
                            <div className="flex items-center gap-4">
                                <div className="relative">
                                    <div className={`h-14 w-14 rounded-full p-[2px] ${user.hasStory ? 'bg-gradient-to-tr from-yellow-400 to-fuchsia-600' : 'border border-gray-100'}`}>
                                        <div className="h-full w-full rounded-full overflow-hidden border-2 border-white bg-white">
                                            <img 
                                                src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user.username}`} 
                                                alt="avatar" 
                                                className="h-full w-full object-cover" 
                                            />
                                        </div>
                                    </div>
                                    {user.posts && (
                                        <div className="absolute -top-1 -right-1 h-3.5 w-3.5 bg-[#7C3AED] rounded-full border-2 border-white shadow-sm" />
                                    )}
                                </div>
                                <div className="flex flex-col">
                                    <span className="font-bold text-[14px] tracking-tight">{user.username}</span>
                                    <span className="text-[13px] text-gray-500 leading-tight">{user.name}</span>
                                    {user.posts && (
                                        <div className="flex items-center gap-1.5 mt-0.5">
                                            <span className="text-[12px] text-gray-400">{user.posts}</span>
                                            <div className="h-1.5 w-1.5 bg-[#7C3AED] rounded-full" />
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <button 
                                    onClick={() => navigate(`/chat/${user.username}`)}
                                    className="bg-gray-100 hover:bg-gray-200 text-black px-6 py-2 rounded-lg text-[13px] font-bold transition-all active:scale-95 border border-gray-100"
                                >
                                    Message
                                </button>
                                {activeTab === 'followers' && (
                                    <button className="p-1 text-gray-400 hover:text-red-500 transition-colors">
                                        <X size={20} />
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default FollowersList;
