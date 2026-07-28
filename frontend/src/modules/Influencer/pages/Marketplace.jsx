import { useState, useEffect } from 'react';
import {
    FiSearch,
    FiFilter,
    FiRefreshCw,
    FiShoppingBag,
    FiSliders,
    FiPercent,
    FiStar,
    FiDollarSign,
    FiTag,
    FiGrid,
    FiAlertCircle,
} from 'react-icons/fi';
import toast from 'react-hot-toast';
import MarketplaceCard from '../components/MarketplaceCard';
import GenerateAffiliateModal from '../components/GenerateAffiliateModal';
import { getMarketplaceProducts } from '../services/influencerMarketplaceService';
import { getPublicCategories, getPublicBrands } from '../../Admin/services/adminService';

const Marketplace = () => {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isProgramEnabled, setIsProgramEnabled] = useState(true);
    const [categories, setCategories] = useState([]);
    const [brands, setBrands] = useState([]);

    // Filter states
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('');
    const [selectedBrand, setSelectedBrand] = useState('');
    const [minPrice, setMinPrice] = useState('');
    const [maxPrice, setMaxPrice] = useState('');
    const [minCommission, setMinCommission] = useState('');
    const [minRating, setMinRating] = useState('');
    const [minDiscount, setMinDiscount] = useState('');
    const [sortBy, setSortBy] = useState('newest');
    const [pagination, setPagination] = useState({ page: 1, total: 0, totalPages: 1 });

    // Modal state
    const [selectedProductForLink, setSelectedProductForLink] = useState(null);

    const fetchFiltersData = async () => {
        try {
            const [catRes, brandRes] = await Promise.all([
                getPublicCategories(),
                getPublicBrands(),
            ]);
            setCategories(catRes?.data || catRes || []);
            setBrands(brandRes?.data || brandRes || []);
        } catch (err) {
            console.error('Failed to load filter categories/brands:', err);
        }
    };

    const fetchProducts = async () => {
        setLoading(true);
        try {
            const params = {
                page: pagination.page,
                limit: 16,
                sort: sortBy,
            };

            if (searchQuery.trim()) params.search = searchQuery.trim();
            if (selectedCategory) params.categoryId = selectedCategory;
            if (selectedBrand) params.brandId = selectedBrand;
            if (minPrice) params.minPrice = minPrice;
            if (maxPrice) params.maxPrice = maxPrice;
            if (minCommission) params.minCommission = minCommission;
            if (minRating) params.minRating = minRating;
            if (minDiscount) params.minDiscount = minDiscount;

            const res = await getMarketplaceProducts(params);
            const data = res?.data || res;
            if (data.isProgramEnabled === false) {
                setIsProgramEnabled(false);
                setProducts([]);
            } else {
                setIsProgramEnabled(true);
                setProducts(data.products || []);
            }
            if (data.pagination) setPagination(data.pagination);
        } catch (err) {
            toast.error(err?.response?.data?.message || 'Failed to fetch marketplace products.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchFiltersData();
    }, []);

    useEffect(() => {
        fetchProducts();
    }, [
        searchQuery,
        selectedCategory,
        selectedBrand,
        minPrice,
        maxPrice,
        minCommission,
        minRating,
        minDiscount,
        sortBy,
        pagination.page,
    ]);

    const resetFilters = () => {
        setSearchQuery('');
        setSelectedCategory('');
        setSelectedBrand('');
        setMinPrice('');
        setMaxPrice('');
        setMinCommission('');
        setMinRating('');
        setMinDiscount('');
        setSortBy('newest');
        setPagination((prev) => ({ ...prev, page: 1 }));
    };

    return (
        <div className="p-6 space-y-6">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2.5">
                        <FiShoppingBag className="text-primary-600" />
                        Influencer Product Marketplace
                    </h1>
                    <p className="text-sm text-slate-500 mt-1">
                        Browse approved products available for promotion. Generate affiliate links and earn high commissions on every order!
                    </p>
                </div>
            </div>

            {/* Global Program Disabled Notice */}
            {!isProgramEnabled && (
                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 flex items-start gap-4 text-amber-900">
                    <FiAlertCircle className="w-6 h-6 text-amber-600 flex-shrink-0 mt-0.5" />
                    <div>
                        <h3 className="font-bold text-base">Influencer Program Currently Paused</h3>
                        <p className="text-xs text-amber-700 mt-1">
                            The platform Admin has temporarily paused the Influencer Affiliate Program. Product browsing and affiliate link generation are currently disabled. Please check back soon!
                        </p>
                    </div>
                </div>
            )}

            {/* Filter Bar */}
            {isProgramEnabled && (
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                    {/* Search & Sort Row */}
                    <div className="flex flex-col lg:flex-row items-center justify-between gap-4">
                        <div className="relative flex-1 w-full">
                            <input
                                type="text"
                                placeholder="Search by Product Name, Brand, Vendor, or SKU..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary-500 bg-slate-50"
                            />
                            <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                        </div>

                        <div className="flex items-center gap-3 w-full lg:w-auto">
                            <span className="text-xs font-bold text-slate-500 whitespace-nowrap">Sort By:</span>
                            <select
                                value={sortBy}
                                onChange={(e) => setSortBy(e.target.value)}
                                className="px-3 py-2.5 rounded-xl border border-slate-200 text-xs font-bold bg-slate-50 text-slate-700 focus:outline-none"
                            >
                                <option value="newest">Newest Arrivals</option>
                                <option value="commission_desc">Highest Commission %</option>
                                <option value="price_asc">Price: Low → High</option>
                                <option value="price_desc">Price: High → Low</option>
                                <option value="rating_desc">Highest Rated</option>
                                <option value="best_selling">Best Selling</option>
                            </select>

                            <button
                                onClick={resetFilters}
                                className="p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors"
                                title="Reset Filters"
                            >
                                <FiRefreshCw className="w-4 h-4" />
                            </button>
                        </div>
                    </div>

                    {/* Filter Dropdowns Row */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3 pt-2 border-t border-slate-100">
                        {/* Category */}
                        <select
                            value={selectedCategory}
                            onChange={(e) => setSelectedCategory(e.target.value)}
                            className="p-2.5 rounded-xl border border-slate-200 text-xs font-bold bg-slate-50 text-slate-700 focus:outline-none"
                        >
                            <option value="">All Categories</option>
                            {categories.map((cat) => (
                                <option key={cat._id} value={cat._id}>{cat.name}</option>
                            ))}
                        </select>

                        {/* Brand */}
                        <select
                            value={selectedBrand}
                            onChange={(e) => setSelectedBrand(e.target.value)}
                            className="p-2.5 rounded-xl border border-slate-200 text-xs font-bold bg-slate-50 text-slate-700 focus:outline-none"
                        >
                            <option value="">All Brands</option>
                            {brands.map((b) => (
                                <option key={b._id} value={b._id}>{b.name}</option>
                            ))}
                        </select>

                        {/* Min Commission */}
                        <select
                            value={minCommission}
                            onChange={(e) => setMinCommission(e.target.value)}
                            className="p-2.5 rounded-xl border border-slate-200 text-xs font-bold bg-slate-50 text-slate-700 focus:outline-none"
                        >
                            <option value="">Min Commission</option>
                            <option value="5">5%+ Commission</option>
                            <option value="10">10%+ Commission</option>
                            <option value="15">15%+ Commission</option>
                            <option value="20">20%+ Commission</option>
                        </select>

                        {/* Min Rating */}
                        <select
                            value={minRating}
                            onChange={(e) => setMinRating(e.target.value)}
                            className="p-2.5 rounded-xl border border-slate-200 text-xs font-bold bg-slate-50 text-slate-700 focus:outline-none"
                        >
                            <option value="">Min Rating</option>
                            <option value="4">4★ & above</option>
                            <option value="3">3★ & above</option>
                        </select>

                        {/* Min Discount */}
                        <select
                            value={minDiscount}
                            onChange={(e) => setMinDiscount(e.target.value)}
                            className="p-2.5 rounded-xl border border-slate-200 text-xs font-bold bg-slate-50 text-slate-700 focus:outline-none"
                        >
                            <option value="">Min Discount</option>
                            <option value="10">10%+ Off</option>
                            <option value="20">20%+ Off</option>
                            <option value="30">30%+ Off</option>
                            <option value="50">50%+ Off</option>
                        </select>

                        {/* Price Range */}
                        <div className="flex items-center gap-1">
                            <input
                                type="number"
                                placeholder="Min ₹"
                                value={minPrice}
                                onChange={(e) => setMinPrice(e.target.value)}
                                className="w-full p-2.5 rounded-xl border border-slate-200 text-xs bg-slate-50 text-slate-800 focus:outline-none"
                            />
                            <span className="text-slate-300">-</span>
                            <input
                                type="number"
                                placeholder="Max ₹"
                                value={maxPrice}
                                onChange={(e) => setMaxPrice(e.target.value)}
                                className="w-full p-2.5 rounded-xl border border-slate-200 text-xs bg-slate-50 text-slate-800 focus:outline-none"
                            />
                        </div>
                    </div>
                </div>
            )}

            {/* Product Grid */}
            {isProgramEnabled && (
                loading ? (
                    <div className="py-16 text-center text-slate-400 text-sm">Loading promotional products...</div>
                ) : products.length === 0 ? (
                    <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-500">
                        <FiShoppingBag className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                        <h3 className="text-base font-bold text-slate-800">No Promotional Products Found</h3>
                        <p className="text-xs text-slate-400 mt-1">Try resetting your search query or filters.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                        {products.map((product) => (
                            <MarketplaceCard
                                key={product._id}
                                product={product}
                                onGenerateLink={setSelectedProductForLink}
                            />
                        ))}
                    </div>
                )
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

export default Marketplace;
