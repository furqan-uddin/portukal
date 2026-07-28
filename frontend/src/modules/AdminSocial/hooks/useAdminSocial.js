import { useState, useEffect } from 'react';
import { mockReelsModeration } from '../dummyData/reelsModerationData';
import { mockPayouts } from '../dummyData/payoutData';
import { mockAuditLogs } from '../dummyData/auditLogsData';

export const useAdminSocial = () => {
    // Persistence setup
    const [reels, setReels] = useState(() => {
        const saved = localStorage.getItem('admin_moderation_reels');
        return saved ? JSON.parse(saved) : mockReelsModeration;
    });

    const [payouts, setPayouts] = useState(() => {
        const saved = localStorage.getItem('admin_payout_requests');
        return saved ? JSON.parse(saved) : mockPayouts;
    });

    const [logs, setLogs] = useState(() => {
        const saved = localStorage.getItem('admin_social_audit_logs');
        return saved ? JSON.parse(saved) : mockAuditLogs;
    });

    // Save on changes
    useEffect(() => {
        localStorage.setItem('admin_moderation_reels', JSON.stringify(reels));
    }, [reels]);

    useEffect(() => {
        localStorage.setItem('admin_payout_requests', JSON.stringify(payouts));
    }, [payouts]);

    useEffect(() => {
        localStorage.setItem('admin_social_audit_logs', JSON.stringify(logs));
    }, [logs]);

    const addLog = (action, category = 'General') => {
        const newLog = {
            logId: `l_${Date.now()}`,
            action,
            performedBy: 'Super Admin',
            timestamp: new Date().toISOString(),
            category
        };
        setLogs(prev => [newLog, ...prev]);
    };

    // Reel Actions
    const updateReelStatus = (reelId, newStatus) => {
        setReels(prev => prev.map(r => 
            r.reelId === reelId ? { ...r, status: newStatus } : r
        ));
        const reel = reels.find(r => r.reelId === reelId);
        addLog(`${newStatus === 'active' ? 'Ignored reports for' : 'Removed'} Reel by ${reel?.creatorName}`, 'Content');
    };

    // Payout Actions
    const updatePayoutStatus = (payoutId, newStatus) => {
        setPayouts(prev => prev.map(p => 
            p.payoutId === payoutId ? { ...p, status: newStatus } : p
        ));
        const payout = payouts.find(p => p.payoutId === payoutId);
        addLog(`${newStatus === 'approved' ? 'Approved' : 'Rejected'} Payout for ${payout?.creatorName} (${payout?.amount})`, 'Finance');
    };

    return {
        reels,
        payouts,
        logs,
        updateReelStatus,
        updatePayoutStatus,
        reportedReels: reels.filter(r => r.status === 'reported'),
    };
};
