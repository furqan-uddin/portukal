import api from '../../../shared/utils/api';

export const registerInfluencer = async (influencerData) => {
    return await api.post('/influencer/register', influencerData);
};

export const verifyEmailOtpInfluencer = async (email, otp) => {
    return await api.post('/influencer/verify-email-otp', { email, otp });
};

export const resendEmailOtpInfluencer = async (email) => {
    return await api.post('/influencer/resend-email-otp', { email });
};

export const loginInfluencer = async (email, password, rememberMe = false) => {
    return await api.post('/influencer/login', { email, password, rememberMe });
};

export const logoutInfluencer = async () => {
    return await api.post('/influencer/logout');
};

export const forgotPasswordInfluencer = async (email) => {
    return await api.post('/influencer/forgot-password', { email });
};

export const verifyOtpInfluencer = async (email, otp) => {
    return await api.post('/influencer/verify-otp', { email, otp });
};

export const resetPasswordInfluencer = async (email, otp, password, confirmPassword) => {
    return await api.post('/influencer/reset-password', { email, otp, password, confirmPassword });
};

export const getInfluencerProfile = async () => {
    return await api.get('/influencer/profile');
};

export const updateInfluencerProfile = async (profileData) => {
    return await api.put('/influencer/profile', profileData);
};
