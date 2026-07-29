import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
    FiSearch,
    FiUserCheck,
    FiUserX,
    FiClock,
    FiAlertCircle,
    FiCheck,
    FiX,
    FiEye,
    FiExternalLink,
    FiAward,
    FiDollarSign,
    FiShield,
    FiTag,
    FiGlobe,
    FiDownload,
    FiPrinter,
    FiCopy,
    FiMail,
    FiTrendingUp,
    FiShoppingBag,
    FiLock,
    FiCheckCircle,
    FiFilter,
    FiRefreshCw,
    FiInstagram,
    FiYoutube,
    FiFacebook,
    FiLinkedin,
} from 'react-icons/fi';
import toast from 'react-hot-toast';
import {
    getAdminInfluencers,
    getAdminInfluencerById,
    updateAdminInfluencerStatus,
    bulkUpdateAdminInfluencerStatus,
} from '../services/adminService';
import {
    getGlobalCommissionSettings,
    updateGlobalCommissionSettings,
} from '../../Influencer/services/influencerMarketplaceService';

const Influencers = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const activeStatusTab = searchParams.get('status') || 'all';

    const [influencers, setInfluencers] = useState([]);
    const [summary, setSummary] = useState({
        totalInfluencers: 0,
        pendingInfluencers: 0,
        approvedInfluencers: 0,
        rejectedInfluencers: 0,
        suspendedInfluencers: 0,
        totalSalesCount: 0,
        totalEarned: 0,
        commissionReserved: 0,
        commissionPaid: 0,
        pendingWithdrawals: 0,
    });
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [followersFilter, setFollowersFilter] = useState('all');
    const [pagination, setPagination] = useState({ page: 1, total: 0, totalPages: 1 });

    // Multi-select state for bulk actions
    const [selectedIds, setSelectedIds] = useState([]);

    // Details modal state
    const [selectedInfluencer, setSelectedInfluencer] = useState(null);
    const [isDetailsLoading, setIsDetailsLoading] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [activeDetailTab, setActiveDetailTab] = useState('overview'); // 'overview' | 'personal' | 'verification'

    // Rejection modal state
    const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
    const [rejectionReason, setRejectionReason] = useState('');
    const [isActionSubmitting, setIsActionSubmitting] = useState(false);

    // Admin Commission Settings modal state
    const [isCommSettingsModalOpen, setIsCommSettingsModalOpen] = useState(false);
    const [minComm, setMinComm] = useState(2);
    const [maxComm, setMaxComm] = useState(20);
    const [defaultComm, setDefaultComm] = useState(5);
    const [returnWindowDays, setReturnWindowDays] = useState(7);
    const [minWithdrawalAmount, setMinWithdrawalAmount] = useState(100);
    const [autoSettlementEnabled, setAutoSettlementEnabled] = useState(true);
    const [commEnabled, setCommEnabled] = useState(true);
    const [savingComm, setSavingComm] = useState(false);

    const fetchCommSettings = async () => {
        try {
            const res = await getGlobalCommissionSettings();
            const data = res?.data || res;
            if (data) {
                setMinComm(data.minCommissionPercent || 2);
                setMaxComm(data.maxCommissionPercent || 20);
                setDefaultComm(data.defaultCommissionPercent || 5);
                setReturnWindowDays(data.returnWindowDays || 7);
                setMinWithdrawalAmount(data.minWithdrawalAmount || 100);
                setAutoSettlementEnabled(data.autoSettlementEnabled !== false);
                setCommEnabled(data.isEnabled !== false);
            }
        } catch (err) {
            console.error('Failed to load global commission settings:', err);
        }
    };

    const handleSaveCommSettings = async (e) => {
        e.preventDefault();
        setSavingComm(true);
        try {
            await updateGlobalCommissionSettings({
                minCommissionPercent: Number(minComm),
                maxCommissionPercent: Number(maxComm),
                defaultCommissionPercent: Number(defaultComm),
                returnWindowDays: Number(returnWindowDays),
                minWithdrawalAmount: Number(minWithdrawalAmount),
                autoSettlementEnabled: Boolean(autoSettlementEnabled),
                isEnabled: commEnabled,
            });
            toast.success('Admin commission and financial parameters updated successfully!');
            setIsCommSettingsModalOpen(false);
        } catch (err) {
            toast.error(err?.response?.data?.message || 'Failed to update settings.');
        } finally {
            setSavingComm(false);
        }
    };

    const fetchInfluencers = async () => {
        setLoading(true);
        try {
            const params = {
                page: pagination.page,
                limit: 15,
            };
            if (activeStatusTab !== 'all') {
                params.status = activeStatusTab;
            }
            if (searchQuery.trim()) {
                params.search = searchQuery.trim();
            }

            if (followersFilter === 'under1k') {
                params.maxFollowers = 999;
            } else if (followersFilter === '1k-10k') {
                params.minFollowers = 1000;
                params.maxFollowers = 10000;
            } else if (followersFilter === '10k-50k') {
                params.minFollowers = 10000;
                params.maxFollowers = 50000;
            } else if (followersFilter === '50k+') {
                params.minFollowers = 50000;
            }

            const res = await getAdminInfluencers(params);
            const data = res?.data || res;
            setInfluencers(data.influencers || []);
            if (data.summary) {
                setSummary(data.summary);
            }
            if (data.pagination) {
                setPagination(data.pagination);
            }
        } catch (err) {
            toast.error(err?.response?.data?.message || 'Failed to fetch influencers.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchInfluencers();
    }, [activeStatusTab, searchQuery, followersFilter, pagination.page]);

    const handleTabChange = (tab) => {
        if (tab === 'all') {
            searchParams.delete('status');
        } else {
            searchParams.set('status', tab);
        }
        setSearchParams(searchParams);
        setSelectedIds([]);
    };

    const handleSelectAll = (e) => {
        if (e.target.checked) {
            setSelectedIds(influencers.map((inf) => inf._id));
        } else {
            setSelectedIds([]);
        }
    };

    const handleSelectOne = (id) => {
        setSelectedIds((prev) =>
            prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
        );
    };

    const handleViewDetails = async (id) => {
        setIsDetailsLoading(true);
        setIsModalOpen(true);
        setActiveDetailTab('overview');
        try {
            const res = await getAdminInfluencerById(id);
            setSelectedInfluencer(res?.data || res);
        } catch (err) {
            toast.error('Failed to load influencer details.');
            setIsModalOpen(false);
        } finally {
            setIsDetailsLoading(false);
        }
    };

    const handleStatusUpdate = async (id, newStatus, reason = '') => {
        setIsActionSubmitting(true);
        try {
            await updateAdminInfluencerStatus(id, newStatus, reason);
            toast.success(`Influencer status updated to ${newStatus}!`);
            setIsModalOpen(false);
            setIsRejectModalOpen(false);
            setRejectionReason('');
            fetchInfluencers();
        } catch (err) {
            toast.error(err?.response?.data?.message || 'Failed to update status.');
        } finally {
            setIsActionSubmitting(false);
        }
    };

    const handleBulkStatusUpdate = async (newStatus) => {
        if (selectedIds.length === 0) return;
        setIsActionSubmitting(true);
        try {
            await bulkUpdateAdminInfluencerStatus(selectedIds, newStatus);
            toast.success(`Bulk updated ${selectedIds.length} influencers to ${newStatus}!`);
            setSelectedIds([]);
            fetchInfluencers();
        } catch (err) {
            toast.error('Bulk update failed.');
        } finally {
            setIsActionSubmitting(false);
        }
    };

    const copyToClipboard = (text, label = 'Text') => {
        navigator.clipboard.writeText(text);
        toast.success(`${label} copied to clipboard!`);
    };

    const exportToCSV = () => {
        if (influencers.length === 0) {
            toast.error('No data available to export.');
            return;
        }

        const headers = ['Name,Email,Mobile,ReferralCode,Slug,Followers,Status,CreatedAt\n'];
        const rows = influencers.map(
            (i) =>
                `"${i.name}","${i.email}","${i.mobile}","${i.referralCode}","${i.slug}","${i.followers || 0}","${i.status}","${new Date(i.createdAt).toLocaleDateString()}"`
        );

        const blob = new Blob([headers.concat(rows.join('\n'))], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `porutkal_influencers_${new Date().toISOString().slice(0, 10)}.csv`;
        a.click();
        toast.success('Influencer data exported to CSV!');
    };

    const getStatusBadge = (status) => {
        switch (status) {
            case 'pending':
                return (
                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200">
                        <FiClock className="w-3 h-3" /> Pending Review
                    </span>
                );
            case 'approved':
                return (
                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                        <FiCheck className="w-3 h-3" /> Approved
                    </span>
                );
            case 'rejected':
                return (
                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-200">
                        <FiX className="w-3 h-3" /> Rejected
                    </span>
                );
            case 'suspended':
                return (
                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-slate-200 text-slate-700 border border-slate-300">
                        <FiAlertCircle className="w-3 h-3" /> Suspended
                    </span>
                );
            default:
                return null;
        }
    };

    return (
        <div className="p-6 space-y-6">
            {/* KPI Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-purple-100 text-purple-600 flex items-center justify-center text-xl font-bold">
                        <FiAward />
                    </div>
                    <div>
                        <span className="text-xs text-slate-500 font-bold uppercase tracking-wider block">Total Influencers</span>
                        <h3 className="text-2xl font-black text-slate-900">{summary.totalInfluencers}</h3>
                        <p className="text-xs text-slate-400 mt-0.5">
                            <strong className="text-amber-600">{summary.pendingInfluencers} Pending</strong> · <strong className="text-emerald-600">{summary.approvedInfluencers} Active</strong>
                        </p>
                    </div>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-indigo-100 text-indigo-600 flex items-center justify-center text-xl font-bold">
                        <FiTrendingUp />
                    </div>
                    <div>
                        <span className="text-xs text-slate-500 font-bold uppercase tracking-wider block">Total Affiliate Sales</span>
                        <h3 className="text-2xl font-black text-slate-900">₹{(summary.totalSalesCount * 1250).toLocaleString()}</h3>
                        <p className="text-xs text-slate-400 mt-0.5">{summary.totalSalesCount} Orders generated</p>
                    </div>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-pink-100 text-pink-600 flex items-center justify-center text-xl font-bold">
                        <FiLock />
                    </div>
                    <div>
                        <span className="text-xs text-slate-500 font-bold uppercase tracking-wider block">Commission Reserved</span>
                        <h3 className="text-2xl font-black text-slate-900">₹{summary.commissionReserved.toLocaleString()}</h3>
                        <p className="text-xs text-slate-400 mt-0.5">Held in Vendor Escrow</p>
                    </div>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center text-xl font-bold">
                        <FiDollarSign />
                    </div>
                    <div>
                        <span className="text-xs text-slate-500 font-bold uppercase tracking-wider block">Commission Paid</span>
                        <h3 className="text-2xl font-black text-slate-900">₹{summary.commissionPaid.toLocaleString()}</h3>
                        <p className="text-xs text-amber-600 font-bold mt-0.5">₹{summary.pendingWithdrawals.toLocaleString()} Pending Payouts</p>
                    </div>
                </div>
            </div>

            {/* Advanced Filters & Search Bar */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                <div className="flex flex-col lg:flex-row items-center justify-between gap-4">
                    {/* Status Tabs */}
                    <div className="flex items-center gap-2 overflow-x-auto w-full lg:w-auto pb-2 lg:pb-0">
                        {[
                            { id: 'all', label: `All (${summary.totalInfluencers})` },
                            { id: 'pending', label: `Pending (${summary.pendingInfluencers})` },
                            { id: 'approved', label: `Active (${summary.approvedInfluencers})` },
                            { id: 'rejected', label: `Rejected (${summary.rejectedInfluencers})` },
                            { id: 'suspended', label: `Suspended (${summary.suspendedInfluencers})` },
                        ].map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => handleTabChange(tab.id)}
                                className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                                    activeStatusTab === tab.id
                                        ? 'bg-primary-600 text-white shadow-md shadow-primary-500/20'
                                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                }`}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>

                    {/* Filter Controls & Action Buttons */}
                    <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
                        <div className="relative flex-1 lg:w-64">
                            <input
                                type="text"
                                placeholder="Search name, email, mobile, code..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-primary-500 bg-slate-50"
                            />
                            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        </div>

                        <select
                            value={followersFilter}
                            onChange={(e) => setFollowersFilter(e.target.value)}
                            className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold bg-slate-50 text-slate-700 focus:outline-none"
                        >
                            <option value="all">All Followers Range</option>
                            <option value="under1k">&lt; 1,000 Followers</option>
                            <option value="1k-10k">1,000 - 10,000</option>
                            <option value="10k-50k">10,000 - 50,000</option>
                            <option value="50k+">50,000+ Followers</option>
                        </select>

                        <button
                            onClick={() => {
                                fetchCommSettings();
                                setIsCommSettingsModalOpen(true);
                            }}
                            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-purple-100 hover:bg-purple-200 text-purple-800 font-bold text-xs transition-colors border border-purple-200"
                        >
                            <FiPercent className="w-3.5 h-3.5 text-purple-600" /> Commission Bounds
                        </button>

                        <button
                            onClick={exportToCSV}
                            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors"
                        >
                            <FiDownload className="w-3.5 h-3.5 text-slate-500" /> Export CSV
                        </button>

                        <button
                            onClick={() => window.print()}
                            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors"
                        >
                            <FiPrinter className="w-3.5 h-3.5 text-slate-500" /> Print
                        </button>
                    </div>
                </div>

                {/* Bulk Action Controls */}
                {selectedIds.length > 0 && (
                    <div className="flex items-center justify-between bg-purple-50 p-3 rounded-xl border border-purple-200 animate-fade-in text-xs">
                        <span className="font-bold text-purple-900">
                            {selectedIds.length} influencers selected for bulk action
                        </span>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => handleBulkStatusUpdate('approved')}
                                disabled={isActionSubmitting}
                                className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold transition-colors"
                            >
                                Bulk Approve
                            </button>
                            <button
                                onClick={() => handleBulkStatusUpdate('rejected')}
                                disabled={isActionSubmitting}
                                className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold transition-colors"
                            >
                                Bulk Reject
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Enterprise Influencers Table */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm border-collapse">
                        <thead>
                            <tr className="bg-slate-50 text-slate-600 uppercase text-xs tracking-wider border-b border-slate-200">
                                <th className="py-4 px-4 w-10">
                                    <input
                                        type="checkbox"
                                        checked={selectedIds.length === influencers.length && influencers.length > 0}
                                        onChange={handleSelectAll}
                                        className="rounded text-primary-600 focus:ring-primary-500 w-4 h-4 cursor-pointer"
                                    />
                                </th>
                                <th className="py-4 px-4 font-bold">Influencer</th>
                                <th className="py-4 px-4 font-bold">Contact Info</th>
                                <th className="py-4 px-4 font-bold">Referral Code</th>
                                <th className="py-4 px-4 font-bold text-center">Orders</th>
                                <th className="py-4 px-4 font-bold text-right">Revenue</th>
                                <th className="py-4 px-4 font-bold text-right">Commission</th>
                                <th className="py-4 px-4 font-bold">Status</th>
                                <th className="py-4 px-4 font-bold text-right">Quick Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {loading ? (
                                <tr>
                                    <td colSpan={9} className="py-8 text-center text-slate-400">
                                        Loading influencer management list...
                                    </td>
                                </tr>
                            ) : influencers.length === 0 ? (
                                <tr>
                                    <td colSpan={9} className="py-8 text-center text-slate-500 font-medium">
                                        No influencers match your search and filter criteria.
                                    </td>
                                </tr>
                            ) : (
                                influencers.map((inf) => {
                                    const isSelected = selectedIds.includes(inf._id);
                                    const orders = inf.stats?.orders || 0;
                                    const revenue = orders * 1500;
                                    const earned = inf.wallet?.totalEarned || 0;

                                    return (
                                        <tr
                                            key={inf._id}
                                            className={`hover:bg-slate-50/80 transition-colors ${
                                                isSelected ? 'bg-purple-50/40' : ''
                                            }`}
                                        >
                                            <td className="py-4 px-4">
                                                <input
                                                    type="checkbox"
                                                    checked={isSelected}
                                                    onChange={() => handleSelectOne(inf._id)}
                                                    className="rounded text-primary-600 focus:ring-primary-500 w-4 h-4 cursor-pointer"
                                                />
                                            </td>

                                            <td className="py-4 px-4">
                                                <div className="flex items-center gap-3">
                                                    {inf.profileImage ? (
                                                        <img
                                                            src={inf.profileImage}
                                                            alt={inf.name}
                                                            className="w-10 h-10 rounded-full object-cover border border-slate-200"
                                                        />
                                                    ) : (
                                                        <div className="w-10 h-10 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center font-bold text-sm">
                                                            {inf.name ? inf.name.charAt(0).toUpperCase() : 'I'}
                                                        </div>
                                                    )}
                                                    <div>
                                                        <h4 className="font-bold text-slate-900 leading-snug">{inf.name}</h4>
                                                        <p className="text-xs text-primary-600 font-mono">porutkal.com/@{inf.slug}</p>
                                                    </div>
                                                </div>
                                            </td>

                                            <td className="py-4 px-4">
                                                <div className="text-xs space-y-0.5">
                                                    <div className="font-semibold text-slate-800 flex items-center gap-1">
                                                        <span>{inf.email}</span>
                                                        {inf.isEmailVerified && (
                                                            <FiCheckCircle className="w-3.5 h-3.5 text-emerald-500" title="Email Verified" />
                                                        )}
                                                    </div>
                                                    <div className="text-slate-500">{inf.mobile}</div>
                                                </div>
                                            </td>

                                            <td className="py-4 px-4">
                                                <button
                                                    onClick={() => copyToClipboard(inf.referralCode, 'Referral Code')}
                                                    className="font-mono text-xs font-bold bg-purple-50 text-purple-700 px-2.5 py-1 rounded-lg border border-purple-200 hover:bg-purple-100 flex items-center gap-1"
                                                >
                                                    <span>{inf.referralCode}</span>
                                                    <FiCopy className="w-3 h-3 text-purple-400" />
                                                </button>
                                            </td>

                                            <td className="py-4 px-4 text-center font-bold text-slate-800">
                                                {orders}
                                            </td>

                                            <td className="py-4 px-4 text-right font-bold text-slate-900">
                                                ₹{revenue.toLocaleString()}
                                            </td>

                                            <td className="py-4 px-4 text-right font-bold text-emerald-600">
                                                ₹{earned.toLocaleString()}
                                            </td>

                                            <td className="py-4 px-4">{getStatusBadge(inf.status)}</td>

                                            <td className="py-4 px-4 text-right">
                                                <div className="flex items-center justify-end gap-1.5">
                                                    <button
                                                        onClick={() => handleViewDetails(inf._id)}
                                                        className="p-1.5 rounded-lg bg-slate-100 hover:bg-primary-50 text-slate-700 hover:text-primary-600 transition-colors"
                                                        title="View Profile & Review Application"
                                                    >
                                                        <FiEye className="w-4 h-4" />
                                                    </button>

                                                    {inf.status === 'pending' && (
                                                        <>
                                                            <button
                                                                onClick={() => handleStatusUpdate(inf._id, 'approved')}
                                                                className="p-1.5 rounded-lg bg-emerald-100 hover:bg-emerald-200 text-emerald-700 transition-colors"
                                                                title="Quick Approve"
                                                            >
                                                                <FiCheck className="w-4 h-4" />
                                                            </button>
                                                            <button
                                                                onClick={() => {
                                                                    setSelectedInfluencer(inf);
                                                                    setIsRejectModalOpen(true);
                                                                }}
                                                                className="p-1.5 rounded-lg bg-rose-100 hover:bg-rose-200 text-rose-700 transition-colors"
                                                                title="Quick Reject"
                                                            >
                                                                <FiX className="w-4 h-4" />
                                                            </button>
                                                        </>
                                                    )}

                                                    <a
                                                        href={`mailto:${inf.email}`}
                                                        className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors"
                                                        title="Send Email"
                                                    >
                                                        <FiMail className="w-4 h-4" />
                                                    </a>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Comprehensive Detail & Application Review Modal */}
            {isModalOpen && selectedInfluencer && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in overflow-y-auto">
                    <div className="bg-white rounded-2xl max-w-3xl w-full p-6 relative shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto">
                        <button
                            onClick={() => setIsModalOpen(false)}
                            className="absolute right-4 top-4 text-slate-400 hover:text-slate-600 p-1 rounded-lg"
                        >
                            <FiX className="w-5 h-5" />
                        </button>

                        {/* Profile Header */}
                        <div className="flex items-center gap-4 mb-6 pb-4 border-b border-slate-100">
                            {selectedInfluencer.profileImage ? (
                                <img
                                    src={selectedInfluencer.profileImage}
                                    alt={selectedInfluencer.name}
                                    className="w-16 h-16 rounded-2xl object-cover border border-purple-200"
                                />
                            ) : (
                                <div className="w-16 h-16 rounded-2xl bg-primary-600 text-white flex items-center justify-center font-black text-2xl">
                                    {selectedInfluencer.name.charAt(0)}
                                </div>
                            )}
                            <div>
                                <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                                    {selectedInfluencer.name}
                                    {selectedInfluencer.isEmailVerified && (
                                        <FiCheckCircle className="w-4 h-4 text-emerald-500" title="Email Verified" />
                                    )}
                                </h3>
                                <p className="text-xs text-primary-600 font-mono">porutkal.com/@{selectedInfluencer.slug}</p>
                                <div className="mt-1 flex items-center gap-2">
                                    {getStatusBadge(selectedInfluencer.status)}
                                    <span className="text-xs font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                                        Code: {selectedInfluencer.referralCode}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Modal Navigation Tabs */}
                        <div className="flex items-center gap-2 border-b border-slate-200 mb-6">
                            {[
                                { id: 'overview', label: 'Overview & Performance' },
                                { id: 'personal', label: 'Personal & Social' },
                                { id: 'verification', label: 'Verification & Payout' },
                            ].map((tab) => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveDetailTab(tab.id)}
                                    className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-all ${
                                        activeDetailTab === tab.id
                                            ? 'border-primary-600 text-primary-600'
                                            : 'border-transparent text-slate-500 hover:text-slate-800'
                                    }`}
                                >
                                    {tab.label}
                                </button>
                            ))}
                        </div>

                        {/* TAB 1: OVERVIEW & PERFORMANCE */}
                        {activeDetailTab === 'overview' && (
                            <div className="space-y-6">
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                                        <span className="text-slate-400 text-xs font-bold uppercase block">Total Orders</span>
                                        <span className="text-lg font-black text-slate-900">{selectedInfluencer.stats?.orders || 0}</span>
                                    </div>
                                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                                        <span className="text-slate-400 text-xs font-bold uppercase block">Total Revenue</span>
                                        <span className="text-lg font-black text-slate-900">₹{((selectedInfluencer.stats?.orders || 0) * 1500).toLocaleString()}</span>
                                    </div>
                                    <div className="p-3 bg-purple-50 rounded-xl border border-purple-100">
                                        <span className="text-purple-600 text-xs font-bold uppercase block">Earned Commission</span>
                                        <span className="text-lg font-black text-purple-900">₹{(selectedInfluencer.wallet?.totalEarned || 0).toLocaleString()}</span>
                                    </div>
                                    <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-100">
                                        <span className="text-emerald-600 text-xs font-bold uppercase block">Available Balance</span>
                                        <span className="text-lg font-black text-emerald-900">₹{(selectedInfluencer.wallet?.available || 0).toLocaleString()}</span>
                                    </div>
                                </div>

                                <div>
                                    <h4 className="text-xs font-extrabold uppercase text-slate-400 tracking-wider mb-2">Activity Timeline</h4>
                                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3 text-xs">
                                        <div className="flex items-center gap-3">
                                            <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold">✓</div>
                                            <div>
                                                <span className="font-bold text-slate-800">Application Registered</span>
                                                <span className="text-slate-400 ml-2">{new Date(selectedInfluencer.createdAt).toLocaleString()}</span>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <div className={`w-6 h-6 rounded-full ${selectedInfluencer.isEmailVerified ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'} flex items-center justify-center font-bold`}>
                                                {selectedInfluencer.isEmailVerified ? '✓' : '•'}
                                            </div>
                                            <div>
                                                <span className="font-bold text-slate-800">Email OTP Verification</span>
                                                <span className="text-slate-500 ml-2">{selectedInfluencer.isEmailVerified ? 'Verified' : 'Pending Verification'}</span>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <div className={`w-6 h-6 rounded-full ${selectedInfluencer.status === 'approved' ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-200 text-slate-600'} flex items-center justify-center font-bold`}>
                                                {selectedInfluencer.status === 'approved' ? '✓' : '•'}
                                            </div>
                                            <div>
                                                <span className="font-bold text-slate-800">Admin Approval Status</span>
                                                <span className="text-slate-500 ml-2 uppercase">{selectedInfluencer.status}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* TAB 2: PERSONAL & SOCIAL */}
                        {activeDetailTab === 'personal' && (
                            <div className="space-y-4 text-xs">
                                <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl">
                                    <div>
                                        <span className="text-slate-400 block">Full Name</span>
                                        <span className="font-bold text-slate-800 text-sm">{selectedInfluencer.name}</span>
                                    </div>
                                    <div>
                                        <span className="text-slate-400 block">Storefront Slug</span>
                                        <span className="font-mono font-bold text-primary-600">porutkal.com/@{selectedInfluencer.slug}</span>
                                    </div>
                                    <div>
                                        <span className="text-slate-400 block">Email Address</span>
                                        <span className="font-bold text-slate-800">{selectedInfluencer.email}</span>
                                    </div>
                                    <div>
                                        <span className="text-slate-400 block">Mobile Number</span>
                                        <span className="font-bold text-slate-800">{selectedInfluencer.mobile}</span>
                                    </div>
                                    <div>
                                        <span className="text-slate-400 block">Followers Count</span>
                                        <span className="font-bold text-slate-800">{selectedInfluencer.followers || 0}</span>
                                    </div>
                                    <div>
                                        <span className="text-slate-400 block">Bio</span>
                                        <span className="font-medium text-slate-700">{selectedInfluencer.bio || 'No bio provided.'}</span>
                                    </div>
                                </div>

                                <div>
                                    <h4 className="text-xs font-extrabold uppercase text-slate-400 tracking-wider mb-2">Social Accounts</h4>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        {selectedInfluencer.socialLinks?.instagram && (
                                            <a href={selectedInfluencer.socialLinks.instagram} target="_blank" rel="noreferrer" className="flex items-center justify-between p-3 bg-pink-50 rounded-xl border border-pink-100 text-pink-700 font-bold hover:underline">
                                                <span className="flex items-center gap-2"><FiInstagram /> Instagram</span>
                                                <FiExternalLink className="w-3.5 h-3.5" />
                                            </a>
                                        )}
                                        {selectedInfluencer.socialLinks?.youtube && (
                                            <a href={selectedInfluencer.socialLinks.youtube} target="_blank" rel="noreferrer" className="flex items-center justify-between p-3 bg-red-50 rounded-xl border border-red-100 text-red-700 font-bold hover:underline">
                                                <span className="flex items-center gap-2"><FiYoutube /> YouTube</span>
                                                <FiExternalLink className="w-3.5 h-3.5" />
                                            </a>
                                        )}
                                        {selectedInfluencer.socialLinks?.facebook && (
                                            <a href={selectedInfluencer.socialLinks.facebook} target="_blank" rel="noreferrer" className="flex items-center justify-between p-3 bg-blue-50 rounded-xl border border-blue-100 text-blue-700 font-bold hover:underline">
                                                <span className="flex items-center gap-2"><FiFacebook /> Facebook</span>
                                                <FiExternalLink className="w-3.5 h-3.5" />
                                            </a>
                                        )}
                                        {selectedInfluencer.socialLinks?.website && (
                                            <a href={selectedInfluencer.socialLinks.website} target="_blank" rel="noreferrer" className="flex items-center justify-between p-3 bg-slate-100 rounded-xl border border-slate-200 text-slate-700 font-bold hover:underline">
                                                <span className="flex items-center gap-2"><FiGlobe /> Website</span>
                                                <FiExternalLink className="w-3.5 h-3.5" />
                                            </a>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* TAB 3: VERIFICATION & PAYOUT */}
                        {activeDetailTab === 'verification' && (
                            <div className="space-y-4 text-xs">
                                <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl">
                                    <div>
                                        <span className="text-slate-400 block">Account Holder Name</span>
                                        <span className="font-bold text-slate-800">{selectedInfluencer.bankDetails?.accountHolderName || 'N/A'}</span>
                                    </div>
                                    <div>
                                        <span className="text-slate-400 block">Bank Name</span>
                                        <span className="font-bold text-slate-800">{selectedInfluencer.bankDetails?.bankName || 'N/A'}</span>
                                    </div>
                                    <div>
                                        <span className="text-slate-400 block">Account Number</span>
                                        <span className="font-bold text-slate-800">{selectedInfluencer.bankDetails?.accountNumber || 'N/A'}</span>
                                    </div>
                                    <div>
                                        <span className="text-slate-400 block">IFSC Code</span>
                                        <span className="font-mono font-bold text-slate-800">{selectedInfluencer.bankDetails?.ifscCode || 'N/A'}</span>
                                    </div>
                                    <div>
                                        <span className="text-slate-400 block">UPI ID</span>
                                        <span className="font-bold text-slate-800">{selectedInfluencer.bankDetails?.upiId || 'N/A'}</span>
                                    </div>
                                    <div>
                                        <span className="text-slate-400 block">PAN Number</span>
                                        <span className="font-mono font-bold text-slate-800">{selectedInfluencer.panNumber || 'N/A'}</span>
                                    </div>
                                    <div>
                                        <span className="text-slate-400 block">Aadhaar Number</span>
                                        <span className="font-mono font-bold text-slate-800">{selectedInfluencer.aadhaarNumber || 'N/A'}</span>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Review Decision Footer */}
                        <div className="mt-6 pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
                            <div className="text-xs text-slate-500">
                                Current Status: <strong className="uppercase text-slate-800">{selectedInfluencer.status}</strong>
                            </div>

                            <div className="flex items-center gap-3">
                                {selectedInfluencer.status !== 'approved' && (
                                    <button
                                        onClick={() => handleStatusUpdate(selectedInfluencer._id, 'approved')}
                                        disabled={isActionSubmitting}
                                        className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-2 shadow-md shadow-emerald-200 transition-all"
                                    >
                                        <FiCheck className="w-4 h-4" /> Approve Application
                                    </button>
                                )}

                                {selectedInfluencer.status !== 'rejected' && (
                                    <button
                                        onClick={() => setIsRejectModalOpen(true)}
                                        disabled={isActionSubmitting}
                                        className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs flex items-center gap-2 shadow-md shadow-rose-200 transition-all"
                                    >
                                        <FiX className="w-4 h-4" /> Reject Application
                                    </button>
                                )}

                                {selectedInfluencer.status === 'approved' && (
                                    <button
                                        onClick={() => handleStatusUpdate(selectedInfluencer._id, 'suspended')}
                                        disabled={isActionSubmitting}
                                        className="px-5 py-2.5 rounded-xl bg-slate-700 hover:bg-slate-800 text-white font-bold text-xs flex items-center gap-2 transition-all"
                                    >
                                        <FiAlertCircle className="w-4 h-4" /> Suspend Creator
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Rejection Reason Modal */}
            {isRejectModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
                    <div className="bg-white rounded-2xl max-w-md w-full p-6 relative shadow-2xl border border-slate-100">
                        <h3 className="font-bold text-lg text-slate-900 mb-2">Reject Influencer Application</h3>
                        <p className="text-xs text-slate-500 mb-4">Provide a reason for rejection. This will be emailed to the applicant.</p>

                        <textarea
                            rows={3}
                            className="w-full p-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500 mb-4"
                            placeholder="e.g. Social media profile handles could not be verified..."
                            value={rejectionReason}
                            onChange={(e) => setRejectionReason(e.target.value)}
                        />

                        <div className="flex gap-3 justify-end">
                            <button
                                onClick={() => setIsRejectModalOpen(false)}
                                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => handleStatusUpdate(selectedInfluencer._id, 'rejected', rejectionReason)}
                                disabled={isActionSubmitting}
                                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs"
                            >
                                Confirm Rejection
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Admin Commission Bounds Settings Modal */}
            {isCommSettingsModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
                    <div className="bg-white rounded-2xl max-w-md w-full p-6 relative shadow-2xl border border-slate-100">
                        <button
                            onClick={() => setIsCommSettingsModalOpen(false)}
                            className="absolute right-4 top-4 text-slate-400 hover:text-slate-600 p-1 rounded-lg"
                        >
                            <FiX className="w-5 h-5" />
                        </button>

                        <h3 className="font-bold text-lg text-slate-900 mb-1">Global Commission Bounds Settings</h3>
                        <p className="text-xs text-slate-500 mb-4">Configure minimum and maximum commission bounds enforced across all vendors.</p>

                        <form onSubmit={handleSaveCommSettings} className="space-y-4 text-xs">
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="font-bold text-slate-700 block mb-1">Min Commission (%)</label>
                                    <input
                                        type="number"
                                        min="0"
                                        max="100"
                                        value={minComm}
                                        onChange={(e) => setMinComm(e.target.value)}
                                        className="w-full p-2.5 rounded-xl border border-slate-200 text-sm font-bold bg-slate-50"
                                    />
                                </div>
                                <div>
                                    <label className="font-bold text-slate-700 block mb-1">Max Commission (%)</label>
                                    <input
                                        type="number"
                                        min="0"
                                        max="100"
                                        value={maxComm}
                                        onChange={(e) => setMaxComm(e.target.value)}
                                        className="w-full p-2.5 rounded-xl border border-slate-200 text-sm font-bold bg-slate-50"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="font-bold text-slate-700 block mb-1">Default Marketplace Rate (%)</label>
                                <input
                                    type="number"
                                    min="0"
                                    max="100"
                                    value={defaultComm}
                                    onChange={(e) => setDefaultComm(e.target.value)}
                                    className="w-full p-2.5 rounded-xl border border-slate-200 text-sm font-bold bg-slate-50"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="font-bold text-slate-700 block mb-1">Return Window (Days)</label>
                                    <input
                                        type="number"
                                        min="1"
                                        max="60"
                                        value={returnWindowDays}
                                        onChange={(e) => setReturnWindowDays(e.target.value)}
                                        className="w-full p-2.5 rounded-xl border border-slate-200 text-sm font-bold bg-slate-50"
                                    />
                                </div>
                                <div>
                                    <label className="font-bold text-slate-700 block mb-1">Min Withdrawal (₹)</label>
                                    <input
                                        type="number"
                                        min="1"
                                        value={minWithdrawalAmount}
                                        onChange={(e) => setMinWithdrawalAmount(e.target.value)}
                                        className="w-full p-2.5 rounded-xl border border-slate-200 text-sm font-bold bg-slate-50"
                                    />
                                </div>
                            </div>

                            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200">
                                <span className="font-bold text-slate-800">Enable Auto Settlement Engine</span>
                                <input
                                    type="checkbox"
                                    checked={autoSettlementEnabled}
                                    onChange={(e) => setAutoSettlementEnabled(e.target.checked)}
                                    className="w-4 h-4 rounded text-purple-600 focus:ring-purple-500"
                                />
                            </div>

                            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200">
                                <span className="font-bold text-slate-800">Enable Influencer Affiliate Program</span>
                                <input
                                    type="checkbox"
                                    checked={commEnabled}
                                    onChange={(e) => setCommEnabled(e.target.checked)}
                                    className="w-4 h-4 rounded text-purple-600 focus:ring-purple-500"
                                />
                            </div>

                            <div className="flex gap-3 justify-end pt-2">
                                <button
                                    type="button"
                                    onClick={() => setIsCommSettingsModalOpen(false)}
                                    className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={savingComm}
                                    className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-md shadow-purple-200"
                                >
                                    {savingComm ? 'Saving...' : 'Save Settings'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Influencers;
