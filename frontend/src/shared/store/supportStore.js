import { create } from 'zustand';
import * as adminService from '../../modules/Admin/services/adminService';
import toast from 'react-hot-toast';

export const useSupportStore = create((set, get) => ({
    tickets: [],
    isLoading: false,
    error: null,
    pagination: {
        total: 0,
        page: 1,
        limit: 10,
        pages: 1
    },

    fetchTickets: async (params = {}) => {
        set({ isLoading: true });
        try {
            const response = await adminService.getAllTickets(params);
            const tickets = response?.tickets || response?.data?.tickets || (Array.isArray(response) ? response : []);
            const pagination = response?.pagination || response?.data?.pagination || { total: tickets.length, page: 1, limit: 10, pages: 1 };

            set({
                tickets,
                pagination,
                isLoading: false
            });
        } catch (error) {
            set({ error: error.message, isLoading: false });
            toast.error(error.message || 'Failed to fetch tickets');
        }
    },

    fetchTicketById: async (id) => {
        set({ isLoading: true });
        try {
            const response = await adminService.getTicketById(id);
            set({ isLoading: false });
            return response?.ticket || response?.data || response;
        } catch (error) {
            set({ isLoading: false });
            toast.error(error.message || 'Failed to fetch ticket details');
            return null;
        }
    },

    updateTicketStatus: async (id, data) => {
        try {
            await adminService.updateTicketStatus(id, data);
            set((state) => ({
                tickets: state.tickets.map((t) =>
                    t.id === id ? { ...t, ...data } : t
                )
            }));
            toast.success('Ticket updated successfully');
            return true;
        } catch (error) {
            toast.error(error.message || 'Failed to update ticket');
            return false;
        }
    },

    addReply: async (id, message) => {
        set({ isLoading: true });
        try {
            const response = await adminService.addTicketMessage(id, message);
            set({ isLoading: false });
            toast.success('Reply added successfully');
            return response?.data || response;
        } catch (error) {
            set({ isLoading: false });
            toast.error(error.message || 'Failed to add reply');
            return null;
        }
    }
}));
