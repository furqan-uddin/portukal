import { useState, useCallback } from 'react';
import { mockReelsData } from '../dummyData/reelsData';

export const useReels = () => {
    const [reels, setReels] = useState(mockReelsData);

    const toggleLike = useCallback((id) => {
        setReels((prev) =>
            prev.map((reel) =>
                reel.id === id
                    ? {
                          ...reel,
                          isLiked: !reel.isLiked,
                          likes: reel.isLiked ? reel.likes - 1 : reel.likes + 1,
                      }
                    : reel
            )
        );
    }, []);

    const shareReel = useCallback((id) => {
        alert(`Shared Reel #${id}!`);
    }, []);

    const saveReel = useCallback((id) => {
        alert(`Saved Reel #${id}!`);
    }, []);

    const reportReel = useCallback((id) => {
        alert(`Reported Reel #${id}!`);
    }, []);

    return {
        reels,
        toggleLike,
        shareReel,
        saveReel,
        reportReel,
    };
};
