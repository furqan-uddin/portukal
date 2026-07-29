import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    FiBell,
    FiCheck,
    FiCheckCircle,
    FiTrash2,
    FiAlertCircle,
    FiInfo,
    FiDollarSign,
    FiFileText,
    FiExternalLink,
} from 'react-icons/fi';
import toast from 'react-hot-toast';
import {
    getNotifications,
    markNotificationRead,
    markAllNotificationsRead,
    archiveNotification,
} from '../../services/notificationService';

const NotificationBell = () => {
    const navigate = useNavigate();
    const [isOpen, setIsOpen] = useState(false);
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [categoryFilter, setCategoryFilter] = useState('all');
    const dropdownRef = useRef(null);

    const fetchNotifications = async () => {
        try {
            const params = categoryFilter !== 'all' ? { category: categoryFilter } : {};
            const res = await getNotifications(params);
            const data = res?.data || res;
            setNotifications(data.notifications || []);
            setUnreadCount(data.unreadCount || 0);
        } catch {
            // Silent fail for header polling
        }
    };

    useEffect(() => {
        fetchNotifications();
        const interval = setInterval(fetchNotifications, 15000); // 15s polling fallback
        return () => clearInterval(interval);
    }, [categoryFilter]);

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleMarkRead = async (id) => {
        try {
            await markNotificationRead(id);
            setNotifications((prev) =>
                prev.map((n) => (n._id === id ? { ...n, read: true } : n))
            );
            setUnreadCount((prev) => Math.max(0, prev - 1));
        } catch (err) {
            toast.error('Failed to update notification status.');
        }
    };

    const handleMarkAllRead = async () => {
        try {
            await markAllNotificationsRead();
            setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
            setUnreadCount(0);
            toast.success('All notifications marked as read.');
        } catch (err) {
            toast.error('Failed to mark all as read.');
        }
    };

    const handleArchive = async (id, e) => {
        e.stopPropagation();
        try {
            await archiveNotification(id);
            setNotifications((prev) => prev.filter((n) => n._id !== id));
            toast.success('Notification archived.');
        } catch (err) {
            toast.error('Failed to archive notification.');
        }
    };

    const getPriorityBadge = (priority) => {
        if (priority === 'critical') return 'bg-rose-500 text-white font-black';
        if (priority === 'high') return 'bg-amber-500 text-white font-bold';
        if (priority === 'normal') return 'bg-indigo-500 text-white font-medium';
        return 'bg-slate-300 text-slate-700';
    };

    return (
        <div className="relative" ref={dropdownRef}>
            {/* Bell Icon Trigger */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors focus:outline-none"
                title="Notifications"
            >
                <FiBell className="w-5 h-5" />
                {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-purple-600 text-white text-[10px] font-black rounded-full flex items-center justify-center shadow-md animate-pulse">
                        {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                )}
            </button>

            {/* Dropdown Menu */}
            {isOpen && (
                <div className="absolute right-0 mt-3 w-80 sm:w-96 bg-white rounded-2xl border border-slate-200 shadow-2xl z-50 overflow-hidden animate-fade-in">
                    {/* Header */}
                    <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <FiBell className="text-purple-400" />
                            <span className="font-bold text-sm">Notifications Center</span>
                            {unreadCount > 0 && (
                                <span className="bg-purple-500/30 text-purple-300 border border-purple-400/40 text-[10px] font-bold px-2 py-0.5 rounded-full">
                                    {unreadCount} new
                                </span>
                            )}
                        </div>
                        {unreadCount > 0 && (
                            <button
                                onClick={handleMarkAllRead}
                                className="text-[11px] font-bold text-purple-300 hover:text-white flex items-center gap-1 hover:underline"
                            >
                                <FiCheckCircle /> Mark All Read
                            </button>
                        )}
                    </div>

                    {/* Category Filter Tabs */}
                    <div className="flex items-center gap-1 p-2 bg-slate-50 border-b border-slate-100 overflow-x-auto text-[11px] font-bold">
                        {['all', 'commission', 'withdrawal', 'settlement', 'system'].map((cat) => (
                            <button
                                key={cat}
                                onClick={() => setCategoryFilter(cat)}
                                className={`px-2.5 py-1 rounded-lg capitalize transition-all whitespace-nowrap ${
                                    categoryFilter === cat
                                        ? 'bg-white text-purple-700 shadow-sm'
                                        : 'text-slate-500 hover:text-slate-900'
                                }`}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>

                    {/* Notification Feed */}
                    <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                        {notifications.length === 0 ? (
                            <div className="p-8 text-center text-slate-400 text-xs">
                                No notifications found in this feed.
                            </div>
                        ) : (
                            notifications.map((item) => (
                                <div
                                    key={item._id}
                                    onClick={() => !item.read && handleMarkRead(item._id)}
                                    className={`p-3.5 flex items-start gap-3 hover:bg-slate-50 transition-colors cursor-pointer relative ${
                                        !item.read ? 'bg-purple-50/40' : ''
                                    }`}
                                >
                                    {/* Icon Indicator */}
                                    <div className="pt-0.5">
                                        {item.category === 'commission' ? (
                                            <FiDollarSign className="w-4 h-4 text-emerald-600" />
                                        ) : item.category === 'withdrawal' ? (
                                            <FiCheckCircle className="w-4 h-4 text-indigo-600" />
                                        ) : item.category === 'report' ? (
                                            <FiFileText className="w-4 h-4 text-purple-600" />
                                        ) : (
                                            <FiInfo className="w-4 h-4 text-slate-500" />
                                        )}
                                    </div>

                                    {/* Body */}
                                    <div className="flex-1 space-y-1">
                                        <div className="flex items-center justify-between gap-2">
                                            <span className="font-bold text-slate-900 text-xs leading-snug">
                                                {item.title}
                                            </span>
                                            <span className={`text-[9px] uppercase px-1.5 py-0.5 rounded ${getPriorityBadge(item.priority)}`}>
                                                {item.priority}
                                            </span>
                                        </div>

                                        <p className="text-[11px] text-slate-600 leading-relaxed">
                                            {item.message}
                                        </p>

                                        <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1">
                                            <span>{new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>

                                            <div className="flex items-center gap-2">
                                                {item.actionUrl && (
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            navigate(item.actionUrl);
                                                            setIsOpen(false);
                                                        }}
                                                        className="text-purple-600 font-bold flex items-center gap-0.5 hover:underline"
                                                    >
                                                        {item.action || 'View'} <FiExternalLink className="w-3 h-3" />
                                                    </button>
                                                )}
                                                <button
                                                    onClick={(e) => handleArchive(item._id, e)}
                                                    className="text-slate-400 hover:text-rose-600"
                                                    title="Archive"
                                                >
                                                    <FiTrash2 className="w-3.5 h-3.5" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default NotificationBell;
