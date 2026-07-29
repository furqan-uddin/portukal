import { useState, useCallback, useRef } from 'react';
import api from '../../../shared/utils/api';
import toast from 'react-hot-toast';

export const useReels = () => {
    const [reels, setReels] = useState([]);
    const [loading, setLoading] = useState(false);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const fetchingRef = useRef(false);

    // Fetch a page of reels from the backend
    const fetchReels = useCallback(async (pageNum = 1, reset = false) => {
        if (fetchingRef.current) return;
        fetchingRef.current = true;
        setLoading(true);
        try {
            const data = await api.get('/reels/feed', { params: { page: pageNum, limit: 8 } });
            const newReels = data.reels || [];
            setReels((prev) => reset ? newReels : [...prev, ...newReels]);
            setHasMore(data.hasMore ?? newReels.length > 0);
            setPage(pageNum);
        } catch {
            // Fallback silently — don't show error on feed load failure
        } finally {
            setLoading(false);
            fetchingRef.current = false;
        }
    }, []);

    // Load initial feed
    const loadInitial = useCallback(() => {
        fetchReels(1, true);
    }, [fetchReels]);

    // Load next page (infinite scroll)
    const loadMore = useCallback(() => {
        if (!hasMore || loading) return;
        fetchReels(page + 1);
    }, [hasMore, loading, page, fetchReels]);

    // Toggle like
    const toggleLike = useCallback(async (reelId) => {
        // Optimistic update
        setReels((prev) =>
            prev.map((r) =>
                r._id === reelId
                    ? { ...r, isLiked: !r.isLiked, likesCount: r.isLiked ? (r.likesCount || 1) - 1 : (r.likesCount || 0) + 1 }
                    : r
            )
        );
        try {
            const data = await api.post(`/reels/${reelId}/like`);
            setReels((prev) =>
                prev.map((r) => r._id === reelId ? { ...r, isLiked: data.isLiked, likesCount: data.likesCount } : r)
            );
        } catch {
            // Revert optimistic update on failure
            setReels((prev) =>
                prev.map((r) =>
                    r._id === reelId
                        ? { ...r, isLiked: !r.isLiked, likesCount: r.isLiked ? (r.likesCount || 0) + 1 : (r.likesCount || 1) - 1 }
                        : r
                )
            );
        }
    }, []);

    // Track view
    const trackView = useCallback(async (reelId, viewData = {}) => {
        try {
            await api.post(`/reels/${reelId}/view`, viewData);
        } catch { /* non-fatal */ }
    }, []);

    // Track product click
    const trackProductClick = useCallback(async (reelId, productId) => {
        try {
            await api.post(`/reels/${reelId}/track/click`, { productId });
        } catch { /* non-fatal */ }
    }, []);

    // Share
    const shareReel = useCallback(async (reelId) => {
        const reel = reels.find((r) => r._id === reelId);
        const shareUrl = `${window.location.origin}/reels?reel=${reelId}`;
        try {
            if (navigator.share) {
                await navigator.share({ title: reel?.title || 'Check this out!', url: shareUrl });
            } else {
                await navigator.clipboard.writeText(shareUrl);
                toast.success('Link copied to clipboard!');
            }
            api.post(`/reels/${reelId}/share`).catch(() => {});
        } catch { /* user cancelled share */ }
    }, [reels]);

    // Save / bookmark
    const saveReel = useCallback(async (reelId) => {
        try {
            const data = await api.post(`/reels/${reelId}/save`);
            toast.success(data.isSaved ? 'Reel saved!' : 'Removed from saved');
            setReels((prev) => prev.map((r) => r._id === reelId ? { ...r, isSaved: data.isSaved } : r));
        } catch { /* non-fatal */ }
    }, []);

    return {
        reels,
        loading,
        hasMore,
        loadInitial,
        loadMore,
        toggleLike,
        trackView,
        trackProductClick,
        shareReel,
        saveReel,
    };
};
