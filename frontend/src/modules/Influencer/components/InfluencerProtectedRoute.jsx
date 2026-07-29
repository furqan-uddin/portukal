import { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useUnifiedInfluencerAuth } from '../store/influencerAuthStore';

const decodeJwtPayload = (token) => {
    try {
        const parts = String(token || '').split('.');
        if (parts.length < 2) return null;
        const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
        const json = window.atob(base64);
        return JSON.parse(json);
    } catch {
        return null;
    }
};

const InfluencerProtectedRoute = ({ children }) => {
    const { isAuthenticated, token, logout } = useUnifiedInfluencerAuth();
    const location = useLocation();
    const accessToken = token || localStorage.getItem('token') || localStorage.getItem('influencer-token');

    const payload = decodeJwtPayload(accessToken);
    const role = String(payload?.role || '').toLowerCase();
    const tokenExpiryMs = typeof payload?.exp === 'number' ? payload.exp * 1000 : null;
    const isExpired = tokenExpiryMs ? Date.now() >= tokenExpiryMs : false;

    const isValidRole = role === 'customer' || role === 'influencer' || role === 'user';

    useEffect(() => {
        if (isAuthenticated && (isExpired || (role && accessToken && !isValidRole))) {
            logout();
        }
    }, [isAuthenticated, isExpired, role, accessToken, logout, isValidRole]);

    if (!isAuthenticated || !accessToken || isExpired || (role && accessToken && !isValidRole)) {
        return <Navigate to="/influencer" state={{ from: location }} replace />;
    }

    return children;
};

export default InfluencerProtectedRoute;
