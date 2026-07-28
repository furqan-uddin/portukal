import { useState, useEffect } from 'react';
import {
    FiLink,
    FiCopy,
    FiExternalLink,
    FiTrash2,
    FiTrendingUp,
    FiShoppingBag,
    FiCheck,
} from 'react-icons/fi';
import toast from 'react-hot-toast';
import { getMyAffiliateLinks, deleteAffiliateLink } from '../services/influencerMarketplaceService';

const AffiliateLinks = () => {
    const [links, setLinks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [pagination, setPagination] = useState({ page: 1, total: 0, totalPages: 1 });
    const [copiedLinkId, setCopiedLinkId] = useState(null);

    const fetchLinks = async () => {
        setLoading(true);
        try {
            const res = await getMyAffiliateLinks({ page: pagination.page, limit: 15 });
            const data = res?.data || res;
            setLinks(data.links || []);
            if (data.pagination) setPagination(data.pagination);
        } catch (err) {
            toast.error(err?.response?.data?.message || 'Failed to fetch affiliate links.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLinks();
    }, [pagination.page]);

    const handleCopy = (url, id) => {
        navigator.clipboard.writeText(url);
        setCopiedLinkId(id);
        toast.success('Affiliate link copied to clipboard!');
        setTimeout(() => setCopiedLinkId(null), 2500);
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to soft-delete this affiliate link? Historical stats will be retained.')) return;
        try {
            await deleteAffiliateLink(id);
            toast.success('Affiliate link deleted successfully.');
            fetchLinks();
        } catch (err) {
            toast.error('Failed to delete affiliate link.');
        }
    };

    const renderStatusBadge = (status) => {
        switch (status) {
            case 'active':
                return <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[11px]">Active</span>;
            case 'inactive':
                return <span className="px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 font-bold text-[11px]">Inactive</span>;
            case 'deleted':
                return <span className="px-2.5 py-1 rounded-full bg-rose-100 text-rose-800 font-bold text-[11px]">Deleted</span>;
            case 'expired':
                return <span className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 font-bold text-[11px]">Expired</span>;
            default:
                return <span className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 font-bold text-[11px]">{status}</span>;
        }
    };

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2.5">
                        <FiLink className="text-primary-600" />
                        My Promotional Affiliate Links
                    </h1>
                    <p className="text-sm text-slate-500 mt-1">
                        Track performance, clicks, orders, and live status of your custom affiliate links.
                    </p>
                </div>
            </div>

            {/* Links Table */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm border-collapse">
                        <thead>
                            <tr className="bg-slate-50 text-slate-600 uppercase text-xs tracking-wider border-b border-slate-200">
                                <th className="py-4 px-6 font-bold">Product</th>
                                <th className="py-4 px-6 font-bold">Vendor</th>
                                <th className="py-4 px-6 font-bold">Affiliate URL</th>
                                <th className="py-4 px-6 font-bold text-center">Status</th>
                                <th className="py-4 px-6 font-bold text-center">Clicks</th>
                                <th className="py-4 px-6 font-bold text-center">Orders</th>
                                <th className="py-4 px-6 font-bold">Created Date</th>
                                <th className="py-4 px-6 font-bold text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {loading ? (
                                <tr>
                                    <td colSpan={8} className="py-8 text-center text-slate-400">
                                        Loading your affiliate links...
                                    </td>
                                </tr>
                            ) : links.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className="py-8 text-center text-slate-500 font-medium">
                                        You haven't generated any affiliate links yet. Visit the Marketplace to generate links!
                                    </td>
                                </tr>
                            ) : (
                                links.map((linkItem) => {
                                    const prod = linkItem.productId;
                                    const isCopied = copiedLinkId === linkItem._id;
                                    const displayStatus = linkItem.computedStatus || linkItem.status || 'active';

                                    return (
                                        <tr key={linkItem._id} className="hover:bg-slate-50/80 transition-colors">
                                            <td className="py-4 px-6">
                                                <div className="flex items-center gap-3">
                                                    {prod?.image ? (
                                                        <img
                                                            src={prod.image}
                                                            alt={prod.name}
                                                            className="w-10 h-10 rounded-lg object-cover border border-slate-200"
                                                        />
                                                    ) : (
                                                        <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center font-bold text-xs text-slate-400">
                                                            N/A
                                                        </div>
                                                    )}
                                                    <div>
                                                        <h4 className="font-bold text-slate-900 leading-snug text-xs max-w-[200px] truncate">
                                                            {prod?.name || 'Product'}
                                                        </h4>
                                                        <span className="text-[11px] font-bold text-emerald-700">
                                                            ₹{prod?.price?.toLocaleString()}
                                                        </span>
                                                    </div>
                                                </div>
                                            </td>

                                            <td className="py-4 px-6 text-xs text-slate-600 font-semibold">
                                                {linkItem.vendorId?.storeName || 'Vendor'}
                                            </td>

                                            <td className="py-4 px-6">
                                                <div className="flex items-center gap-2 max-w-[240px]">
                                                    <input
                                                        type="text"
                                                        readOnly
                                                        value={linkItem.affiliateUrl}
                                                        className="w-full p-2 rounded-lg border border-slate-200 text-xs font-mono bg-slate-50 text-slate-700 truncate"
                                                    />
                                                </div>
                                            </td>

                                            <td className="py-4 px-6 text-center">
                                                {renderStatusBadge(displayStatus)}
                                            </td>

                                            <td className="py-4 px-6 text-center font-bold text-slate-800">
                                                <span className="px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700 text-xs">
                                                    {linkItem.clicks || 0}
                                                </span>
                                            </td>

                                            <td className="py-4 px-6 text-center font-bold text-emerald-700">
                                                <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs">
                                                    {linkItem.orders || 0}
                                                </span>
                                            </td>

                                            <td className="py-4 px-6 text-xs text-slate-500">
                                                {new Date(linkItem.createdAt).toLocaleDateString()}
                                            </td>

                                            <td className="py-4 px-6 text-right">
                                                <div className="flex items-center justify-end gap-1.5">
                                                    <button
                                                        onClick={() => handleCopy(linkItem.affiliateUrl, linkItem._id)}
                                                        className={`p-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1 ${
                                                            isCopied
                                                                ? 'bg-emerald-600 text-white'
                                                                : 'bg-primary-50 text-primary-600 hover:bg-primary-100'
                                                        }`}
                                                        title="Copy Link"
                                                    >
                                                        {isCopied ? <FiCheck className="w-3.5 h-3.5" /> : <FiCopy className="w-3.5 h-3.5" />}
                                                    </button>

                                                    <a
                                                        href={linkItem.affiliateUrl}
                                                        target="_blank"
                                                        rel="noreferrer"
                                                        className="p-2 rounded-xl bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors"
                                                        title="Open Link"
                                                    >
                                                        <FiExternalLink className="w-3.5 h-3.5" />
                                                    </a>

                                                    {displayStatus !== 'deleted' && (
                                                        <button
                                                            onClick={() => handleDelete(linkItem._id)}
                                                            className="p-2 rounded-xl bg-rose-50 text-rose-600 hover:bg-rose-100 transition-colors"
                                                            title="Delete Link"
                                                        >
                                                            <FiTrash2 className="w-3.5 h-3.5" />
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default AffiliateLinks;
