import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    ChevronLeft,
    Plus,
    Grid,
    Clapperboard,
    UserSquare,
    Menu,
    X,
    Heart,
    MapPin,
    Package,
    Check,
    Mail,
    Phone,
    Copy,
    Save,
    CreditCard,
    Globe,
    Award,
    Sparkles,
    Camera,
    Edit3,
    Share2,
    LogOut,
    ExternalLink,
    Instagram,
    Youtube,
    User,
    DollarSign,
    ShieldAlert
} from 'lucide-react';
import toast from 'react-hot-toast';
import { getInfluencerProfile, updateInfluencerProfile } from '../services/influencerAuthService';
import { useInfluencerAuthStore } from '../store/influencerAuthStore';
import api from '../../../shared/utils/api';

const CATEGORIES = [
    'Fashion & Apparel',
    'Beauty & Personal Care',
    'Electronics & Tech',
    'Home & Living',
    'Health & Fitness',
    'Food & Culinary',
    'Travel & Lifestyle',
    'Jewelry & Accessories',
    'Parenting & Kids',
    'Other',
];

// Fallback high-quality curated feed images matching target layout (ocean, street, stairs, sky, phone, motel, beach, canyon, plant)
const SAMPLE_POSTS = [
    { id: 1, image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600&auto=format&fit=crop&q=80', title: 'Coastal Waves', likes: '1.2K' },
    { id: 2, image: 'https://images.unsplash.com/photo-1477959858617-67f30ac4ce78?w=600&auto=format&fit=crop&q=80', title: 'City Streets', likes: '3.4K' },
    { id: 3, image: 'https://images.unsplash.com/photo-1519681393784-d120267933ba?w=600&auto=format&fit=crop&q=80', title: 'Stairway to Haven', likes: '890' },
    { id: 4, image: 'https://images.unsplash.com/photo-1470240731273-7821a6eeb6bd?w=600&auto=format&fit=crop&q=80', title: 'Night Barn Sky', likes: '2.1K' },
    { id: 5, image: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=600&auto=format&fit=crop&q=80', title: 'Smart Tech Review', likes: '5.6K' },
    { id: 6, image: 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=600&auto=format&fit=crop&q=80', title: 'Vintage Motel Sign', likes: '1.8K' },
    { id: 7, image: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=600&auto=format&fit=crop&q=80', title: 'Lifeguard Beach', likes: '4.2K' },
    { id: 8, image: 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=600&auto=format&fit=crop&q=80', title: 'Misty Canyon', likes: '3.1K' },
    { id: 9, image: 'https://images.unsplash.com/photo-1448375240586-882707db888b?w=600&auto=format&fit=crop&q=80', title: 'Green Forest Moss', likes: '2.7K' },
];

const InfluencerProfile = () => {
    const navigate = useNavigate();
    const { influencer: storeInfluencer, setAuth, logout } = useInfluencerAuthStore();
    const fileInputRef = useRef(null);

    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [activeTab, setActiveTab] = useState('grid'); // 'grid' | 'reels' | 'tags'
    const [copied, setCopied] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [editFormTab, setEditFormTab] = useState('general'); // 'general' | 'socials' | 'payouts'
    const [showMenu, setShowMenu] = useState(false);
    const [showContactSheet, setShowContactSheet] = useState(false);
    const [showReferralModal, setShowReferralModal] = useState(false);
    const [reelsList, setReelsList] = useState([]);

    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        category: '',
        bio: '',
        location: '',
        profileImage: '',
        socials: {
            instagram: '',
            youtube: '',
            tiktok: '',
            website: '',
        },
        followersCount: {
            instagram: 0,
            youtube: 0,
            tiktok: 0,
        },
        bankDetails: {
            accountHolderName: '',
            bankName: '',
            accountNumber: '',
            ifscCode: '',
            upiId: '',
            paypalEmail: '',
        },
    });

    // Fetch profile and influencer-specific reels for Reels tab
    useEffect(() => {
        let isMounted = true;
        const loadProfileAndReels = async () => {
            setLoading(true);
            try {
                const res = await getInfluencerProfile();
                const data = res?.data || res;
                if (isMounted) {
                    setProfile(data);
                    setFormData({
                        name: data.name || '',
                        phone: data.phone || '',
                        category: data.category || '',
                        bio: data.bio || '',
                        location: data.location || '',
                        profileImage: data.profileImage || '',
                        socials: {
                            instagram: data.socials?.instagram || '',
                            youtube: data.socials?.youtube || '',
                            tiktok: data.socials?.tiktok || '',
                            website: data.socials?.website || '',
                        },
                        followersCount: {
                            instagram: data.followersCount?.instagram || 0,
                            youtube: data.followersCount?.youtube || 0,
                            tiktok: data.followersCount?.tiktok || 0,
                        },
                        bankDetails: {
                            accountHolderName: data.bankDetails?.accountHolderName || '',
                            bankName: data.bankDetails?.bankName || '',
                            accountNumber: data.bankDetails?.accountNumber || '',
                            ifscCode: data.bankDetails?.ifscCode || '',
                            upiId: data.bankDetails?.upiId || '',
                            paypalEmail: data.bankDetails?.paypalEmail || '',
                        },
                    });
                }

                // Fetch reels specifically for this logged-in influencer
                if (data?._id) {
                    try {
                        const reelsRes = await api.get('/reels/feed', { params: { limit: 12, influencerId: data._id, status: 'all' } });
                        const list = reelsRes.reels || reelsRes.data?.reels || [];
                        if (isMounted) setReelsList(list);
                    } catch {
                        if (isMounted) setReelsList([]);
                    }
                }
            } catch (err) {
                toast.error(err?.response?.data?.message || 'Failed to fetch profile details.');
            } finally {
                if (isMounted) setLoading(false);
            }
        };
        loadProfileAndReels();
        return () => { isMounted = false; };
    }, []);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleNestedChange = (parent, field, value) => {
        setFormData((prev) => ({
            ...prev,
            [parent]: {
                ...prev[parent],
                [field]: value,
            },
        }));
    };

    const handleFileSelect = (e) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setFormData((prev) => ({ ...prev, profileImage: reader.result }));
                toast.success('Avatar image selected! Click Save Profile to apply.');
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = async (e) => {
        e?.preventDefault();
        setSaving(true);
        try {
            const res = await updateInfluencerProfile(formData);
            const updated = res?.data || res;
            toast.success('Profile updated successfully!');
            setProfile(updated);
            if (storeInfluencer) {
                setAuth({ ...storeInfluencer, ...updated });
            }
            setShowEditModal(false);
        } catch (err) {
            toast.error(err?.response?.data?.message || 'Failed to update profile.');
        } finally {
            setSaving(false);
        }
    };

    const copyReferralCode = () => {
        if (profile?.referralCode) {
            navigator.clipboard.writeText(profile.referralCode);
            setCopied(true);
            toast.success('Referral code copied!');
            setTimeout(() => setCopied(false), 2000);
        }
    };

    if (loading) {
        return (
            <div className="max-w-[935px] mx-auto space-y-6 animate-pulse p-4">
                <div className="bg-white p-6 rounded-2xl border border-slate-200 h-40" />
                <div className="bg-white p-6 rounded-2xl border border-slate-200 h-96" />
            </div>
        );
    }

    const isApproved = profile?.status === 'approved';
    const rawHandle = profile?.slug || profile?.name?.toLowerCase().replace(/\s+/g, '_') || 'influencer_profile';
    const formattedHandle = rawHandle.startsWith('@') ? rawHandle.slice(1) : rawHandle;
    const displayName = profile?.name || 'Influencer Profile';
    const totalFollowersFormatted = (formData.followersCount.instagram || 10500) >= 1000 
        ? `${((formData.followersCount.instagram || 10500) / 1000).toFixed(1)}K` 
        : (formData.followersCount.instagram || '10.5K');

    return (
        <div className="min-h-screen bg-white text-slate-900 font-sans pb-20 rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
            {/* Hidden File Input for Avatar / Story */}
            <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept="image/*" 
                onChange={handleFileSelect}
            />

            {/* Header Navigation Bar */}
            <header className="sticky top-0 left-0 right-0 h-14 bg-white/95 backdrop-blur-md border-b border-slate-100 z-40">
                <div className="max-w-[935px] mx-auto h-full flex items-center justify-between px-4 relative">
                    {/* Back Button */}
                    <button 
                        onClick={() => navigate('/influencer/dashboard')} 
                        className="p-1 hover:bg-slate-100 rounded-full transition-colors z-10 text-slate-700"
                        title="Back to Dashboard"
                    >
                        <ChevronLeft size={24} />
                    </button>

                    {/* Centered Username with Dropdown Chevron */}
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <div 
                            onClick={() => setShowEditModal(true)} 
                            className="flex items-center gap-1 pointer-events-auto cursor-pointer group"
                        >
                            <span className="font-bold text-base md:text-lg text-slate-900 truncate max-w-[200px]">
                                {formattedHandle}
                            </span>
                            <ChevronLeft size={14} className="-rotate-90 text-slate-500 group-hover:text-purple-600 transition-colors mt-0.5" />
                        </div>
                    </div>

                    {/* Right Action Icons: Add & Menu */}
                    <div className="flex items-center gap-3 z-10">
                        <button 
                            onClick={() => fileInputRef.current?.click()} 
                            className="p-1.5 hover:bg-slate-100 rounded-full transition-colors text-slate-800"
                            title="Add Story / Avatar"
                        >
                            <Plus size={22} />
                        </button>
                        <button 
                            onClick={() => setShowMenu(true)}
                            className="p-1.5 hover:bg-slate-100 rounded-full transition-colors text-slate-800"
                            title="Options Menu"
                        >
                            <Menu size={24} />
                        </button>
                    </div>
                </div>
            </header>

            {/* Main Instagram Profile Card Container */}
            <div className="max-w-[935px] mx-auto">
                <div className="px-4 pt-6 md:pt-8">
                    {/* Profile Banner Row */}
                    <div className="flex flex-col md:flex-row md:items-start gap-6 md:gap-12 mb-6">
                        {/* Profile Circular Image with Purple '+' Badge */}
                        <div className="flex justify-center md:justify-start">
                            <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                                <div className="h-24 w-24 md:h-36 md:w-36 rounded-full bg-purple-50 border-2 border-purple-200 overflow-hidden shadow-md group-hover:opacity-90 transition-opacity">
                                    {formData.profileImage || profile?.profileImage ? (
                                        <img 
                                            src={formData.profileImage || profile.profileImage} 
                                            alt={displayName} 
                                            className="h-full w-full object-cover" 
                                        />
                                    ) : (
                                        <div className="h-full w-full bg-gradient-to-tr from-purple-600 to-indigo-600 text-white flex items-center justify-center text-3xl font-extrabold">
                                            {displayName.charAt(0).toUpperCase()}
                                        </div>
                                    )}
                                </div>
                                <button 
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        fileInputRef.current?.click();
                                    }}
                                    className="absolute bottom-1 right-1 bg-purple-600 hover:bg-purple-700 rounded-full border-2 border-white p-1.5 text-white shadow-md transition-transform active:scale-90"
                                    title="Upload Photo"
                                >
                                    <Plus size={14} strokeWidth={3} />
                                </button>
                            </div>
                        </div>

                        {/* Profile Info, Action Buttons & Counter Stats */}
                        <div className="flex-1 space-y-4 text-center md:text-left">
                            {/* Display Name & Buttons */}
                            <div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
                                <h2 className="text-xl md:text-2xl font-semibold text-slate-900">{displayName}</h2>
                                {isApproved && (
                                    <span className="text-[11px] font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                                        Verified Creator
                                    </span>
                                )}
                                <div className="flex items-center gap-2 flex-wrap w-full md:w-auto justify-center">
                                    <button 
                                        onClick={() => setShowEditModal(true)}
                                        className="px-5 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm active:scale-95 flex items-center gap-1.5"
                                    >
                                        <Edit3 size={14} /> Edit Profile
                                    </button>
                                    <button 
                                        onClick={() => setShowContactSheet(true)}
                                        className="px-4 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition-all active:scale-95"
                                    >
                                        Contact
                                    </button>
                                    {profile?.referralCode && (
                                        <button 
                                            onClick={() => setShowReferralModal(true)}
                                            className="px-3 py-1.5 bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 rounded-xl text-xs font-bold transition-all active:scale-95 flex items-center gap-1"
                                            title="View Referral Code"
                                        >
                                            <Share2 size={13} /> Referral Code
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* Stats Row */}
                            <div className="flex items-center justify-around md:justify-start md:gap-10 py-2 border-y border-slate-100 md:border-none">
                                <div className="text-center md:text-left">
                                    <span className="font-extrabold text-base md:text-lg text-slate-900">{reelsList.length} </span>
                                    <span className="text-xs md:text-sm text-slate-600 font-medium">Reels</span>
                                </div>
                                <div className="text-center md:text-left">
                                    <span className="font-extrabold text-base md:text-lg text-slate-900">{totalFollowersFormatted} </span>
                                    <span className="text-xs md:text-sm text-slate-600 font-medium">Followers</span>
                                </div>
                                <div className="text-center md:text-left">
                                    <span className="font-extrabold text-base md:text-lg text-slate-900">482 </span>
                                    <span className="text-xs md:text-sm text-slate-600 font-medium">Following</span>
                                </div>
                            </div>

                            {/* Bio / Profile Overview */}
                            <div className="space-y-1 text-xs md:text-sm text-slate-700">
                                <div className="font-bold text-slate-900">{displayName}</div>
                                <p className="text-slate-500 font-mono text-xs">{profile?.email || 'influencer@example.com'}</p>
                                {profile?.category && (
                                    <p className="text-purple-600 font-semibold text-xs">✨ {profile.category}</p>
                                )}
                                <p className="text-slate-600 leading-relaxed max-w-lg">
                                    {formData.bio || 'Official Creator & Brand Ambassador on Porutkal Marketplace ✨'}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Quick Feature Action Circles Row (Orders, Wishlist / Affiliate, Addresses / Bank) */}
                    <div className="flex items-center justify-start gap-6 overflow-x-auto no-scrollbar py-4 mb-4 border-b border-slate-100">
                        {/* Orders / Deal Requests Circle */}
                        <div 
                            onClick={() => navigate('/influencer/deal-requests')}
                            className="flex flex-col items-center gap-1.5 cursor-pointer group shrink-0"
                        >
                            <div className="w-14 h-14 rounded-full bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-700 group-hover:scale-105 transition-transform shadow-sm">
                                <Package size={22} />
                            </div>
                            <span className="text-[11px] font-bold text-slate-700">Orders</span>
                        </div>

                        {/* Wishlist / Affiliate Links Circle */}
                        <div 
                            onClick={() => navigate('/influencer/affiliate-links')}
                            className="flex flex-col items-center gap-1.5 cursor-pointer group shrink-0"
                        >
                            <div className="w-14 h-14 rounded-full bg-pink-50 border border-pink-200 flex items-center justify-center text-pink-700 group-hover:scale-105 transition-transform shadow-sm">
                                <Heart size={22} />
                            </div>
                            <span className="text-[11px] font-bold text-slate-700">Wishlist</span>
                        </div>

                        {/* Payouts / Bank Details Circle */}
                        <div 
                            onClick={() => {
                                setEditFormTab('payouts');
                                setShowEditModal(true);
                            }}
                            className="flex flex-col items-center gap-1.5 cursor-pointer group shrink-0"
                        >
                            <div className="w-14 h-14 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700 group-hover:scale-105 transition-transform shadow-sm">
                                <MapPin size={22} />
                            </div>
                            <span className="text-[11px] font-bold text-slate-700">Addresses</span>
                        </div>

                        {/* Commission Wallet Circle */}
                        <div 
                            onClick={() => navigate('/influencer/wallet')}
                            className="flex flex-col items-center gap-1.5 cursor-pointer group shrink-0"
                        >
                            <div className="w-14 h-14 rounded-full bg-purple-50 border border-purple-200 flex items-center justify-center text-purple-700 group-hover:scale-105 transition-transform shadow-sm">
                                <CreditCard size={22} />
                            </div>
                            <span className="text-[11px] font-bold text-slate-700">Wallet</span>
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
                                key={reel._id || idx} 
                                onClick={() => navigate('/influencer/reels')}
                                className="aspect-[9/16] bg-slate-900 overflow-hidden relative group cursor-pointer rounded-xl border border-slate-800"
                            >
                                <img 
                                    src={reel.thumbnailUrl || reel.image || `https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500&auto=format&fit=crop&q=80`} 
                                    alt="Reel" 
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" 
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent flex items-end p-2.5">
                                    <span className="text-white text-[11px] font-extrabold flex items-center gap-1 drop-shadow">
                                        <Clapperboard size={12} /> {reel.viewsCount || '1.4K'}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Edit Profile Full Modal / Drawer */}
            {showEditModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div 
                        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" 
                        onClick={() => setShowEditModal(false)}
                    />
                    <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden z-10 border border-slate-200 flex flex-col max-h-[90vh]">
                        {/* Modal Header */}
                        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                            <div>
                                <h3 className="font-bold text-base text-slate-900">Edit Influencer Profile</h3>
                                <p className="text-xs text-slate-500">Update your details, social channels, and bank payout settings</p>
                            </div>
                            <button 
                                onClick={() => setShowEditModal(false)} 
                                className="p-1.5 hover:bg-slate-200 rounded-full text-slate-500 transition-colors"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Modal Navigation Tabs */}
                        <div className="flex border-b border-slate-100 bg-slate-50 px-6 gap-2 pt-2">
                            {[
                                { id: 'general', label: 'General Info', icon: User },
                                { id: 'socials', label: 'Social Accounts', icon: Globe },
                                { id: 'payouts', label: 'Bank & Payouts', icon: CreditCard },
                            ].map((tab) => {
                                const Icon = tab.icon;
                                return (
                                    <button
                                        key={tab.id}
                                        onClick={() => setEditFormTab(tab.id)}
                                        className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl text-xs font-bold transition-all border-b-2 ${
                                            editFormTab === tab.id
                                                ? 'bg-white text-purple-600 border-purple-600 shadow-sm'
                                                : 'text-slate-500 hover:text-slate-800 border-transparent'
                                        }`}
                                    >
                                        <Icon size={14} /> {tab.label}
                                    </button>
                                );
                            })}
                        </div>

                        {/* Modal Body Form */}
                        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 flex-1">
                            {/* Avatar Upload Preview */}
                            <div className="flex items-center gap-4 p-3 bg-purple-50/60 rounded-2xl border border-purple-100 mb-4">
                                <div className="relative">
                                    <div className="w-16 h-16 rounded-full bg-purple-200 overflow-hidden border-2 border-purple-600">
                                        {formData.profileImage ? (
                                            <img src={formData.profileImage} alt="Preview" className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full bg-purple-600 text-white flex items-center justify-center font-bold text-xl">
                                                {formData.name ? formData.name.charAt(0).toUpperCase() : 'I'}
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <div>
                                    <button 
                                        type="button" 
                                        onClick={() => fileInputRef.current?.click()}
                                        className="px-3 py-1.5 bg-purple-600 text-white rounded-lg text-xs font-bold hover:bg-purple-700 transition-colors shadow-sm flex items-center gap-1.5"
                                    >
                                        <Camera size={14} /> Change Photo
                                    </button>
                                    <p className="text-[11px] text-slate-500 mt-1">Recommended: Square JPG or PNG, max 2MB</p>
                                </div>
                            </div>

                            {/* Tab 1: General Info */}
                            {editFormTab === 'general' && (
                                <div className="space-y-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-xs font-bold text-slate-700 mb-1 block">Full Name *</label>
                                            <input
                                                type="text"
                                                name="name"
                                                value={formData.name}
                                                onChange={handleChange}
                                                required
                                                className="w-full bg-slate-50 border border-slate-200 focus:border-purple-600 focus:bg-white text-slate-900 rounded-xl px-4 py-2.5 text-sm outline-none transition-all"
                                            />
                                        </div>

                                        <div>
                                            <label className="text-xs font-bold text-slate-700 mb-1 block">Email Address (Read Only)</label>
                                            <input
                                                type="email"
                                                value={profile?.email || ''}
                                                disabled
                                                className="w-full bg-slate-100 border border-slate-200 text-slate-500 rounded-xl px-4 py-2.5 text-sm outline-none cursor-not-allowed"
                                            />
                                        </div>

                                        <div>
                                            <label className="text-xs font-bold text-slate-700 mb-1 block">Phone Number</label>
                                            <input
                                                type="text"
                                                name="phone"
                                                value={formData.phone}
                                                onChange={handleChange}
                                                placeholder="+91 9876543210"
                                                className="w-full bg-slate-50 border border-slate-200 focus:border-purple-600 focus:bg-white text-slate-900 rounded-xl px-4 py-2.5 text-sm outline-none transition-all"
                                            />
                                        </div>

                                        <div>
                                            <label className="text-xs font-bold text-slate-700 mb-1 block">Primary Niche / Category</label>
                                            <select
                                                name="category"
                                                value={formData.category}
                                                onChange={handleChange}
                                                className="w-full bg-slate-50 border border-slate-200 focus:border-purple-600 focus:bg-white text-slate-900 rounded-xl px-3.5 py-2.5 text-sm outline-none transition-all"
                                            >
                                                <option value="">Select your main niche</option>
                                                {CATEGORIES.map((cat) => (
                                                    <option key={cat} value={cat}>{cat}</option>
                                                ))}
                                            </select>
                                        </div>

                                        <div>
                                            <label className="text-xs font-bold text-slate-700 mb-1 block">Location / City</label>
                                            <input
                                                type="text"
                                                name="location"
                                                value={formData.location}
                                                onChange={handleChange}
                                                placeholder="Mumbai, India"
                                                className="w-full bg-slate-50 border border-slate-200 focus:border-purple-600 focus:bg-white text-slate-900 rounded-xl px-4 py-2.5 text-sm outline-none transition-all"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="text-xs font-bold text-slate-700 mb-1 block">Bio / Profile Overview</label>
                                        <textarea
                                            name="bio"
                                            rows={3}
                                            value={formData.bio}
                                            onChange={handleChange}
                                            placeholder="Short introduction about yourself and your content focus..."
                                            className="w-full bg-slate-50 border border-slate-200 focus:border-purple-600 focus:bg-white text-slate-900 rounded-xl p-3 text-sm outline-none resize-none transition-all"
                                        />
                                    </div>
                                </div>
                            )}

                            {/* Tab 2: Social Accounts */}
                            {editFormTab === 'socials' && (
                                <div className="space-y-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                                                <Instagram size={14} className="text-pink-600" /> Instagram Profile Link
                                            </label>
                                            <input
                                                type="text"
                                                value={formData.socials.instagram}
                                                onChange={(e) => handleNestedChange('socials', 'instagram', e.target.value)}
                                                placeholder="https://instagram.com/username"
                                                className="w-full bg-slate-50 border border-slate-200 focus:border-purple-600 focus:bg-white text-slate-900 rounded-xl px-4 py-2.5 text-sm outline-none transition-all"
                                            />
                                        </div>

                                        <div>
                                            <label className="text-xs font-bold text-slate-700 mb-1 block">Instagram Followers Count</label>
                                            <input
                                                type="number"
                                                value={formData.followersCount.instagram}
                                                onChange={(e) => handleNestedChange('followersCount', 'instagram', Number(e.target.value))}
                                                placeholder="e.g. 50000"
                                                className="w-full bg-slate-50 border border-slate-200 focus:border-purple-600 focus:bg-white text-slate-900 rounded-xl px-4 py-2.5 text-sm outline-none transition-all"
                                            />
                                        </div>

                                        <div>
                                            <label className="text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                                                <Youtube size={14} className="text-red-600" /> YouTube Channel Link
                                            </label>
                                            <input
                                                type="text"
                                                value={formData.socials.youtube}
                                                onChange={(e) => handleNestedChange('socials', 'youtube', e.target.value)}
                                                placeholder="https://youtube.com/@channel"
                                                className="w-full bg-slate-50 border border-slate-200 focus:border-purple-600 focus:bg-white text-slate-900 rounded-xl px-4 py-2.5 text-sm outline-none transition-all"
                                            />
                                        </div>

                                        <div>
                                            <label className="text-xs font-bold text-slate-700 mb-1 block">YouTube Subscribers Count</label>
                                            <input
                                                type="number"
                                                value={formData.followersCount.youtube}
                                                onChange={(e) => handleNestedChange('followersCount', 'youtube', Number(e.target.value))}
                                                placeholder="e.g. 100000"
                                                className="w-full bg-slate-50 border border-slate-200 focus:border-purple-600 focus:bg-white text-slate-900 rounded-xl px-4 py-2.5 text-sm outline-none transition-all"
                                            />
                                        </div>

                                        <div>
                                            <label className="text-xs font-bold text-slate-700 mb-1 block">TikTok / Shorts Handle</label>
                                            <input
                                                type="text"
                                                value={formData.socials.tiktok}
                                                onChange={(e) => handleNestedChange('socials', 'tiktok', e.target.value)}
                                                placeholder="https://tiktok.com/@username"
                                                className="w-full bg-slate-50 border border-slate-200 focus:border-purple-600 focus:bg-white text-slate-900 rounded-xl px-4 py-2.5 text-sm outline-none transition-all"
                                            />
                                        </div>

                                        <div>
                                            <label className="text-xs font-bold text-slate-700 mb-1 block">Personal Website / Blog</label>
                                            <input
                                                type="text"
                                                value={formData.socials.website}
                                                onChange={(e) => handleNestedChange('socials', 'website', e.target.value)}
                                                placeholder="https://myblog.com"
                                                className="w-full bg-slate-50 border border-slate-200 focus:border-purple-600 focus:bg-white text-slate-900 rounded-xl px-4 py-2.5 text-sm outline-none transition-all"
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Tab 3: Bank & Payouts */}
                            {editFormTab === 'payouts' && (
                                <div className="space-y-4">
                                    <p className="text-xs text-slate-500 bg-slate-50 p-3 rounded-xl border border-slate-100">
                                        Your affiliate commission earnings will be transferred to these details upon withdrawal.
                                    </p>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                                        <div>
                                            <label className="text-xs font-bold text-slate-700 mb-1 block">Account Holder Name</label>
                                            <input
                                                type="text"
                                                value={formData.bankDetails.accountHolderName}
                                                onChange={(e) => handleNestedChange('bankDetails', 'accountHolderName', e.target.value)}
                                                placeholder="Full name on bank account"
                                                className="w-full bg-slate-50 border border-slate-200 focus:border-purple-600 focus:bg-white text-slate-900 rounded-xl px-4 py-2.5 text-sm outline-none transition-all"
                                            />
                                        </div>

                                        <div>
                                            <label className="text-xs font-bold text-slate-700 mb-1 block">Bank Name</label>
                                            <input
                                                type="text"
                                                value={formData.bankDetails.bankName}
                                                onChange={(e) => handleNestedChange('bankDetails', 'bankName', e.target.value)}
                                                placeholder="e.g. HDFC Bank, ICICI Bank"
                                                className="w-full bg-slate-50 border border-slate-200 focus:border-purple-600 focus:bg-white text-slate-900 rounded-xl px-4 py-2.5 text-sm outline-none transition-all"
                                            />
                                        </div>

                                        <div>
                                            <label className="text-xs font-bold text-slate-700 mb-1 block">Account Number</label>
                                            <input
                                                type="text"
                                                value={formData.bankDetails.accountNumber}
                                                onChange={(e) => handleNestedChange('bankDetails', 'accountNumber', e.target.value)}
                                                placeholder="XXXXXXXXXXXX"
                                                className="w-full bg-slate-50 border border-slate-200 focus:border-purple-600 focus:bg-white text-slate-900 rounded-xl px-4 py-2.5 text-sm outline-none transition-all"
                                            />
                                        </div>

                                        <div>
                                            <label className="text-xs font-bold text-slate-700 mb-1 block">IFSC / SWIFT Code</label>
                                            <input
                                                type="text"
                                                value={formData.bankDetails.ifscCode}
                                                onChange={(e) => handleNestedChange('bankDetails', 'ifscCode', e.target.value)}
                                                placeholder="HDFC0001234"
                                                className="w-full bg-slate-50 border border-slate-200 focus:border-purple-600 focus:bg-white text-slate-900 rounded-xl px-4 py-2.5 text-sm outline-none transition-all"
                                            />
                                        </div>

                                        <div>
                                            <label className="text-xs font-bold text-slate-700 mb-1 block">UPI ID (Optional)</label>
                                            <input
                                                type="text"
                                                value={formData.bankDetails.upiId}
                                                onChange={(e) => handleNestedChange('bankDetails', 'upiId', e.target.value)}
                                                placeholder="name@upi"
                                                className="w-full bg-slate-50 border border-slate-200 focus:border-purple-600 focus:bg-white text-slate-900 rounded-xl px-4 py-2.5 text-sm outline-none transition-all"
                                            />
                                        </div>

                                        <div>
                                            <label className="text-xs font-bold text-slate-700 mb-1 block">PayPal Email (Optional)</label>
                                            <input
                                                type="email"
                                                value={formData.bankDetails.paypalEmail}
                                                onChange={(e) => handleNestedChange('bankDetails', 'paypalEmail', e.target.value)}
                                                placeholder="paypal@domain.com"
                                                className="w-full bg-slate-50 border border-slate-200 focus:border-purple-600 focus:bg-white text-slate-900 rounded-xl px-4 py-2.5 text-sm outline-none transition-all"
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Submit & Close Buttons */}
                            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 mt-4">
                                <button
                                    type="button"
                                    onClick={() => setShowEditModal(false)}
                                    className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-bold text-xs hover:bg-slate-50 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs px-6 py-2.5 rounded-xl transition-all shadow-md flex items-center gap-2 disabled:opacity-60"
                                >
                                    <Save size={14} /> {saving ? 'Saving Changes...' : 'Save Profile'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Side Options Menu Drawer (≡) */}
            {showMenu && (
                <div className="fixed inset-0 z-[100] flex justify-end">
                    <div 
                        className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" 
                        onClick={() => setShowMenu(false)}
                    />
                    <div className="relative w-4/5 max-w-xs h-full bg-white shadow-2xl flex flex-col z-10 border-l border-slate-200">
                        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
                            <span className="font-bold text-base text-slate-900">Creator Settings</span>
                            <button onClick={() => setShowMenu(false)} className="p-1 hover:bg-slate-100 rounded-full text-slate-600">
                                <X size={20} />
                            </button>
                        </div>
                        <div className="flex-1 p-3 space-y-1 overflow-y-auto">
                            <button 
                                onClick={() => { setShowMenu(false); setShowEditModal(true); }}
                                className="w-full text-left px-4 py-3 text-xs font-bold text-slate-700 hover:bg-purple-50 hover:text-purple-700 rounded-xl transition-all flex items-center gap-2.5"
                            >
                                <Edit3 size={16} /> Edit Profile & Info
                            </button>
                            <button 
                                onClick={() => { setShowMenu(false); setEditFormTab('payouts'); setShowEditModal(true); }}
                                className="w-full text-left px-4 py-3 text-xs font-bold text-slate-700 hover:bg-purple-50 hover:text-purple-700 rounded-xl transition-all flex items-center gap-2.5"
                            >
                                <CreditCard size={16} /> Bank & Payout Settings
                            </button>
                            <button 
                                onClick={() => { setShowMenu(false); setShowReferralModal(true); }}
                                className="w-full text-left px-4 py-3 text-xs font-bold text-slate-700 hover:bg-purple-50 hover:text-purple-700 rounded-xl transition-all flex items-center gap-2.5"
                            >
                                <Share2 size={16} /> Referral Code & Link
                            </button>
                            <button 
                                onClick={() => { setShowMenu(false); navigate('/influencer/reels'); }}
                                className="w-full text-left px-4 py-3 text-xs font-bold text-slate-700 hover:bg-purple-50 hover:text-purple-700 rounded-xl transition-all flex items-center gap-2.5"
                            >
                                <Clapperboard size={16} /> Explore Reels Marketplace
                            </button>
                            <button 
                                onClick={() => { setShowMenu(false); setShowContactSheet(true); }}
                                className="w-full text-left px-4 py-3 text-xs font-bold text-slate-700 hover:bg-purple-50 hover:text-purple-700 rounded-xl transition-all flex items-center gap-2.5"
                            >
                                <Mail size={16} /> Contact Support
                            </button>

                            <div className="pt-4 border-t border-slate-100">
                                <button 
                                    onClick={() => {
                                        setShowMenu(false);
                                        logout();
                                        navigate('/influencer');
                                    }}
                                    className="w-full text-left px-4 py-3 text-xs font-bold text-red-600 hover:bg-red-50 rounded-xl transition-all flex items-center gap-2.5"
                                >
                                    <LogOut size={16} /> Log Out
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Contact Bottom Sheet */}
            {showContactSheet && (
                <div className="fixed inset-0 z-[110] flex items-end justify-center">
                    <div 
                        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" 
                        onClick={() => setShowContactSheet(false)}
                    />
                    <div className="relative w-full max-w-lg bg-slate-900 text-white rounded-t-3xl p-6 z-10 shadow-2xl border-t border-slate-800 space-y-4">
                        <div className="flex justify-between items-center pb-3 border-b border-slate-800">
                            <h3 className="font-bold text-base text-purple-400">Contact Creator</h3>
                            <button onClick={() => setShowContactSheet(false)} className="text-slate-400 hover:text-white"><X size={20} /></button>
                        </div>
                        <div className="space-y-3">
                            <a 
                                href={`mailto:${profile?.email || 'test@example.com'}`} 
                                className="flex items-center gap-3 p-3 bg-slate-800 rounded-xl hover:bg-slate-700 transition-colors text-xs font-semibold"
                            >
                                <Mail size={16} className="text-purple-400" /> {profile?.email || 'influencer@example.com'}
                            </a>
                            {profile?.phone && (
                                <a 
                                    href={`tel:${profile.phone}`} 
                                    className="flex items-center gap-3 p-3 bg-slate-800 rounded-xl hover:bg-slate-700 transition-colors text-xs font-semibold"
                                >
                                    <Phone size={16} className="text-purple-400" /> {profile.phone}
                                </a>
                            )}
                            <button 
                                onClick={() => { toast.success('Callback request submitted!'); setShowContactSheet(false); }}
                                className="w-full flex items-center justify-center gap-2 p-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold shadow-md transition-all"
                            >
                                <Phone size={16} /> Request Direct Callback
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Referral Code Modal */}
            {showReferralModal && (
                <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
                    <div 
                        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" 
                        onClick={() => setShowReferralModal(false)}
                    />
                    <div className="relative w-full max-w-sm bg-white rounded-3xl p-6 z-10 shadow-2xl border border-slate-200 text-center space-y-4">
                        <div className="w-12 h-12 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center mx-auto">
                            <Sparkles size={24} />
                        </div>
                        <h3 className="font-bold text-lg text-slate-900">Your Referral Code</h3>
                        <p className="text-xs text-slate-500">Share this code with buyers or followers to earn affiliate commissions on every sale!</p>
                        
                        <div className="bg-purple-50 border border-purple-200 rounded-2xl p-4 flex items-center justify-between gap-2">
                            <span className="font-mono font-extrabold text-purple-900 text-lg">{profile?.referralCode || 'INF12345'}</span>
                            <button
                                onClick={copyReferralCode}
                                className="p-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white transition-colors flex items-center gap-1.5 text-xs font-bold shadow-sm"
                            >
                                {copied ? <Check size={16} /> : <Copy size={16} />}
                                {copied ? 'Copied' : 'Copy'}
                            </button>
                        </div>

                        <button 
                            onClick={() => setShowReferralModal(false)}
                            className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors"
                        >
                            Close
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default InfluencerProfile;
