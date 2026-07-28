import React from 'react';
import { FiClock, FiUser, FiActivity, FiFilter } from 'react-icons/fi';

const AuditLogTable = ({ logs }) => {
    return (
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-gray-50 flex items-center justify-between bg-gray-50/20">
                <h2 className="font-black text-gray-800 uppercase tracking-wide flex items-center gap-2">
                    <FiActivity className="text-primary-500" />
                    Security & Social Logs
                </h2>
                <div className="flex items-center gap-2 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                    <FiFilter /> Total entries: {logs.length}
                </div>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-gray-50/50 border-b border-gray-100">
                            <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Timestamp</th>
                            <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Admin</th>
                            <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Action</th>
                            <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Category</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {logs.map((log) => (
                            <tr key={log.logId} className="hover:bg-gray-50/30 transition-colors">
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-2 text-xs font-bold text-gray-500">
                                        <FiClock className="text-gray-300" />
                                        {new Date(log.timestamp).toLocaleString()}
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-2 bg-gray-100/50 w-max px-3 py-1.5 rounded-full border border-gray-100">
                                        <FiUser className="text-gray-400" size={12} />
                                        <span className="text-[10px] font-black text-gray-900 uppercase tracking-tighter">{log.performedBy}</span>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <p className="font-bold text-gray-800 text-sm leading-tight">{log.action}</p>
                                </td>
                                <td className="px-6 py-4">
                                    <span className={`px-2 py-0.5 rounded-md text-[8px] font-black uppercase tracking-[0.2em] border ${
                                        log.category === 'Finance' ? 'bg-blue-50 text-blue-600 border-blue-100' :
                                        log.category === 'Content' ? 'bg-purple-50 text-purple-600 border-purple-100' :
                                        'bg-gray-100 text-gray-500 border-gray-200'
                                    }`}>
                                        {log.category}
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default AuditLogTable;
