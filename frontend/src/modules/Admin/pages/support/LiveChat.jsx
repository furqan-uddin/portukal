import { useState, useEffect, useMemo, useRef } from 'react';
import { FiMessageCircle, FiSend, FiUser, FiClock, FiCheckCircle } from 'react-icons/fi';
import { motion } from 'framer-motion';
import { useSupportStore } from '../../../../shared/store/supportStore';
import { getSocket, joinRoom } from '../../../../shared/utils/socket';
import { useAdminAuthStore } from '../../store/adminStore';

const getCleanName = (name) => {
  if (!name) return 'Anonymous';
  return String(name).replace(/\s*\(Influencer\)/gi, '').replace(/\s*\(Vendor\)/gi, '').replace(/\s*\(Customer\)/gi, '').trim();
};

const getRoleBadgeStyle = (role) => {
  switch (role) {
    case 'influencer':
      return 'bg-purple-100 text-purple-700 border-purple-200';
    case 'vendor':
      return 'bg-blue-100 text-blue-700 border-blue-200';
    case 'delivery':
      return 'bg-amber-100 text-amber-700 border-amber-200';
    default:
      return 'bg-emerald-100 text-emerald-700 border-emerald-200';
  }
};

const LiveChat = () => {
  const { tickets, isLoading, fetchTickets, fetchTicketById, addReply } = useSupportStore();
  const { admin } = useAdminAuthStore();
  const [selectedChat, setSelectedChat] = useState(null);
  const [newMessage, setNewMessage] = useState('');
  const [activeSourceFilter, setActiveSourceFilter] = useState('all');
  const messagesEndRef = useRef(null);

  const sourceFilters = [
    { id: 'all', label: 'All Support Chats' },
    { id: 'customer', label: 'User Chats' },
    { id: 'vendor', label: 'Vendor Chats' },
    { id: 'influencer', label: 'Influencer Chats' },
    { id: 'delivery', label: 'Delivery Chats' },
  ];

  useEffect(() => {
    fetchTickets({
      limit: 200,
      source: activeSourceFilter !== 'all' ? activeSourceFilter : undefined,
    });
  }, [fetchTickets, activeSourceFilter]);

  // Auto-scroll messages to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [selectedChat?.messages]);

  useEffect(() => {
    const token = localStorage.getItem('admin-token') || localStorage.getItem('token');
    if (!token) return;

    const socket = getSocket(token);
    if (!socket) return;

    const handleNotification = (payload) => {
      if (payload.type === 'new_support_message' || payload.type === 'support_ticket_update') {
        fetchTickets({
          limit: 200,
          source: activeSourceFilter !== 'all' ? activeSourceFilter : undefined,
        });
      }
    };

    socket.on('new_notification', handleNotification);

    if (selectedChat?.id) {
      joinRoom(`ticket_${selectedChat.id}`);

      const handleNewMessage = (msg) => {
        setSelectedChat((prev) => {
          if (!prev || prev.id !== selectedChat.id) return prev;
          if (prev.messages?.some((m) => m._id === msg._id)) return prev;
          return {
            ...prev,
            messages: [...(prev.messages || []), msg],
          };
        });
      };

      socket.on('new_support_message', handleNewMessage);

      return () => {
        socket.off('new_notification', handleNotification);
        socket.off('new_support_message', handleNewMessage);
      };
    }

    return () => {
      socket.off('new_notification', handleNotification);
    };
  }, [selectedChat?.id, fetchTickets, activeSourceFilter]);

  const chats = useMemo(() => {
    return (tickets || [])
      .filter((ticket) => ['open', 'in_progress'].includes(ticket.status))
      .filter((ticket) => {
        if (activeSourceFilter === 'all') return true;
        const raisedBy =
          ticket.raisedBy ||
          (ticket.userId ? 'customer' : ticket.vendorId ? 'vendor' : ticket.deliveryBoyId ? 'delivery' : ticket.influencerId ? 'influencer' : 'customer');
        return raisedBy === activeSourceFilter;
      })
      .map((ticket) => {
        const lastMessage = ticket.messages?.[ticket.messages.length - 1];
        const raisedBy =
          ticket.raisedBy ||
          (ticket.userId ? 'customer' : ticket.vendorId ? 'vendor' : ticket.deliveryBoyId ? 'delivery' : ticket.influencerId ? 'influencer' : 'customer');
        return {
          id: ticket.id,
          customerName: getCleanName(ticket.customer?.name),
          customerEmail: ticket.customer?.email || '',
          lastMessage: lastMessage?.message || ticket.subject || 'No messages yet',
          unreadCount: 0,
          status: ticket.status,
          raisedBy,
          lastActivity: ticket.updatedAt || ticket.lastUpdate || ticket.createdAt,
        };
      });
  }, [tickets, activeSourceFilter]);

  const handleSelectChat = async (chat) => {
    const detail = await fetchTicketById(chat.id);
    if (detail) {
      setSelectedChat(detail);
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedChat?.id) return;
    const sent = await addReply(selectedChat.id, newMessage.trim());
    if (!sent) return;

    const refreshed = await fetchTicketById(selectedChat.id);
    if (refreshed) setSelectedChat(refreshed);
    setNewMessage('');
  };

  const selectedMessages = selectedChat?.messages || [];
  const selectedRole = selectedChat?.raisedBy || (selectedChat?.userId ? 'customer' : selectedChat?.vendorId ? 'vendor' : selectedChat?.deliveryBoyId ? 'delivery' : selectedChat?.influencerId ? 'influencer' : 'customer');
  const selectedCleanName = getCleanName(selectedChat?.customer?.name);

  return (
    <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-200 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Support Desk Live Chat</h1>
          <p className="text-xs text-slate-500 mt-0.5">Real-time omnichannel support hub for Users, Vendors, Creators, and Delivery</p>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 h-[630px]">
        {/* Left Column: Active Chats List */}
        <div className="lg:col-span-1 bg-white rounded-2xl shadow-sm border border-slate-200 flex flex-col overflow-hidden">
          <div className="p-3.5 border-b border-slate-100 bg-slate-50/50 space-y-2.5">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-slate-800 text-sm">Active Conversations</h3>
              <span className="text-xs bg-indigo-50 text-indigo-700 border border-indigo-100 px-2.5 py-0.5 rounded-full font-semibold">
                {chats.length} Active
              </span>
            </div>

            {/* Source Filter Dropdown */}
            <select
              value={activeSourceFilter}
              onChange={(e) => setActiveSourceFilter(e.target.value)}
              className="w-full text-xs font-semibold bg-white border border-slate-200 text-slate-700 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm cursor-pointer"
            >
              {sourceFilters.map((filter) => (
                <option key={filter.id} value={filter.id}>
                  {filter.label}
                </option>
              ))}
            </select>
          </div>

          <div className="divide-y divide-slate-100 flex-1 overflow-y-auto">
            {isLoading && chats.length === 0 ? (
              <div className="flex justify-center items-center p-8">
                <div className="animate-spin rounded-full h-7 w-7 border-b-2 border-indigo-600"></div>
              </div>
            ) : (
              chats.map((chat) => (
                <div
                  key={chat.id}
                  onClick={() => handleSelectChat(chat)}
                  className={`p-3.5 cursor-pointer transition-all ${
                    selectedChat?.id === chat.id ? 'bg-indigo-50/70 border-l-4 border-indigo-600' : 'hover:bg-slate-50/80'
                  }`}
                >
                  <div className="flex items-start justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center font-bold text-xs shadow-xs border border-slate-200">
                        {chat.customerName.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-semibold text-slate-800 text-sm leading-none">{chat.customerName}</span>
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border uppercase tracking-wider ${getRoleBadgeStyle(chat.raisedBy)}`}>
                            {chat.raisedBy === 'customer' ? 'USER' : chat.raisedBy}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <p className="text-xs text-slate-600 truncate pl-10">{chat.lastMessage}</p>
                  <div className="flex items-center justify-between text-[11px] text-slate-400 mt-1.5 pl-10">
                    <span className="flex items-center gap-1">
                      <FiClock className="text-[10px]" />
                      {chat.lastActivity ? new Date(chat.lastActivity).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'N/A'}
                    </span>
                    <span className="capitalize text-[10px] font-medium text-slate-500">{chat.status.replace('_', ' ')}</span>
                  </div>
                </div>
              ))
            )}

            {!isLoading && chats.length === 0 && (
              <div className="p-8 text-center text-slate-400 text-xs">
                No active support chats found for this filter.
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Conversation View */}
        {selectedChat ? (
          <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-slate-200 flex flex-col overflow-hidden">
            {/* Selected Chat Header */}
            <div className="p-3.5 border-b border-slate-200 bg-white flex items-center justify-between shadow-xs">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-base shadow-sm">
                  {selectedCleanName.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-slate-800 text-base">{selectedCleanName}</h3>
                    <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold border uppercase tracking-wider ${getRoleBadgeStyle(selectedRole)}`}>
                      {selectedRole === 'customer' ? 'USER' : selectedRole}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {selectedChat.customer?.email ? `${selectedChat.customer.email} • ` : ''}Ticket #{selectedChat.id.slice(-6).toUpperCase()}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs bg-emerald-50 text-emerald-700 border border-emerald-200 px-3 py-1 rounded-full font-semibold flex items-center gap-1">
                  <FiCheckCircle className="text-xs" /> Active Session
                </span>
              </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 p-4 overflow-y-auto space-y-3.5 bg-slate-50/60">
              {selectedMessages.map((msg, idx) => {
                const isAdmin = msg.senderType === 'admin';
                return (
                  <div key={`${msg.createdAt || idx}-${idx}`} className={`flex flex-col ${isAdmin ? 'items-end' : 'items-start'}`}>
                    <div className="flex items-end gap-2 max-w-[85%] sm:max-w-[75%]">
                      {!isAdmin && (
                        <div className="w-7 h-7 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center font-bold text-xs shrink-0 mb-1">
                          {selectedCleanName.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div
                        className={`p-3.5 text-sm shadow-xs ${
                          isAdmin
                            ? 'bg-gradient-to-r from-indigo-600 to-primary-600 text-white rounded-2xl rounded-tr-none'
                            : 'bg-white border border-slate-200 text-slate-800 rounded-2xl rounded-tl-none'
                        }`}
                      >
                        <div className={`text-[11px] font-semibold mb-1 ${isAdmin ? 'text-indigo-200' : 'text-slate-500'}`}>
                          {isAdmin ? 'Super Admin' : selectedCleanName}
                        </div>
                        <p className="leading-relaxed whitespace-pre-wrap">{msg.message}</p>
                        <p className={`text-[10px] mt-1.5 text-right ${isAdmin ? 'text-indigo-200' : 'text-slate-400'}`}>
                          {msg.createdAt ? new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Bar */}
            <div className="p-3.5 border-t border-slate-200 bg-white">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                  placeholder={`Reply to ${selectedCleanName}...`}
                  className="flex-1 px-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50/50"
                />
                <button
                  onClick={handleSendMessage}
                  disabled={!newMessage.trim()}
                  className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-medium text-sm rounded-xl transition-all shadow-sm flex items-center gap-2 active:scale-95 cursor-pointer"
                >
                  <span>Send</span>
                  <FiSend className="text-xs" />
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-slate-200 flex items-center justify-center p-12">
            <div className="text-center max-w-sm">
              <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4 border border-indigo-100 shadow-xs">
                <FiMessageCircle className="text-2xl" />
              </div>
              <h3 className="font-bold text-slate-800 text-lg mb-1">Select a Conversation</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Choose an active support ticket from the list on the left to start live messaging with the user or creator.
              </p>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default LiveChat;
