import React from 'react';
import { FiPlay, FiShield, FiTrash2, FiActivity } from 'react-icons/fi';

const ReelTable = ({ reels, onUpdateStatus }) => {
    return (
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-gray-50/50 border-b border-gray-100">
                            <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Creator</th>
                            <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Reports</th>
                            <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Status</th>
                            <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {reels.map((reel) => (
                            <tr key={reel.reelId} className="hover:bg-gray-50/50 transition-colors">
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-4">
                                        <div className="relative group cursor-pointer w-12 h-16 rounded-xl overflow-hidden bg-gray-100 border border-gray-200">
                                            <img src={reel.thumbnail} className="w-full h-full object-cover group-hover:scale-110 transition-transform" />
                                            <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/40 transition-all">
                                                <FiPlay className="text-white text-xs drop-shadow-lg" />
                                            </div>
                                        </div>
                                        <div>
                                            <p className="font-bold text-gray-900 leading-tight">{reel.creatorName}</p>
                                            <p className="text-[10px] text-gray-400 font-mono mt-0.5 uppercase tracking-tighter">ID: {reel.reelId}</p>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-2">
                                        <span className={`px-2 py-1 rounded-full text-[10px] font-black ${reel.reportsCount > 10 ? 'bg-red-50 text-red-600' : 'bg-gray-100 text-gray-500'}`}>
                                            {reel.reportsCount} Reports
                                        </span>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${
                                        reel.status === 'active' ? 'bg-green-50 text-green-600 border-green-100' : 
                                        reel.status === 'reported' ? 'bg-yellow-50 text-yellow-600 border-yellow-100' : 
                                        'bg-gray-50 text-gray-400 border-gray-100'
                                    }`}>
                                        {reel.status}
                                    </span>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-2">
                                        <button 
                                            onClick={() => onUpdateStatus(reel.reelId, 'active')}
                                            disabled={reel.status === 'active'}
                                            className="p-2 hover:bg-green-50 text-gray-400 hover:text-green-600 rounded-lg transition-all disabled:opacity-30 tooltip"
                                            title="Safe / Ignore Reports"
                                        >
                                            <FiShield size={18} />
                                        </button>
                                        <button 
                                            onClick={() => onUpdateStatus(reel.reelId, 'removed')}
                                            disabled={reel.status === 'removed'}
                                            className="p-2 hover:bg-red-50 text-gray-400 hover:text-red-600 rounded-lg transition-all disabled:opacity-30"
                                            title="Remove Content"
                                        >
                                            <FiTrash2 size={18} />
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

export default ReelTable;
