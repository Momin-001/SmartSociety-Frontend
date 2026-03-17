// src/pages/Bills.jsx
import { useState, useEffect } from 'react';
import {
    Search,
    Trash2,
    Plus,
    Loader2,
    DollarSign,
    FileText,
    UserCircle,
    Sparkles,
    CreditCard,
    RefreshCw,
    Zap,
    CheckCircle2,
    AlertTriangle,
    X
} from 'lucide-react';
import { billsService } from '../services/billsService';
import { userService } from '../services/userService';
import { aiService } from '../services/aiService';
import { paymentService } from '../services/paymentService';
import { toast } from 'react-toastify';

const Bills = () => {
    const [bills, setBills] = useState([]);
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    // Modal state
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isAdding, setIsAdding] = useState(false);
    const [riskMap, setRiskMap] = useState({});
    const [isPredicting, setIsPredicting] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);

    // Payment modal state
    const [isPayModalOpen, setIsPayModalOpen] = useState(false);
    const [selectedBill, setSelectedBill] = useState(null);
    const [isPaying, setIsPaying] = useState(false);
    const [cardDetails, setCardDetails] = useState({
        cardNumber: '',
        expiry: '',
        cvc: '',
        name: ''
    });

    const [newBill, setNewBill] = useState({
        title: '',
        userId: '',
        type: 'Maintenance',
        amount: '',
        dueDate: '',
        description: '',
        month: ''
    });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [billsData, usersData] = await Promise.all([
                billsService.getAllBills(),
                userService.getAllUsers()
            ]);
            setBills(billsData);
            setUsers(usersData);
        } catch (error) {
            console.error('Error fetching data:', error);
            toast.error('Failed to fetch data.');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this bill?')) return;

        try {
            await billsService.deleteBill(id);
            toast.success('Bill deleted successfully');
            setBills(bills.filter(bill => bill.id !== id));
        } catch (error) {
            console.error('Error deleting bill:', error);
            toast.error('Failed to delete bill.');
        }
    };

    const handleAddBill = async (e) => {
        e.preventDefault();
        if (!newBill.title || !newBill.userId || !newBill.amount || !newBill.dueDate || !newBill.month) {
            toast.error('Please fill all required fields');
            return;
        }

        const selectedUser = users.find(u => u.id === newBill.userId);
        if (!selectedUser) {
            toast.error('Selected user not found');
            return;
        }

        try {
            setIsAdding(true);
            const billData = {
                title: newBill.title,
                userId: selectedUser.id,
                userName: selectedUser.fullName || selectedUser.name || 'Unknown User',
                houseNumber: selectedUser.flatNumber || selectedUser.houseNumber || 'Unknown',
                type: newBill.type,
                amount: Number(newBill.amount),
                dueDate: newBill.dueDate,
                status: 'pending',
                description: newBill.description,
                month: newBill.month
            };

            const addedBill = await billsService.addBill(billData);
            setBills([addedBill, ...bills]);
            toast.success('Bill added successfully');
            setIsAddModalOpen(false);
            setNewBill({ title: '', userId: '', type: 'Maintenance', amount: '', dueDate: '', description: '', month: '' });
        } catch (error) {
            console.error('Error adding bill:', error);
            toast.error('Failed to add bill.');
        } finally {
            setIsAdding(false);
        }
    };

    // ── Auto-Generate Monthly Bills ────────────────────────────────
    const handleGenerateBills = async () => {
        if (!window.confirm('This will auto-generate Maintenance, Water & Electricity bills for all residents for the current month. Continue?')) return;

        try {
            setIsGenerating(true);
            const result = await paymentService.generateMonthlyBills();
            toast.success(`✅ Generated ${result.billsCreated} bills for ${result.month}`);
            await fetchData(); // Refresh the bills list
        } catch (error) {
            console.error('Error generating bills:', error);
            toast.error('Failed to generate monthly bills.');
        } finally {
            setIsGenerating(false);
        }
    };

    // ── Pay Bill ───────────────────────────────────────────────────
    const openPayModal = (bill) => {
        setSelectedBill(bill);
        setCardDetails({ cardNumber: '', expiry: '', cvc: '', name: '' });
        setIsPayModalOpen(true);
    };

    const handlePayBill = async (e) => {
        e.preventDefault();
        if (!selectedBill) return;

        try {
            setIsPaying(true);

            // 1. Create PaymentIntent on the backend
            const { clientSecret } = await paymentService.createPaymentIntent(
                selectedBill.amount,
                selectedBill.id
            );

            // 2. In a full integration, you'd use Stripe.js confirmCardPayment here.
            //    For this implementation, we simulate success and confirm on the backend.
            //    The clientSecret confirms the intent was created.

            // 3. Confirm payment on the server (marks bill as paid in Firestore)
            await paymentService.confirmPaymentOnServer(selectedBill.id, clientSecret);

            // 4. Update local state
            setBills(bills.map(b =>
                b.id === selectedBill.id
                    ? { ...b, status: 'paid', paidAt: new Date() }
                    : b
            ));

            toast.success('💳 Payment successful! Bill marked as paid.');
            setIsPayModalOpen(false);
            setSelectedBill(null);
        } catch (error) {
            console.error('Payment error:', error);
            toast.error('Payment failed. Please try again.');
        } finally {
            setIsPaying(false);
        }
    };

    // ── AI Late Payment Prediction (enhanced with 6-month history) ──
    const handlePredictLate = async () => {
        const pendingBills = bills.filter(b => b.status !== 'paid');
        if (pendingBills.length === 0) {
            toast.info('No pending bills to analyze.');
            return;
        }
        try {
            setIsPredicting(true);

            // Gather unique user IDs from pending bills
            const userIds = [...new Set(pendingBills.map(b => b.userId))];

            // Fetch 6-month payment history for each user
            const historyByUser = {};
            await Promise.all(
                userIds.map(async (uid) => {
                    try {
                        const history = await paymentService.getPaymentHistory(uid);
                        // Count late payments
                        const lateCount = history.filter(
                            h => h.status === 'overdue' || h.status === 'late'
                        ).length;
                        historyByUser[uid] = { history, lateCount };
                    } catch {
                        historyByUser[uid] = { history: [], lateCount: 0 };
                    }
                })
            );

            // Build payload with payment history
            const payload = pendingBills.map(b => ({
                id: b.id,
                userName: b.userName,
                amount: b.amount,
                dueDate: b.dueDate instanceof Date ? b.dueDate.toISOString() : b.dueDate,
                type: b.type,
                month: b.month,
                paymentHistory: historyByUser[b.userId]?.history || [],
                lateCountLast6Months: historyByUser[b.userId]?.lateCount || 0,
            }));

            const result = await aiService.predictLatePayments(payload);
            setRiskMap(result);
            toast.success('🤖 AI late payment prediction complete!');
        } catch {
            toast.error('Failed to predict late payments.');
        } finally {
            setIsPredicting(false);
        }
    };

    const filteredBills = bills.filter(bill =>
        bill.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        bill.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        bill.userName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        bill.houseNumber?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const formatDate = (date) => {
        if (!date) return 'N/A';
        return new Date(date).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="text-center">
                    <Loader2 className="w-16 h-16 text-emerald-500 animate-spin mx-auto mb-4" />
                    <p className="text-gray-600">Loading bills...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Bills Management</h1>
                    <p className="text-gray-600 mt-1">
                        Create, manage & auto-generate society bills
                    </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                    {/* AI Predict */}
                    <button
                        onClick={handlePredictLate}
                        disabled={isPredicting}
                        className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-50 text-emerald-700 rounded-lg font-medium transition-all hover:bg-emerald-100 disabled:opacity-70"
                    >
                        {isPredicting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
                        {isPredicting ? 'Analyzing...' : 'Predict Late Payments'}
                    </button>
                    {/* Auto-Generate Monthly Bills */}
                    <button
                        onClick={handleGenerateBills}
                        disabled={isGenerating}
                        className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-50 text-emerald-700 rounded-lg font-medium transition-all hover:bg-emerald-100 disabled:opacity-70"
                    >
                        {isGenerating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Zap className="w-5 h-5" />}
                        {isGenerating ? 'Generating...' : 'Generate Monthly Bills'}
                    </button>
                    {/* Add New Bill */}
                    <button
                        onClick={() => setIsAddModalOpen(true)}
                        className="inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-emerald-500 to-green-600 text-white rounded-lg font-medium transition-all shadow-lg shadow-emerald-500/30 hover:opacity-90"
                    >
                        <Plus className="w-5 h-5" />
                        Add New Bill
                    </button>

                </div>
            </div>

            {/* Main Content Card */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
                {/* Filters */}
                <div className="p-6 border-b border-gray-200">
                    <div className="relative max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search by title, description, or user..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                        />
                    </div>
                </div>

                {/* Table List */}
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50 border-b border-gray-200">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                                    Bill Info
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                                    Resident
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                                    Amount
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                                    Due Date
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                                    Status
                                </th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-700 uppercase tracking-wider">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {filteredBills.map((bill) => (
                                <tr key={bill.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="max-w-md">
                                            <p className="text-sm font-medium text-gray-900 truncate flex items-center gap-2">
                                                {bill.title}
                                                <span className="px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-600 border border-gray-200">
                                                    {bill.type || 'Other'}
                                                </span>
                                                {bill.autoGenerated && (
                                                    <span className="px-2 py-0.5 rounded text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200">
                                                        Auto
                                                    </span>
                                                )}
                                            </p>
                                            {bill.month && (
                                                <p className="text-xs text-emerald-600 font-medium mt-0.5">
                                                    Billing Month: {bill.month}
                                                </p>
                                            )}
                                            {bill.description && (
                                                <p className="text-sm text-gray-500 truncate mt-1">
                                                    {bill.description}
                                                </p>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center gap-2">
                                            <UserCircle className="w-6 h-6 text-gray-400" />
                                            <div>
                                                <p className="text-sm font-medium text-gray-900">{bill.userName}</p>
                                                <p className="text-xs text-gray-500">House #{bill.houseNumber}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center text-gray-900 font-medium font-mono">
                                            <DollarSign className="w-4 h-4 text-gray-500 mr-1" />
                                            {bill.amount}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <p className="text-sm text-gray-900">{formatDate(bill.dueDate)}</p>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`px-3 py-1 rounded-full text-xs font-medium border ${bill.status === 'paid'
                                            ? 'bg-green-100 text-green-800 border-green-200'
                                            : bill.status === 'overdue'
                                                ? 'bg-red-100 text-red-800 border-red-200'
                                                : 'bg-orange-100 text-orange-800 border-orange-200'
                                            }`}>
                                            {bill.status === 'paid' ? 'Paid' : bill.status === 'overdue' ? 'Overdue' : 'Pending'}
                                        </span>
                                        {riskMap[bill.id] && bill.status !== 'paid' && (
                                            <span className={`ml-1 px-2 py-0.5 rounded-full text-xs font-medium border ${riskMap[bill.id] === 'High Risk' ? 'bg-red-100 text-red-700 border-red-200'
                                                : riskMap[bill.id] === 'Medium Risk' ? 'bg-yellow-100 text-yellow-700 border-yellow-200'
                                                    : 'bg-green-100 text-green-700 border-green-200'
                                                }`}>
                                                {riskMap[bill.id]}
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right">
                                        <div className="flex items-center justify-end gap-1">
                                            {bill.status !== 'paid' && (
                                                <button
                                                    onClick={() => openPayModal(bill)}
                                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                                                    title="Pay Now"
                                                >
                                                    <CreditCard className="w-4 h-4" />
                                                    Pay
                                                </button>
                                            )}
                                            <button
                                                onClick={() => handleDelete(bill.id)}
                                                className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                title="Delete Bill"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                                Delete
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Empty State */}
                {filteredBills.length === 0 && (
                    <div className="py-12 text-center">
                        <FileText className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                        <p className="text-gray-500">No bills found</p>
                        {searchTerm && (
                            <p className="text-sm text-gray-400 mt-1">Try adjusting your search</p>
                        )}
                    </div>
                )}
            </div>

            {/* ═══════════════════════════════════════════════════════ */}
            {/* Add Bill Modal */}
            {/* ═══════════════════════════════════════════════════════ */}
            {isAddModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl overflow-hidden max-h-[90vh] flex flex-col">
                        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-gray-50 shrink-0">
                            <h3 className="text-lg font-bold text-gray-900">Add New Bill</h3>
                            <button
                                onClick={() => setIsAddModalOpen(false)}
                                className="text-gray-400 hover:text-gray-600 transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="p-6 overflow-y-auto">
                            <form id="add-bill-form" onSubmit={handleAddBill} className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Select Resident <span className="text-red-500">*</span>
                                        </label>
                                        <select
                                            required
                                            value={newBill.userId}
                                            onChange={(e) => setNewBill({ ...newBill, userId: e.target.value })}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none bg-white"
                                        >
                                            <option value="" disabled>Choose a resident...</option>
                                            {users.map(user => (
                                                <option key={user.id} value={user.id}>
                                                    {user.name} (House #{user.houseNumber})
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Bill Type <span className="text-red-500">*</span>
                                        </label>
                                        <select
                                            required
                                            value={newBill.type}
                                            onChange={(e) => setNewBill({ ...newBill, type: e.target.value })}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none bg-white"
                                        >
                                            <option value="Maintenance">Maintenance</option>
                                            <option value="Water">Water</option>
                                            <option value="Electricity">Electricity</option>
                                            <option value="Other">Other</option>
                                        </select>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Bill Title <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        placeholder="e.g. Maintenance Fee - Jan 2026"
                                        value={newBill.title}
                                        onChange={(e) => setNewBill({ ...newBill, title: e.target.value })}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Description
                                    </label>
                                    <textarea
                                        rows="2"
                                        placeholder="Optional details about this bill..."
                                        value={newBill.description}
                                        onChange={(e) => setNewBill({ ...newBill, description: e.target.value })}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none resize-none"
                                    />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Billing Month <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="month"
                                            required
                                            value={newBill.month}
                                            onChange={(e) => setNewBill({ ...newBill, month: e.target.value })}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Amount ($) <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="number"
                                            required
                                            min="0"
                                            step="0.01"
                                            placeholder="0.00"
                                            value={newBill.amount}
                                            onChange={(e) => setNewBill({ ...newBill, amount: e.target.value })}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Due Date <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="date"
                                            required
                                            value={newBill.dueDate}
                                            onChange={(e) => setNewBill({ ...newBill, dueDate: e.target.value })}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                                        />
                                    </div>
                                </div>
                            </form>
                        </div>

                        <div className="p-4 border-t border-gray-200 bg-gray-50 flex gap-3 shrink-0">
                            <button
                                type="button"
                                onClick={() => setIsAddModalOpen(false)}
                                className="flex-1 px-4 py-2 text-gray-700 bg-white border border-gray-300 hover:bg-gray-100 font-medium rounded-lg transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                form="add-bill-form"
                                disabled={isAdding}
                                className="flex-1 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-70"
                            >
                                {isAdding ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        Saving...
                                    </>
                                ) : 'Save Bill'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ═══════════════════════════════════════════════════════ */}
            {/* Payment Modal */}
            {/* ═══════════════════════════════════════════════════════ */}
            {isPayModalOpen && selectedBill && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
                        {/* Header */}
                        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-gradient-to-r from-emerald-50 to-green-50">
                            <div className="flex items-center gap-2">
                                <CreditCard className="w-5 h-5 text-emerald-600" />
                                <h3 className="text-lg font-bold text-gray-900">Pay Bill</h3>
                            </div>
                            <button
                                onClick={() => setIsPayModalOpen(false)}
                                className="text-gray-400 hover:text-gray-600 transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Bill Summary */}
                        <div className="px-6 pt-5 pb-3">
                            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                                <p className="text-sm text-gray-600">{selectedBill.title}</p>
                                <p className="text-xs text-gray-500 mt-0.5">
                                    {selectedBill.userName} — House #{selectedBill.houseNumber}
                                </p>
                                <div className="flex items-center mt-2">
                                    <DollarSign className="w-5 h-5 text-emerald-600" />
                                    <span className="text-2xl font-bold text-gray-900">{selectedBill.amount}</span>
                                </div>
                            </div>
                        </div>

                        {/* Card Form */}
                        <form onSubmit={handlePayBill} className="px-6 pb-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Cardholder Name
                                </label>
                                <input
                                    type="text"
                                    required
                                    placeholder="John Doe"
                                    value={cardDetails.name}
                                    onChange={(e) => setCardDetails({ ...cardDetails, name: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Card Number
                                </label>
                                <input
                                    type="text"
                                    required
                                    placeholder="4242 4242 4242 4242"
                                    maxLength={19}
                                    value={cardDetails.cardNumber}
                                    onChange={(e) => {
                                        // Auto-format card number with spaces
                                        const val = e.target.value.replace(/\D/g, '').replace(/(.{4})/g, '$1 ').trim();
                                        setCardDetails({ ...cardDetails, cardNumber: val });
                                    }}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none font-mono"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Expiry (MM/YY)
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        placeholder="12/28"
                                        maxLength={5}
                                        value={cardDetails.expiry}
                                        onChange={(e) => {
                                            let val = e.target.value.replace(/\D/g, '');
                                            if (val.length > 2) val = val.slice(0, 2) + '/' + val.slice(2);
                                            setCardDetails({ ...cardDetails, expiry: val });
                                        }}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none font-mono"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        CVC
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        placeholder="123"
                                        maxLength={4}
                                        value={cardDetails.cvc}
                                        onChange={(e) => {
                                            const val = e.target.value.replace(/\D/g, '');
                                            setCardDetails({ ...cardDetails, cvc: val });
                                        }}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none font-mono"
                                    />
                                </div>
                            </div>

                            <div className="pt-2 flex gap-3">
                                <button
                                    type="button"
                                    onClick={() => setIsPayModalOpen(false)}
                                    className="flex-1 px-4 py-2.5 text-gray-700 bg-white border border-gray-300 hover:bg-gray-100 font-medium rounded-lg transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isPaying}
                                    className="flex-1 px-4 py-2.5 bg-gradient-to-r from-emerald-500 to-green-600 text-white font-medium rounded-lg transition-all shadow-lg shadow-emerald-500/30 hover:opacity-90 disabled:opacity-70 flex items-center justify-center gap-2"
                                >
                                    {isPaying ? (
                                        <>
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                            Processing...
                                        </>
                                    ) : (
                                        <>
                                            <CheckCircle2 className="w-4 h-4" />
                                            Pay ${selectedBill.amount}
                                        </>
                                    )}
                                </button>
                            </div>

                            <p className="text-xs text-gray-400 text-center flex items-center justify-center gap-1">
                                <AlertTriangle className="w-3 h-3" />
                                Test mode — Use card 4242 4242 4242 4242
                            </p>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Bills;
