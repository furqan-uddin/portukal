import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { FiMenu, FiSidebar } from 'react-icons/fi';
import InfluencerSidebar from './InfluencerSidebar';
import NotificationBell from './notifications/NotificationBell';

const InfluencerLayout = () => {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [isCollapsed, setIsCollapsed] = useState(
        localStorage.getItem('influencer_sidebar_collapsed') === 'true'
    );

    const toggleSidebar = () => {
        const nextVal = !isCollapsed;
        setIsCollapsed(nextVal);
        localStorage.setItem('influencer_sidebar_collapsed', String(nextVal));
    };

    return (
        <div className="min-h-screen bg-slate-50 text-slate-900 font-sans flex relative overflow-x-hidden">
            <InfluencerSidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} isCollapsed={isCollapsed} />
            <main className={`flex-1 overflow-y-auto h-screen flex flex-col min-w-0 transition-all duration-300 ${isCollapsed ? 'md:ml-0' : 'md:ml-64'}`}>
                <header className="h-16 bg-white border-b border-slate-200 px-4 md:px-6 flex items-center justify-between sticky top-0 z-30 shadow-xs">
                    <div className="flex items-center gap-3">
                        <button 
                            className="p-2 -ml-2 text-slate-500 hover:bg-slate-100 rounded-lg transition-colors"
                            onClick={() => {
                                if (window.innerWidth >= 768) {
                                    toggleSidebar();
                                } else {
                                    setSidebarOpen(true);
                                }
                            }}
                            title="Toggle Menu"
                        >
                            <FiMenu className="w-5 h-5" />
                        </button>
                        <div className="text-xs font-bold uppercase tracking-wider text-slate-500 hidden sm:block">Creator Portal</div>
                    </div>
                    <NotificationBell />
                </header>
                <div className="flex-1 p-2 md:p-4">
                    <Outlet />
                </div>
            </main>
        </div>
    );
};

export default InfluencerLayout;
