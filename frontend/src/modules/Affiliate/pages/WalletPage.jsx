import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FiArrowLeft, FiPieChart, FiTrendingUp, FiCheckCircle, FiClock, FiDollarSign } from 'react-icons/fi';
import { useAffiliate } from '../hooks/useAffiliate';
import PageTransition from '../../../shared/components/PageTransition';
import MobileLayout from '../../UserApp/components/Layout/MobileLayout';
import { formatPrice } from '../../../shared/utils/helpers';

const WalletPage = () => {
    const navigate = useNavigate();
    const { calculateEarnings, records, simulateDelivery } = useAffiliate();
    const { pending, approved, total } = calculateEarnings();

    return (
        <PageTransition>
            <MobileLayout showBottomNav={true} showCartBar={false}>
                <div className="min-h-screen bg-gray-50 pb-24">
                    {/* Header */}
                    <div className="bg-white border-b border-gray-100 px-6 py-8 shadow-sm">
                        <div className="flex items-center gap-4 mb-6">
                            <button
                                onClick={() => navigate(-1)}
                                className="p-2 rounded-full hover:bg-gray-50 transition-colors"
                            >
                                <FiArrowLeft className="text-xl text-gray-700" />
                            </button>
                            <h1 className="text-2xl font-black text-gray-900 tracking-tight flex items-center gap-2">
                                <FiDollarSign className="text-primary-600" />
                                CREATOR WALLET
                            </h1>
                        </div>

                        {/* Summary Cards */}
                        <div className="grid grid-cols-3 gap-3">
                            <div className="bg-primary-50 p-4 rounded-2xl border border-primary-100">
                                <FiPieChart className="text-primary-600 mb-2" />
                                <p className="text-[10px] font-bold text-primary-400 uppercase tracking-wider">Total Earnings</p>
                                <p className="text-lg font-black text-primary-900">{formatPrice(total)}</p>
                            </div>
                            <div className="bg-green-50 p-4 rounded-2xl border border-green-100">
                                <FiCheckCircle className="text-green-600 mb-2" />
                                <p className="text-[10px] font-bold text-green-400 uppercase tracking-wider">Approved</p>
                                <p className="text-lg font-black text-green-900">{formatPrice(approved)}</p>
                            </div>
                            <div className="bg-yellow-50 p-4 rounded-2xl border border-yellow-100">
                                <FiClock className="text-yellow-600 mb-2" />
                                <p className="text-[10px] font-bold text-yellow-400 uppercase tracking-wider">Pending</p>
                                <p className="text-lg font-black text-yellow-900">{formatPrice(pending)}</p>
                            </div>
                        </div>
                    </div>

                    {/* Earnings List */}
                    <div className="px-6 py-8">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2 uppercase tracking-wide">
                                <FiTrendingUp className="text-primary-500" />
                                Earnings History
                            </h2>
                            <p className="text-xs text-gray-400 font-medium">Auto-updated</p>
                        </div>

                        <div className="space-y-4">
                            {records.map((record) => (
                                <div 
                                    key={record.id} 
                                    className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex flex-col gap-3 group transition-all hover:shadow-md"
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className={`p-2 rounded-xl ${record.orderStatus === 'delivered' ? 'bg-green-100 text-green-600' : 'bg-yellow-100 text-yellow-600'}`}>
                                                {record.orderStatus === 'delivered' ? <FiCheckCircle /> : <FiClock />}
                                            </div>
                                            <div>
                                                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Product Ref</p>
                                                <p className="text-sm font-black text-gray-800 leading-tight">...{String(record.productId).slice(-8)}</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Commission</p>
                                            <p className={`text-lg font-black ${record.orderStatus === 'delivered' ? 'text-green-600' : 'text-yellow-600'}`}>
                                                +{formatPrice(record.commissionAmount)}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between pt-3 border-t border-gray-50">
                                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-tight">Status: {record.orderStatus}</p>
                                        {record.orderStatus === 'pending' && (
                                            <button
                                                onClick={() => simulateDelivery(record.id)}
                                                className="text-[10px] font-black text-primary-600 hover:text-primary-700 underline uppercase tracking-widest decoration-2"
                                            >
                                                Simulate Delivery
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </MobileLayout>
        </PageTransition>
    );
};

export default WalletPage;
