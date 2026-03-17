// src/services/announcementsService.js
import {
    collection,
    getDocs,
    doc,
    addDoc,
    updateDoc,
    deleteDoc,
    query,
    orderBy,
    Timestamp
} from 'firebase/firestore';
import { db } from '../config/firebase';

export const announcementsService = {
    // Get all announcements (ordered newest first)
    getAllAnnouncements: async () => {
        try {
            const ref = collection(db, 'announcements');
            const q = query(ref, orderBy('createdAt', 'desc'));
            const snapshot = await getDocs(q);

            const announcements = [];
            snapshot.forEach((doc) => {
                announcements.push({
                    id: doc.id,
                    ...doc.data(),
                    date: doc.data().date?.toDate(),
                    createdAt: doc.data().createdAt?.toDate(),
                });
            });

            return announcements;
        } catch (error) {
            console.error('Error fetching announcements:', error);
            throw error;
        }
    },

    // Add a new announcement
    addAnnouncement: async (data) => {
        try {
            const ref = collection(db, 'announcements');
            const newDoc = {
                title: data.title,
                description: data.description,
                type: data.type,
                date: data.date ? Timestamp.fromDate(new Date(data.date)) : Timestamp.now(),
                time: data.time || null,
                createdBy: data.createdBy,
                createdAt: Timestamp.now(),
                imageUrl: data.imageUrl || null,
                isArchived: false,
            };
            const docRef = await addDoc(ref, newDoc);
            return {
                id: docRef.id,
                ...newDoc,
                date: newDoc.date.toDate(),
                createdAt: newDoc.createdAt.toDate(),
            };
        } catch (error) {
            console.error('Error adding announcement:', error);
            throw error;
        }
    },

    // Archive an announcement
    archiveAnnouncement: async (id) => {
        try {
            const ref = doc(db, 'announcements', id);
            await updateDoc(ref, { isArchived: true });
        } catch (error) {
            console.error('Error archiving announcement:', error);
            throw error;
        }
    },

    // Unarchive an announcement
    unarchiveAnnouncement: async (id) => {
        try {
            const ref = doc(db, 'announcements', id);
            await updateDoc(ref, { isArchived: false });
        } catch (error) {
            console.error('Error unarchiving announcement:', error);
            throw error;
        }
    },

    // Delete an announcement
    deleteAnnouncement: async (id) => {
        try {
            await deleteDoc(doc(db, 'announcements', id));
        } catch (error) {
            console.error('Error deleting announcement:', error);
            throw error;
        }
    },
};
