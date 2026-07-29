import React, { useEffect, useRef, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Camera } from 'lucide-react';
import { useReels } from '../hooks/useReels';
import ReelCard from '../components/ReelCard';
import MobileLayout from '../../UserApp/components/Layout/MobileLayout';

// Skeleton loading card (same dimensions as ReelCard)
const ReelSkeleton = () => (
    <div className="relative flex-shrink-0 w-full md:max-w-[calc(100vh*9/16)] h-screen snap-start bg-neutral-900 animate-pulse mx-auto">
        <div className="absolute inset-0 bg-gradient-to-b from-neutral-800/40 to-neutral-900/40" />
        <div className="absolute bottom-20 left-4 right-16 space-y-3">
            <div className="h-4 bg-white/10 rounded-full w-3/4" />
            <div className="h-3 bg-white/10 rounded-full w-1/2" />
            <div className="h-3 bg-white/10 rounded-full w-2/3" />
        </div>
        <div className="absolute bottom-20 right-4 space-y-5">
            {[1, 2, 3, 4].map((i) => (
                <div key={i} className="w-8 h-8 rounded-full bg-white/10" />
            ))}
        </div>
    </div>
);

const ReelsPage = () => {
    const {
        reels, loading, hasMore,
        loadInitial, loadMore,
        toggleLike, trackView, trackProductClick,
        shareReel, saveReel,
    } = useReels();

    const navigate = useNavigate();
    const location = useLocation();
    const scrollRef = useRef(null);
    const sentinelRef = useRef(null);
    const initialIndex = location.state?.initialIndex || 0;

    // Load initial feed
    useEffect(() => { loadInitial(); }, [loadInitial]);

    // Scroll to initialIndex if provided
    useEffect(() => {
        if (scrollRef.current && initialIndex > 0 && reels.length > 0) {
            scrollRef.current.scrollTo({ top: initialIndex * window.innerHeight, behavior: 'auto' });
        }
    }, [initialIndex, reels.length]);

    // Infinite scroll sentinel
    useEffect(() => {
        if (!sentinelRef.current) return;
        const observer = new IntersectionObserver(
            (entries) => { if (entries[0].isIntersecting && hasMore && !loading) loadMore(); },
            { root: scrollRef.current, threshold: 0.1 }
        );
        observer.observe(sentinelRef.current);
        return () => observer.disconnect();
    }, [hasMore, loading, loadMore]);

    const handleReport = useCallback((reelId) => {
        // Report interaction (no dedicated UI needed beyond toast)
        import('../../../shared/utils/api').then(({ default: api }) => {
            api.post(`/reels/${reelId}/share`).catch(() => {});
        });
    }, []);

    return (
        <MobileLayout showBottomNav={true} showCartBar={false} showHeader={false}>
            <div
                ref={scrollRef}
                className="relative h-[calc(100vh-56px)] w-full bg-black overflow-y-scroll snap-y snap-mandatory scroll-smooth no-scrollbar flex flex-col items-center"
            >
                {/* Top Navigation Bar Overlay */}
                <div className="fixed top-0 left-0 right-0 z-50 flex justify-center pointer-events-none">
                    <div className="w-full md:max-w-[calc(100vh*9/16)] flex items-center justify-between pl-2 pr-4 pt-3 pb-8">
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => navigate('/')}
                                className="pointer-events-auto p-2 rounded-full bg-black/20 backdrop-blur-md text-white transition-all active:scale-95 border border-white/10"
                            >
                                <ArrowLeft size={18} strokeWidth={2.5} />
                            </button>
                            <div className="pointer-events-auto font-bold text-2xl text-white tracking-tight drop-shadow-2xl">
                                Reels
                            </div>
                        </div>
                        <button className="pointer-events-auto p-1 text-white transition-all active:scale-95">
                            <Camera size={26} strokeWidth={2.5} />
                        </button>
                    </div>
                </div>

                {/* Skeleton loading — shown before first fetch */}
                {loading && reels.length === 0 && (
                    Array.from({ length: 3 }).map((_, i) => <ReelSkeleton key={i} />)
                )}

                {/* Reel Cards */}
                {reels.map((reel) => (
                    <ReelCard
                        key={reel._id || reel.id}
                        reel={reel}
                        toggleLike={toggleLike}
                        shareReel={shareReel}
                        saveReel={saveReel}
                        reportReel={handleReport}
                        onView={trackView}
                        onProductClick={trackProductClick}
                    />
                ))}

                {/* Infinite scroll sentinel */}
                {hasMore && <div ref={sentinelRef} className="h-4 w-full flex-shrink-0" />}

                {/* Loading more indicator */}
                {loading && reels.length > 0 && (
                    <div className="h-screen w-full flex-shrink-0 snap-start mx-auto md:max-w-[calc(100vh*9/16)] flex items-center justify-center">
                        <ReelSkeleton />
                    </div>
                )}

                {/* End of feed */}
                {!hasMore && reels.length > 0 && (
                    <div className="h-screen flex items-center justify-center text-white/40 bg-neutral-900 w-full flex-shrink-0 snap-start">
                        <div className="text-center">
                            <p className="font-bold tracking-tight text-lg">You&apos;re all caught up!</p>
                            <p className="text-sm mt-1">Check back later for new reels</p>
                        </div>
                    </div>
                )}

                {/* Empty state */}
                {!loading && reels.length === 0 && (
                    <div className="h-screen flex items-center justify-center text-white/50 bg-neutral-900 w-full">
                        <div className="text-center">
                            <p className="font-bold tracking-tight text-xl mb-2">No Reels Yet</p>
                            <p className="text-sm">Product reels from our vendors will appear here</p>
                        </div>
                    </div>
                )}

                <style>{`
                    .no-scrollbar::-webkit-scrollbar { display: none; }
                    .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
                `}</style>
            </div>
        </MobileLayout>
    );
};

export default ReelsPage;
