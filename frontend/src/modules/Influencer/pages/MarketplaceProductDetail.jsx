import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    FiArrowLeft,
    FiStar,
    FiShare2,
    FiCheckCircle,
    FiShoppingBag,
    FiShield,
    FiTag,
} from 'react-icons/fi';
import toast from 'react-hot-toast';
import CommissionBadge from '../../../shared/components/CommissionBadge';
import GenerateAffiliateModal from '../components/GenerateAffiliateModal';
import { getMarketplaceProductBySlug } from '../services/influencerMarketplaceService';

const MarketplaceProductDetail = () => {
    const { slug } = useParams();
    const navigate = useNavigate();

    const [product, setProduct] = useState(null);
    const [relatedProducts, setRelatedProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedImage, setSelectedImage] = useState('');
    const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);

    const fetchDetail = async () => {
        setLoading(true);
        try {
            const res = await getMarketplaceProductBySlug(slug);
            const data = res?.data || res;
            setProduct(data.product);
            setRelatedProducts(data.relatedProducts || []);
            setSelectedImage(data.product?.image || (data.product?.images && data.product?.images[0]) || '');
        } catch (err) {
            toast.error(err?.response?.data?.message || 'Failed to fetch product details.');
            navigate('/influence/marketplace');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDetail();
    }, [slug]);

    if (loading) {
        return <div className="p-12 text-center text-slate-400 text-sm">Loading product promotional detail...</div>;
    }

    if (!product) return null;

    const mrp = product.originalPrice || product.price;
    const isDiscounted = mrp > product.price;

    return (
        <div className="p-6 space-y-6 max-w-6xl mx-auto">
            {/* Back Button */}
            <button
                onClick={() => navigate('/influence/marketplace')}
                className="inline-flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-primary-600 transition-colors"
            >
                <FiArrowLeft className="w-4 h-4" /> Back to Marketplace
            </button>

            {/* Main Product Container */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Left: Image Gallery */}
                <div className="space-y-4">
                    <div className="aspect-square bg-slate-100 rounded-2xl overflow-hidden border border-slate-200">
                        <img
                            src={selectedImage}
                            alt={product.name}
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
                                        selectedImage === img ? 'border-primary-600 ring-2 ring-primary-100' : 'border-slate-200'
                                    }`}
                                >
                                    <img src={img} alt="" className="w-full h-full object-cover" />
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
                            <span className="text-primary-600 font-bold">{product.categoryId?.name}</span>
                        </div>
                        <h1 className="text-2xl font-bold text-slate-900 leading-snug">{product.name}</h1>
                    </div>

                    {/* Rating & Vendor */}
                    <div className="flex flex-wrap items-center gap-4 text-xs">
                        <div className="flex items-center gap-1 bg-amber-50 text-amber-800 px-2.5 py-1 rounded-lg border border-amber-200 font-bold">
                            <FiStar className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                            <span>{product.rating > 0 ? product.rating.toFixed(1) : 'New'}</span>
                            <span className="text-amber-600">({product.reviewCount} reviews)</span>
                        </div>

                        <div className="flex items-center gap-1.5 text-slate-600 bg-slate-50 px-3 py-1 rounded-lg border border-slate-200">
                            <FiShoppingBag className="w-3.5 h-3.5 text-slate-400" />
                            <span>Vendor: <strong className="text-slate-800">{product.vendorId?.storeName || 'Porutkal Seller'}</strong></span>
                        </div>
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

                    {/* Generate Link Button */}
                    <button
                        onClick={() => setIsLinkModalOpen(true)}
                        className="w-full py-4 rounded-2xl bg-primary-600 hover:bg-primary-700 text-white font-extrabold text-sm flex items-center justify-center gap-2 shadow-lg shadow-primary-500/25 transition-all"
                    >
                        <FiShare2 className="w-5 h-5" /> Generate My Affiliate Link
                    </button>

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
        </div>
    );
};

export default MarketplaceProductDetail;
