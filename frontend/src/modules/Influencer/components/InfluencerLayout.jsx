import { Outlet } from 'react-router-dom';
import InfluencerSidebar from './InfluencerSidebar';
import NotificationBell from './notifications/NotificationBell';

const InfluencerLayout = () => {
    return (
        <div className="min-h-screen bg-slate-50 text-slate-900 font-sans flex">
            <InfluencerSidebar />
            <main className="flex-1 overflow-y-auto min-h-screen flex flex-col">
                <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between sticky top-0 z-30 shadow-xs">
                    <div className="text-xs font-bold uppercase tracking-wider text-slate-500">Creator Portal</div>
                    <NotificationBell />
                </header>
                <div className="flex-1 p-2">
                    <Outlet />
                </div>
            </main>
        </div>
    );
};

export default InfluencerLayout;
