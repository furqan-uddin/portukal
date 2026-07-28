import { useNavigate } from 'react-router-dom';
import { FiStar, FiEye, FiShare2, FiCheckCircle } from 'react-icons/fi';
import CommissionBadge from '../../../shared/components/CommissionBadge';

const MarketplaceCard = ({ product, onGenerateLink }) => {
    const navigate = useNavigate();

    const mrp = product.originalPrice || product.price;
    const isDiscounted = mrp > product.price;

    return (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all flex flex-col overflow-hidden group">
            {/* Image Container */}
            <div className="relative aspect-square bg-slate-100 overflow-hidden">
                <img
                    src={product.image || (product.images && product.images[0]) || ''}
                    alt={product.name}
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
                        <span className="font-semibold text-slate-500">{product.brand?.name || 'Generic'}</span>
                        <span className="text-slate-400 truncate max-w-[120px]">{product.vendor?.storeName}</span>
                    </div>

                    {/* Product Title */}
                    <h3 className="font-bold text-slate-900 text-sm leading-snug line-clamp-2 hover:text-primary-600 transition-colors">
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
                        onClick={() => navigate(`/influence/product/${product.slug}`)}
                        className="w-full py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center justify-center gap-1 transition-colors"
                    >
                        <FiEye className="w-3.5 h-3.5" /> Details
                    </button>
                    <button
                        onClick={() => onGenerateLink(product)}
                        className="w-full py-2 rounded-xl bg-primary-600 hover:bg-primary-700 text-white font-bold text-xs flex items-center justify-center gap-1 shadow-sm shadow-primary-500/20 transition-all"
                    >
                        <FiShare2 className="w-3.5 h-3.5" /> Get Link
                    </button>
                </div>
            </div>
        </div>
    );
};

export default MarketplaceCard;
