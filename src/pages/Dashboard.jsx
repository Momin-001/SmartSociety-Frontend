// src/pages/Dashboard.jsx
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  Clock,
  MessageSquare,
  CheckCircle,
  UserCheck,
  Bell,
  DollarSign,
  TrendingUp
} from 'lucide-react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../config/firebase';

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalResidents: 0,
    pendingApprovals: 0,
    activeComplaints: 0,
    resolvedThisMonth: 0
  });
  const [recentActivities, setRecentActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      // Fetch users stats
      const usersRef = collection(db, 'users');
      const residentsQuery = query(usersRef, where('role', '==', 'resident'));
      const usersSnapshot = await getDocs(residentsQuery);

      let totalResidents = 0;
      let pendingApprovals = 0;

      usersSnapshot.forEach((doc) => {
        const userData = doc.data();
        totalResidents++;
        if (!userData.isApproved) {
          pendingApprovals++;
        }
      });

      // Fetch complaints stats
      const complaintsRef = collection(db, 'complaints');
      const pendingComplaintsQuery = query(complaintsRef, where('status', '==', 'pending'));
      const complaintsSnapshot = await getDocs(pendingComplaintsQuery);
      const activeComplaints = complaintsSnapshot.size;

      // Fetch resolved complaints this month (filter date client-side to avoid composite index)
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      const resolvedQuery = query(
        complaintsRef,
        where('status', '==', 'resolved')
      );
      const resolvedSnapshot = await getDocs(resolvedQuery);

      let resolvedThisMonth = 0;
      resolvedSnapshot.forEach((doc) => {
        const data = doc.data();
        const updatedAt = data.updatedAt?.toDate();
        if (updatedAt && updatedAt >= startOfMonth) {
          resolvedThisMonth++;
        }
      });

      // Fetch recent activities (sort client-side to avoid composite index)
      const recentUsersQuery = query(
        usersRef,
        where('role', '==', 'resident')
      );
      const recentUsersSnapshot = await getDocs(recentUsersQuery);

      const activities = [];
      recentUsersSnapshot.forEach((doc) => {
        const userData = doc.data();
        activities.push({
          user: userData.fullName,
          action: 'registered',
          time: formatTimeAgo(userData.createdAt?.toDate()),
          createdAt: userData.createdAt?.toDate(),
          icon: 'user'
        });
      });

      // Sort by newest first and keep top 5
      activities.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
      const recentActivitiesList = activities.slice(0, 5);

      setStats({
        totalResidents,
        pendingApprovals,
        activeComplaints,
        resolvedThisMonth
      });
      setRecentActivities(recentActivitiesList);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatTimeAgo = (date) => {
    if (!date) return 'Just now';

    const seconds = Math.floor((new Date() - date) / 1000);

    const intervals = {
      year: 31536000,
      month: 2592000,
      week: 604800,
      day: 86400,
      hour: 3600,
      minute: 60
    };

    for (const [unit, secondsInUnit] of Object.entries(intervals)) {
      const interval = Math.floor(seconds / secondsInUnit);
      if (interval >= 1) {
        return `${interval} ${unit}${interval > 1 ? 's' : ''} ago`;
      }
    }

    return 'Just now';
  };

  const statsCards = [
    {
      label: 'Total Residents',
      value: stats.totalResidents,
      icon: Users,
      color: 'emerald',
      bgColor: 'bg-emerald-100',
      textColor: 'text-emerald-600'
    },
    {
      label: 'Pending Approvals',
      value: stats.pendingApprovals,
      icon: Clock,
      color: 'orange',
      bgColor: 'bg-orange-100',
      textColor: 'text-orange-600'
    },
    {
      label: 'Active Complaints',
      value: stats.activeComplaints,
      icon: MessageSquare,
      color: 'blue',
      bgColor: 'bg-blue-100',
      textColor: 'text-blue-600'
    },
    {
      label: 'Resolved This Month',
      value: stats.resolvedThisMonth,
      icon: CheckCircle,
      color: 'green',
      bgColor: 'bg-green-100',
      textColor: 'text-green-600'
    }
  ];

  const quickActions = [
    {
      label: 'Approve Users',
      icon: UserCheck,
      color: 'emerald',
      bgColor: 'bg-emerald-50',
      borderColor: 'border-emerald-200',
      textColor: 'text-emerald-600',
      hoverBg: 'hover:bg-emerald-100',
      path: '/users'
    },
    {
      label: 'View Complaints',
      icon: MessageSquare,
      color: 'blue',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200',
      textColor: 'text-blue-600',
      hoverBg: 'hover:bg-blue-100',
      path: '/complaints'
    },
    {
      label: 'Add Announcement',
      icon: Bell,
      color: 'purple',
      bgColor: 'bg-purple-50',
      borderColor: 'border-purple-200',
      textColor: 'text-purple-600',
      hoverBg: 'hover:bg-purple-100',
      path: '/announcements'
    },
    {
      label: 'Bill Management',
      icon: DollarSign,
      color: 'orange',
      bgColor: 'bg-orange-50',
      borderColor: 'border-orange-200',
      textColor: 'text-orange-600',
      hoverBg: 'hover:bg-orange-100',
      path: '/bills'
    }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-1">Welcome back! Here's what's happening today.</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statsCards.map((stat, index) => (
          <div
            key={index}
            className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`w-12 h-12 rounded-lg ${stat.bgColor} flex items-center justify-center`}>
                <stat.icon className={`w-6 h-6 ${stat.textColor}`} />
              </div>

            </div>
            <h3 className="text-2xl font-bold text-gray-900">{stat.value}</h3>
            <p className="text-sm text-gray-600 mt-1">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activities */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Activities</h2>
          <div className="space-y-4">
            {recentActivities.length > 0 ? (
              recentActivities.map((activity, index) => (
                <div
                  key={index}
                  className="flex items-center gap-3 pb-4 border-b border-gray-100 last:border-0"
                >
                  <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
                    <Users className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-900 truncate">
                      <span className="font-medium">{activity.user}</span> {activity.action}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">{activity.time}</p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-gray-500 text-center py-4">No recent activities</p>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-2 gap-3">
            {quickActions.map((action, index) => (
              <Link
                key={index}
                to={action.path}
                className={`p-4 rounded-lg border-2 ${action.borderColor} ${action.bgColor} ${action.hoverBg} transition-colors text-left`}
              >
                <action.icon className={`w-6 h-6 ${action.textColor} mb-2`} />
                <p className="text-sm font-medium text-gray-900">{action.label}</p>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;