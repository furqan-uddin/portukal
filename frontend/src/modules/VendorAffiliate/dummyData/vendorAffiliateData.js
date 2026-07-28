export const mockVendorAffiliateProducts = [
  {
    productId: '69a3f9753d180944de183c57',
    productName: 'Valentino heels',
    affiliateEnabled: true,
    commissionPercentage: 10,
    totalAffiliateSales: 156,
    totalRevenueFromAffiliate: 623844, // 156 * 3999
    topCreators: [
      { name: 'Sarah Jay', sales: 45, earnings: 17995 },
      { name: 'Alex Rivera', sales: 32, earnings: 12796 }
    ]
  },
  {
    productId: '69a2bcbedc14f741b639871d',
    productName: 'Floral Summer Dress',
    affiliateEnabled: false,
    commissionPercentage: 5,
    totalAffiliateSales: 0,
    totalRevenueFromAffiliate: 0,
    topCreators: []
  },
  {
    productId: '69a07ca7bd36da8fa1da74a9',
    productName: 'Premium Leather Bag',
    affiliateEnabled: true,
    commissionPercentage: 12,
    totalAffiliateSales: 89,
    totalRevenueFromAffiliate: 445000,
    topCreators: [
      { name: 'Mia Wong', sales: 28, earnings: 16800 }
    ]
  }
];

export const mockAffiliateStats = {
  totalOrders: 245,
  totalRevenue: 1068844,
  activeCreators: 12,
  pendingCommissions: 45200
};
