import { useState, useMemo } from 'react';
import { mockReels, mockProducts, mockCreators } from '../dummyData/exploreData';

export const useExplore = () => {
    const [selectedCategory, setSelectedCategory] = useState('All');

    const filteredReels = useMemo(() => {
        if (selectedCategory === 'All') return mockReels;
        return mockReels.filter(reel => reel.category === selectedCategory);
    }, [selectedCategory]);

    const filteredProducts = useMemo(() => {
        if (selectedCategory === 'All') return mockProducts;
        return mockProducts.filter(product => product.category === selectedCategory);
    }, [selectedCategory]);

    return {
        selectedCategory,
        setSelectedCategory,
        reels: filteredReels,
        products: filteredProducts,
        creators: mockCreators // Creators are usually not filtered by category in Explore
    };
};
