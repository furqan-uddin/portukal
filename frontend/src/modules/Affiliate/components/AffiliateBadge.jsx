import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FiCheckCircle, FiExternalLink } from 'react-icons/fi';
import { useAffiliate } from '../hooks/useAffiliate';

const AffiliateBadge = ({ productId }) => {
    const { trackedProduct } = useAffiliate();
    const navigate = useNavigate();

    // Only show if the link matches the current product
    if (!trackedProduct || String(trackedProduct.productId) !== String(productId)) {
        return null;
    }

    return (
        <button
            onClick={() => navigate('/wallet')}
            className="flex items-center gap-3 px-4 py-2 bg-yellow-50 border border-yellow-200 rounded-xl text-yellow-700 shadow-sm animate-pulse-subtle hover:bg-yellow-100 transition-all active:scale-95 text-left group mb-4"
        >
            <FiCheckCircle className="text-yellow-600 animate-bounce" />
            <div className="flex flex-col">
                <span className="text-xs font-bold tracking-tight">Affiliate Link Active</span>
                <span className="text-[10px] font-semibold text-yellow-600 flex items-center gap-1 group-hover:underline">
                    View Wallet Earnings <FiExternalLink size={10} />
                </span>
            </div>
        </button>
    );
};

export default AffiliateBadge;
