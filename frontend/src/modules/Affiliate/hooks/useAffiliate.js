import { useState, useCallback, useEffect } from 'react';
import { mockAffiliateRecords } from '../dummyData/affiliateData';

export const useAffiliate = () => {
    const [records, setRecords] = useState(() => {
        // Hydrate from localStorage if simulated updates were made, otherwise use mocks
        const saved = localStorage.getItem('affiliateRecords');
        return saved ? JSON.parse(saved) : mockAffiliateRecords;
    });

    const [trackedProduct, setTrackedProduct] = useState(null);

    // Sync state to localStorage for demo data persistence
    useEffect(() => {
        localStorage.setItem('affiliateRecords', JSON.stringify(records));
    }, [records]);

    // Check for tracked affiliate link in localStorage on mount
    useEffect(() => {
        const checkTrack = () => {
            const saved = localStorage.getItem('affiliateTrack');
            if (saved) {
                setTrackedProduct(JSON.parse(saved));
            }
        };
        checkTrack();
        window.addEventListener('storage', checkTrack);
        return () => window.removeEventListener('storage', checkTrack);
    }, []);

    const trackClick = (productId, reelId, creatorId) => {
        const trackingInfo = {
            productId,
            reelId,
            creatorId,
            timestamp: new Date().toISOString(),
        };
        localStorage.setItem('affiliateTrack', JSON.stringify(trackingInfo));
        setTrackedProduct(trackingInfo);

        // Add a new dynamic record to the wallet for testing
        const newRecord = {
            id: `aff_${Date.now()}`,
            reelId,
            productId,
            creatorId,
            commissionPercentage: 10,
            orderStatus: "pending",
            commissionAmount: 500, // Simulated commission
            isCredited: false,
            createdAt: trackingInfo.timestamp,
        };
        setRecords(prev => {
            if (prev.find(r => r.productId === productId && r.orderStatus === 'pending')) return prev;
            return [newRecord, ...prev];
        });
    };

    const clearTracking = () => {
        localStorage.removeItem('affiliateTrack');
        setTrackedProduct(null);
    };

    const simulateDelivery = (id) => {
        setRecords(prev => prev.map(rec => 
            rec.id === id ? { ...rec, orderStatus: 'delivered', isCredited: true } : rec
        ));
    };

    const calculateEarnings = useCallback(() => {
        const pending = records
            .filter(r => r.orderStatus === 'pending')
            .reduce((sum, r) => sum + r.commissionAmount, 0);

        const approved = records
            .filter(r => r.orderStatus === 'delivered')
            .reduce((sum, r) => sum + r.commissionAmount, 0);

        return {
            pending,
            approved,
            total: pending + approved,
        };
    }, [records]);

    return {
        records,
        trackedProduct,
        trackClick,
        clearTracking,
        calculateEarnings,
        simulateDelivery,
    };
};
