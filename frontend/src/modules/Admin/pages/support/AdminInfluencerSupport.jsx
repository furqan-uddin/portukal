import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
    FiHelpCircle,
    FiMessageSquare,
    FiSend,
    FiUser,
    FiDollarSign,
    FiCheckCircle,
    FiClock,
    FiTag,
    FiSearch,
    FiAward,
} from 'react-icons/fi';
import api from '../../../../shared/utils/api';
import toast from 'react-hot-toast';
import { getSocket, joinRoom } from '../../../../shared/utils/socket';

const AdminInfluencerSupport = () => {
    const [tickets, setTickets] = useState([]);
    const [selectedTicket, setSelectedTicket] = useState(null);
    const [creatorWallet, setCreatorWallet] = useState(null);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');

    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const fetchTickets = useCallback(async () => {
        setLoading(true);
        try {
            const data = await api.get('/admin/influencer-support/tickets', { params: { search } });
            const list = data.tickets || data.data?.tickets || [];
            setTickets(list);
            if (list.length > 0 && !selectedTicket) {
                loadTicketDetail(list[0]._id);
            }
        } catch {
            toast.error('Failed to load influencer support tickets.');
        } finally {
            setLoading(false);
        }
    }, [search, selectedTicket]);

    const loadTicketDetail = async (id) => {
        try {
            const data = await api.get(`/admin/influencer-support/tickets/${id}`);
            const detail = data.ticket || data.data?.ticket;
            setSelectedTicket(detail);
            setCreatorWallet(data.wallet || data.data?.wallet);
            if (detail?._id) joinRoom(`ticket_${detail._id}`);
            scrollToBottom();
        } catch {
            toast.error('Failed to load ticket details.');
        }
    };

    const handleSendMessage = async () => {
        if (!newMessage.trim() || !selectedTicket?._id) return;
        try {
            const data = await api.post(`/admin/influencer-support/tickets/${selectedTicket._id}/message`, {
                message: newMessage.trim(),
            });
            setSelectedTicket(data.data || data);
            setNewMessage('');
            scrollToBottom();
        } catch {
            toast.error('Failed to send reply.');
        }
    };

    useEffect(() => {
        const token = localStorage.getItem('admin-token') || localStorage.getItem('token');
        if (!token) return;

        const socket = getSocket(token);
        if (!socket) return;

        fetchTickets();

        const handleSupportMsg = (msg) => {
            if (selectedTicket && msg.ticketId === selectedTicket._id) {
                setSelectedTicket((prev) => ({
                    ...prev,
                    messages: [...(prev.messages || []), msg],
                }));
                scrollToBottom();
            }
        };

        socket.on('new_support_message', handleSupportMsg);

        return () => {
            socket.off('new_support_message', handleSupportMsg);
        };
    }, [selectedTicket?._id, fetchTickets]);

    return (
        <div className="space-y-6 p-6">
            {/* Header */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2.5">
                        <FiMessageSquare className="text-purple-600" /> Influencer Support &amp; Live Chat
                    </h1>
                    <p className="text-sm text-slate-500 mt-1">Direct support channel for creator account verification, payouts, and technical help</p>
                </div>
            </div>

            {/* Chat Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[620px]">
                {/* Tickets List */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col overflow-hidden">
                    <div className="p-3.5 border-b border-slate-100 relative">
                        <FiSearch className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                        <input
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Search creator name or referral code..."
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-8 pr-3 py-2 text-xs text-slate-900 outline-none"
                        />
                    </div>

                    <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
                        {loading ? (
                            <div className="p-6 text-center text-xs text-slate-400">Loading influencer tickets...</div>
                        ) : tickets.length === 0 ? (
                            <div className="p-6 text-center text-xs text-slate-400">No active support tickets from influencers.</div>
                        ) : (
                            tickets.map((t) => (
                                <div
                                    key={t._id}
                                    onClick={() => loadTicketDetail(t._id)}
                                    className={`p-4 cursor-pointer transition-all ${
                                        selectedTicket?._id === t._id ? 'bg-purple-50 border-l-4 border-purple-600' : 'hover:bg-slate-50'
                                    }`}
                                >
                                    <div className="flex justify-between items-start mb-1">
                                        <span className="font-bold text-slate-900 text-xs line-clamp-1">{t.influencerId?.name || 'Creator'}</span>
                                        <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full ${
                                            t.status === 'resolved' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                                        }`}>
                                            {t.status}
                                        </span>
                                    </div>
                                    <p className="text-xs text-purple-700 font-semibold line-clamp-1">{t.subject}</p>
                                    <p className="text-[10px] text-slate-400 truncate mt-0.5">
                                        Code: {t.influencerId?.referralCode || 'INF'}
                                    </p>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Conversation Room & Creator Summary Drawer */}
                <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col overflow-hidden">
                    {selectedTicket ? (
                        <>
                            {/* Header Bar */}
                            <div className="p-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-purple-600 text-white font-bold flex items-center justify-center text-sm shadow-sm">
                                        {selectedTicket.influencerId?.name?.charAt(0) || 'I'}
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-slate-900 text-sm">{selectedTicket.influencerId?.name}</h3>
                                        <p className="text-xs text-purple-600 font-bold">Code: {selectedTicket.influencerId?.referralCode} • {selectedTicket.influencerId?.email}</p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3 text-xs">
                                    <span className="bg-purple-100 text-purple-800 font-extrabold px-3 py-1 rounded-full">
                                        Earned: ₹{creatorWallet?.totalEarned || '0.00'}
                                    </span>
                                </div>
                            </div>

                            {/* Message Stream */}
                            <div className="flex-1 p-4 overflow-y-auto space-y-3">
                                {selectedTicket.messages?.map((msg, idx) => (
                                    <div
                                        key={idx}
                                        className={`flex ${msg.senderType === 'admin' ? 'justify-end' : 'justify-start'}`}
                                    >
                                        <div className={`max-w-md p-3.5 rounded-2xl text-xs ${
                                            msg.senderType === 'admin' ? 'bg-purple-600 text-white' : 'bg-slate-100 text-slate-900'
                                        }`}>
                                            <p className="font-semibold text-[10px] mb-1 opacity-80">
                                                {msg.senderType === 'admin' ? 'You (Admin)' : selectedTicket.influencerId?.name || 'Creator'}
                                            </p>
                                            <p>{msg.message}</p>
                                            <span className="text-[9px] block text-right mt-1 opacity-60">
                                                {new Date(msg.createdAt || Date.now()).toLocaleTimeString()}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                                <div ref={messagesEndRef} />
                            </div>

                            {/* Reply Bar */}
                            <div className="p-3 border-t border-slate-100 flex gap-2">
                                <input
                                    value={newMessage}
                                    onChange={(e) => setNewMessage(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                                    placeholder="Type your response to creator..."
                                    className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-900 outline-none"
                                />
                                <button
                                    onClick={handleSendMessage}
                                    className="bg-purple-600 hover:bg-purple-700 text-white px-5 py-2.5 rounded-xl font-bold text-xs transition-all shadow-sm"
                                >
                                    <FiSend size={14} />
                                </button>
                            </div>
                        </>
                    ) : (
                        <div className="flex-1 flex items-center justify-center p-6 text-center text-slate-400 text-xs">
                            Select an influencer ticket to start live support messaging.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AdminInfluencerSupport;
