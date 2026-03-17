// src/pages/Complaints.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  ChevronDown,
  MessageSquare,
  Clock,
  CheckCircle,
  AlertCircle,
  Eye,
  Filter,
  Loader2,
  Sparkles,
  BarChart3,
  Download
} from 'lucide-react';
import { complaintsService } from '../services/complaintsService';
import { aiService } from '../services/aiService'; // <-- IMPORT THE NEW AI SERVICE
import { ComplaintCategories, ComplaintStatuses } from '../utils/constants';
import { toast } from 'react-toastify';

const Complaints = () => {
  const navigate = useNavigate();
  const [isClassifying, setIsClassifying] = useState(false);
  const [activeTab, setActiveTab] = useState('complaints');
  const [complaints, setComplaints] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterCategory, setFilterCategory] = useState('all');

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    try {
      setLoading(true);
      if (activeTab === 'complaints') {
        const data = await complaintsService.getAllComplaints();
        setComplaints(data);
      } else {
        const data = await complaintsService.getAllSuggestions();
        setSuggestions(data);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to fetch data. Please try again.');

    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const classifyComplaints = async () => {
      if (activeTab === 'complaints' && complaints.length > 0) {
        // Find complaints that don't have a priority yet
        const complaintsToClassify = complaints.filter(c => !c.priority);

        if (complaintsToClassify.length === 0) {
          return; // All complaints are already classified
        }

        setIsClassifying(true);
        try {
          // Call our new aiService
          const priorityMap = await aiService.getClassifications(complaintsToClassify);

          // Persist AI priority so complaint model stays synced in Firestore.
          await Promise.all(
            complaintsToClassify
              .filter(c => priorityMap[c.id])
              .map(c => complaintsService.updateComplaintPriority(c.id, priorityMap[c.id]))
          );

          // Merge priorities back into the main complaints state
          setComplaints(prevComplaints =>
            prevComplaints.map(c =>
              priorityMap[c.id] ? { ...c, priority: priorityMap[c.id] } : c
            )
          );

        } catch (error) {
          console.error("Error classifying complaints:", error);
          toast.error("AI priority classification failed.");
        } finally {
          setIsClassifying(false);
        }
      }
    };

    classifyComplaints();
  }, [complaints, activeTab]); // Runs when 'complaints' state updates or tab changes
  // -----------------------------------------

  const getPriorityBadge = (priority) => {
    if (!priority) {
      return (
        <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
          <Loader2 className="w-3 h-3 animate-spin" />
          Classifying...
        </span>
      );
    }

    let config = {
      label: 'Unknown',
      bgColor: 'bg-gray-100',
      textColor: 'text-gray-800'
    };

    if (priority === 'urgent' || priority === 'High Priority') {
      config = { label: 'Urgent', bgColor: 'bg-red-100', textColor: 'text-red-800' };
    } else if (priority === 'normal' || priority === 'Medium Priority' || priority === 'Low Priority') {
      config = { label: 'Normal', bgColor: 'bg-blue-100', textColor: 'text-blue-800' };
    }

    return (
      <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${config.bgColor} ${config.textColor}`}>
        <Sparkles className="w-3 h-3" />
        {config.label}
      </span>
    );
  };
  // -------------------------------------

  const currentData = activeTab === 'complaints' ? complaints : suggestions;

  const filteredData = currentData.filter(item => {
    const matchesSearch =
      item.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.userName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.houseNumber?.includes(searchTerm);

    const matchesStatus = filterStatus === 'all' || item.status === filterStatus;
    const matchesCategory = filterCategory === 'all' || item.category === filterCategory;

    return matchesSearch && matchesStatus && (activeTab === 'suggestions' || matchesCategory);
  });

  const stats = activeTab === 'complaints'
    ? complaintsService.getComplaintsStats(complaints)
    : complaintsService.getSuggestionsStats(suggestions);

  const getStatusBadge = (status) => {
    const statusConfig = activeTab === 'complaints'
      ? ComplaintStatuses[status]
      : ComplaintStatuses[status] || ComplaintStatuses.pending;

    return (
      <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusConfig.bgColor} ${statusConfig.textColor} border ${statusConfig.borderColor}`}>
        {statusConfig.label}
      </span>
    );
  };

  const getCategoryBadge = (categoryKey) => {
    const category = ComplaintCategories[categoryKey] || ComplaintCategories.other;
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-700`}>
        {category.label}
      </span>
    );
  };

  const formatDate = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatTime = (date) => {
    if (!date) return '';
    return new Date(date).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const handleExportCSV = () => {
    if (filteredData.length === 0) return;

    const isComplaints = activeTab === 'complaints';
    const headers = isComplaints
      ? ['Title', 'Description', 'Category', 'Priority', 'Status', 'Resident', 'House #', 'Date']
      : ['Title', 'Description', 'Status', 'Resident', 'House #', 'Date'];

    const rows = filteredData.map(item => {
      const base = [
        `"${(item.title || '').replace(/"/g, '""')}"`,
        `"${(item.description || '').replace(/"/g, '""')}"`,
      ];
      if (isComplaints) {
        base.push(item.category || 'N/A');
        base.push(item.priority || 'N/A');
      }
      base.push(item.status || 'N/A');
      base.push(`"${(item.userName || '').replace(/"/g, '""')}"`);
      base.push(item.houseNumber || 'N/A');
      base.push(formatDate(item.createdAt));
      return base.join(',');
    });

    const csv = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${activeTab}_report_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success('Report exported!');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <Loader2 className="w-16 h-16 text-emerald-500 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            {activeTab === 'complaints' ? 'Complaints' : 'Suggestions'} Management
          </h1>
          <p className="text-gray-600 mt-1">
            Manage and respond to resident {activeTab}
          </p>
        </div>
        <button
          onClick={handleExportCSV}
          disabled={filteredData.length === 0}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-linear-to-r from-emerald-500 to-green-600 text-white rounded-lg font-medium transition-all shadow-lg shadow-emerald-500/30 hover:opacity-90 disabled:opacity-50 shrink-0"
        >
          <Download className="w-5 h-5" />
          Export CSV
        </button>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-2">
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab('complaints')}
            className={`flex-1 px-4 py-2.5 rounded-lg font-medium transition-all ${activeTab === 'complaints'
              ? 'bg-linear-to-r from-emerald-500 to-green-600 text-white shadow-lg shadow-emerald-500/30'
              : 'text-gray-700 hover:bg-gray-100'
              }`}
          >
            <div className="flex items-center justify-center gap-2">
              <AlertCircle className="w-5 h-5" />
              <span>Complaints</span>
              <span className={`px-2 py-0.5 rounded-full text-xs ${activeTab === 'complaints'
                ? 'bg-white/20 text-white'
                : 'bg-gray-200 text-gray-700'
                }`}>
                {complaints.length}
              </span>
            </div>
          </button>
          <button
            onClick={() => setActiveTab('suggestions')}
            className={`flex-1 px-4 py-2.5 rounded-lg font-medium transition-all ${activeTab === 'suggestions'
              ? 'bg-linear-to-r from-emerald-500 to-green-600 text-white shadow-lg shadow-emerald-500/30'
              : 'text-gray-700 hover:bg-gray-100'
              }`}
          >
            <div className="flex items-center justify-center gap-2">
              <MessageSquare className="w-5 h-5" />
              <span>Suggestions</span>
              <span className={`px-2 py-0.5 rounded-full text-xs ${activeTab === 'suggestions'
                ? 'bg-white/20 text-white'
                : 'bg-gray-200 text-gray-700'
                }`}>
                {suggestions.length}
              </span>
            </div>
          </button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total {activeTab === 'complaints' ? 'Complaints' : 'Suggestions'}</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{stats.total}</p>
            </div>
            <MessageSquare className="w-8 h-8 text-emerald-600" />
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Pending</p>
              <p className="text-2xl font-bold text-orange-600 mt-1">{stats.pending}</p>
            </div>
            <Clock className="w-8 h-8 text-orange-600" />
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">In Progress</p>
              <p className="text-2xl font-bold text-blue-600 mt-1">{stats.inProgress}</p>
            </div>
            <AlertCircle className="w-8 h-8 text-blue-600" />
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">
                {activeTab === 'complaints' ? 'Resolved' : 'Reviewed'}
              </p>
              <p className="text-2xl font-bold text-green-600 mt-1">
                {activeTab === 'complaints' ? stats.resolved : stats.reviewed}
              </p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
        </div>
      </div>

      {/* Main Content Card */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        {/* Filters */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by title, description, resident name, or house number..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
              />
            </div>
            <div className="flex gap-3">
              <div className="relative">
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="pl-4 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none appearance-none bg-white min-w-[150px]"
                >
                  <option value="all">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="in_progress">In Progress</option>
                  <option value={activeTab === 'complaints' ? 'resolved' : 'reviewed'}>
                    {activeTab === 'complaints' ? 'Resolved' : 'Reviewed'}
                  </option>
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
              </div>
              {activeTab === 'complaints' && (
                <div className="relative">
                  <select
                    value={filterCategory}
                    onChange={(e) => setFilterCategory(e.target.value)}
                    className="pl-4 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none appearance-none bg-white min-w-[150px]"
                  >
                    <option value="all">All Categories</option>
                    {Object.entries(ComplaintCategories).map(([key, category]) => (
                      <option key={key} value={key}>{category.label}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Table/List */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  {activeTab === 'complaints' ? 'Complaint' : 'Suggestion'}
                </th>
                {activeTab === 'complaints' && (
                  <>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                      AI Priority
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                      Category
                    </th>
                  </>
                )}
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Resident
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Submitted
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredData.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="max-w-md">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {item.title}
                      </p>
                      <p className="text-sm text-gray-500 truncate mt-1">
                        {item.description}
                      </p>
                    </div>
                  </td>

                  {activeTab === 'complaints' && (
                    <>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getPriorityBadge(item.priority)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getCategoryBadge(item.category)}
                      </td>
                    </>
                  )}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{item.userName}</p>
                      <p className="text-sm text-gray-500">House #{item.houseNumber}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getStatusBadge(item.status)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <p className="text-sm text-gray-900">{formatDate(item.createdAt)}</p>
                      <p className="text-xs text-gray-500">{formatTime(item.createdAt)}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <button
                      onClick={() => navigate(`/${activeTab}/${item.id}`)}
                      className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                    >
                      <Eye className="w-4 h-4" />
                      View Details
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Empty State */}
        {filteredData.length === 0 && (
          <div className="py-12 text-center">
            <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-500">No {activeTab} found</p>
            {searchTerm && (
              <p className="text-sm text-gray-400 mt-1">Try adjusting your search or filters</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Complaints;