// src/services/billsService.js
import {
    collection,
    getDocs,
    doc,
    getDoc,
    addDoc,
    updateDoc,
    deleteDoc,
    query,
    where,
    orderBy,
    Timestamp
} from 'firebase/firestore';
import { db } from '../config/firebase';

export const billsService = {
    // Get all bills
    getAllBills: async () => {
        try {
            const billsRef = collection(db, 'bills');
            const q = query(billsRef, orderBy('createdAt', 'desc'));
            const querySnapshot = await getDocs(q);

            const bills = [];
            querySnapshot.forEach((doc) => {
                bills.push({
                    id: doc.id,
                    ...doc.data(),
                    createdAt: doc.data().createdAt?.toDate(),
                    dueDate: doc.data().dueDate?.toDate(),
                    paidAt: doc.data().paidAt?.toDate(),
                });
            });

            return bills;
        } catch (error) {
            console.error('Error fetching bills:', error);
            throw error;
        }
    },

    // Add new bill
    addBill: async (billData) => {
        try {
            const billsRef = collection(db, 'bills');
            const newBill = {
                ...billData,
                createdAt: Timestamp.now(),
                // Check if dueDate is coming as a Date object or string, convert appropriately before calling if needed
                dueDate: billData.dueDate ? Timestamp.fromDate(new Date(billData.dueDate)) : null,
                status: billData.status || 'pending',
            };
            const docRef = await addDoc(billsRef, newBill);
            return { id: docRef.id, ...newBill };
        } catch (error) {
            console.error('Error adding bill:', error);
            throw error;
        }
    },

    // Delete bill
    deleteBill: async (id) => {
        try {
            await deleteDoc(doc(db, 'bills', id));
        } catch (error) {
            console.error('Error deleting bill:', error);
            throw error;
        }
    },

    // Mark bill as paid
    markBillPaid: async (billId, paymentIntentId = null) => {
        try {
            const billRef = doc(db, 'bills', billId);
            await updateDoc(billRef, {
                status: 'paid',
                paidAt: Timestamp.now(),
                paymentIntentId: paymentIntentId,
            });
        } catch (error) {
            console.error('Error marking bill as paid:', error);
            throw error;
        }
    },

    // Get bills for a specific user
    getBillsByUserId: async (userId) => {
        try {
            const billsRef = collection(db, 'bills');
            const q = query(billsRef, where('userId', '==', userId), orderBy('createdAt', 'desc'));
            const querySnapshot = await getDocs(q);

            const bills = [];
            querySnapshot.forEach((docSnap) => {
                bills.push({
                    id: docSnap.id,
                    ...docSnap.data(),
                    createdAt: docSnap.data().createdAt?.toDate(),
                    dueDate: docSnap.data().dueDate?.toDate(),
                    paidAt: docSnap.data().paidAt?.toDate(),
                });
            });
            return bills;
        } catch (error) {
            console.error('Error fetching user bills:', error);
            throw error;
        }
    },

    // Resident-scoped billing behavior alias for cross-client consistency
    getUserBills: async (userId) => {
        return billsService.getBillsByUserId(userId);
    }
};
