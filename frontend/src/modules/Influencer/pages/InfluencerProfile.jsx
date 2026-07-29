import { useState, useEffect } from 'react';
import {
    FiUser,
    FiMail,
    FiPhone,
    FiGlobe,
    FiInstagram,
    FiYoutube,
    FiCreditCard,
    FiCheck,
    FiCopy,
    FiSave,
    FiShield,
    FiTag,
    FiMapPin,
    FiDollarSign,
    FiAward,
} from 'react-icons/fi';
import toast from 'react-hot-toast';
import { getInfluencerProfile, updateInfluencerProfile } from '../services/influencerAuthService';
import { useInfluencerAuthStore } from '../store/influencerAuthStore';

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

const InfluencerProfile = () => {
    const { influencer: storeInfluencer, setAuth } = useInfluencerAuthStore();
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [activeTab, setActiveTab] = useState('general');
    const [copied, setCopied] = useState(false);

    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        category: '',
        bio: '',
        location: '',
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

    const fetchProfile = async () => {
        setLoading(true);
        try {
            const res = await getInfluencerProfile();
            const data = res?.data || res;
            setProfile(data);
            setFormData({
                name: data.name || '',
                phone: data.phone || '',
                category: data.category || '',
                bio: data.bio || '',
                location: data.location || '',
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
        } catch (err) {
            toast.error(err?.response?.data?.message || 'Failed to fetch profile details.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProfile();
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

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            const res = await updateInfluencerProfile(formData);
            const updated = res?.data || res;
            toast.success('Profile updated successfully!');
            setProfile(updated);
            if (storeInfluencer) {
                setAuth({ ...storeInfluencer, ...updated });
            }
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
            <div className="space-y-6 animate-pulse">
                <div className="bg-white p-6 rounded-2xl border border-slate-200 h-40" />
                <div className="bg-white p-6 rounded-2xl border border-slate-200 h-96" />
            </div>
        );
    }

    const isApproved = profile?.status === 'approved';

    return (
        <div className="space-y-6">
            {/* Profile Header Banner Card */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                <div className="flex items-center gap-5">
                    {/* Avatar */}
                    <div className="relative">
                        {profile?.profileImage ? (
                            <img
                                src={profile.profileImage}
                                alt={profile.name}
                                className="w-20 h-20 rounded-2xl object-cover border-2 border-purple-600 shadow-md"
                            />
                        ) : (
                            <div className="w-20 h-20 rounded-2xl bg-purple-600 text-white flex items-center justify-center font-bold text-2xl shadow-md shadow-purple-500/20">
                                {profile?.name ? profile.name.charAt(0).toUpperCase() : 'I'}
                            </div>
                        )}
                        <span className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-emerald-500 border-2 border-white" />
                    </div>

                    {/* Profile Details */}
                    <div>
                        <div className="flex items-center gap-3 flex-wrap">
                            <h1 className="text-2xl font-bold text-slate-900">{profile?.name}</h1>
                            <span className={`text-xs font-bold px-3 py-0.5 rounded-full border ${isApproved ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200'}`}>
                                {isApproved ? 'Verified Creator' : profile?.status ? profile.status.toUpperCase() : 'PENDING'}
                            </span>
                        </div>
                        <p className="text-sm font-mono text-purple-600 mt-0.5">@{profile?.slug || 'handle'}</p>
                        <p className="text-xs text-slate-500 mt-1 flex items-center gap-2">
                            <FiMail size={13} /> {profile?.email}
                            <span className="text-slate-300">•</span>
                            <FiAward size={13} className="text-purple-600" /> Member since {new Date(profile?.createdAt).toLocaleDateString()}
                        </p>
                    </div>
                </div>

                {/* Referral Code Box */}
                {profile?.referralCode && (
                    <div className="bg-purple-50 border border-purple-200/80 rounded-2xl p-4 w-full md:w-auto min-w-[220px]">
                        <p className="text-xs font-semibold text-purple-700 uppercase tracking-wider mb-1">Your Referral Code</p>
                        <div className="flex items-center justify-between gap-3 bg-white p-2 px-3 rounded-xl border border-purple-200">
                            <span className="font-mono font-bold text-slate-900 text-sm">{profile.referralCode}</span>
                            <button
                                onClick={copyReferralCode}
                                className="p-1.5 rounded-lg hover:bg-purple-50 text-purple-600 transition-colors"
                                title="Copy Code"
                            >
                                {copied ? <FiCheck size={16} className="text-emerald-600" /> : <FiCopy size={16} />}
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Navigation Tabs */}
            <div className="bg-white p-2 rounded-2xl border border-slate-200/80 shadow-sm flex gap-2 overflow-x-auto no-scrollbar">
                {[
                    { id: 'general', label: 'General Info', icon: FiUser },
                    { id: 'socials', label: 'Social Accounts', icon: FiGlobe },
                    { id: 'payouts', label: 'Bank & Payouts', icon: FiCreditCard },
                ].map((tab) => {
                    const Icon = tab.icon;
                    return (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                                activeTab === tab.id
                                    ? 'bg-purple-600 text-white shadow-sm'
                                    : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                            }`}
                        >
                            <Icon size={14} /> {tab.label}
                        </button>
                    );
                })}
            </div>

            {/* Form Section */}
            <form onSubmit={handleSubmit} className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-6">
                {/* Tab 1: General Info */}
                {activeTab === 'general' && (
                    <div className="space-y-4">
                        <h3 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
                            <FiUser className="text-purple-600" /> Personal & Contact Details
                        </h3>

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
                {activeTab === 'socials' && (
                    <div className="space-y-4">
                        <h3 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
                            <FiGlobe className="text-purple-600" /> Social Media Links &amp; Followers
                        </h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                                    <FiInstagram className="text-pink-600" /> Instagram Profile Link
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
                                    <FiYoutube className="text-red-600" /> YouTube Channel Link
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

                {/* Tab 3: Payouts */}
                {activeTab === 'payouts' && (
                    <div className="space-y-4">
                        <h3 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
                            <FiCreditCard className="text-purple-600" /> Bank &amp; Payout Settings
                        </h3>
                        <p className="text-xs text-slate-500">Your affiliate commission earnings will be transferred to these details upon withdrawal.</p>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
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

                {/* Submit button */}
                <div className="flex justify-end pt-4 border-t border-slate-100">
                    <button
                        type="submit"
                        disabled={saving}
                        className="bg-purple-600 hover:bg-purple-700 text-white font-semibold text-xs px-6 py-2.5 rounded-xl transition-all shadow-sm flex items-center gap-2 disabled:opacity-60"
                    >
                        <FiSave size={14} /> {saving ? 'Saving Changes...' : 'Save Profile'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default InfluencerProfile;
