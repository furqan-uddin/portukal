import { useState, useEffect, useRef, useCallback } from 'react';
import {
    FiHelpCircle,
    FiMessageSquare,
    FiSend,
    FiUsers,
    FiBookOpen,
    FiCheckCircle,
    FiClock,
    FiShoppingBag,
    FiFilm,
    FiUser,
    FiSearch,
    FiCheck,
    FiPackage,
} from 'react-icons/fi';
import api from '../../../shared/utils/api';
import toast from 'react-hot-toast';
import { getSocket, joinRoom } from '../../../shared/utils/socket';

const InfluencerSupport = () => {
    const [activeTab, setActiveTab] = useState('admin_chat'); // 'admin_chat' | 'vendor_collab' | 'faq'
    
    // --- Domain 1: Admin Support Chat States ---
    const [adminTickets, setAdminTickets] = useState([]);
    const [selectedTicket, setSelectedTicket] = useState(null);
    const [newAdminMessage, setNewAdminMessage] = useState('');
    const [newSubject, setNewSubject] = useState('');
    const [showNewTicketModal, setShowNewTicketModal] = useState(false);
    const [loadingAdmin, setLoadingAdmin] = useState(true);

    // --- Domain 2: Vendor Creator Collaboration States ---
    const [collaborations, setCollaborations] = useState([]);
    const [selectedCollab, setSelectedCollab] = useState(null);
    const [collabMessages, setCollabMessages] = useState([]);
    const [newCollabMessage, setNewCollabMessage] = useState('');
    const [loadingCollab, setLoadingCollab] = useState(true);
    const [collabSearch, setCollabSearch] = useState('');

    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    // -------------------------------------------------------------------------
    // Domain 1: Admin Support Chat Handlers
    // -------------------------------------------------------------------------
    const fetchAdminTickets = useCallback(async () => {
        setLoadingAdmin(true);
        try {
            const data = await api.get('/influencer/support/tickets');
            const list = data.data || data || [];
            setAdminTickets(list);
            if (list.length > 0 && !selectedTicket) {
                setSelectedTicket(list[0]);
            }
        } catch {
            toast.error('Failed to load support chats.');
        } finally {
            setLoadingAdmin(false);
        }
    }, [selectedTicket]);

    const handleCreateAdminTicket = async (e) => {
        e.preventDefault();
        if (!newSubject.trim() || !newAdminMessage.trim()) {
            toast.error('Subject and message are required.');
            return;
        }
        try {
            const res = await api.post('/influencer/support/tickets', {
                subject: newSubject.trim(),
                message: newAdminMessage.trim(),
            });
            toast.success('Admin support ticket opened!');
            setNewSubject('');
            setNewAdminMessage('');
            setShowNewTicketModal(false);
            fetchAdminTickets();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to start chat.');
        }
    };

    const handleSendAdminReply = async () => {
        if (!newAdminMessage.trim() || !selectedTicket?._id) return;
        try {
            const res = await api.post(`/influencer/support/tickets/${selectedTicket._id}/message`, {
                message: newAdminMessage.trim(),
            });
            setSelectedTicket(res.data || res);
            setNewAdminMessage('');
            scrollToBottom();
        } catch {
            toast.error('Failed to send message.');
        }
    };

    // -------------------------------------------------------------------------
    // Domain 2: Vendor Collaboration Handlers
    // -------------------------------------------------------------------------
    const fetchCollaborations = useCallback(async () => {
        setLoadingCollab(true);
        try {
            const data = await api.get('/influencer/collaborations');
            const list = data.collaborations || data.data?.collaborations || [];
            setCollaborations(list);
            if (list.length > 0 && !selectedCollab) {
                loadCollabDetail(list[0]._id);
            }
        } catch {
            toast.error('Failed to load collaborations.');
        } finally {
            setLoadingCollab(false);
        }
    }, [selectedCollab]);

    const loadCollabDetail = async (id) => {
        try {
            const data = await api.get(`/influencer/collaborations/${id}`);
            setSelectedCollab(data.collaboration || data.data?.collaboration);
            setCollabMessages(data.messages || data.data?.messages || []);
            scrollToBottom();
        } catch {
            toast.error('Failed to load discussion.');
        }
    };

    const handleSendCollabMessage = async () => {
        if (!newCollabMessage.trim() || !selectedCollab?._id) return;
        const msgText = newCollabMessage.trim();
        setNewCollabMessage('');
        try {
            const data = await api.post(`/influencer/collaborations/${selectedCollab._id}/message`, {
                text: msgText,
            });
            const msgObj = data.data || data;
            setCollabMessages((prev) => {
                if (prev.some((m) => m._id === msgObj._id || (m.senderId === msgObj.senderId && m.text === msgObj.text && Math.abs(new Date(m.createdAt || Date.now()) - new Date(msgObj.createdAt || Date.now())) < 3000))) {
                    return prev;
                }
                return [...prev, msgObj];
            });
            scrollToBottom();
        } catch {
            toast.error('Failed to send message.');
        }
    };

    // Setup Socket IO for Realtime Chat Updates
    useEffect(() => {
        const token = localStorage.getItem('influencerToken') || localStorage.getItem('token');
        if (!token) return;

        const socket = getSocket(token);
        if (!socket) return;

        if (activeTab === 'admin_chat') fetchAdminTickets();
        if (activeTab === 'vendor_collab') fetchCollaborations();

        if (selectedTicket?._id) {
            joinRoom(`ticket_${selectedTicket._id}`);
        }

        if (selectedCollab?._id) {
            joinRoom(`collab_${selectedCollab._id}`);
        }

        const handleNotification = (payload) => {
            if (payload.type === 'new_support_message' || payload.type === 'support_ticket_update') {
                fetchAdminTickets();
            }
            if (payload.type === 'new_collaboration_message' || payload.type === 'collaboration_updated') {
                fetchCollaborations();
            }
        };

        const handleSupportMsg = (msg) => {
            if (selectedTicket && msg.ticketId === selectedTicket._id) {
                setSelectedTicket((prev) => {
                    if (!prev) return prev;
                    if (prev.messages?.some((m) => m._id === msg._id)) return prev;
                    return {
                        ...prev,
                        messages: [...(prev.messages || []), msg],
                    };
                });
                scrollToBottom();
            }
        };

        const handleCollabMsg = (msg) => {
            if (selectedCollab && (msg.collaborationId === selectedCollab._id || msg.collaborationId?._id === selectedCollab._id)) {
                setCollabMessages((prev) => {
                    if (prev.some((m) => m._id === msg._id || (m.text === msg.text && Math.abs(new Date(m.createdAt || Date.now()) - new Date(msg.createdAt || Date.now())) < 3000))) {
                        return prev;
                    }
                    return [...prev, msg];
                });
                scrollToBottom();
            }
        };

        socket.on('new_notification', handleNotification);
        socket.on('new_support_message', handleSupportMsg);
        socket.on('new_collaboration_message', handleCollabMsg);

        return () => {
            socket.off('new_notification', handleNotification);
            socket.off('new_support_message', handleSupportMsg);
            socket.off('new_collaboration_message', handleCollabMsg);
        };
    }, [activeTab, selectedTicket?._id, selectedCollab?._id, fetchAdminTickets, fetchCollaborations]);

    const faqs = [
        { q: 'How are affiliate commissions calculated?', a: 'Commissions are calculated as a percentage of net order value using your referral code or affiliate link.' },
        { q: 'When are commission funds released to my Available Balance?', a: 'Commissions move to Available Balance after the customer return window (default 7 days) expires.' },
        { q: 'What is the minimum withdrawal amount?', a: 'Minimum withdrawal is ₹100. Payouts are transferred via direct IMPS/NEFT bank settlement.' },
    ];

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2.5">
                        <FiHelpCircle className="text-purple-600" /> Creator Support &amp; Communication Center
                    </h1>
                    <p className="text-sm text-slate-500 mt-1">Live chat with Admin support or manage vendor product promotion collaborations</p>
                </div>

                <div className="flex items-center gap-2 bg-slate-100 p-1.5 rounded-xl border border-slate-200 flex-wrap">
                    <button
                        onClick={() => setActiveTab('admin_chat')}
                        className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                            activeTab === 'admin_chat' ? 'bg-purple-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
                        }`}
                    >
                        <FiMessageSquare className="inline mr-1.5" /> Admin Live Chat
                    </button>
                    <button
                        onClick={() => setActiveTab('vendor_collab')}
                        className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                            activeTab === 'vendor_collab' ? 'bg-purple-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
                        }`}
                    >
                        <FiUsers className="inline mr-1.5" /> Vendor Collaborations
                    </button>
                    <button
                        onClick={() => setActiveTab('faq')}
                        className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                            activeTab === 'faq' ? 'bg-purple-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
                        }`}
                    >
                        <FiBookOpen className="inline mr-1.5" /> FAQs &amp; Guides
                    </button>
                </div>
            </div>

            {/* TAB 1: ADMIN LIVE CHAT */}
            {activeTab === 'admin_chat' && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[600px]">
                    {/* Tickets Sidebar */}
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col overflow-hidden">
                        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                            <h3 className="font-bold text-slate-900 text-sm">Support Tickets</h3>
                            <button
                                onClick={() => setShowNewTicketModal(true)}
                                className="bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold px-3 py-1.5 rounded-xl transition-all shadow-sm"
                            >
                                + New Chat
                            </button>
                        </div>
                        <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
                            {loadingAdmin ? (
                                <div className="p-6 text-center text-xs text-slate-400">Loading support threads...</div>
                            ) : adminTickets.length === 0 ? (
                                <div className="p-6 text-center text-xs text-slate-400">No support tickets yet. Click + New Chat to start.</div>
                            ) : (
                                adminTickets.map((t) => (
                                    <div
                                        key={t._id}
                                        onClick={() => setSelectedTicket(t)}
                                        className={`p-4 cursor-pointer transition-all ${
                                            selectedTicket?._id === t._id ? 'bg-purple-50 border-l-4 border-purple-600' : 'hover:bg-slate-50'
                                        }`}
                                    >
                                        <div className="flex justify-between items-start mb-1">
                                            <span className="font-bold text-slate-900 text-xs line-clamp-1">{t.subject}</span>
                                            <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full ${
                                                t.status === 'resolved' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                                            }`}>
                                                {t.status}
                                            </span>
                                        </div>
                                        <p className="text-[11px] text-slate-500 truncate">
                                            {t.messages?.[t.messages.length - 1]?.message || 'No messages'}
                                        </p>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Chat Messages Area */}
                    <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col overflow-hidden">
                        {selectedTicket ? (
                            <>
                                <div className="p-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
                                    <div>
                                        <h3 className="font-bold text-slate-900 text-sm">{selectedTicket.subject}</h3>
                                        <p className="text-[11px] text-purple-600 font-semibold">Admin Support Representative</p>
                                    </div>
                                    <span className="text-xs bg-emerald-100 text-emerald-800 font-bold px-2.5 py-1 rounded-full flex items-center gap-1">
                                        ● Active Live Chat
                                    </span>
                                </div>

                                <div className="flex-1 p-4 overflow-y-auto space-y-3">
                                    {selectedTicket.messages?.map((msg, idx) => (
                                        <div
                                            key={idx}
                                            className={`flex ${msg.senderType === 'influencer' ? 'justify-end' : 'justify-start'}`}
                                        >
                                            <div className={`max-w-md p-3.5 rounded-2xl text-xs ${
                                                msg.senderType === 'influencer' ? 'bg-purple-600 text-white' : 'bg-slate-100 text-slate-900'
                                            }`}>
                                                <p className="font-semibold text-[10px] mb-1 opacity-80">
                                                    {msg.senderType === 'influencer' ? 'You' : 'Admin Support'}
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

                                <div className="p-3 border-t border-slate-100 flex gap-2">
                                    <input
                                        value={newAdminMessage}
                                        onChange={(e) => setNewAdminMessage(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && handleSendAdminReply()}
                                        placeholder="Type your message for Admin..."
                                        className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-900 outline-none"
                                    />
                                    <button
                                        onClick={handleSendAdminReply}
                                        className="bg-purple-600 hover:bg-purple-700 text-white px-5 py-2.5 rounded-xl font-bold text-xs transition-all shadow-sm"
                                    >
                                        <FiSend size={14} />
                                    </button>
                                </div>
                            </>
                        ) : (
                            <div className="flex-1 flex items-center justify-center p-6 text-center text-slate-400 text-xs">
                                Select or create a support ticket to start live chat with Admin.
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* TAB 2: VENDOR CREATOR COLLABORATIONS */}
            {activeTab === 'vendor_collab' && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[600px]">
                    {/* Collaborations List */}
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col overflow-hidden">
                        <div className="p-4 border-b border-slate-100">
                            <h3 className="font-bold text-slate-900 text-sm">Vendor Deals &amp; Messages</h3>
                        </div>
                        <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
                            {loadingCollab ? (
                                <div className="p-6 text-center text-xs text-slate-400">Loading vendor discussions...</div>
                            ) : collaborations.length === 0 ? (
                                <div className="p-6 text-center text-xs text-slate-400">No vendor collaborations yet. Browse marketplace or accept vendor offers.</div>
                            ) : (
                                collaborations.map((c) => (
                                    <div
                                        key={c._id}
                                        onClick={() => loadCollabDetail(c._id)}
                                        className={`p-4 cursor-pointer transition-all ${
                                            selectedCollab?._id === c._id ? 'bg-purple-50 border-l-4 border-purple-600' : 'hover:bg-slate-50'
                                        }`}
                                    >
                                        <div className="flex justify-between items-center mb-1">
                                            <span className="font-bold text-slate-900 text-xs">{c.vendorId?.storeName || 'Vendor'}</span>
                                            <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full ${
                                                c.status === 'accepted' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                                            }`}>
                                                {c.status}
                                            </span>
                                        </div>
                                        <p className="text-[11px] text-purple-600 font-semibold line-clamp-1">Product: {c.productId?.name || 'Catalog Item'}</p>
                                        <p className="text-[10px] text-slate-500 truncate mt-0.5">{c.lastMessage || 'No messages yet'}</p>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Vendor Conversation Thread */}
                    <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col overflow-hidden">
                        {selectedCollab ? (
                            <>
                                <div className="p-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
                                    <div>
                                        <h3 className="font-bold text-slate-900 text-sm">{selectedCollab.vendorId?.storeName || 'Vendor Store'}</h3>
                                        <p className="text-[11px] text-purple-600 font-semibold">Offered Commission: {selectedCollab.offer?.commissionPercent || 10}%</p>
                                    </div>
                                    <span className="text-xs bg-purple-100 text-purple-800 font-bold px-3 py-1 rounded-full">
                                        Status: {selectedCollab.status.toUpperCase()}
                                    </span>
                                </div>

                                <div className="flex-1 p-4 overflow-y-auto space-y-3">
                                    {collabMessages.map((msg, idx) => (
                                        <div
                                            key={msg._id || idx}
                                            className={`flex ${msg.senderModel === 'Influencer' ? 'justify-end' : 'justify-start'}`}
                                        >
                                            <div className={`max-w-md p-3.5 rounded-2xl text-xs ${
                                                msg.senderModel === 'Influencer' ? 'bg-purple-600 text-white' : 'bg-slate-100 text-slate-900'
                                            }`}>
                                                <p className="font-semibold text-[10px] mb-1 opacity-80">
                                                    {msg.senderModel === 'Influencer' ? 'You' : selectedCollab.vendorId?.storeName || 'Vendor'}
                                                </p>
                                                {msg.text && <p>{msg.text}</p>}
                                                {msg.productData && (
                                                    <div className="mt-2 bg-white/10 p-2 rounded-xl border border-white/20 flex items-center gap-2">
                                                        <FiShoppingBag size={16} />
                                                        <div>
                                                            <p className="font-bold">{msg.productData.name}</p>
                                                            <p className="text-[10px]">₹{msg.productData.price}</p>
                                                        </div>
                                                    </div>
                                                )}
                                                <span className="text-[9px] block text-right mt-1 opacity-60">
                                                    {new Date(msg.createdAt || Date.now()).toLocaleTimeString()}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                    <div ref={messagesEndRef} />
                                </div>

                                <div className="p-3 border-t border-slate-100 flex gap-2">
                                    <input
                                        value={newCollabMessage}
                                        onChange={(e) => setNewCollabMessage(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && handleSendCollabMessage()}
                                        placeholder="Type your message for Vendor..."
                                        className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-900 outline-none"
                                    />
                                    <button
                                        onClick={handleSendCollabMessage}
                                        className="bg-purple-600 hover:bg-purple-700 text-white px-5 py-2.5 rounded-xl font-bold text-xs transition-all shadow-sm"
                                    >
                                        <FiSend size={14} />
                                    </button>
                                </div>
                            </>
                        ) : (
                            <div className="flex-1 flex items-center justify-center p-6 text-center text-slate-400 text-xs">
                                Select a vendor collaboration thread to start messaging.
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* TAB 3: FAQS */}
            {activeTab === 'faq' && (
                <div className="space-y-4">
                    <h2 className="text-lg font-bold text-slate-900">Frequently Asked Questions</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {faqs.map((faq, idx) => (
                            <div key={idx} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2">
                                <h3 className="font-bold text-slate-900 text-sm">{faq.q}</h3>
                                <p className="text-xs text-slate-600 leading-relaxed">{faq.a}</p>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* New Ticket Modal */}
            {showNewTicketModal && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl border border-slate-200 space-y-4">
                        <h3 className="font-bold text-slate-900 text-lg">Open Admin Support Ticket</h3>
                        <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1">Subject</label>
                            <input
                                value={newSubject}
                                onChange={(e) => setNewSubject(e.target.value)}
                                placeholder="e.g. Question about payout release date"
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-900 outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1">Initial Message</label>
                            <textarea
                                value={newAdminMessage}
                                onChange={(e) => setNewAdminMessage(e.target.value)}
                                rows={4}
                                placeholder="Describe your query in detail..."
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-900 outline-none resize-none"
                            />
                        </div>
                        <div className="flex gap-3">
                            <button onClick={() => setShowNewTicketModal(false)} className="flex-1 bg-slate-100 text-slate-700 py-2.5 rounded-xl text-xs font-bold">Cancel</button>
                            <button onClick={handleCreateAdminTicket} className="flex-1 bg-purple-600 text-white py-2.5 rounded-xl text-xs font-bold shadow-sm">Start Support Live Chat</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default InfluencerSupport;
