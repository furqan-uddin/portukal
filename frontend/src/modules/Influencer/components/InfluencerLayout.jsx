import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { FiMenu } from 'react-icons/fi';
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
            
            <div className={`flex-1 flex flex-col min-w-0 max-w-full transition-all duration-300 ${isCollapsed ? 'md:ml-0' : 'md:ml-64'}`}>
                {/* Fixed Header */}
                <header className={`bg-white/90 backdrop-blur-md border-b border-slate-200/80 fixed top-0 right-0 z-30 transition-all duration-300 shadow-sm flex items-center justify-between px-4 lg:px-6 h-16 ${isCollapsed ? 'left-0' : 'left-0 md:left-64'}`}>
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
                
                {/* Scrollable Page Content */}
                <main className="flex-1 p-2 md:p-4 mt-16 w-full min-w-0">
                    <Outlet />
                </main>
            </div>
        </div>
    );
};

export default InfluencerLayout;
