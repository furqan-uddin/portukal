import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    FiClock,
    FiCheckCircle,
    FiXCircle,
    FiShare2,
    FiVideo,
    FiShoppingBag,
    FiSearch,
    FiFilter,
    FiArrowRight
} from 'react-icons/fi';
import toast from 'react-hot-toast';
import api from '../../../shared/utils/api';
import GenerateAffiliateModal from '../components/GenerateAffiliateModal';
import { getSocket } from '../../../shared/utils/socket';

const RequestedProducts = () => {
    const navigate = useNavigate();
    const [dealRequests, setDealRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'pending' | 'accepted' | 'declined'
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedProductForLink, setSelectedProductForLink] = useState(null);

    const fetchRequests = async () => {
        setLoading(true);
        try {
            const res = await api.get('/influencer/deal-requests');
            const data = res?.data || res;
            const list = data.dealRequests || data.data?.dealRequests || [];
            setDealRequests(list);
        } catch {
            toast.error('Failed to load deal requests.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRequests();

        const token = localStorage.getItem('influencer-token') || localStorage.getItem('influencerToken') || localStorage.getItem('token');
        if (!token) return;

        const socket = getSocket(token);
        if (!socket) return;

        const handleUpdate = () => fetchRequests();

        socket.on('collaboration_updated', handleUpdate);
        socket.on('new_notification', handleUpdate);

        return () => {
            socket.off('collaboration_updated', handleUpdate);
            socket.off('new_notification', handleUpdate);
        };
    }, []);

    const filteredRequests = useMemo(() => {
        return dealRequests.filter((item) => {
            const status = item.status === 'pending' ? 'requested' : item.status;
            if (statusFilter !== 'all') {
                if (statusFilter === 'pending' && status !== 'requested' && status !== 'pending') return false;
                if (statusFilter === 'accepted' && status !== 'accepted') return false;
                if (statusFilter === 'declined' && status !== 'declined' && status !== 'rejected') return false;
            }
            if (searchQuery.trim()) {
                const q = searchQuery.toLowerCase();
                const pName = item.productId?.name?.toLowerCase() || '';
                const vName = item.vendorId?.storeName?.toLowerCase() || '';
                return pName.includes(q) || vName.includes(q);
            }
            return true;
        });
    }, [dealRequests, statusFilter, searchQuery]);

    const getStatusBadge = (status) => {
        const s = status === 'pending' ? 'requested' : status;
        switch (s) {
            case 'accepted':
                return (
                    <span className="inline-flex items-center gap-1 text-xs font-black text-emerald-700 bg-emerald-100 border border-emerald-200 px-2.5 py-1 rounded-full">
                        <FiCheckCircle size={13} /> Approved ✓
                    </span>
                );
            case 'declined':
            case 'rejected':
                return (
                    <span className="inline-flex items-center gap-1 text-xs font-black text-rose-700 bg-rose-100 border border-rose-200 px-2.5 py-1 rounded-full">
                        <FiXCircle size={13} /> Declined ✕
                    </span>
                );
            default:
                return (
                    <span className="inline-flex items-center gap-1 text-xs font-black text-amber-700 bg-amber-100 border border-amber-200 px-2.5 py-1 rounded-full">
                        <FiClock size={13} /> Pending Approval ⏳
                    </span>
                );
        }
    };

    return (
        <div className="p-6 space-y-6 max-w-7xl mx-auto">
            {/* Header */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2.5">
                        <FiShoppingBag className="text-purple-600" /> Requested Product Deals
                    </h1>
                    <p className="text-xs text-slate-500 mt-1">
                        Track all product promotion requests sent to vendors and manage approved affiliate deals.
                    </p>
                </div>

                <button
                    onClick={() => navigate('/influencer/marketplace')}
                    className="px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-extrabold text-xs rounded-xl shadow-sm transition-all flex items-center gap-2 shrink-0"
                >
                    Browse Marketplace <FiArrowRight size={14} />
                </button>
            </div>

            {/* Filter Tabs & Search Bar */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
                    {[
                        { key: 'all', label: 'All Requests' },
                        { key: 'pending', label: 'Pending Approval ⏳' },
                        { key: 'accepted', label: 'Approved ✓' },
                        { key: 'declined', label: 'Declined ✕' },
                    ].map((tab) => (
                        <button
                            key={tab.key}
                            onClick={() => setStatusFilter(tab.key)}
                            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                                statusFilter === tab.key
                                    ? 'bg-purple-600 text-white shadow-sm'
                                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                            }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                <div className="relative min-w-[240px]">
                    <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search product or store..."
                        className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-purple-500 font-medium"
                    />
                </div>
            </div>

            {/* Product Request Cards Grid */}
            {loading ? (
                <div className="p-12 text-center text-slate-400 text-sm font-semibold">Loading your requested deals...</div>
            ) : filteredRequests.length === 0 ? (
                <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-3">
                    <FiShoppingBag className="mx-auto text-4xl text-slate-300" />
                    <h3 className="text-base font-bold text-slate-800">No requested product deals found</h3>
                    <p className="text-xs text-slate-500 max-w-md mx-auto">
                        You haven't requested any promotional product deals under this view yet.
                    </p>
                    <button
                        onClick={() => navigate('/influencer/marketplace')}
                        className="mt-2 px-4 py-2 bg-purple-600 text-white font-extrabold text-xs rounded-xl shadow-sm hover:bg-purple-700 transition-all inline-flex items-center gap-1.5"
                    >
                        Explore Marketplace <FiArrowRight />
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredRequests.map((item) => {
                        const prod = item.productId || {};
                        const vendor = item.vendorId || {};
                        const status = item.status === 'pending' ? 'requested' : item.status;
                        const commRate = item.offeredCommissionPercent || item.offer?.commissionPercent || 10;
                        const price = prod.price || 0;
                        const estEarnings = Math.round((price * commRate) / 100);
                        const image = prod.image || (prod.images && prod.images[0]) || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=300';

                        return (
                            <div
                                key={item._id}
                                className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col hover:border-purple-200 transition-all"
                            >
                                {/* Card Top Image Banner */}
                                <div className="relative aspect-video bg-slate-100 overflow-hidden border-b border-slate-100">
                                    <img
                                        src={image}
                                        alt={prod.name || 'Product'}
                                        className="w-full h-full object-cover"
                                        onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=300'; }}
                                    />
                                    <div className="absolute top-3 right-3">
                                        {getStatusBadge(status)}
                                    </div>
                                    <div className="absolute bottom-3 left-3 bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-lg text-white text-[11px] font-bold">
                                        Commission: {commRate}%
                                    </div>
                                </div>

                                {/* Card Body */}
                                <div className="p-4 space-y-3 flex-1 flex flex-col justify-between">
                                    <div>
                                        <div className="flex items-center gap-1.5 text-[11px] text-slate-500 font-semibold mb-1">
                                            <FiShoppingBag className="text-purple-600" />
                                            <span>{vendor.storeName || 'Vendor Store'}</span>
                                        </div>
                                        <h3 className="font-bold text-slate-900 text-sm line-clamp-1">{prod.name || 'Product Item'}</h3>

                                        <div className="flex items-baseline gap-2 mt-2">
                                            <span className="text-lg font-black text-slate-900">₹{price.toLocaleString()}</span>
                                            <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                                                Est. Payout: ₹{estEarnings} / sale
                                            </span>
                                        </div>
                                    </div>

                                    {/* Action Footer Buttons */}
                                    <div className="pt-3 border-t border-slate-100 flex items-center gap-2">
                                        {status === 'accepted' ? (
                                            <>
                                                <button
                                                    onClick={() => setSelectedProductForLink(prod)}
                                                    className="flex-1 py-2 bg-purple-600 hover:bg-purple-700 text-white font-extrabold text-xs rounded-xl transition-all shadow-sm flex items-center justify-center gap-1"
                                                >
                                                    <FiShare2 size={13} /> Affiliate Link
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        const pId = prod._id || prod.id;
                                                        if (pId) {
                                                            navigate(`/influencer/reels?productId=${pId}&autoUpload=true`);
                                                        } else {
                                                            navigate('/influencer/reels');
                                                        }
                                                    }}
                                                    className="py-2 px-3 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 font-bold text-xs rounded-xl transition-all flex items-center gap-1 shrink-0"
                                                >
                                                    <FiVideo size={13} /> Upload Reel
                                                </button>

                                            </>
                                        ) : (
                                            <button
                                                onClick={() => {
                                                    const pSlug = prod.slug || prod._id;
                                                    if (pSlug) navigate(`/influencer/product/${pSlug}`);
                                                }}
                                                className="w-full py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-1.5"
                                            >
                                                View Product Details <FiArrowRight size={13} />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Generate Link Modal */}
            {selectedProductForLink && (
                <GenerateAffiliateModal
                    product={selectedProductForLink}
                    onClose={() => setSelectedProductForLink(null)}
                />
            )}
        </div>
    );
};

export default RequestedProducts;
