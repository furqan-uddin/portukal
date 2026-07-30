import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    FiArrowLeft,
    FiStar,
    FiShare2,
    FiShoppingBag,
    FiSend,
    FiX
} from 'react-icons/fi';
import toast from 'react-hot-toast';
import CommissionBadge from '../../../shared/components/CommissionBadge';
import GenerateAffiliateModal from '../components/GenerateAffiliateModal';
import { getMarketplaceProductBySlug } from '../services/influencerMarketplaceService';
import api from '../../../shared/utils/api';
import { getSocket } from '../../../shared/utils/socket';

const MarketplaceProductDetail = () => {
    const { slug } = useParams();
    const navigate = useNavigate();

    const [product, setProduct] = useState(null);
    const [loading, setLoading] = useState(true);
    const [selectedImage, setSelectedImage] = useState('');
    const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);
    const [isDealModalOpen, setIsDealModalOpen] = useState(false);
    const [commissionRate, setCommissionRate] = useState('15');
    const [pitchMessage, setPitchMessage] = useState('');
    const [submittingDeal, setSubmittingDeal] = useState(false);

    const fetchDetail = async () => {
        setLoading(true);
        try {
            const res = await getMarketplaceProductBySlug(slug);
            const data = res?.data || res;
            setProduct(data.product);
            const validImg = (data.product?.images && Array.isArray(data.product.images) && data.product.images.find(i => typeof i === 'string' && i.startsWith('http') && !i.includes('via.placeholder') && !i.includes('80x80'))) || data.product?.image || (data.product?.images && data.product?.images[0]) || '';
            setSelectedImage(validImg);
        } catch (err) {
            toast.error(err?.response?.data?.message || 'Failed to fetch product details.');
            navigate('/influencer/marketplace');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDetail();

        const token = localStorage.getItem('influencer-token') || localStorage.getItem('influencerToken') || localStorage.getItem('token');
        if (!token) return;

        const socket = getSocket(token);
        if (!socket) return;

        const handleCollabUpdate = () => {
            fetchDetail();
        };

        const handleNotification = (payload) => {
            if (payload?.type === 'collaboration' || payload?.type === 'collaboration_request') {
                fetchDetail();
            }
        };

        socket.on('collaboration_updated', handleCollabUpdate);
        socket.on('new_notification', handleNotification);

        return () => {
            socket.off('collaboration_updated', handleCollabUpdate);
            socket.off('new_notification', handleNotification);
        };
    }, [slug]);

    const handleSendDealRequest = async () => {
        if (!product?._id) return;
        setSubmittingDeal(true);
        try {
            await api.post('/influencer/reels/request-collaboration', {
                productId: product._id,
                requestedCommissionPercent: Number(commissionRate) || 15,
                message: pitchMessage.trim() || `I would like to promote ${product.name} to my audience.`,
            });
            toast.success('Promotional deal request sent to vendor successfully!');
            setProduct(prev => ({ ...prev, collabStatus: 'pending' }));
            setIsDealModalOpen(false);
            setPitchMessage('');
        } catch (err) {
            toast.error(err?.response?.data?.message || 'Failed to send deal request.');
        } finally {
            setSubmittingDeal(false);
        }
    };

    if (loading) {
        return <div className="p-12 text-center text-slate-400 text-sm font-semibold">Loading product promotional detail...</div>;
    }

    if (!product) return null;

    const mrp = product.originalPrice || product.price;
    const isDiscounted = mrp > product.price;

    return (
        <div className="p-6 space-y-6 max-w-6xl mx-auto">
            {/* Back Button */}
            <button
                onClick={() => navigate('/influencer/marketplace')}
                className="inline-flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-purple-600 transition-colors"
            >
                <FiArrowLeft className="w-4 h-4" /> Back to Marketplace
            </button>

            {/* Main Product Container */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Left: Image Gallery */}
                <div className="space-y-4">
                    <div className="aspect-square bg-slate-100 rounded-2xl overflow-hidden border border-slate-200">
                        <img
                            src={
                                selectedImage && typeof selectedImage === 'string' && (selectedImage.startsWith('http') || selectedImage.startsWith('data:'))
                                    ? selectedImage
                                    : 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500&auto=format&fit=crop&q=60'
                            }
                            alt={product.name}
                            onError={(e) => {
                                e.target.onerror = null;
                                e.target.src = 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500&auto=format&fit=crop&q=60';
                            }}
                            className="w-full h-full object-cover"
                        />
                    </div>

                    {product.images && product.images.length > 1 && (
                        <div className="flex items-center gap-3 overflow-x-auto pb-2">
                            {product.images.map((img, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => setSelectedImage(img)}
                                    className={`w-16 h-16 rounded-xl overflow-hidden border-2 transition-all flex-shrink-0 ${
                                        selectedImage === img ? 'border-purple-600 ring-2 ring-purple-100' : 'border-slate-200'
                                    }`}
                                >
                                    <img
                                        src={img && typeof img === 'string' && img.startsWith('http') ? img : 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500&auto=format&fit=crop&q=60'}
                                        alt=""
                                        onError={(e) => {
                                            e.target.onerror = null;
                                            e.target.src = 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500&auto=format&fit=crop&q=60';
                                        }}
                                        className="w-full h-full object-cover"
                                    />
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Right: Info & Actions */}
                <div className="space-y-6">
                    <div>
                        <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 mb-1">
                            <span>{product.brandId?.name || 'Brand'}</span>
                            <span>•</span>
                            <span className="text-purple-600 font-bold">{product.categoryId?.name}</span>
                        </div>
                        <h1 className="text-2xl font-bold text-slate-900 leading-snug">{product.name}</h1>
                    </div>

                    {/* Rating & Vendor Card */}
                    <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl flex flex-wrap items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full border border-slate-200 overflow-hidden bg-slate-200 shrink-0">
                                {product.vendorId?.storeLogo || product.vendor?.storeLogo ? (
                                    <img src={product.vendorId?.storeLogo || product.vendor?.storeLogo} alt="Vendor" className="w-full h-full object-cover" />
                                ) : (
                                    <img src={`https://api.dicebear.com/7.x/shapes/svg?seed=${product.vendorId?.storeName || product.vendor?.storeName || 'seller'}`} alt="Vendor" className="w-full h-full" />
                                )}
                            </div>
                            <div>
                                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900">
                                    <FiShoppingBag className="text-purple-600" />
                                    <span>{product.vendorId?.storeName || product.vendor?.storeName || 'Porutkal Seller'}</span>
                                    {product.vendorId?.isVerified !== false && (
                                        <span className="text-purple-600 bg-purple-100 text-[10px] px-1.5 py-0.2 rounded-full font-extrabold">✓ Verified</span>
                                    )}
                                </div>
                                <div className="flex items-center gap-1.5 text-[11px] text-slate-500 font-medium mt-0.5">
                                    <span className="flex items-center text-amber-600 font-bold">
                                        <FiStar className="w-3 h-3 fill-amber-500 text-amber-500 mr-0.5" />
                                        {product.vendorId?.rating || product.rating || '4.9'}
                                    </span>
                                    <span>• Official Marketplace Vendor</span>
                                </div>
                            </div>
                        </div>

                        {/* Visit Storefront Button */}
                        <button
                            onClick={() => {
                                const vendorTarget = product.vendorId?.storefrontId?.slug || product.vendorId?._id || product.vendor?._id;
                                if (vendorTarget) navigate(`/store/${vendorTarget}`);
                            }}
                            className="px-3.5 py-1.5 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all shadow-sm flex items-center gap-1"
                        >
                            Visit Storefront 🛍️
                        </button>
                    </div>

                    {/* Price & Commission Card */}
                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                        <div className="flex items-baseline gap-3">
                            <span className="text-3xl font-black text-slate-900">₹{product.price?.toLocaleString()}</span>
                            {isDiscounted && (
                                <span className="text-sm text-slate-400 line-through">₹{mrp.toLocaleString()}</span>
                            )}
                            {isDiscounted && (
                                <span className="text-xs font-extrabold text-rose-600 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                                    SAVE {Math.round(((mrp - product.price) / mrp) * 100)}%
                                </span>
                            )}
                        </div>

                        {/* Large Commission Badge */}
                        <CommissionBadge
                            commissionPercent={product.commissionPercent}
                            estimatedEarnings={product.estimatedEarnings}
                            size="lg"
                        />
                    </div>

                    {/* Action Buttons Row */}
                    {product.collabStatus === 'accepted' ? (
                        <div className="flex gap-3">
                            <button
                                onClick={() => setIsLinkModalOpen(true)}
                                className="flex-1 py-3.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-extrabold text-xs flex items-center justify-center gap-2 shadow-md transition-all active:scale-[0.98]"
                            >
                                <FiShare2 className="w-4 h-4" /> Generate Affiliate Link
                            </button>
                            <div className="px-4 py-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 font-extrabold text-xs flex items-center justify-center gap-1.5">
                                Deal Approved ✓
                            </div>
                        </div>
                    ) : product.collabStatus === 'pending' ? (
                        <div className="w-full py-3.5 rounded-xl bg-amber-50 border border-amber-300 text-amber-800 font-extrabold text-xs flex items-center justify-center gap-2">
                            Deal Request Pending Vendor Approval ⏳
                        </div>
                    ) : (
                        <button
                            onClick={() => setIsDealModalOpen(true)}
                            className="w-full py-3.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-extrabold text-xs flex items-center justify-center gap-2 shadow-md transition-all active:scale-[0.98]"
                        >
                            <FiSend className="w-4 h-4" /> Request Deal / Promotion
                        </button>
                    )}

                    {/* Description & Specifications */}
                    <div className="space-y-4 pt-4 border-t border-slate-100 text-xs">
                        <div>
                            <h3 className="font-bold text-slate-900 text-sm mb-1">Product Description</h3>
                            <p className="text-slate-600 leading-relaxed">{product.description || 'No description available.'}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Generate Link Modal */}
            {isLinkModalOpen && (
                <GenerateAffiliateModal
                    product={product}
                    onClose={() => setIsLinkModalOpen(false)}
                />
            )}

            {/* Request Deal Modal */}
            {isDealModalOpen && (
                <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl border border-slate-200 space-y-4">
                        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                            <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
                                <FiSend className="text-purple-600" /> Request Deal with Vendor
                            </h3>
                            <button onClick={() => setIsDealModalOpen(false)} className="p-1 text-slate-400 hover:text-slate-600 rounded-lg">
                                <FiX size={18} />
                            </button>
                        </div>

                        <div className="bg-purple-50 p-3 rounded-xl border border-purple-100 text-xs text-purple-900">
                            <strong>Vendor:</strong> {product.vendorId?.storeName || 'Porutkal Seller'}<br />
                            <strong>Product:</strong> {product.name} (₹{product.price})
                        </div>

                        <div className="space-y-3 text-xs">
                            <div>
                                <label className="block font-bold text-slate-700 mb-1">Requested Commission Rate (%)</label>
                                <input
                                    type="number"
                                    min="1"
                                    max="50"
                                    value={commissionRate}
                                    onChange={(e) => setCommissionRate(e.target.value)}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-900 font-semibold focus:border-purple-600 outline-none"
                                />
                            </div>

                            <div>
                                <label className="block font-bold text-slate-700 mb-1">Pitch Note / Deal Proposal</label>
                                <textarea
                                    rows="3"
                                    value={pitchMessage}
                                    onChange={(e) => setPitchMessage(e.target.value)}
                                    placeholder="Explain your promotion plan, target audience, or request sample products..."
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-900 focus:border-purple-600 outline-none resize-none"
                                />
                            </div>
                        </div>

                        <div className="flex gap-2 pt-2">
                            <button
                                onClick={() => setIsDealModalOpen(false)}
                                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-bold text-xs hover:bg-slate-50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSendDealRequest}
                                disabled={submittingDeal}
                                className="flex-1 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs transition-all shadow-md"
                            >
                                {submittingDeal ? 'Sending...' : 'Send Request'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MarketplaceProductDetail;
