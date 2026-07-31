import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    FiUsers,
    FiSearch,
    FiSend,
    FiCheck,
    FiX,
    FiShoppingBag,
    FiPackage,
    FiGift,
    FiCheckCircle,
    FiClock,
    FiMessageSquare,
    FiTrendingUp,
} from 'react-icons/fi';
import api from '../../../shared/utils/api';
import toast from 'react-hot-toast';
import { getSocket, joinRoom } from '../../../shared/utils/socket';

const VendorCreatorCollaborations = () => {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('all'); // 'all' | 'active' | 'pending' | 'completed' | 'rejected'
    const [collaborations, setCollaborations] = useState([]);
    const [selectedCollab, setSelectedCollab] = useState(null);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [actionLoading, setActionLoading] = useState('');
    const [trackingNumber, setTrackingNumber] = useState('');
    const [showSampleModal, setShowSampleModal] = useState(false);

    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const fetchCollaborations = useCallback(async () => {
        setLoading(true);
        try {
            const data = await api.get('/vendor/creator-collaborations', { params: { status: activeTab, search } });
            const list = data.collaborations || data.data?.collaborations || [];
            setCollaborations(list);
            if (list.length > 0 && !selectedCollab) {
                const urlParams = new URLSearchParams(window.location.search);
                const targetInf = urlParams.get('influencer');
                if (targetInf) {
                    const match = list.find((c) => 
                        String(c.influencerId?._id) === String(targetInf) || 
                        c.influencerId?.slug === targetInf || 
                        (c.influencerId?.name && c.influencerId.name.toLowerCase().includes(targetInf.toLowerCase()))
                    );
                    if (match) {
                        loadCollabDetail(match._id);
                        return;
                    }
                }
                loadCollabDetail(list[0]._id);
            }
        } catch {
            toast.error('Failed to load creator collaborations.');
        } finally {
            setLoading(false);
        }
    }, [activeTab, search, selectedCollab]);

    const loadCollabDetail = async (id) => {
        try {
            const data = await api.get(`/vendor/creator-collaborations/${id}`);
            setSelectedCollab(data.collaboration || data.data?.collaboration);
            setMessages(data.messages || data.data?.messages || []);
            scrollToBottom();
        } catch {
            toast.error('Failed to load thread.');
        }
    };

    const handleSendMessage = async () => {
        if (!newMessage.trim() || !selectedCollab?._id) return;
        const msgText = newMessage.trim();
        setNewMessage('');
        try {
            const data = await api.post(`/vendor/creator-collaborations/${selectedCollab._id}/message`, {
                text: msgText,
            });
            const msgObj = data.data || data;
            setMessages((prev) => {
                if (prev.some((m) => m._id === msgObj._id || (m.senderModel === msgObj.senderModel && m.text === msgObj.text && Math.abs(new Date(m.createdAt || Date.now()) - new Date(msgObj.createdAt || Date.now())) < 3000))) {
                    return prev;
                }
                return [...prev, msgObj];
            });
            scrollToBottom();
        } catch {
            toast.error('Failed to send message.');
        }
    };

    const handleStatusUpdate = async (status) => {
        if (!selectedCollab?._id) return;
        setActionLoading(status);
        try {
            const data = await api.patch(`/vendor/creator-collaborations/${selectedCollab._id}/status`, { status });
            setSelectedCollab(data.collab || data.data?.collab || { ...selectedCollab, status });
            toast.success(`Collaboration status updated to ${status.toUpperCase()}`);
            fetchCollaborations();
        } catch {
            toast.error('Failed to update status.');
        } finally {
            setActionLoading('');
        }
    };

    const handleShipSample = async () => {
        if (!trackingNumber.trim() || !selectedCollab?._id) {
            toast.error('Please enter a valid tracking number.');
            return;
        }
        try {
            await api.patch(`/vendor/creator-collaborations/${selectedCollab._id}/sample`, {
                trackingNumber: trackingNumber.trim(),
            });
            toast.success('Sample tracking number saved!');
            setShowSampleModal(false);
            setTrackingNumber('');
            loadCollabDetail(selectedCollab._id);
        } catch {
            toast.error('Failed to update sample tracking.');
        }
    };

    // Socket IO for Live Messages
    useEffect(() => {
        const token = localStorage.getItem('vendor-token') || localStorage.getItem('vendorToken') || localStorage.getItem('token');
        if (!token) return;

        const socket = getSocket(token);
        if (!socket) return;

        fetchCollaborations();

        if (selectedCollab?._id) {
            joinRoom(`collab_${selectedCollab._id}`);
        }

        const handleCollabMsg = (msg) => {
            const msgCollabId = String(msg.collaborationId?._id || msg.collaborationId || '');
            const activeCollabId = String(selectedCollab?._id || '');
            if (activeCollabId && msgCollabId === activeCollabId) {
                setMessages((prev) => {
                    if (prev.some((m) => (m._id && msg._id && m._id === msg._id) || (m.text === msg.text && Math.abs(new Date(m.createdAt || Date.now()) - new Date(msg.createdAt || Date.now())) < 3000))) {
                        return prev;
                    }
                    return [...prev, msg];
                });
                scrollToBottom();
            }
        };

        const handleCollabUpdate = (payload) => {
            const payloadCollabId = String(payload.collaborationId?._id || payload.collaborationId || '');
            const activeCollabId = String(selectedCollab?._id || '');
            if (activeCollabId && payloadCollabId === activeCollabId) {
                setSelectedCollab(payload.collab);
            }
        };

        const handleNotification = (payload) => {
            if (payload.type === 'new_collaboration_message' || payload.type === 'collaboration_updated') {
                fetchCollaborations();
            }
        };

        socket.on('new_notification', handleNotification);
        socket.on('new_collaboration_message', handleCollabMsg);
        socket.on('collaboration_updated', handleCollabUpdate);

        return () => {
            socket.off('new_notification', handleNotification);
            socket.off('new_collaboration_message', handleCollabMsg);
            socket.off('collaboration_updated', handleCollabUpdate);
        };
    }, [activeTab, selectedCollab?._id, fetchCollaborations]);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2.5">
                        <FiUsers className="text-purple-600" /> Creator Collaborations Hub
                    </h1>
                    <p className="text-sm text-slate-500 mt-1">Manage influencer product deals, negotiations, sample shipments, and campaign messages</p>
                </div>
            </div>

            {/* Navigation Tabs */}
            <div className="bg-white p-2 rounded-2xl border border-slate-200/80 shadow-sm flex gap-2 flex-wrap">
                {['all', 'active', 'pending', 'completed', 'rejected'].map((tab) => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`px-5 py-2 rounded-xl text-xs font-bold capitalize transition-all ${
                            activeTab === tab ? 'bg-purple-600 text-white shadow-sm' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                        }`}
                    >
                        {tab} Deals
                    </button>
                ))}
            </div>

            {/* Main Chat Interface */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[620px]">
                {/* Threads Sidebar */}
                <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm flex flex-col overflow-hidden">
                    <div className="p-3.5 border-b border-slate-100 relative">
                        <FiSearch className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                        <input
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Search creator name or handle..."
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-8 pr-3 py-2 text-xs text-slate-900 outline-none"
                        />
                    </div>

                    <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
                        {loading ? (
                            <div className="p-6 text-center text-xs text-slate-400">Loading collaborations...</div>
                        ) : collaborations.length === 0 ? (
                            <div className="p-6 text-center text-xs text-slate-400">No creator deals found in this status.</div>
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
                                        <span className="font-bold text-slate-900 text-xs">{c.influencerId?.name || 'Creator'}</span>
                                        <span className={`text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full ${
                                            c.status === 'accepted' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                                        }`}>
                                            {c.status}
                                        </span>
                                    </div>
                                    
                                    {/* Product Mini Banner */}
                                    <div className="flex items-center gap-2 my-1 bg-white p-1.5 rounded-lg border border-slate-100">
                                        <img
                                            src={c.productId?.image || (c.productId?.images && c.productId.images[0]) || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=100'}
                                            alt=""
                                            className="w-7 h-7 rounded-md object-cover border border-slate-200 shrink-0"
                                            onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=100'; }}
                                        />
                                        <div className="min-w-0 flex-1">
                                            <p className="text-[11px] font-bold text-slate-800 truncate">{c.productId?.name || 'Catalog Item'}</p>
                                            <p className="text-[10px] text-purple-600 font-bold">₹{c.productId?.price?.toLocaleString() || '0'} • {c.offeredCommissionPercent || c.offer?.commissionPercent || 10}% Comm</p>
                                        </div>
                                    </div>

                                    <p className="text-[10px] text-slate-500 truncate mt-0.5">{c.lastMessage || 'No messages'}</p>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Conversation Room & Controls */}
                <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/80 shadow-sm flex flex-col overflow-hidden">
                    {selectedCollab ? (
                        <>
                            {/* Room Header */}
                            <div className="p-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between flex-wrap gap-2">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold text-sm border border-purple-200">
                                        {selectedCollab.influencerId?.name?.charAt(0) || 'C'}
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-slate-900 text-sm">{selectedCollab.influencerId?.name} (@{selectedCollab.influencerId?.slug || 'creator'})</h3>
                                        <p className="text-xs text-purple-600 font-semibold">Offered Commission: {selectedCollab.offeredCommissionPercent || selectedCollab.offer?.commissionPercent || 10}%</p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2">
                                    <span className={`text-xs font-bold px-3 py-1 rounded-full border ${
                                        selectedCollab.status === 'accepted'
                                            ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                                            : selectedCollab.status === 'rejected'
                                            ? 'bg-red-100 text-red-800 border-red-200'
                                            : 'bg-amber-100 text-amber-800 border-amber-200'
                                    }`}>
                                        {selectedCollab.status.toUpperCase()}
                                    </span>


                                    <button
                                        onClick={() => setShowSampleModal(true)}
                                        className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-xl text-xs font-bold transition-all flex items-center gap-1"
                                    >
                                        <FiGift size={14} /> Ship Sample
                                    </button>
                                </div>
                            </div>

                            {/* Product Deal Details Banner */}
                            <div className="p-3.5 bg-purple-50/70 border-b border-purple-100 flex items-center justify-between gap-3 flex-wrap">
                                <div className="flex items-center gap-3">
                                    <img
                                        src={selectedCollab.productId?.image || (selectedCollab.productId?.images && selectedCollab.productId.images[0]) || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=150'}
                                        alt="Product"
                                        className="w-12 h-12 rounded-xl object-cover border border-purple-200 shadow-sm shrink-0"
                                        onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=150'; }}
                                    />
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-[10px] uppercase font-black text-purple-700 bg-purple-200/70 px-2 py-0.5 rounded">Product Deal</span>
                                            <span className="text-xs font-extrabold text-slate-900">{selectedCollab.productId?.name || 'Catalog Item'}</span>
                                        </div>
                                        <div className="flex items-center gap-3 text-xs font-bold text-slate-700 mt-1 flex-wrap">
                                            <span>Price: <strong className="text-slate-900">₹{selectedCollab.productId?.price?.toLocaleString() || '0'}</strong></span>
                                            <span>Commission Rate: <strong className="text-purple-600 font-extrabold">{selectedCollab.offeredCommissionPercent || selectedCollab.offer?.commissionPercent || 10}%</strong></span>
                                            <span className="text-emerald-700 font-bold bg-emerald-100 px-2 py-0.5 rounded-md text-[11px]">Est. Payout / Sale: ₹{Math.round(((selectedCollab.productId?.price || 0) * (selectedCollab.offeredCommissionPercent || selectedCollab.offer?.commissionPercent || 10)) / 100)}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2">
                                    {selectedCollab.status === 'pending' || selectedCollab.status === 'requested' ? (
                                        <>
                                            <button
                                                type="button"
                                                onClick={() => handleStatusUpdate('accepted')}
                                                disabled={actionLoading === 'accepted'}
                                                className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1 shadow-sm cursor-pointer"
                                            >
                                                <FiCheck size={14} /> Approve Deal
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => handleStatusUpdate('rejected')}
                                                disabled={actionLoading === 'rejected'}
                                                className="px-3.5 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1 shadow-sm cursor-pointer"
                                            >
                                                <FiX size={14} /> Decline
                                            </button>
                                        </>
                                    ) : selectedCollab.status === 'accepted' ? (
                                        <button
                                            type="button"
                                            onClick={() => handleStatusUpdate('rejected')}
                                            disabled={actionLoading === 'rejected'}
                                            className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-xl text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                                        >
                                            <FiX size={14} /> Decline / Revoke
                                        </button>
                                    ) : null}

                                    <button
                                        type="button"
                                        onClick={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            const pSlug = selectedCollab.productId?.slug || selectedCollab.productId?._id || selectedCollab.productId?.id;
                                            if (pSlug) {
                                                window.open(`/product/${pSlug}`, '_blank');
                                            } else {
                                                navigate('/vendor/products/manage-products');
                                            }
                                        }}
                                        className="px-3.5 py-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold transition-all shadow-sm shrink-0 flex items-center gap-1.5 cursor-pointer hover:border-purple-300 relative z-10"
                                    >
                                        <FiShoppingBag size={14} className="text-purple-600" />
                                        <span>View Product 🛍️</span>
                                    </button>
                                </div>
                            </div>

                            {/* Message Stream */}
                            <div className="flex-1 p-4 overflow-y-auto space-y-3">
                                {messages.map((msg, idx) => (
                                    <div
                                        key={msg._id || idx}
                                        className={`flex ${msg.senderModel === 'Vendor' ? 'justify-end' : 'justify-start'}`}
                                    >
                                        <div className={`max-w-md p-3.5 rounded-2xl text-xs ${
                                            msg.senderModel === 'Vendor' ? 'bg-purple-600 text-white' : 'bg-slate-100 text-slate-900'
                                        }`}>
                                            <p className="font-semibold text-[10px] mb-1 opacity-80">
                                                {msg.senderModel === 'Vendor' ? 'You (Store Owner)' : selectedCollab.influencerId?.name || 'Creator'}
                                            </p>
                                            {msg.text && <p>{msg.text}</p>}
                                            <span className="text-[9px] block text-right mt-1 opacity-60">
                                                {new Date(msg.createdAt || Date.now()).toLocaleTimeString()}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                                <div ref={messagesEndRef} />
                            </div>

                            {/* Input Bar */}
                            <div className="p-3 border-t border-slate-100 flex gap-2">
                                <input
                                    value={newMessage}
                                    onChange={(e) => setNewMessage(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                                    placeholder="Type your message for creator..."
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
                            Select a creator collaboration thread to open live messaging.
                        </div>
                    )}
                </div>
            </div>

            {/* Ship Sample Modal */}
            {showSampleModal && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl border border-slate-200 space-y-4">
                        <h3 className="font-bold text-slate-900 text-lg">Ship Product Sample to Creator</h3>
                        <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1">Courier Tracking Number</label>
                            <input
                                value={trackingNumber}
                                onChange={(e) => setTrackingNumber(e.target.value)}
                                placeholder="e.g. AWB984201859"
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-900 outline-none"
                            />
                        </div>
                        <div className="flex gap-3">
                            <button onClick={() => setShowSampleModal(false)} className="flex-1 bg-slate-100 text-slate-700 py-2.5 rounded-xl text-xs font-bold">Cancel</button>
                            <button onClick={handleShipSample} className="flex-1 bg-purple-600 text-white py-2.5 rounded-xl text-xs font-bold shadow-sm">Save Tracking Info</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default VendorCreatorCollaborations;
