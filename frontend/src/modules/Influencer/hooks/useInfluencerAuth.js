import { useInfluencerAuthStore } from '../store/influencerAuthStore';

export const useInfluencerAuth = () => {
    const {
        influencer,
        token,
        isAuthenticated,
        isLoading,
        error,
        login,
        register,
        verifyEmailOtp,
        resendEmailOtp,
        logout,
        forgotPassword,
        verifyOtp,
        resetPassword,
        fetchProfile,
        updateProfile,
    } = useInfluencerAuthStore();

    return {
        influencer,
        token,
        isAuthenticated,
        isLoading,
        error,
        status: influencer?.status || 'pending',
        isPending: influencer?.status === 'pending',
        isApproved: influencer?.status === 'approved',
        isRejected: influencer?.status === 'rejected',
        isSuspended: influencer?.status === 'suspended',
        login,
        register,
        verifyEmailOtp,
        resendEmailOtp,
        logout,
        forgotPassword,
        verifyOtp,
        resetPassword,
        fetchProfile,
        updateProfile,
    };
};

export default useInfluencerAuth;
