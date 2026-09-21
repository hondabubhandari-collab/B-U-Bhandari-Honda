import React, { useState, useEffect, useMemo } from 'react';
import {
  TrackedReview,
  ReviewSource,
  ReviewStatus,
  ReviewAnalyticsStats,
} from '../types';
import {
  getTrackedReviews,
  updateReviewStatus,
  deleteTrackedReview,
  calculateReviewAnalytics,
  logoutAdmin,
  formatDateTime,
  AUTHORIZED_ADMIN_EMAIL,
  getAuthenticatedAdminEmail,
} from '../utils/adminReviewStore';
import { AddManualReviewModal } from './AddManualReviewModal';
import { ReportsModal } from './ReportsModal';
import {
  BarChart3,
  Bot,
  UserCheck,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Percent,
  Plus,
  Search,
  Filter,
  LogOut,
  ArrowLeft,
  Trash2,
  ExternalLink,
  ShieldCheck,
  FileSpreadsheet,
  Download,
  Info,
  Calendar,
  Layers,
  Mail,
} from 'lucide-react';

interface AdminReviewAnalyticsProps {
  onBackToApp: () => void;
  onLogout: () => void;
}

type FilterOption = 'ALL' | 'AI GENERATED' | 'MANUAL / OTHER' | 'POSTED' | 'SPAM / REMOVED' | 'PENDING';

export const AdminReviewAnalytics: React.FC<AdminReviewAnalyticsProps> = ({
  onBackToApp,
  onLogout,
}) => {
  const [reviews, setReviews] = useState<TrackedReview[]>([]);
  const [activeFilter, setActiveFilter] = useState<FilterOption>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddManualOpen, setIsAddManualOpen] = useState(false);
  const [isReportsOpen, setIsReportsOpen] = useState(false);
  const [expandedReviewId, setExpandedReviewId] = useState<string | null>(null);

  // Load reviews on mount
  const refreshReviews = () => {
    const list = getTrackedReviews();
    setReviews(list);
  };

  useEffect(() => {
    refreshReviews();
  }, []);

  // Compute stats dynamically
  const stats: ReviewAnalyticsStats = useMemo(() => {
    return calculateReviewAnalytics(reviews);
  }, [reviews]);

  // Handle status update
  const handleStatusChange = (id: string, newStatus: ReviewStatus) => {
    updateReviewStatus(id, newStatus);
    refreshReviews();
  };

  // Handle delete
  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to remove this tracked review?')) {
      deleteTrackedReview(id);
      refreshReviews();
    }
  };

  // Export to CSV
  const handleExportCSV = () => {
    if (!reviews.length) return;
    const headers = ['ID', 'Source', 'Current Status', 'Generated Date', 'Status Updated Date', 'Review Text', 'Admin Notes'];
    const rows = reviews.map((r) => [
      `"${r.id}"`,
      `"${r.source}"`,
      `"${r.status}"`,
      `"${r.generatedDate}"`,
      `"${r.statusUpdatedDate}"`,
      `"${(r.reviewText || '').replace(/"/g, '""')}"`,
      `"${(r.notes || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `bhandari_review_analytics_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filtered reviews
  const filteredReviews = useMemo(() => {
    return reviews.filter((r) => {
      // Status & Source filters
      if (activeFilter === 'AI GENERATED' && r.source !== 'AI App Generated') return false;
      if (activeFilter === 'MANUAL / OTHER' && r.source !== 'Manual / Other') return false;
      if (activeFilter === 'POSTED' && r.status !== 'Posted') return false;
      if (activeFilter === 'SPAM / REMOVED' && r.status !== 'Spam / Removed') return false;
      if (activeFilter === 'PENDING' && r.status !== 'Pending') return false;

      // Search keyword filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const textMatch = (r.reviewText || '').toLowerCase().includes(query);
        const sourceMatch = (r.source || '').toLowerCase().includes(query);
        const notesMatch = (r.notes || '').toLowerCase().includes(query);
        const empMatch = (r.employeeName || '').toLowerCase().includes(query);
        return textMatch || sourceMatch || notesMatch || empMatch;
      }

      return true;
    });
  }, [reviews, activeFilter, searchQuery]);

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans text-slate-900">
      {/* Top Admin Navbar */}
      <header className="bg-slate-900 text-white border-b border-slate-800 sticky top-0 z-30 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3.5 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-red-600 flex items-center justify-center font-black text-white text-base select-none">
              H
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-bold tracking-tight">Review Analytics</h1>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" />
                  <span>Authorized: {AUTHORIZED_ADMIN_EMAIL}</span>
                </span>
              </div>
              <p className="text-xs text-slate-400">
                B.U. Bhandari Honda • Quality, Reports & Tracking Dashboard
              </p>
            </div>
          </div>

          <div className="flex items-center flex-wrap gap-2">
            <button
              onClick={() => setIsReportsOpen(true)}
              className="px-3 py-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer"
              title="Dealer Reporting, 4-Hour Shift Reports & Google Sheets Sync"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Reports & Sheet</span>
            </button>

            <button
              onClick={() => setIsAddManualOpen(true)}
              className="px-3 py-1.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Add Manual Review</span>
            </button>

            <button
              onClick={handleExportCSV}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium flex items-center gap-1.5 border border-slate-700 transition-colors cursor-pointer"
              title="Download CSV export"
            >
              <Download className="w-3.5 h-3.5 text-slate-400" />
              <span className="hidden sm:inline">Export CSV</span>
            </button>

            <button
              onClick={onBackToApp}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium flex items-center gap-1.5 border border-slate-700 transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5 text-slate-400" />
              <span>Customer App</span>
            </button>

            <button
              onClick={() => {
                logoutAdmin();
                onLogout();
              }}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-rose-900/50 text-rose-300 text-xs font-medium flex items-center gap-1.5 border border-slate-700 hover:border-rose-700 transition-colors cursor-pointer"
              title="End admin session"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 w-full space-y-6">
        {/* Compliance / Privacy Note */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-start gap-2.5 text-xs text-slate-600">
            <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-slate-800">
                Private Administrative Tracking System:
              </span>{' '}
              <span>
                All counts and classifications are managed internally in free local storage. Google is never queried, and spam/removed statuses are labeled as{' '}
                <strong className="text-slate-900">Manually Marked as Spam / Removed</strong>.
              </span>
            </div>
          </div>
          <span className="text-[11px] font-semibold text-slate-400 shrink-0">
            Updated: {formatDateTime()}
          </span>
        </div>

        {/* SECTION 1: 7 Core Analytics Dashboard Cards */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-red-600" />
              <span>Review Analytics Overview</span>
            </h2>
            <span className="text-xs text-slate-500 font-medium">
              Total Tracked: {stats.totalTrackedReviews}
            </span>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
            {/* 1. TOTAL REVIEWS GENERATED */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex flex-col justify-between">
              <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                Total Reviews Generated
              </div>
              <div className="mt-2 text-2xl font-black text-slate-900">
                {stats.totalReviewsGenerated}
              </div>
              <div className="mt-1 text-[11px] text-slate-400 flex items-center gap-1">
                <Bot className="w-3 h-3 text-blue-600" />
                <span>Via AI Generator</span>
              </div>
            </div>

            {/* 2. TOTAL AI REVIEWS */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex flex-col justify-between">
              <div className="text-[11px] font-bold text-blue-700 uppercase tracking-wider">
                Total AI Reviews
              </div>
              <div className="mt-2 text-2xl font-black text-blue-700">
                {stats.totalAiReviews}
              </div>
              <div className="mt-1 text-[11px] text-blue-600">
                App generated
              </div>
            </div>

            {/* 3. TOTAL MANUAL / OTHER REVIEWS */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex flex-col justify-between">
              <div className="text-[11px] font-bold text-purple-700 uppercase tracking-wider">
                Total Manual / Other
              </div>
              <div className="mt-2 text-2xl font-black text-purple-700">
                {stats.totalManualReviews}
              </div>
              <div className="mt-1 text-[11px] text-purple-600">
                Tracked externally
              </div>
            </div>

            {/* 4. TOTAL MARKED AS POSTED */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex flex-col justify-between">
              <div className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider">
                Marked as Posted
              </div>
              <div className="mt-2 text-2xl font-black text-emerald-700">
                {stats.totalMarkedAsPosted}
              </div>
              <div className="mt-1 text-[11px] text-emerald-600 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" />
                <span>Active on Google</span>
              </div>
            </div>

            {/* 5. TOTAL MARKED AS SPAM / REMOVED */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex flex-col justify-between">
              <div className="text-[11px] font-bold text-rose-700 uppercase tracking-wider">
                Spam / Removed
              </div>
              <div className="mt-2 text-2xl font-black text-rose-700">
                {stats.totalMarkedAsSpamRemoved}
              </div>
              <div className="mt-1 text-[11px] text-rose-600 flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" />
                <span>Manually flagged</span>
              </div>
            </div>

            {/* 6. TOTAL PENDING */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex flex-col justify-between">
              <div className="text-[11px] font-bold text-amber-700 uppercase tracking-wider">
                Total Pending
              </div>
              <div className="mt-2 text-2xl font-black text-amber-700">
                {stats.totalPending}
              </div>
              <div className="mt-1 text-[11px] text-amber-600 flex items-center gap-1">
                <Clock className="w-3 h-3" />
                <span>Awaiting verify</span>
              </div>
            </div>

            {/* 7. SPAM / REMOVED PERCENTAGE */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex flex-col justify-between col-span-2 sm:col-span-1">
              <div className="text-[11px] font-bold text-slate-800 uppercase tracking-wider">
                Spam / Removed %
              </div>
              <div className="mt-2 text-2xl font-black text-slate-900">
                {stats.spamRemovedPercentage}%
              </div>
              <div className="mt-1 text-[10px] text-slate-400">
                of total tracked
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 2: Separate AI vs Manual Reviews Breakdown */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* AI App Generated Card */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
                  <Bot className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">AI App Generated Reviews</h3>
                  <p className="text-xs text-slate-500">Created by this AI Review Assistant</p>
                </div>
              </div>
              <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
                {stats.aiBreakdown.generated} Total
              </span>
            </div>

            <div className="grid grid-cols-4 gap-2 text-center">
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                <div className="text-[11px] text-slate-500 font-semibold uppercase">Generated</div>
                <div className="text-lg font-bold text-slate-900 mt-1">{stats.aiBreakdown.generated}</div>
              </div>
              <div className="bg-emerald-50/70 p-3 rounded-xl border border-emerald-100">
                <div className="text-[11px] text-emerald-700 font-semibold uppercase">Posted</div>
                <div className="text-lg font-bold text-emerald-700 mt-1">{stats.aiBreakdown.posted}</div>
              </div>
              <div className="bg-rose-50/70 p-3 rounded-xl border border-rose-100">
                <div className="text-[11px] text-rose-700 font-semibold uppercase">Spam/Removed</div>
                <div className="text-lg font-bold text-rose-700 mt-1">{stats.aiBreakdown.spamRemoved}</div>
              </div>
              <div className="bg-amber-50/70 p-3 rounded-xl border border-amber-100">
                <div className="text-[11px] text-amber-700 font-semibold uppercase">Pending</div>
                <div className="text-lg font-bold text-amber-700 mt-1">{stats.aiBreakdown.pending}</div>
              </div>
            </div>
          </div>

          {/* Manual / Other Reviews Card */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center font-bold">
                  <UserCheck className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Manual / Other Reviews</h3>
                  <p className="text-xs text-slate-500">Tracked outside this AI application</p>
                </div>
              </div>
              <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-purple-50 text-purple-700 border border-purple-200">
                {stats.manualBreakdown.tracked} Tracked
              </span>
            </div>

            <div className="grid grid-cols-4 gap-2 text-center">
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                <div className="text-[11px] text-slate-500 font-semibold uppercase">Tracked</div>
                <div className="text-lg font-bold text-slate-900 mt-1">{stats.manualBreakdown.tracked}</div>
              </div>
              <div className="bg-emerald-50/70 p-3 rounded-xl border border-emerald-100">
                <div className="text-[11px] text-emerald-700 font-semibold uppercase">Posted</div>
                <div className="text-lg font-bold text-emerald-700 mt-1">{stats.manualBreakdown.posted}</div>
              </div>
              <div className="bg-rose-50/70 p-3 rounded-xl border border-rose-100">
                <div className="text-[11px] text-rose-700 font-semibold uppercase">Spam/Removed</div>
                <div className="text-lg font-bold text-rose-700 mt-1">{stats.manualBreakdown.spamRemoved}</div>
              </div>
              <div className="bg-amber-50/70 p-3 rounded-xl border border-amber-100">
                <div className="text-[11px] text-amber-700 font-semibold uppercase">Pending</div>
                <div className="text-lg font-bold text-amber-700 mt-1">{stats.manualBreakdown.pending}</div>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 3: Combined Overall Summary Bar */}
        <section className="bg-slate-900 text-white rounded-2xl p-4 shadow-sm flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-white">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs text-slate-400 font-medium">Combined Dealership Totals</div>
              <div className="text-sm font-bold text-white">B.U. Bhandari Honda Review Registry</div>
            </div>
          </div>

          <div className="flex items-center flex-wrap gap-6 text-sm">
            <div>
              <span className="text-slate-400 text-xs block">TOTAL TRACKED REVIEWS</span>
              <span className="text-xl font-black text-white">{stats.totalTrackedReviews}</span>
            </div>
            <div className="h-8 w-px bg-slate-800" />
            <div>
              <span className="text-slate-400 text-xs block">TOTAL MARKED AS POSTED</span>
              <span className="text-xl font-black text-emerald-400">{stats.totalMarkedAsPosted}</span>
            </div>
            <div className="h-8 w-px bg-slate-800" />
            <div>
              <span className="text-slate-400 text-xs block">TOTAL SPAM / REMOVED</span>
              <span className="text-xl font-black text-rose-400">{stats.totalMarkedAsSpamRemoved}</span>
            </div>
            <div className="h-8 w-px bg-slate-800" />
            <div>
              <span className="text-slate-400 text-xs block">SPAM / REMOVED %</span>
              <span className="text-xl font-black text-amber-400">{stats.spamRemovedPercentage}%</span>
            </div>
          </div>
        </section>

        {/* SECTION 4: Private Review History Table */}
        <section className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
          {/* Header & Controls */}
          <div className="p-4 sm:p-5 border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <span>Review History</span>
                <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-600">
                  {filteredReviews.length} of {reviews.length}
                </span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Every review record with status transitions and timestamps
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              {/* Search input */}
              <div className="relative min-w-[200px]">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search reviews..."
                  className="w-full text-xs pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-900"
                />
              </div>

              {/* Add Manual button */}
              <button
                onClick={() => setIsAddManualOpen(true)}
                className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-black text-white text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-2xs cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Add Manual Review</span>
              </button>
            </div>
          </div>

          {/* Filter Tabs */}
          <div className="px-4 sm:px-5 py-2.5 bg-slate-50 border-b border-slate-200 flex items-center gap-1.5 overflow-x-auto">
            <span className="text-xs font-semibold text-slate-500 flex items-center gap-1 mr-1">
              <Filter className="w-3 h-3" />
              <span>Filter:</span>
            </span>

            {(
              [
                'ALL',
                'AI GENERATED',
                'MANUAL / OTHER',
                'POSTED',
                'SPAM / REMOVED',
                'PENDING',
              ] as FilterOption[]
            ).map((f) => (
              <button
                key={f}
                onClick={() => setActiveFilter(f)}
                className={`px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  activeFilter === f
                    ? 'bg-slate-900 text-white shadow-2xs'
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                {f}
              </button>
            ))}
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50/80 text-slate-500 uppercase font-bold text-[10px] tracking-wider border-b border-slate-200">
                  <th className="py-3 px-4 w-[40%]">Review</th>
                  <th className="py-3 px-4">Source</th>
                  <th className="py-3 px-4">Generated Date</th>
                  <th className="py-3 px-4">Current Status</th>
                  <th className="py-3 px-4">Status Updated Date</th>
                  <th className="py-3 px-4 text-right">Quick Status Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredReviews.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-400">
                      <div className="flex flex-col items-center justify-center space-y-2">
                        <Info className="w-6 h-6 text-slate-300" />
                        <span className="text-xs font-medium">No reviews match the selected filter.</span>
                        {searchQuery && (
                          <button
                            onClick={() => setSearchQuery('')}
                            className="text-xs text-red-600 hover:underline cursor-pointer"
                          >
                            Clear search query
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredReviews.map((rev) => {
                    const isExpanded = expandedReviewId === rev.id;
                    const isAi = rev.source === 'AI App Generated';
                    return (
                      <tr key={rev.id} className="hover:bg-slate-50/70 transition-colors">
                        {/* Review text */}
                        <td className="py-3.5 px-4 align-top">
                          <div className="space-y-1">
                            <p
                              className={`text-slate-800 leading-relaxed font-normal ${
                                !isExpanded && rev.reviewText.length > 130 ? 'line-clamp-2' : ''
                              }`}
                            >
                              "{rev.reviewText}"
                            </p>
                            {rev.reviewText.length > 130 && (
                              <button
                                onClick={() => setExpandedReviewId(isExpanded ? null : rev.id)}
                                className="text-[11px] text-red-600 hover:underline font-medium cursor-pointer"
                              >
                                {isExpanded ? 'Show less' : 'Read full review'}
                              </button>
                            )}

                            {/* Extra metadata if present */}
                            {(rev.employeeName || rev.notes || rev.experienceType) && (
                              <div className="flex flex-wrap items-center gap-1.5 pt-1 text-[10px] text-slate-400">
                                {rev.experienceType && (
                                  <span className="bg-slate-100 px-2 py-0.5 rounded text-slate-600">
                                    {rev.experienceType}
                                  </span>
                                )}
                                {rev.employeeName && (
                                  <span className="bg-slate-100 px-2 py-0.5 rounded text-slate-600">
                                    Staff: {rev.employeeName}
                                  </span>
                                )}
                                {rev.notes && (
                                  <span className="italic text-slate-500">
                                    Note: {rev.notes}
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                        </td>

                        {/* Source */}
                        <td className="py-3.5 px-4 align-top whitespace-nowrap">
                          {isAi ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                              <Bot className="w-3 h-3 text-blue-600" />
                              <span>AI App Generated</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-purple-50 text-purple-700 border border-purple-200">
                              <UserCheck className="w-3 h-3 text-purple-600" />
                              <span>Manual / Other</span>
                            </span>
                          )}
                        </td>

                        {/* Generated Date */}
                        <td className="py-3.5 px-4 align-top whitespace-nowrap text-slate-600 text-[11px] font-medium">
                          {rev.generatedDate}
                        </td>

                        {/* Current Status Badge */}
                        <td className="py-3.5 px-4 align-top whitespace-nowrap">
                          {rev.status === 'Posted' && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              <span>Posted</span>
                            </span>
                          )}
                          {rev.status === 'Spam / Removed' && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-rose-100 text-rose-800 border border-rose-300" title="Manually Marked as Spam / Removed">
                              <AlertTriangle className="w-3 h-3 text-rose-600" />
                              <span>Spam / Removed</span>
                            </span>
                          )}
                          {rev.status === 'Pending' && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                              <Clock className="w-3 h-3 text-amber-600" />
                              <span>Pending</span>
                            </span>
                          )}
                        </td>

                        {/* Status Updated Date */}
                        <td className="py-3.5 px-4 align-top whitespace-nowrap text-slate-500 text-[11px]">
                          {rev.statusUpdatedDate || rev.generatedDate}
                        </td>

                        {/* Quick Status Action Controls */}
                        <td className="py-3.5 px-4 align-top text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* [ Posted ] */}
                            <button
                              type="button"
                              onClick={() => handleStatusChange(rev.id, 'Posted')}
                              className={`px-2 py-1 rounded-md text-[11px] font-semibold border transition-all cursor-pointer ${
                                rev.status === 'Posted'
                                  ? 'bg-emerald-600 text-white border-emerald-600 shadow-2xs'
                                  : 'bg-white text-slate-600 border-slate-200 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-200'
                              }`}
                              title="Mark as Posted"
                            >
                              Posted
                            </button>

                            {/* [ Spam / Removed ] */}
                            <button
                              type="button"
                              onClick={() => handleStatusChange(rev.id, 'Spam / Removed')}
                              className={`px-2 py-1 rounded-md text-[11px] font-semibold border transition-all cursor-pointer ${
                                rev.status === 'Spam / Removed'
                                  ? 'bg-rose-600 text-white border-rose-600 shadow-2xs'
                                  : 'bg-white text-slate-600 border-slate-200 hover:bg-rose-50 hover:text-rose-700 hover:border-rose-200'
                              }`}
                              title="Mark as Spam / Removed"
                            >
                              Spam / Removed
                            </button>

                            {/* [ Pending ] */}
                            <button
                              type="button"
                              onClick={() => handleStatusChange(rev.id, 'Pending')}
                              className={`px-2 py-1 rounded-md text-[11px] font-semibold border transition-all cursor-pointer ${
                                rev.status === 'Pending'
                                  ? 'bg-amber-600 text-white border-amber-600 shadow-2xs'
                                  : 'bg-white text-slate-600 border-slate-200 hover:bg-amber-50 hover:text-amber-700 hover:border-amber-200'
                              }`}
                              title="Mark as Pending"
                            >
                              Pending
                            </button>

                            {/* Delete button */}
                            <button
                              type="button"
                              onClick={() => handleDelete(rev.id)}
                              className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors ml-1 cursor-pointer"
                              title="Delete record"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </section>
      </main>

      {/* Add Manual Review Modal */}
      <AddManualReviewModal
        isOpen={isAddManualOpen}
        onClose={() => setIsAddManualOpen(false)}
        onReviewAdded={refreshReviews}
      />

      {/* Reports & Google Sheets Modal (Admin Only) */}
      <ReportsModal
        isOpen={isReportsOpen}
        onClose={() => setIsReportsOpen(false)}
      />
    </div>
  );
};
