import { useState } from 'react';
import { FiX, FiCopy, FiExternalLink, FiCheck, FiShare2 } from 'react-icons/fi';
import toast from 'react-hot-toast';
import CommissionBadge from '../../../shared/components/CommissionBadge';
import { generateAffiliateLink } from '../services/influencerMarketplaceService';

const GenerateAffiliateModal = ({ product, onClose }) => {
    const [generating, setGenerating] = useState(false);
    const [affiliateLinkData, setAffiliateLinkData] = useState(null);
    const [copied, setCopied] = useState(false);

    const handleGenerateLink = async () => {
        setGenerating(true);
        try {
            const res = await generateAffiliateLink(product._id);
            const data = res?.data || res;
            setAffiliateLinkData(data);
        } catch (err) {
            toast.error(err?.response?.data?.message || 'Failed to generate link.');
        } finally {
            setGenerating(false);
        }
    };

    // Auto generate on open
    useState(() => {
        if (product && !affiliateLinkData) {
            handleGenerateLink();
        }
    });

    const handleCopy = () => {
        const url = affiliateLinkData?.affiliateUrl || `http://localhost:3000/product/${product.slug}`;
        navigator.clipboard.writeText(url);
        setCopied(true);
        toast.success('Affiliate link copied to clipboard!');
        setTimeout(() => setCopied(false), 2500);
    };

    if (!product) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
            <div className="bg-white rounded-2xl max-w-lg w-full p-6 relative shadow-2xl border border-slate-100">
                <button
                    onClick={onClose}
                    className="absolute right-4 top-4 text-slate-400 hover:text-slate-600 p-1 rounded-lg"
                >
                    <FiX className="w-5 h-5" />
                </button>

                <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center font-bold text-lg">
                        <FiShare2 />
                    </div>
                    <div>
                        <h3 className="font-bold text-lg text-slate-900 leading-snug">Generate Affiliate Link</h3>
                        <p className="text-xs text-slate-500">Promote this product and earn commission on every sale.</p>
                    </div>
                </div>

                {/* Product Summary */}
                <div className="flex items-center gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200 mb-5">
                    <img
                        src={product.image || (product.images && product.images[0]) || ''}
                        alt={product.name}
                        className="w-16 h-16 object-cover rounded-lg border border-slate-200"
                    />
                    <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-slate-900 text-sm truncate">{product.name}</h4>
                        <div className="text-xs text-slate-500 mt-0.5">
                            Price: <span className="font-bold text-slate-900">₹{product.price?.toLocaleString()}</span>
                        </div>
                        <div className="mt-1">
                            <CommissionBadge
                                commissionPercent={product.commissionPercent}
                                estimatedEarnings={product.estimatedEarnings}
                                size="sm"
                            />
                        </div>
                    </div>
                </div>

                {/* Generated Link Display */}
                {generating ? (
                    <div className="py-6 text-center text-slate-400 text-sm">Generating your custom affiliate link...</div>
                ) : (
                    <div className="space-y-4">
                        <div>
                            <label className="text-xs font-bold text-slate-600 uppercase tracking-wider block mb-1">
                                Your Unique Affiliate URL
                            </label>
                            <div className="flex items-center gap-2">
                                <input
                                    type="text"
                                    readOnly
                                    value={affiliateLinkData?.affiliateUrl || ''}
                                    className="w-full p-3 rounded-xl border border-slate-200 text-xs font-mono bg-slate-100 text-slate-800 focus:outline-none"
                                />
                                <button
                                    onClick={handleCopy}
                                    className={`px-4 py-3 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all ${
                                        copied
                                            ? 'bg-emerald-600 text-white'
                                            : 'bg-primary-600 hover:bg-primary-700 text-white shadow-md shadow-primary-500/20'
                                    }`}
                                >
                                    {copied ? <FiCheck className="w-4 h-4" /> : <FiCopy className="w-4 h-4" />}
                                    {copied ? 'Copied' : 'Copy'}
                                </button>
                            </div>
                        </div>

                        <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100">
                            <span>Referral Code Attached: <strong className="font-mono text-purple-700">{affiliateLinkData?.referralCode}</strong></span>
                            <a
                                href={affiliateLinkData?.affiliateUrl || '#'}
                                target="_blank"
                                rel="noreferrer"
                                className="text-primary-600 hover:underline font-bold flex items-center gap-1"
                            >
                                Open Link <FiExternalLink className="w-3 h-3" />
                            </a>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default GenerateAffiliateModal;
