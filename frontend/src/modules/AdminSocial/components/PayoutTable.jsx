import React from 'react';
import { FiDollarSign, FiCheck, FiX, FiClock } from 'react-icons/fi';
import { formatPrice } from '../../../shared/utils/helpers';

const PayoutTable = ({ payouts, onUpdateStatus }) => {
    return (
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-gray-50 flex items-center justify-between">
                <h2 className="font-black text-gray-800 uppercase tracking-wide flex items-center gap-2">
                    <FiDollarSign className="text-primary-500" />
                    Pending Requests
                </h2>
                <span className="px-3 py-1 bg-primary-50 text-primary-600 rounded-full text-[10px] font-black uppercase tracking-widest">{payouts.length} items</span>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-gray-50/50 border-b border-gray-50">
                            <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Creator</th>
                            <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Amount</th>
                            <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Requested On</th>
                            <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {payouts.map((payout) => (
                            <tr key={payout.payoutId} className="hover:bg-gray-50/50 transition-colors">
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 font-black">
                                            {payout.creatorName[0]}
                                        </div>
                                        <div>
                                            <p className="font-bold text-gray-900 leading-tight">{payout.creatorName}</p>
                                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{payout.walletType} Wallet</p>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <span className="font-black text-gray-900 text-lg">{formatPrice(payout.amount)}</span>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-2 text-gray-500 font-medium text-sm">
                                        <FiClock size={14} />
                                        {payout.date}
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-2">
                                        <button 
                                            onClick={() => onUpdateStatus(payout.payoutId, 'approved')}
                                            className="px-4 py-2 bg-green-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-green-600 transition-all shadow-sm flex items-center gap-2"
                                        >
                                            <FiCheck /> Approve
                                        </button>
                                        <button 
                                            onClick={() => onUpdateStatus(payout.payoutId, 'rejected')}
                                            className="px-4 py-2 bg-white text-red-500 border border-red-100 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-red-50 transition-all flex items-center gap-2"
                                        >
                                            <FiX /> Reject
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default PayoutTable;
