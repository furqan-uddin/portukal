import { useNavigate } from 'react-router-dom';
import { FiStar, FiEye, FiShare2 } from 'react-icons/fi';
import CommissionBadge from '../../../shared/components/CommissionBadge';

const MarketplaceCard = ({ product, onGenerateLink }) => {
    const navigate = useNavigate();

    const mrp = product.originalPrice || product.price;
    const isDiscounted = mrp > product.price;

    const handleOpenDetail = () => {
        const identifier = product.slug || product._id || product.id;
        if (identifier) {
            navigate(`/influencer/product/${identifier}`);
        }
    };

    const getProductImageUrl = (img) => {
        if (!img || typeof img !== 'string') return `https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(product.name || 'product')}`;
        if (img.startsWith('http://') || img.startsWith('https://') || img.startsWith('data:image')) return img;
        if (img.startsWith('/')) return `http://localhost:5000${img}`;
        return `http://localhost:5000/${img}`;
    };

    const validCloudinaryImg = Array.isArray(product.images)
        ? product.images.find(i => typeof i === 'string' && i.startsWith('http') && !i.includes('via.placeholder') && !i.includes('80x80'))
        : null;

    const rawImg = validCloudinaryImg || product.image || (product.images && product.images[0]) || '';
    const displayImg = getProductImageUrl(rawImg);

    return (
        <div 
            onClick={handleOpenDetail}
            className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all flex flex-col overflow-hidden group cursor-pointer"
        >
            {/* Image Container */}
            <div className="relative aspect-square bg-slate-100 overflow-hidden">
                <img
                    src={displayImg}
                    alt={product.name}
                    onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500&auto=format&fit=crop&q=60';
                    }}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />

                {isDiscounted && (
                    <div className="absolute top-3 left-3 bg-rose-600 text-white font-extrabold text-[10px] px-2 py-0.5 rounded-md shadow-sm">
                        {product.discountPercent}% OFF
                    </div>
                )}

                <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm text-slate-800 text-xs font-bold px-2 py-1 rounded-lg border border-slate-200 shadow-sm flex items-center gap-1">
                    <FiStar className="w-3 h-3 text-amber-500 fill-amber-500" />
                    <span>{product.rating > 0 ? product.rating.toFixed(1) : 'New'}</span>
                    {product.reviewCount > 0 && <span className="text-slate-400">({product.reviewCount})</span>}
                </div>
            </div>

            {/* Content Body */}
            <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                <div>
                    {/* Brand & Vendor */}
                    <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                        <span className="font-semibold text-slate-500">{product.brand?.name || product.brandId?.name || 'Generic'}</span>
                        <span className="text-slate-400 truncate max-w-[120px]">{product.vendor?.storeName || product.vendorId?.storeName}</span>
                    </div>

                    {/* Product Title */}
                    <h3 className="font-bold text-slate-900 text-sm leading-snug line-clamp-2 group-hover:text-purple-600 transition-colors">
                        {product.name}
                    </h3>
                </div>

                {/* Pricing & Commission */}
                <div className="space-y-2 pt-2 border-t border-slate-100">
                    <div className="flex items-baseline gap-2">
                        <span className="text-lg font-black text-slate-900">₹{product.price?.toLocaleString()}</span>
                        {isDiscounted && (
                            <span className="text-xs text-slate-400 line-through">₹{mrp.toLocaleString()}</span>
                        )}
                    </div>

                    {/* Commission Badge */}
                    <CommissionBadge
                        commissionPercent={product.commissionPercent}
                        estimatedEarnings={product.estimatedEarnings}
                        size="sm"
                    />
                </div>

                {/* Actions Bar */}
                <div className="grid grid-cols-2 gap-2 pt-2">
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            handleOpenDetail();
                        }}
                        className="w-full py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center justify-center gap-1 transition-colors"
                    >
                        <FiEye className="w-3.5 h-3.5" /> Details
                    </button>
                    {product.collabStatus === 'accepted' ? (
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                if (onGenerateLink) onGenerateLink(product);
                            }}
                            className="w-full py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs flex items-center justify-center gap-1 shadow-sm shadow-purple-500/20 transition-all"
                        >
                            <FiShare2 className="w-3.5 h-3.5" /> Get Link
                        </button>
                    ) : product.collabStatus === 'pending' ? (
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                handleOpenDetail();
                            }}
                            className="w-full py-2 rounded-xl bg-amber-50 text-amber-800 border border-amber-300 font-bold text-xs flex items-center justify-center gap-1"
                        >
                            Pending ⏳
                        </button>
                    ) : (
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                handleOpenDetail();
                            }}
                            className="w-full py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center justify-center gap-1 transition-all"
                        >
                            Request Deal
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default MarketplaceCard;
