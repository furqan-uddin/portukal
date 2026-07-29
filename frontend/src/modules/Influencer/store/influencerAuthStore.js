import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import {
    registerInfluencer,
    getInfluencerProfile,
    updateInfluencerProfile,
} from '../services/influencerAuthService';
import { useAuthStore } from '../../../shared/store/authStore';

export const useInfluencerAuthStore = create(
    persist(
        (set, get) => ({
            influencer: null,
            isLoading: false,
            error: null,

            // Login proxy to the global AuthStore
            login: async (email, password, rememberMe = false) => {
                set({ isLoading: true, error: null });
                try {
                    // 1. Log in as a standard User
                    const { login } = useAuthStore.getState();
                    await login(email, password, rememberMe);

                    // 2. Fetch Influencer Profile
                    const profile = await getInfluencerProfile();
                    set({
                        influencer: profile,
                        isLoading: false,
                        error: null,
                    });

                    return { success: true, influencer: profile };
                } catch (err) {
                    const message = err?.response?.data?.message || err?.message || 'Login failed';
                    set({ isLoading: false, error: message });
                    
                    // If they logged in successfully but don't have an influencer profile, we should logout from User?
                    // Actually, if it's a 403 because they aren't an influencer, the error will be caught here.
                    if (err?.response?.status === 403) {
                         const { logout } = useAuthStore.getState();
                         logout();
                    }
                    
                    throw err;
                }
            },

            register: async (formData) => {
                set({ isLoading: true, error: null });
                try {
                    const res = await registerInfluencer(formData);
                    set({ isLoading: false, error: null });
                    return res;
                } catch (err) {
                    const message = err?.response?.data?.message || err?.message || 'Registration failed';
                    set({ isLoading: false, error: message });
                    throw err;
                }
            },

            fetchProfile: async () => {
                const token = localStorage.getItem('token');
                if (!token) return;
                
                set({ isLoading: true });
                try {
                    const profile = await getInfluencerProfile();
                    set({ influencer: profile, isLoading: false });
                    return profile;
                } catch (err) {
                    set({ isLoading: false });
                }
            },

            updateProfile: async (data) => {
                set({ isLoading: true, error: null });
                try {
                    const updated = await updateInfluencerProfile(data);
                    set({ influencer: updated, isLoading: false });
                    return updated;
                } catch (err) {
                    set({ isLoading: false, error: err?.response?.data?.message || err?.message });
                    throw err;
                }
            },

            logout: () => {
                const { logout } = useAuthStore.getState();
                logout(); // Logout standard user

                set({
                    influencer: null,
                    isLoading: false,
                    error: null,
                });
            },
        }),
        {
            name: 'influencer-profile-storage',
            storage: createJSONStorage(() => localStorage),
        }
    )
);

// We expose a custom hook to combine User Auth State with Influencer Profile State
export const useUnifiedInfluencerAuth = () => {
    const { isAuthenticated: isUserAuth, user, token } = useAuthStore();
    const { influencer, isLoading, error, login, register, logout, fetchProfile, updateProfile } = useInfluencerAuthStore();

    const isAuthenticated = isUserAuth && Boolean(influencer);

    return {
        isAuthenticated,
        user,
        influencer,
        token: token || localStorage.getItem('token'),
        isLoading,
        error,
        status: influencer?.status || 'pending',
        isPending: influencer?.status === 'pending',
        isApproved: influencer?.status === 'approved',
        isRejected: influencer?.status === 'rejected',
        isSuspended: influencer?.status === 'suspended',
        login,
        register,
        logout,
        fetchProfile,
        updateProfile,
    };
};
