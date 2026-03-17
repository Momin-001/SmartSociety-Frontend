// src/pages/Announcements.jsx
import { useState, useEffect } from 'react';
import {
    Search,
    Trash2,
    Plus,
    Loader2,
    Bell,
    Calendar,
    Megaphone,
    Clock,
    X,
    Archive,
    ArchiveRestore,
    Sparkles
} from 'lucide-react';
import { announcementsService } from '../services/announcementsService';
import { aiService } from '../services/aiService';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';

const TYPE_CONFIG = {
    announcement: {
        label: 'Announcement',
        icon: Megaphone,
        bg: 'bg-blue-100',
        text: 'text-blue-700',
        border: 'border-blue-200',
    },
    event: {
        label: 'Event',
        icon: Calendar,
        bg: 'bg-purple-100',
        text: 'text-purple-700',
        border: 'border-purple-200',
    },
};

const emptyForm = {
    title: '',
    description: '',
    type: 'announcement',
    date: '',
    time: '',
    imageUrl: '',
};

const Announcements = () => {
    const { user } = useAuth();
    const [announcements, setAnnouncements] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState('all');
    const [showArchived, setShowArchived] = useState(false);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isAdding, setIsAdding] = useState(false);
    const [form, setForm] = useState(emptyForm);
    const [timeSuggestions, setTimeSuggestions] = useState([]);
    const [isSuggesting, setIsSuggesting] = useState(false);

    useEffect(() => {
        fetchAnnouncements();
    }, []);

    const fetchAnnouncements = async () => {
        try {
            setLoading(true);
            const data = await announcementsService.getAllAnnouncements();
            setAnnouncements(data);
        } catch (error) {
            console.error('Error fetching announcements:', error);
            toast.error('Failed to load announcements.');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this announcement?')) return;
        try {
            await announcementsService.deleteAnnouncement(id);
            setAnnouncements(prev => prev.filter(a => a.id !== id));
            toast.success('Announcement deleted.');
        } catch {
            toast.error('Failed to delete announcement.');
        }
    };

    const handleAdd = async (e) => {
        e.preventDefault();
        if (!form.title || !form.description || !form.date) {
            toast.error('Please fill all required fields.');
            return;
        }
        try {
            setIsAdding(true);
            const payload = {
                title: form.title,
                description: form.description,
                type: form.type,
                date: form.date,
                time: form.time || null,
                createdBy: user?.email || 'Admin',
                imageUrl: form.imageUrl || null,
            };
            const added = await announcementsService.addAnnouncement(payload);
            setAnnouncements(prev => [added, ...prev]);
            toast.success('Announcement published!');
            setIsModalOpen(false);
            setForm(emptyForm);
        } catch {
            toast.error('Failed to publish announcement.');
        } finally {
            setIsAdding(false);
        }
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setForm(emptyForm);
        setTimeSuggestions([]);
    };

    const handleSuggestTime = async () => {
        if (!form.title && !form.description) {
            toast.info('Please enter a title or description first so the AI can suggest.');
            return;
        }
        try {
            setIsSuggesting(true);
            const pastEvents = announcements
                .filter(a => a.type === 'event')
                .slice(0, 10)
                .map(e => ({ title: e.title, date: e.date, time: e.time }));
            const suggestions = await aiService.suggestEventTime(
                `${form.title}. ${form.description}`,
                pastEvents
            );
            setTimeSuggestions(suggestions);
        } catch {
            toast.error('Failed to get time suggestions.');
        } finally {
            setIsSuggesting(false);
        }
    };

    const handleArchive = async (id) => {
        try {
            await announcementsService.archiveAnnouncement(id);
            setAnnouncements(prev => prev.map(a => a.id === id ? { ...a, isArchived: true } : a));
            toast.success('Archived successfully.');
        } catch {
            toast.error('Failed to archive.');
        }
    };

    const handleUnarchive = async (id) => {
        try {
            await announcementsService.unarchiveAnnouncement(id);
            setAnnouncements(prev => prev.map(a => a.id === id ? { ...a, isArchived: false } : a));
            toast.success('Unarchived successfully.');
        } catch {
            toast.error('Failed to unarchive.');
        }
    };

    const filteredAnnouncements = announcements.filter(a => {
        const matchesSearch =
            a.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            a.description?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesType = filterType === 'all' || a.type === filterType;
        const matchesArchived = showArchived ? a.isArchived : !a.isArchived;
        return matchesSearch && matchesType && matchesArchived;
    });

    const formatDate = (date) => {
        if (!date) return 'N/A';
        return new Date(date).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
        });
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="text-center">
                    <Loader2 className="w-16 h-16 text-emerald-500 animate-spin mx-auto mb-4" />
                    <p className="text-gray-600">Loading announcements...</p>
                </div>
            </div>
        );
    }

    const announcementsCount = announcements.filter(a => a.type === 'announcement' && !a.isArchived).length;
    const eventsCount = announcements.filter(a => a.type === 'event' && !a.isArchived).length;
    const archivedCount = announcements.filter(a => a.isArchived).length;

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Announcements</h1>
                    <p className="text-gray-600 mt-1">
                        Publish and manage society announcements &amp; events
                    </p>
                </div>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="inline-flex items-center gap-2 px-4 py-2.5 bg-linear-to-r from-emerald-500 to-green-600 text-white rounded-lg font-medium transition-all shadow-lg shadow-emerald-500/30 hover:opacity-90 shrink-0"
                >
                    <Plus className="w-5 h-5" />
                    New Announcement
                </button>
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 flex items-center justify-between">
                    <div>
                        <p className="text-sm text-gray-600">Total</p>
                        <p className="text-2xl font-bold text-gray-900 mt-1">{announcements.length}</p>
                    </div>
                    <Bell className="w-8 h-8 text-emerald-600" />
                </div>
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 flex items-center justify-between">
                    <div>
                        <p className="text-sm text-gray-600">Announcements</p>
                        <p className="text-2xl font-bold text-blue-600 mt-1">{announcementsCount}</p>
                    </div>
                    <Megaphone className="w-8 h-8 text-blue-500" />
                </div>
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 flex items-center justify-between">
                    <div>
                        <p className="text-sm text-gray-600">Events</p>
                        <p className="text-2xl font-bold text-purple-600 mt-1">{eventsCount}</p>
                    </div>
                    <Calendar className="w-8 h-8 text-purple-500" />
                </div>
            </div>

            {/* Active / Archived Toggle */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-2">
                <div className="flex gap-2">
                    <button
                        onClick={() => setShowArchived(false)}
                        className={`flex-1 px-4 py-2.5 rounded-lg font-medium transition-all ${!showArchived
                            ? 'bg-linear-to-r from-emerald-500 to-green-600 text-white shadow-lg shadow-emerald-500/30'
                            : 'text-gray-700 hover:bg-gray-100'
                            }`}
                    >
                        <div className="flex items-center justify-center gap-2">
                            <Bell className="w-5 h-5" />
                            Active
                        </div>
                    </button>
                    <button
                        onClick={() => setShowArchived(true)}
                        className={`flex-1 px-4 py-2.5 rounded-lg font-medium transition-all ${showArchived
                            ? 'bg-linear-to-r from-emerald-500 to-green-600 text-white shadow-lg shadow-emerald-500/30'
                            : 'text-gray-700 hover:bg-gray-100'
                            }`}
                    >
                        <div className="flex items-center justify-center gap-2">
                            <Archive className="w-5 h-5" />
                            Archived
                            <span className={`px-2 py-0.5 rounded-full text-xs ${showArchived ? 'bg-white/20 text-white' : 'bg-gray-200 text-gray-700'}`}>{archivedCount}</span>
                        </div>
                    </button>
                </div>
            </div>

            {/* Main Content Card */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
                {/* Filters */}
                <div className="p-6 border-b border-gray-200 flex flex-col sm:flex-row gap-4">
                    <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search announcements..."
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                        />
                    </div>
                    <div className="flex gap-2 shrink-0">
                        {['all', 'announcement', 'event'].map(t => (
                            <button
                                key={t}
                                onClick={() => setFilterType(t)}
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all capitalize ${filterType === t
                                    ? 'bg-linear-to-r from-emerald-500 to-green-600 text-white shadow-md shadow-emerald-500/30'
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                    }`}
                            >
                                {t === 'all' ? 'All' : TYPE_CONFIG[t].label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Cards Grid */}
                {filteredAnnouncements.length > 0 ? (
                    <div className="p-6 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                        {filteredAnnouncements.map(item => {
                            const cfg = TYPE_CONFIG[item.type] || TYPE_CONFIG.announcement;
                            const Icon = cfg.icon;
                            return (
                                <div
                                    key={item.id}
                                    className="border border-gray-200 rounded-xl overflow-hidden hover:shadow-md transition-shadow flex flex-col"
                                >
                                    {/* Image or gradient banner */}
                                    {item.imageUrl ? (
                                        <img
                                            src={item.imageUrl}
                                            alt={item.title}
                                            className="w-full h-36 object-cover"
                                        />
                                    ) : (
                                        <div className={`w-full h-14 ${item.type === 'event' ? 'bg-linear-to-br from-purple-500 to-indigo-600' : 'bg-linear-to-br from-emerald-500 to-green-600'} flex items-center justify-center`}>
                                            <Icon className="w-6 h-6 text-white/70" />
                                        </div>
                                    )}

                                    <div className="p-4 flex flex-col flex-1">
                                        {/* Type badge */}
                                        <span className={`self-start inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium border ${cfg.bg} ${cfg.text} ${cfg.border} mb-2`}>
                                            <Icon className="w-3 h-3" />
                                            {cfg.label}
                                        </span>

                                        <h3 className="font-semibold text-gray-900 leading-snug line-clamp-2 mb-1">
                                            {item.title}
                                        </h3>
                                        <p className="text-sm text-gray-500 line-clamp-3 flex-1 mb-3">
                                            {item.description}
                                        </p>

                                        <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                                            <div className="text-xs text-gray-500 space-y-0.5">
                                                <p className="flex items-center gap-1">
                                                    <Calendar className="w-3 h-3" />
                                                    {formatDate(item.date)}
                                                    {item.time && (
                                                        <span className="flex items-center gap-1 ml-1">
                                                            <Clock className="w-3 h-3" />
                                                            {item.time}
                                                        </span>
                                                    )}
                                                </p>
                                                <p className="text-gray-400">By {item.createdBy}</p>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                {!showArchived ? (
                                                    <button
                                                        onClick={() => handleArchive(item.id)}
                                                        className="p-1.5 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors"
                                                        title="Archive"
                                                    >
                                                        <Archive className="w-4 h-4" />
                                                    </button>
                                                ) : (
                                                    <button
                                                        onClick={() => handleUnarchive(item.id)}
                                                        className="p-1.5 text-emerald-500 hover:bg-emerald-50 rounded-lg transition-colors"
                                                        title="Unarchive"
                                                    >
                                                        <ArchiveRestore className="w-4 h-4" />
                                                    </button>
                                                )}
                                                <button
                                                    onClick={() => handleDelete(item.id)}
                                                    className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                                    title="Delete"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div className="py-16 text-center">
                        <Bell className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                        <p className="text-gray-500 font-medium">No announcements found</p>
                        {(searchTerm || filterType !== 'all') && (
                            <p className="text-sm text-gray-400 mt-1">Try adjusting your filters</p>
                        )}
                    </div>
                )}
            </div>

            {/* Add Announcement Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden max-h-[90vh] flex flex-col">
                        {/* Modal header */}
                        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-gray-50 shrink-0">
                            <h3 className="text-lg font-bold text-gray-900">New Announcement</h3>
                            <button onClick={closeModal} className="text-gray-400 hover:text-gray-600 transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Modal body */}
                        <div className="p-6 overflow-y-auto flex-1">
                            <form id="announcement-form" onSubmit={handleAdd} className="space-y-4">
                                {/* Type toggle */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Type <span className="text-red-500">*</span></label>
                                    <div className="flex rounded-lg border border-gray-300 overflow-hidden">
                                        {['announcement', 'event'].map(t => (
                                            <button
                                                key={t}
                                                type="button"
                                                onClick={() => setForm({ ...form, type: t })}
                                                className={`flex-1 py-2 text-sm font-medium flex items-center justify-center gap-2 transition-colors capitalize ${form.type === t
                                                    ? 'bg-emerald-600 text-white'
                                                    : 'bg-white text-gray-600 hover:bg-gray-50'
                                                    }`}
                                            >
                                                {t === 'announcement' ? <Megaphone className="w-4 h-4" /> : <Calendar className="w-4 h-4" />}
                                                {TYPE_CONFIG[t].label}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Title <span className="text-red-500">*</span></label>
                                    <input
                                        type="text"
                                        required
                                        placeholder="e.g. Society Meeting on March 1st"
                                        value={form.title}
                                        onChange={e => setForm({ ...form, title: e.target.value })}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Description <span className="text-red-500">*</span></label>
                                    <textarea
                                        required
                                        rows="4"
                                        placeholder="Write announcement details here..."
                                        value={form.description}
                                        onChange={e => setForm({ ...form, description: e.target.value })}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none resize-none"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Date <span className="text-red-500">*</span></label>
                                        <input
                                            type="date"
                                            required
                                            value={form.date}
                                            onChange={e => setForm({ ...form, date: e.target.value })}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                                        />
                                    </div>
                                    {form.type === 'event' && (
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Time</label>
                                            <input
                                                type="time"
                                                value={form.time}
                                                onChange={e => setForm({ ...form, time: e.target.value })}
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                                            />
                                        </div>
                                    )}
                                </div>

                                {/* AI Time Suggestion (visible for events) */}
                                {form.type === 'event' && (
                                    <div>
                                        <button
                                            type="button"
                                            onClick={handleSuggestTime}
                                            disabled={isSuggesting}
                                            className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 bg-linear-to-r from-purple-500 to-indigo-600 text-white rounded-lg font-medium transition-all shadow-lg shadow-purple-500/30 hover:opacity-90 disabled:opacity-70 text-sm"
                                        >
                                            {isSuggesting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                                            {isSuggesting ? 'Thinking...' : 'AI: Suggest Best Time'}
                                        </button>
                                        {timeSuggestions.length > 0 && (
                                            <div className="mt-3 space-y-2">
                                                {timeSuggestions.map((s, i) => (
                                                    <button
                                                        key={i}
                                                        type="button"
                                                        onClick={() => setForm({ ...form, time: s.time })}
                                                        className="w-full text-left p-3 rounded-lg border border-purple-200 bg-purple-50 hover:bg-purple-100 transition-colors"
                                                    >
                                                        <p className="text-sm font-medium text-purple-800">{s.day} at {s.time}</p>
                                                        <p className="text-xs text-purple-600 mt-0.5">{s.reason}</p>
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Image URL <span className="text-gray-400">(optional)</span></label>
                                    <input
                                        type="url"
                                        placeholder="https://example.com/image.jpg"
                                        value={form.imageUrl}
                                        onChange={e => setForm({ ...form, imageUrl: e.target.value })}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                                    />
                                </div>
                            </form>
                        </div>

                        {/* Modal footer */}
                        <div className="p-4 border-t border-gray-200 bg-gray-50 flex gap-3 shrink-0">
                            <button
                                type="button"
                                onClick={closeModal}
                                className="flex-1 px-4 py-2 text-gray-700 bg-white border border-gray-300 hover:bg-gray-100 font-medium rounded-lg transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                form="announcement-form"
                                disabled={isAdding}
                                className="flex-1 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-70"
                            >
                                {isAdding ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        Publishing...
                                    </>
                                ) : 'Publish'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Announcements;
