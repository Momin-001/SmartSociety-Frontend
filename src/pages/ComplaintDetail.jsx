// src/pages/ComplaintDetail.jsx
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  User, 
  Home, 
  Calendar,
  Clock,
  Mail,
  MessageSquare,
  CheckCircle,
  AlertCircle,
  Send,
  Trash2,
  Loader2
} from 'lucide-react';
import { complaintsService } from '../services/complaintsService';
import { ComplaintCategories, ComplaintStatuses, SuggestionStatuses } from '../utils/constants';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';

const ComplaintDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [showReplyBox, setShowReplyBox] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // Determine if it's a complaint or suggestion based on the URL
  const isComplaint = window.location.pathname.includes('/complaints/');

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    try {
      setLoading(true);
      let fetchedData;
      if (isComplaint) {
        fetchedData = await complaintsService.getComplaintById(id);
      } else {
        fetchedData = await complaintsService.getSuggestionById(id);
      }
      
      if (fetchedData) {
        setData(fetchedData);
        if (fetchedData.adminReply) {
          setReplyText(fetchedData.adminReply);
        }
      } else {
        toast.error('Record not found');
        navigate(-1);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to fetch data. Please try again.');
      navigate(-1);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (newStatus) => {
    try {
      setActionLoading(true);
      if (isComplaint) {
        await complaintsService.updateComplaintStatus(id, newStatus);
      } else {
        await complaintsService.updateSuggestionStatus(id, newStatus);
      }
      await fetchData();
        toast.success('Status updated successfully!');
    } catch (error) {
      console.error('Error updating status:', error);
        toast.error('Failed to update status. Please try again.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReply = async () => {
    if (!replyText.trim()) {
        toast.error('Reply cannot be empty');
      return;
    }

    try {
      setActionLoading(true);
      if (isComplaint) {
        await complaintsService.replyToComplaint(id, replyText, user.email);
      } else {
        await complaintsService.replyToSuggestion(id, replyText, user.email);
      }
      await fetchData();
      setShowReplyBox(false);
        toast.success('Reply sent successfully!');
    } catch (error) {
      console.error('Error sending reply:', error);
        toast.error('Failed to send reply. Please try again.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      setActionLoading(true);
      if (isComplaint) {
        await complaintsService.deleteComplaint(id);
      } else {
        await complaintsService.deleteSuggestion(id);
      }
        toast.success('Deleted successfully!');
      navigate(-1);
    } catch (error) {
      console.error('Error deleting:', error);
        toast.error('Failed to delete. Please try again.');
    } finally {
      setActionLoading(false);
      setShowDeleteModal(false);
    }
  };

  const formatDate = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-US', { 
      month: 'long', 
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

  const formatDateTime = (date) => {
    if (!date) return 'N/A';
    return `${formatDate(date)} at ${formatTime(date)}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <Loader2 className="w-16 h-16 text-emerald-500 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading details...</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return null;
  }

  const statusConfig = isComplaint 
    ? ComplaintStatuses[data.status]
    : SuggestionStatuses[data.status];

  const categoryInfo = isComplaint && data.category 
    ? ComplaintCategories[data.category] 
    : null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-700" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              {isComplaint ? 'Complaint' : 'Suggestion'} Details
            </h1>
            <p className="text-gray-600 mt-1">
              View and manage {isComplaint ? 'complaint' : 'suggestion'}
            </p>
          </div>
        </div>
        <button
          onClick={() => setShowDeleteModal(true)}
          disabled={actionLoading}
          className="flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
        >
          <Trash2 className="w-5 h-5" />
          <span className="font-medium">Delete</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content - Left Side */}
        <div className="lg:col-span-2 space-y-6">
          {/* Status Card */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-gray-900">Status</h2>
              <span className={`px-4 py-2 rounded-full text-sm font-medium ${statusConfig.bgColor} ${statusConfig.textColor} border ${statusConfig.borderColor}`}>
                {statusConfig.label}
              </span>
            </div>

            <div className="space-y-3">
              <p className="text-sm text-gray-600 mb-4">Update status:</p>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => handleStatusChange('pending')}
                  disabled={actionLoading || data.status === 'pending'}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    data.status === 'pending'
                      ? 'bg-orange-100 text-orange-700 cursor-not-allowed'
                      : 'bg-orange-50 text-orange-600 hover:bg-orange-100'
                  } disabled:opacity-50`}
                >
                  Pending
                </button>
                <button
                  onClick={() => handleStatusChange('in_progress')}
                  disabled={actionLoading || data.status === 'in_progress'}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    data.status === 'in_progress'
                      ? 'bg-blue-100 text-blue-700 cursor-not-allowed'
                      : 'bg-blue-50 text-blue-600 hover:bg-blue-100'
                  } disabled:opacity-50`}
                >
                  In Progress
                </button>
                <button
                  onClick={() => handleStatusChange(isComplaint ? 'resolved' : 'reviewed')}
                  disabled={actionLoading || data.status === (isComplaint ? 'resolved' : 'reviewed')}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    data.status === (isComplaint ? 'resolved' : 'reviewed')
                      ? 'bg-green-100 text-green-700 cursor-not-allowed'
                      : 'bg-green-50 text-green-600 hover:bg-green-100'
                  } disabled:opacity-50`}
                >
                  {isComplaint ? 'Resolved' : 'Reviewed'}
                </button>
              </div>
            </div>
          </div>

          {/* Details Card */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            {isComplaint && categoryInfo && (
              <div className="mb-6 pb-6 border-b border-gray-200">
                <p className="text-sm text-gray-600 mb-2">Category</p>
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-lg">
                  <span className="text-gray-900 font-medium">{categoryInfo.label}</span>
                </div>
              </div>
            )}

            <div className="space-y-6">
              <div>
                <p className="text-sm text-gray-600 mb-2">Title</p>
                <h3 className="text-xl font-semibold text-gray-900">{data.title}</h3>
              </div>

              <div>
                <p className="text-sm text-gray-600 mb-2">Description</p>
                <p className="text-gray-700 leading-relaxed">{data.description}</p>
              </div>
            </div>
          </div>

          {/* Reply Section */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Admin Reply</h2>
              {!showReplyBox && !data.adminReply && (
                <button
                  onClick={() => setShowReplyBox(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 rounded-lg transition-colors font-medium"
                >
                  <MessageSquare className="w-4 h-4" />
                  Add Reply
                </button>
              )}
            </div>

            {data.adminReply ? (
              <div className="space-y-4">
                <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
                  <p className="text-gray-900">{data.adminReply}</p>
                </div>
                {data.repliedAt && (
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Clock className="w-4 h-4" />
                    <span>Replied on {formatDateTime(data.repliedAt)}</span>
                  </div>
                )}
                <button
                  onClick={() => setShowReplyBox(true)}
                  className="text-sm text-emerald-600 hover:text-emerald-700 font-medium"
                >
                  Edit Reply
                </button>
              </div>
            ) : showReplyBox ? (
              <div className="space-y-4">
                <textarea
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="Write your reply to the resident..."
                  rows={5}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none resize-none"
                />
                <div className="flex gap-3">
                  <button
                    onClick={handleReply}
                    disabled={actionLoading || !replyText.trim()}
                    className="flex items-center gap-2 px-4 py-2 bg-linear-to-r from-emerald-500 to-green-600 text-white rounded-lg hover:from-emerald-600 hover:to-green-700 transition-all disabled:opacity-50 font-medium"
                  >
                    {actionLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                    Send Reply
                  </button>
                  <button
                    onClick={() => {
                      setShowReplyBox(false);
                      setReplyText(data.adminReply || '');
                    }}
                    disabled={actionLoading}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">No reply yet</p>
            )}
          </div>

          {/* Timeline */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">Activity Timeline</h2>
            
            <div className="space-y-4">
              {/* Submitted */}
              <div className="flex gap-4">
                <div className="flex flex-col items-center">
                  <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center">
                    <CheckCircle className="w-5 h-5 text-emerald-600" />
                  </div>
                  {(data.status !== 'pending' || data.adminReply) && (
                    <div className="w-0.5 h-full bg-gray-200 mt-2"></div>
                  )}
                </div>
                <div className="flex-1 pb-4">
                  <p className="font-medium text-gray-900">Submitted</p>
                  <p className="text-sm text-gray-500 mt-1">{formatDateTime(data.createdAt)}</p>
                </div>
              </div>

              {/* In Progress */}
              {data.status !== 'pending' && (
                <div className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                      <Clock className="w-5 h-5 text-blue-600" />
                    </div>
                    {(data.status === (isComplaint ? 'resolved' : 'reviewed') || data.adminReply) && (
                      <div className="w-0.5 h-full bg-gray-200 mt-2"></div>
                    )}
                  </div>
                  <div className="flex-1 pb-4">
                    <p className="font-medium text-gray-900">
                      {data.status === 'in_progress' ? 'In Progress' : 'Was In Progress'}
                    </p>
                    <p className="text-sm text-gray-500 mt-1">{formatDateTime(data.updatedAt)}</p>
                  </div>
                </div>
              )}

              {/* Replied */}
              {data.adminReply && data.repliedAt && (
                <div className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
                      <MessageSquare className="w-5 h-5 text-purple-600" />
                    </div>
                    {data.status === (isComplaint ? 'resolved' : 'reviewed') && (
                      <div className="w-0.5 h-full bg-gray-200 mt-2"></div>
                    )}
                  </div>
                  <div className="flex-1 pb-4">
                    <p className="font-medium text-gray-900">Admin Replied</p>
                    <p className="text-sm text-gray-500 mt-1">{formatDateTime(data.repliedAt)}</p>
                  </div>
                </div>
              )}

              {/* Resolved/Reviewed */}
              {data.status === (isComplaint ? 'resolved' : 'reviewed') && (
                <div className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                    </div>
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">
                      {isComplaint ? 'Resolved' : 'Reviewed'}
                    </p>
                    <p className="text-sm text-gray-500 mt-1">
                      {formatDateTime(data.resolvedAt || data.reviewedAt)}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar - Right Side */}
        <div className="space-y-6">
          {/* Resident Info */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Resident Information</h2>
            
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-linear-to-br from-emerald-400 to-green-500 flex items-center justify-center text-white font-semibold shrink-0">
                  {data.userName?.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1">
                  <p className="text-sm text-gray-600">Name</p>
                  <p className="font-medium text-gray-900">{data.userName}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Home className="w-5 h-5 text-gray-400 shrink-0" />
                <div className="flex-1">
                  <p className="text-sm text-gray-600">House Number</p>
                  <p className="font-medium text-gray-900">{data.houseNumber}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-gray-400 shrink-0" />
                <div className="flex-1">
                  <p className="text-sm text-gray-600">Email</p>
                  <p className="font-medium text-gray-900 break-all">{data.userEmail}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Calendar className="w-5 h-5 text-gray-400 shrink-0" />
                <div className="flex-1">
                  <p className="text-sm text-gray-600">Submitted On</p>
                  <p className="font-medium text-gray-900">{formatDate(data.createdAt)}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
            
            <div className="space-y-2">
              {!data.adminReply && (
                <button
                  onClick={() => setShowReplyBox(true)}
                  className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-50 rounded-lg transition-colors"
                >
                  <MessageSquare className="w-5 h-5 text-emerald-600" />
                  <span className="font-medium text-gray-900">Reply to Resident</span>
                </button>
              )}
              {data.status !== (isComplaint ? 'resolved' : 'reviewed') && (
                <button
                  onClick={() => handleStatusChange(isComplaint ? 'resolved' : 'reviewed')}
                  disabled={actionLoading}
                  className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-50 rounded-lg transition-colors disabled:opacity-50"
                >
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span className="font-medium text-gray-900">
                    Mark as {isComplaint ? 'Resolved' : 'Reviewed'}
                  </span>
                </button>
              )}
              <button
                onClick={() => setShowDeleteModal(true)}
                disabled={actionLoading}
                className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
              >
                <Trash2 className="w-5 h-5 text-red-600" />
                <span className="font-medium text-red-600">
                  Delete {isComplaint ? 'Complaint' : 'Suggestion'}
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-red-100 mx-auto mb-4">
              <AlertCircle className="w-6 h-6 text-red-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 text-center mb-2">
              Delete {isComplaint ? 'Complaint' : 'Suggestion'}
            </h3>
            <p className="text-sm text-gray-600 text-center mb-6">
              Are you sure you want to delete this {isComplaint ? 'complaint' : 'suggestion'}? 
              This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                disabled={actionLoading}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={actionLoading}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {actionLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ComplaintDetail;