import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import {
    loginInfluencer,
    registerInfluencer,
    verifyEmailOtpInfluencer,
    resendEmailOtpInfluencer,
    logoutInfluencer,
    forgotPasswordInfluencer,
    verifyOtpInfluencer,
    resetPasswordInfluencer,
    getInfluencerProfile,
    updateInfluencerProfile,
} from '../services/influencerAuthService';

export const useInfluencerAuthStore = create(
    persist(
        (set, get) => ({
            influencer: null,
            token: null,
            refreshToken: null,
            isAuthenticated: false,
            isLoading: false,
            error: null,

            login: async (email, password, rememberMe = false) => {
                set({ isLoading: true, error: null });
                try {
                    const res = await loginInfluencer(email, password, rememberMe);
                    const { influencer, accessToken, refreshToken } = res || {};

                    if (!accessToken || !influencer) {
                        throw new Error('Invalid login response from server.');
                    }

                    localStorage.setItem('influencer-token', accessToken);
                    if (refreshToken) {
                        localStorage.setItem('influencer-refresh-token', refreshToken);
                    }

                    set({
                        influencer,
                        token: accessToken,
                        refreshToken: refreshToken || null,
                        isAuthenticated: true,
                        isLoading: false,
                        error: null,
                    });

                    return { success: true, influencer };
                } catch (err) {
                    const message = err?.response?.data?.message || err?.message || 'Login failed';
                    set({ isLoading: false, error: message });
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

            verifyEmailOtp: async (email, otp) => {
                set({ isLoading: true, error: null });
                try {
                    const res = await verifyEmailOtpInfluencer(email, otp);
                    set({ isLoading: false });
                    return res;
                } catch (err) {
                    const message = err?.response?.data?.message || err?.message || 'Email verification failed';
                    set({ isLoading: false, error: message });
                    throw err;
                }
            },

            resendEmailOtp: async (email) => {
                set({ isLoading: true, error: null });
                try {
                    const res = await resendEmailOtpInfluencer(email);
                    set({ isLoading: false });
                    return res;
                } catch (err) {
                    const message = err?.response?.data?.message || err?.message;
                    set({ isLoading: false, error: message });
                    throw err;
                }
            },

            forgotPassword: async (email) => {
                set({ isLoading: true, error: null });
                try {
                    const res = await forgotPasswordInfluencer(email);
                    set({ isLoading: false });
                    return res;
                } catch (err) {
                    set({ isLoading: false, error: err?.response?.data?.message || err?.message });
                    throw err;
                }
            },

            verifyOtp: async (email, otp) => {
                set({ isLoading: true, error: null });
                try {
                    const res = await verifyOtpInfluencer(email, otp);
                    set({ isLoading: false });
                    return res;
                } catch (err) {
                    set({ isLoading: false, error: err?.response?.data?.message || err?.message });
                    throw err;
                }
            },

            resetPassword: async (email, otp, password, confirmPassword) => {
                set({ isLoading: true, error: null });
                try {
                    const res = await resetPasswordInfluencer(email, otp, password, confirmPassword);
                    set({ isLoading: false });
                    return res;
                } catch (err) {
                    set({ isLoading: false, error: err?.response?.data?.message || err?.message });
                    throw err;
                }
            },

            fetchProfile: async () => {
                if (!localStorage.getItem('influencer-token')) return;
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
                logoutInfluencer().catch(() => {});
                localStorage.removeItem('influencer-token');
                localStorage.removeItem('influencer-refresh-token');
                set({
                    influencer: null,
                    token: null,
                    refreshToken: null,
                    isAuthenticated: false,
                    isLoading: false,
                    error: null,
                });
            },
        }),
        {
            name: 'influencer-auth-storage',
            storage: createJSONStorage(() => localStorage),
        }
    )
);
