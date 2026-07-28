import { Outlet } from 'react-router-dom';
import InfluencerSidebar from './InfluencerSidebar';

const InfluencerLayout = () => {
    return (
        <div className="min-h-screen bg-slate-50 text-slate-900 font-sans flex">
            <InfluencerSidebar />
            <main className="flex-1 overflow-y-auto min-h-screen">
                <Outlet />
            </main>
        </div>
    );
};

export default InfluencerLayout;
