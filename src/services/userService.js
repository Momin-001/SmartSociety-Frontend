import {
  collection,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
  query,
  where,
  Timestamp
} from 'firebase/firestore';
import { db } from '../config/firebase';

export const userService = {
  // Get all users (residents)
  getAllUsers: async () => {
    try {
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('role', '==', 'resident'));
      const querySnapshot = await getDocs(q);

      const users = [];
      querySnapshot.forEach((doc) => {
        users.push({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate(),
          updatedAt: doc.data().updatedAt?.toDate()
        });
      });

      // Sort by createdAt descending (newest first) - done client-side to avoid needing a composite index
      users.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));

      return users;
    } catch (error) {
      console.error('Error fetching users:', error);
      throw error;
    }
  },

  // Approve user
  approveUser: async (userId) => {
    try {
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        isApproved: true,
        isActive: true,
        updatedAt: Timestamp.now()
      });
    } catch (error) {
      console.error('Error approving user:', error);
      throw error;
    }
  },

  // Reject user (keep as not approved)
  rejectUser: async (userId) => {
    try {
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        isApproved: false,
        isActive: false,
        updatedAt: Timestamp.now()
      });
    } catch (error) {
      console.error('Error rejecting user:', error);
      throw error;
    }
  },

  // Toggle user active status
  toggleUserStatus: async (userId, currentStatus) => {
    try {
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        isActive: !currentStatus,
        updatedAt: Timestamp.now()
      });
    } catch (error) {
      console.error('Error toggling user status:', error);
      throw error;
    }
  },

  // Update user profile
  updateUser: async (userId, updates) => {
    try {
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        ...updates,
        updatedAt: Timestamp.now()
      });
    } catch (error) {
      console.error('Error updating user:', error);
      throw error;
    }
  },

  // Delete user
  deleteUser: async (userId) => {
    try {
      await deleteDoc(doc(db, 'users', userId));
    } catch (error) {
      console.error('Error deleting user:', error);
      throw error;
    }
  },

  // Get user statistics
  getUserStats: (users) => {
    return {
      total: users.length,
      pending: users.filter(u => !u.isApproved).length,
      active: users.filter(u => u.isApproved && u.isActive).length,
      inactive: users.filter(u => !u.isActive).length
    };
  }
};