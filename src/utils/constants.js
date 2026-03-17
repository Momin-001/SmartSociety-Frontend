// src/utils/constants.js

export const ComplaintCategories = {
  security: {
    label: 'Security',
    icon: 'shield-alert',
    color: 'red'
  },
  cleanliness: {
    label: 'Cleanliness',
    icon: 'trash-2',
    color: 'green'
  },
  water: {
    label: 'Water',
    icon: 'droplet',
    color: 'blue'
  },
  electricity: {
    label: 'Electricity',
    icon: 'zap',
    color: 'yellow'
  },
  maintenance: {
    label: 'Maintenance',
    icon: 'wrench',
    color: 'orange'
  },
  noise: {
    label: 'Noise',
    icon: 'volume-2',
    color: 'purple'
  },
  parking: {
    label: 'Parking',
    icon: 'car',
    color: 'indigo'
  },
  other: {
    label: 'Other',
    icon: 'alert-circle',
    color: 'gray'
  }
};

export const ComplaintStatuses = {
  pending: {
    label: 'Pending',
    color: 'orange',
    bgColor: 'bg-orange-100',
    textColor: 'text-orange-700',
    borderColor: 'border-orange-200'
  },
  in_progress: {
    label: 'In Progress',
    color: 'blue',
    bgColor: 'bg-blue-100',
    textColor: 'text-blue-700',
    borderColor: 'border-blue-200'
  },
  resolved: {
    label: 'Resolved',
    color: 'green',
    bgColor: 'bg-green-100',
    textColor: 'text-green-700',
    borderColor: 'border-green-200'
  }
};

export const SuggestionStatuses = {
  pending: {
    label: 'Pending',
    color: 'orange',
    bgColor: 'bg-orange-100',
    textColor: 'text-orange-700',
    borderColor: 'border-orange-200'
  },
  in_progress: {
    label: 'In Progress',
    color: 'blue',
    bgColor: 'bg-blue-100',
    textColor: 'text-blue-700',
    borderColor: 'border-blue-200'
  },
  reviewed: {
    label: 'Reviewed',
    color: 'green',
    bgColor: 'bg-green-100',
    textColor: 'text-green-700',
    borderColor: 'border-green-200'
  }
};