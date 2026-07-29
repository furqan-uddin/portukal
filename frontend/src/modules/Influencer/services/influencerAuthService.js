import api from '../../../shared/utils/api';

export const registerInfluencer = async (influencerData) => {
    return await api.post('/influencer/register', influencerData);
};

export const getInfluencerProfile = async () => {
    return await api.get('/influencer/profile');
};

export const updateInfluencerProfile = async (profileData) => {
    return await api.put('/influencer/profile', profileData);
};
