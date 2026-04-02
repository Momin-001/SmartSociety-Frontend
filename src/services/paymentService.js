// src/services/paymentService.js
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';
const API_BASE = API_URL.replace(/\/api\/?$/, '');
const PAYMENTS_API = `${API_BASE}/payments`;

/**
 * Creates a Stripe PaymentIntent on the backend.
 * Returns the clientSecret needed to confirm the payment on the frontend.
 */
export const createPaymentIntent = async (amount, billId) => {
    try {
        const response = await axios.post(`${PAYMENTS_API}/create-checkout-session`, {
            amount,
            billId,
        });
        return response.data; // { clientSecret }
    } catch (error) {
        console.error('Error creating payment intent:', error);
        throw error;
    }
};

/**
 * After successful Stripe payment, mark the bill as paid in Firestore via backend.
 */
export const confirmPaymentOnServer = async (billId, paymentIntentId) => {
    try {
        const response = await axios.post(`${PAYMENTS_API}/confirm-checkout-session`, {
            billId,
            paymentIntentId,
        });
        return response.data; // { success, billId }
    } catch (error) {
        console.error('Error confirming payment on server:', error);
        throw error;
    }
};

/**
 * Admin manual trigger: auto-generate monthly bills for all residents.
 */
export const generateMonthlyBills = async () => {
    try {
        const response = await axios.post(`${API_URL}/generate-monthly-bills`);
        return response.data; // { success, billsCreated, month }
    } catch (error) {
        console.error('Error generating monthly bills:', error);
        throw error;
    }
};

/**
 * Get payment history for a specific user (last 6 months).
 */
export const getPaymentHistory = async (userId) => {
    try {
        const response = await axios.get(`${API_URL}/payment-history/${userId}`);
        return response.data; // array of { id, month, type, amount, status, dueDate, paidAt }
    } catch (error) {
        console.error('Error fetching payment history:', error);
        throw error;
    }
};

/**
 * Get payment histories for many users in a single request.
 */
export const getPaymentHistories = async (userIds) => {
    try {
        const response = await axios.post(`${API_URL}/payment-history/batch`, { userIds });
        // Expected shape: { [userId]: Array<{ id, month, type, amount, status, dueDate, paidAt }> }
        return response.data || {};
    } catch (error) {
        console.error('Error fetching payment histories (batch):', error);
        throw error;
    }
};

export const paymentService = {
    createPaymentIntent,
    confirmPaymentOnServer,
    generateMonthlyBills,
    getPaymentHistory,
    getPaymentHistories,
};
