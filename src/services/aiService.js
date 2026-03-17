// src/services/aiService.js
import axios from 'axios';

// The URL of the backend server you just created
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

/**
 * Takes an array of complaint objects and returns a map of { id: priority }
 */
const getClassifications = async (complaints) => {
  try {
    const response = await axios.post(`${API_URL}/classify-complaints`, {
      complaints
    });
    const priorityMap = {};
    for (const item of response.data) {
      priorityMap[item.id] = item.priority;
    }
    return priorityMap;
  } catch (error) {
    console.error("Error from classification API:", error);
    throw error;
  }
};

/**
 * Takes an array of pending bills and returns a map of { id: risk }
 */
const predictLatePayments = async (bills) => {
  try {
    const response = await axios.post(`${API_URL}/predict-late-payments`, { bills });
    const riskMap = {};
    for (const item of response.data) {
      riskMap[item.id] = item.risk;
    }
    return riskMap;
  } catch (error) {
    console.error("Error from late payment prediction API:", error);
    throw error;
  }
};

/**
 * Takes an event description and past events, returns 3 time slot suggestions
 */
const suggestEventTime = async (eventDescription, pastEvents) => {
  try {
    const response = await axios.post(`${API_URL}/suggest-event-time`, {
      eventDescription,
      pastEvents
    });
    return response.data; // Array of { day, time, reason }
  } catch (error) {
    console.error("Error from event time suggestion API:", error);
    throw error;
  }
};

export const aiService = {
  getClassifications,
  predictLatePayments,
  suggestEventTime,
};