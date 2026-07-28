import { useState, useEffect } from 'react';
import { mockVendorAffiliateProducts, mockAffiliateStats } from '../dummyData/vendorAffiliateData';

export const useVendorAffiliate = () => {
    const [products, setProducts] = useState(() => {
        const saved = localStorage.getItem('vendorAffiliateSettings');
        return saved ? JSON.parse(saved) : mockVendorAffiliateProducts;
    });

    const [stats] = useState(mockAffiliateStats);

    useEffect(() => {
        localStorage.setItem('vendorAffiliateSettings', JSON.stringify(products));
    }, [products]);

    const toggleAffiliate = (productId) => {
        setProducts(prev => prev.map(p => 
            p.productId === productId ? { ...p, affiliateEnabled: !p.affiliateEnabled } : p
        ));
    };

    const updateCommission = (productId, percentage) => {
        const val = Number(percentage);
        if (isNaN(val) || val < 0 || val > 100) return false;
        
        setProducts(prev => prev.map(p => 
            p.productId === productId ? { ...p, commissionPercentage: val } : p
        ));
        return true;
    };

    return {
        products,
        stats,
        toggleAffiliate,
        updateCommission,
    };
};
