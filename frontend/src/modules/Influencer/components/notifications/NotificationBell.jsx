import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiBell, FiCheck, FiX, FiChevronRight, FiTrash2 } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import {
    getNotifications,
    markNotificationRead,
    markAllNotificationsRead,
    archiveNotification,
} from '../../services/notificationService';

import { getSocket, joinRoom } from '../../../../shared/utils/socket';
import { useInfluencerAuth } from '../../hooks/useInfluencerAuth';

const formatDateTime = (dateString) => {
    return new Date(dateString).toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
};

const getNotificationColor = (type) => {
    const colors = {
        commission: "bg-emerald-100 text-emerald-600",
        withdrawal: "bg-indigo-100 text-indigo-600",
        report: "bg-purple-100 text-purple-600",
        NEW_FOLLOWER: "bg-purple-100 text-purple-700 font-bold",
        system: "bg-gray-100 text-gray-600",
    };
    return colors[type] || colors.system;
};

const NotificationBell = () => {
    const navigate = useNavigate();
    const { influencer } = useInfluencerAuth();
    const [isOpen, setIsOpen] = useState(false);
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const windowRef = useRef(null);

    const fetchNotifications = async () => {
        try {
            const res = await getNotifications();
            const data = res?.data || res;
            setNotifications(data.notifications || []);
            setUnreadCount(data.unreadCount || 0);
        } catch {
            // Silent fail for polling
        }
    };

    useEffect(() => {
        fetchNotifications();
        const interval = setInterval(fetchNotifications, 15000);

        // Socket.IO real-time notification listener
        const token = localStorage.getItem('influencerToken') || localStorage.getItem('token');
        const socket = getSocket(token);

        if (socket && influencer?._id) {
            const roomName = `influencer_${influencer._id}`;
            joinRoom(roomName);

            const handleNewNotification = (newNotif) => {
                if (!newNotif) return;
                setNotifications((prev) => [newNotif, ...prev.filter(n => n._id !== newNotif._id)]);
                setUnreadCount((prev) => prev + 1);
                toast.success(`🔔 ${newNotif.title || 'Notification'}: ${newNotif.message}`);
            };

            socket.on('new_follower', handleNewNotification);
            socket.on('new_notification', handleNewNotification);
            socket.on('notification', handleNewNotification);

            return () => {
                interval && clearInterval(interval);
                socket.off('new_follower', handleNewNotification);
                socket.off('new_notification', handleNewNotification);
                socket.off('notification', handleNewNotification);
            };
        }

        return () => clearInterval(interval);
    }, [influencer?._id]);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (windowRef.current && !windowRef.current.contains(event.target)) {
                if (!event.target.closest("[data-notification-button]")) {
                    setIsOpen(false);
                }
            }
        };

        if (isOpen) {
            document.addEventListener("mousedown", handleClickOutside);
            document.addEventListener("touchstart", handleClickOutside);
        }
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
            document.removeEventListener("touchstart", handleClickOutside);
        };
    }, [isOpen]);

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
        } catch (err) {
            toast.error('Failed to mark all as read.');
        }
    };

    const handleArchive = async (id, e) => {
        e.stopPropagation();
        try {
            await archiveNotification(id);
            setNotifications((prev) => prev.filter((n) => n._id !== id));
        } catch (err) {
            toast.error('Failed to remove notification.');
        }
    };

    const handleNotificationClick = (notification) => {
        if (!notification.read) {
            handleMarkRead(notification._id);
        }
        if (notification.actionUrl) {
            navigate(notification.actionUrl);
        }
        setIsOpen(false);
    };

    return (
        <div className="relative">
            {/* Bell Icon Trigger */}
            <button
                data-notification-button
                onClick={() => setIsOpen(!isOpen)}
                className="p-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors relative focus:outline-none flex items-center justify-center"
                title="Notifications"
            >
                <FiBell className="w-5 h-5" />
                {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                )}
            </button>

            {/* Notification Window */}
            <AnimatePresence>
                {isOpen && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            onClick={() => setIsOpen(false)}
                            className="fixed inset-0 bg-black/20 z-[9999] lg:hidden"
                        />

                        <motion.div
                            ref={windowRef}
                            initial={{ opacity: 0, y: -10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -10, scale: 0.95 }}
                            transition={{ type: "spring", damping: 25, stiffness: 300 }}
                            className="fixed lg:absolute right-2 lg:-right-2 top-16 lg:top-full lg:mt-2 z-[10000] w-[calc(100vw-1rem)] sm:w-96 max-w-md bg-white rounded-xl shadow-2xl border border-gray-200 max-h-[calc(100vh-5rem)] flex flex-col overflow-hidden"
                            style={{ willChange: "transform" }}
                        >
                            <div className="sticky top-0 bg-white border-b border-gray-200 p-4 flex items-center justify-between z-10">
                                <div className="flex items-center gap-2">
                                    <h3 className="text-lg font-bold text-gray-800">Notifications</h3>
                                    {unreadCount > 0 && (
                                        <span className="px-2 py-0.5 bg-red-500 text-white text-xs font-bold rounded-full">
                                            {unreadCount}
                                        </span>
                                    )}
                                </div>
                                <div className="flex items-center gap-2">
                                    {unreadCount > 0 && (
                                        <button
                                            onClick={handleMarkAllRead}
                                            className="text-xs font-semibold text-primary-600 hover:text-primary-700 px-2 py-1 rounded-lg hover:bg-primary-50 transition-colors"
                                        >
                                            Mark all read
                                        </button>
                                    )}
                                    <button
                                        onClick={() => setIsOpen(false)}
                                        className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                                    >
                                        <FiX className="text-lg" />
                                    </button>
                                </div>
                            </div>

                            <div className="flex-1 overflow-y-auto scrollbar-admin">
                                {notifications.length === 0 ? (
                                    <div className="p-12 text-center">
                                        <FiBell className="mx-auto text-4xl text-gray-400 mb-4" />
                                        <p className="text-gray-500 font-medium">No notifications</p>
                                        <p className="text-sm text-gray-400 mt-1">You're all caught up!</p>
                                    </div>
                                ) : (
                                    <div className="divide-y divide-gray-100">
                                        {notifications.map((notification) => (
                                            <motion.div
                                                key={notification._id}
                                                initial={{ opacity: 0, x: -10 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                className={`p-4 hover:bg-gray-50 transition-colors cursor-pointer ${!notification.read ? "bg-blue-50/30" : ""}`}
                                                onClick={() => handleNotificationClick(notification)}
                                            >
                                                <div className="flex items-start gap-3">
                                                    <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${getNotificationColor(notification.category)}`}>
                                                        <FiBell className="text-lg" />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-2">
                                                            <h4 className="font-semibold text-gray-800 text-sm">
                                                                {notification.title}
                                                            </h4>
                                                            {!notification.read && (
                                                                <span className="flex-shrink-0 w-2 h-2 bg-blue-600 rounded-full" />
                                                            )}
                                                        </div>
                                                        <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                                                            {notification.message}
                                                        </p>
                                                        <div className="flex items-center gap-3 mt-2">
                                                            <span className="text-xs text-gray-500">
                                                                {formatDateTime(notification.createdAt)}
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-1">
                                                        {!notification.read && (
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    handleMarkRead(notification._id);
                                                                }}
                                                                className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                                                                title="Mark as read"
                                                            >
                                                                <FiCheck className="text-sm" />
                                                            </button>
                                                        )}
                                                        <button
                                                            onClick={(e) => handleArchive(notification._id, e)}
                                                            className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                            title="Delete"
                                                        >
                                                            <FiTrash2 className="text-sm" />
                                                        </button>
                                                    </div>
                                                </div>
                                            </motion.div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {notifications.length > 0 && (
                                <div className="sticky bottom-0 bg-white border-t border-gray-200 p-3">
                                    <button
                                        onClick={() => {
                                            navigate("/influencer/dashboard");
                                            setIsOpen(false);
                                        }}
                                        className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold text-primary-600 hover:text-primary-700 hover:bg-primary-50 rounded-lg transition-colors"
                                    >
                                        <span>View all notifications</span>
                                        <FiChevronRight className="text-base" />
                                    </button>
                                </div>
                            )}
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
};

export default NotificationBell;
