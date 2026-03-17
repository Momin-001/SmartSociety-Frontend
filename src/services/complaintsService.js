// src/services/complaintsService.js
import { 
  collection, 
  getDocs, 
  doc, 
  getDoc,
  updateDoc, 
  deleteDoc,
  query,
  where,
  orderBy,
  Timestamp
} from 'firebase/firestore';
import { db } from '../config/firebase';

export const complaintsService = {
  // Get all complaints
  getAllComplaints: async () => {
    try {
      const complaintsRef = collection(db, 'complaints');
      const q = query(complaintsRef, orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      
      const complaints = [];
      querySnapshot.forEach((doc) => {
        complaints.push({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate(),
          updatedAt: doc.data().updatedAt?.toDate(),
          repliedAt: doc.data().repliedAt?.toDate(),
          resolvedAt: doc.data().resolvedAt?.toDate()
        });
      });
      
      return complaints;
    } catch (error) {
      console.error('Error fetching complaints:', error);
      throw error;
    }
  },

  // Get all suggestions
  getAllSuggestions: async () => {
    try {
      const suggestionsRef = collection(db, 'suggestions');
      const q = query(suggestionsRef, orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      
      const suggestions = [];
      querySnapshot.forEach((doc) => {
        suggestions.push({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate(),
          updatedAt: doc.data().updatedAt?.toDate(),
          repliedAt: doc.data().repliedAt?.toDate(),
          reviewedAt: doc.data().reviewedAt?.toDate()
        });
      });
      
      return suggestions;
    } catch (error) {
      console.error('Error fetching suggestions:', error);
      throw error;
    }
  },

  // Get single complaint by ID
  getComplaintById: async (id) => {
    try {
      const docRef = doc(db, 'complaints', id);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        return {
          id: docSnap.id,
          ...docSnap.data(),
          createdAt: docSnap.data().createdAt?.toDate(),
          updatedAt: docSnap.data().updatedAt?.toDate(),
          repliedAt: docSnap.data().repliedAt?.toDate(),
          resolvedAt: docSnap.data().resolvedAt?.toDate()
        };
      }
      return null;
    } catch (error) {
      console.error('Error fetching complaint:', error);
      throw error;
    }
  },

  // Get single suggestion by ID
  getSuggestionById: async (id) => {
    try {
      const docRef = doc(db, 'suggestions', id);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        return {
          id: docSnap.id,
          ...docSnap.data(),
          createdAt: docSnap.data().createdAt?.toDate(),
          updatedAt: docSnap.data().updatedAt?.toDate(),
          repliedAt: docSnap.data().repliedAt?.toDate(),
          reviewedAt: docSnap.data().reviewedAt?.toDate()
        };
      }
      return null;
    } catch (error) {
      console.error('Error fetching suggestion:', error);
      throw error;
    }
  },

  // Update complaint status
  updateComplaintStatus: async (id, status) => {
    try {
      const complaintRef = doc(db, 'complaints', id);
      const updateData = {
        status,
        updatedAt: Timestamp.now()
      };

      if (status === 'resolved') {
        updateData.resolvedAt = Timestamp.now();
      }

      await updateDoc(complaintRef, updateData);
    } catch (error) {
      console.error('Error updating complaint status:', error);
      throw error;
    }
  },

  // Update complaint priority
  updateComplaintPriority: async (id, priority) => {
    try {
      const complaintRef = doc(db, 'complaints', id);
      await updateDoc(complaintRef, {
        priority,
        updatedAt: Timestamp.now()
      });
    } catch (error) {
      console.error('Error updating complaint priority:', error);
      throw error;
    }
  },

  // Update suggestion status
  updateSuggestionStatus: async (id, status) => {
    try {
      const suggestionRef = doc(db, 'suggestions', id);
      const updateData = {
        status,
        updatedAt: Timestamp.now()
      };

      if (status === 'reviewed') {
        updateData.reviewedAt = Timestamp.now();
      }

      await updateDoc(suggestionRef, updateData);
    } catch (error) {
      console.error('Error updating suggestion status:', error);
      throw error;
    }
  },

  // Add reply to complaint
  replyToComplaint: async (id, reply, adminEmail) => {
    try {
      const complaintRef = doc(db, 'complaints', id);
      await updateDoc(complaintRef, {
        adminReply: reply,
        repliedAt: Timestamp.now(),
        repliedBy: adminEmail,
        updatedAt: Timestamp.now()
      });
    } catch (error) {
      console.error('Error replying to complaint:', error);
      throw error;
    }
  },

  // Add reply to suggestion
  replyToSuggestion: async (id, reply, adminEmail) => {
    try {
      const suggestionRef = doc(db, 'suggestions', id);
      await updateDoc(suggestionRef, {
        adminReply: reply,
        repliedAt: Timestamp.now(),
        repliedBy: adminEmail,
        updatedAt: Timestamp.now()
      });
    } catch (error) {
      console.error('Error replying to suggestion:', error);
      throw error;
    }
  },

  // Delete complaint
  deleteComplaint: async (id) => {
    try {
      await deleteDoc(doc(db, 'complaints', id));
    } catch (error) {
      console.error('Error deleting complaint:', error);
      throw error;
    }
  },

  // Delete suggestion
  deleteSuggestion: async (id) => {
    try {
      await deleteDoc(doc(db, 'suggestions', id));
    } catch (error) {
      console.error('Error deleting suggestion:', error);
      throw error;
    }
  },

  // Get statistics
  getComplaintsStats: (complaints) => {
    return {
      total: complaints.length,
      pending: complaints.filter(c => c.status === 'pending').length,
      inProgress: complaints.filter(c => c.status === 'in_progress').length,
      resolved: complaints.filter(c => c.status === 'resolved').length
    };
  },

  getSuggestionsStats: (suggestions) => {
    return {
      total: suggestions.length,
      pending: suggestions.filter(s => s.status === 'pending').length,
      inProgress: suggestions.filter(s => s.status === 'in_progress').length,
      reviewed: suggestions.filter(s => s.status === 'reviewed').length
    };
  },

  // Get complaints by category
  getComplaintsByCategory: (complaints) => {
    const categories = {};
    complaints.forEach(complaint => {
      const category = complaint.category || 'other';
      categories[category] = (categories[category] || 0) + 1;
    });
    return categories;
  }
};