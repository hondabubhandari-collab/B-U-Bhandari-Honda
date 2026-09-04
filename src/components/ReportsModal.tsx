import React, { useState, useEffect } from 'react';
import {
  ActivityLog,
  FourHourReportStats,
  DailyReportStats,
  EmployeeSummary,
  TeamSummary,
} from '../types';
import {
  X,
  FileSpreadsheet,
  Clock,
  Calendar,
  Users,
  Mail,
  Download,
  Code,
  Check,
  RefreshCw,
  Send,
  CheckCircle2,
  Table,
  Link as LinkIcon,
  AlertCircle,
  Star,
} from 'lucide-react';

interface ReportsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ReportsModal: React.FC<ReportsModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<
    'activity' | '4hour' | 'daily' | 'employee' | 'sheets' | 'email'
  >('activity');

  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [fourHourReport, setFourHourReport] = useState<FourHourReportStats | null>(null);
  const [dailyReport, setDailyReport] = useState<DailyReportStats | null>(null);
  const [employeeSummaries, setEmployeeSummaries] = useState<EmployeeSummary[]>([]);
  const [teamSummaries, setTeamSummaries] = useState<TeamSummary[]>([]);
  const [gasCode, setGasCode] = useState<string>('');
  const [copiedCode, setCopiedCode] = useState(false);
  const [loading, setLoading] = useState(false);

  // Webhook & Sheet Config
  const [webhookUrl, setWebhookUrl] = useState<string>('');
  const [sheetName, setSheetName] = useState<string>('B.U. Bhandari Honda – Review Reports');
  const [lastSyncStatus, setLastSyncStatus] = useState<string>('Not Connected');
  const [lastSyncTime, setLastSyncTime] = useState<string>('');
  const [testingWebhook, setTestingWebhook] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  // Email Test
  const [emailStatus, setEmailStatus] = useState<string | null>(null);
  const [sendingEmail, setSendingEmail] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchReportData();
      fetchSheetConfig();
    }
  }, [isOpen]);

  const fetchReportData = async () => {
    setLoading(true);
    try {
      const [actRes, fourRes, dailyRes, empRes, gasRes] = await Promise.all([
        fetch('/api/reports/activity').then((r) => (r.ok ? r.json() : { logs: [] })),
        fetch('/api/reports/4-hour').then((r) => (r.ok ? r.json() : null)),
        fetch('/api/reports/daily').then((r) => (r.ok ? r.json() : null)),
        fetch('/api/reports/employee-summary').then((r) =>
          r.ok ? r.json() : { summaries: [], teamSummaries: [] }
        ),
        fetch('/api/reports/google-apps-script').then((r) => (r.ok ? r.json() : { script: '' })),
      ]);

      setLogs(actRes.logs || []);
      setFourHourReport(fourRes);
      setDailyReport(dailyRes);
      setEmployeeSummaries(empRes.summaries || []);
      setTeamSummaries(empRes.teamSummaries || []);
      setGasCode(gasRes.script || '');
    } catch (err) {
      console.error('Failed to load report data:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchSheetConfig = async () => {
    try {
      const res = await fetch('/api/sheet-config');
      if (res.ok) {
        const data = await res.json();
        setWebhookUrl(data.webhookUrl || '');
        setSheetName(data.sheetName || 'B.U. Bhandari Honda – Review Reports');
        setLastSyncStatus(data.lastSyncStatus || (data.webhookUrl ? 'Configured' : 'Not Connected'));
        setLastSyncTime(data.lastSyncTime || '');
      }
    } catch (err) {
      console.warn('Error loading sheet config:', err);
    }
  };

  const handleSaveWebhook = async () => {
    setTestingWebhook(true);
    setTestResult(null);
    try {
      const saveRes = await fetch('/api/sheet-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ webhookUrl }),
      });

      if (!saveRes.ok) throw new Error('Failed to save config');

      // Test webhook
      const testRes = await fetch('/api/sheet-test-sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ webhookUrl }),
      });

      const data = await testRes.json();
      if (testRes.ok) {
        setTestResult({ success: true, message: data.message || 'Connected successfully!' });
        setLastSyncStatus('Connected & Verified');
        setLastSyncTime(new Date().toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata' }) + ' IST');
      } else {
        setTestResult({ success: false, message: data.error || 'Connection failed.' });
      }
    } catch (err: any) {
      setTestResult({
        success: false,
        message: err.message || 'Could not reach the Web App URL. Please verify deployment.',
      });
    } finally {
      setTestingWebhook(false);
    }
  };

  const handleCopyCode = async () => {
    if (gasCode) {
      await navigator.clipboard.writeText(gasCode);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2500);
    }
  };

  const handleTriggerEmail = async (reportType: '4hour' | 'daily') => {
    setSendingEmail(true);
    setEmailStatus(null);
    try {
      const res = await fetch('/api/reports/trigger-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reportType,
          recipientEmail: 'hondabubhandari@gmail.com',
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setEmailStatus(`Report triggered! Check hondabubhandari@gmail.com inbox.`);
      } else {
        setEmailStatus(`Trigger failed: ${data.error || 'Webhook offline'}`);
      }
    } catch (err: any) {
      setEmailStatus(`Failed: ${err.message}`);
    } finally {
      setSendingEmail(false);
    }
  };

  const handleDownloadCsv = () => {
    if (logs.length === 0) return;

    // Headers match Columns A through I
    const headers = [
      'Date',
      'Time',
      'Experience Type',
      'Rating',
      'Sales Employee Name',
      'Team Name',
      'AI Improvement',
      'AI Status',
      'Review Generated',
    ];

    const csvRows = logs.map((log) => {
      return [
        `"${log.date}"`,
        `"${log.time}"`,
        `"${log.experienceType}"`,
        `"${log.rating}"`,
        `"${(log.employeeName || '').replace(/"/g, '""')}"`,
        `"${(log.teamName || '').replace(/"/g, '""')}"`,
        `"${log.aiImprovement || 'No'}"`,
        `"${log.aiStatus || 'Generated'}"`,
        `"${(log.reviewGenerated || '').replace(/"/g, '""')}"`,
      ].join(',');
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...csvRows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute(
      'download',
      `BU_Bhandari_Honda_Reviews_${new Date().toISOString().split('T')[0]}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white w-full max-w-5xl rounded-2xl shadow-2xl border border-slate-200 flex flex-col max-h-[92vh] overflow-hidden">
        {/* Header */}
        <div className="bg-slate-900 text-white px-5 py-4 flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg bg-red-600 flex items-center justify-center text-white font-black text-sm">
              H
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold tracking-tight">
                B.U. Bhandari Honda – Reporting & Sheet Integration
              </h2>
              <p className="text-xs text-slate-400">
                Live Customer Feedback Logs & Google Sheets Automation for hondabubhandari@gmail.com
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-4 overflow-x-auto shrink-0 scrollbar-thin">
          <button
            type="button"
            onClick={() => setActiveTab('activity')}
            className={`py-3 px-3.5 text-xs font-semibold flex items-center gap-1.5 border-b-2 whitespace-nowrap transition-colors cursor-pointer ${
              activeTab === 'activity'
                ? 'border-red-600 text-red-600 bg-white'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Table className="w-3.5 h-3.5" />
            <span>Review Activity (Tab 1)</span>
            <span className="ml-1 text-[10px] bg-slate-200 px-1.5 py-0.2 rounded-full">
              {logs.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('4hour')}
            className={`py-3 px-3.5 text-xs font-semibold flex items-center gap-1.5 border-b-2 whitespace-nowrap transition-colors cursor-pointer ${
              activeTab === '4hour'
                ? 'border-red-600 text-red-600 bg-white'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>4-Hour Report (Tab 2)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('daily')}
            className={`py-3 px-3.5 text-xs font-semibold flex items-center gap-1.5 border-b-2 whitespace-nowrap transition-colors cursor-pointer ${
              activeTab === 'daily'
                ? 'border-red-600 text-red-600 bg-white'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Daily Report (Tab 3)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('employee')}
            className={`py-3 px-3.5 text-xs font-semibold flex items-center gap-1.5 border-b-2 whitespace-nowrap transition-colors cursor-pointer ${
              activeTab === 'employee'
                ? 'border-red-600 text-red-600 bg-white'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Employee Summary (Tab 4)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('sheets')}
            className={`py-3 px-3.5 text-xs font-semibold flex items-center gap-1.5 border-b-2 whitespace-nowrap transition-colors cursor-pointer ${
              activeTab === 'sheets'
                ? 'border-red-600 text-red-600 bg-white'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
            <span>Google Sheet Setup</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('email')}
            className={`py-3 px-3.5 text-xs font-semibold flex items-center gap-1.5 border-b-2 whitespace-nowrap transition-colors cursor-pointer ${
              activeTab === 'email'
                ? 'border-red-600 text-red-600 bg-white'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Mail className="w-3.5 h-3.5 text-blue-600" />
            <span>Email Reports (Gmail)</span>
          </button>
        </div>

        {/* Content Area */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 bg-slate-50/50">
          {/* TAB 1: REVIEW ACTIVITY */}
          {activeTab === 'activity' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Tab 1: Review Activity (Exact Columns A through I)
                  </h3>
                  <p className="text-xs text-slate-500">
                    Every completed review automatically creates a new row with date, time, ratings, and generated text.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={fetchReportData}
                    className="px-3 py-1.5 rounded-lg border border-slate-300 text-slate-700 bg-white hover:bg-slate-50 text-xs font-medium flex items-center gap-1 cursor-pointer"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                    <span>Refresh</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleDownloadCsv}
                    disabled={logs.length === 0}
                    className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-black text-white text-xs font-medium flex items-center gap-1 cursor-pointer disabled:opacity-50"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Export CSV</span>
                  </button>
                </div>
              </div>

              {logs.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-xl border border-slate-200 p-6">
                  <Table className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                  <p className="text-sm font-semibold text-slate-700">No review activity recorded yet</p>
                  <p className="text-xs text-slate-500 mt-1">
                    Complete a review in the assistant to see rows appear here and in your Google Sheet.
                  </p>
                </div>
              ) : (
                <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs">
                  <div className="overflow-x-auto max-h-[480px]">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead className="bg-slate-900 text-white sticky top-0 z-10 select-none">
                        <tr>
                          <th className="p-3 font-semibold border-r border-slate-800 whitespace-nowrap">A: Date</th>
                          <th className="p-3 font-semibold border-r border-slate-800 whitespace-nowrap">B: Time</th>
                          <th className="p-3 font-semibold border-r border-slate-800 whitespace-nowrap">C: Experience Type</th>
                          <th className="p-3 font-semibold border-r border-slate-800 whitespace-nowrap">D: Rating</th>
                          <th className="p-3 font-semibold border-r border-slate-800 whitespace-nowrap">E: Sales Employee</th>
                          <th className="p-3 font-semibold border-r border-slate-800 whitespace-nowrap">F: Team Name</th>
                          <th className="p-3 font-semibold border-r border-slate-800 whitespace-nowrap">G: AI Improvement</th>
                          <th className="p-3 font-semibold border-r border-slate-800 whitespace-nowrap">H: AI Status</th>
                          <th className="p-3 font-semibold whitespace-nowrap">I: Review Generated</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 font-normal">
                        {logs.map((log) => (
                          <tr key={log.id} className="hover:bg-slate-50/80 transition-colors">
                            <td className="p-3 font-medium text-slate-900 whitespace-nowrap border-r border-slate-100">{log.date}</td>
                            <td className="p-3 text-slate-600 whitespace-nowrap border-r border-slate-100">{log.time}</td>
                            <td className="p-3 text-slate-900 font-medium whitespace-nowrap border-r border-slate-100">
                              <span className="px-2 py-0.5 rounded-sm bg-slate-100 text-slate-800 border border-slate-200">
                                {log.experienceType}
                              </span>
                            </td>
                            <td className="p-3 whitespace-nowrap border-r border-slate-100 font-semibold text-amber-600">
                              {log.rating}
                            </td>
                            <td className="p-3 text-slate-700 whitespace-nowrap border-r border-slate-100">
                              {log.employeeName || '—'}
                            </td>
                            <td className="p-3 text-slate-700 whitespace-nowrap border-r border-slate-100">
                              {log.teamName || '—'}
                            </td>
                            <td className="p-3 whitespace-nowrap border-r border-slate-100">
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                                log.aiImprovement === 'Refined with AI' || log.aiImprovement === 'Yes'
                                  ? 'bg-purple-100 text-purple-800'
                                  : 'bg-slate-100 text-slate-700'
                              }`}>
                                {log.aiImprovement || 'Natural'}
                              </span>
                            </td>
                            <td className="p-3 whitespace-nowrap border-r border-slate-100">
                              <span className="text-[11px] text-emerald-700 font-medium bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                                {log.aiStatus || 'Generated'}
                              </span>
                            </td>
                            <td className="p-3 text-slate-700 min-w-[280px] max-w-[420px] text-[11px] leading-relaxed">
                              {log.reviewGenerated}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: 4-HOUR REPORT */}
          {activeTab === '4hour' && fourHourReport && (
            <div className="space-y-4">
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Tab 2: 4-Hour Customer Review Performance
                  </h3>
                  <p className="text-xs text-slate-500">
                    Report Timestamp: {fourHourReport.reportDate} {fourHourReport.reportTime} • Dispatched every 4 hours to hondabubhandari@gmail.com
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleTriggerEmail('4hour')}
                  disabled={sendingEmail}
                  className="px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{sendingEmail ? 'Dispatching...' : 'Send 4-Hour Email'}</span>
                </button>
              </div>

              {emailStatus && (
                <div className="p-3 rounded-lg bg-slate-100 text-slate-800 text-xs font-medium border border-slate-200">
                  {emailStatus}
                </div>
              )}

              {/* KPI Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Reviews (4h)</span>
                  <div className="text-xl sm:text-2xl font-black text-slate-900 mt-1">{fourHourReport.totalReviewsGenerated}</div>
                </div>
                <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Average Rating</span>
                  <div className="text-xl sm:text-2xl font-black text-red-600 mt-1">⭐ {fourHourReport.averageRating}</div>
                </div>
                <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">5-Star & 4-Star</span>
                  <div className="text-xl sm:text-2xl font-black text-emerald-600 mt-1">
                    {fourHourReport.fiveStarCount + fourHourReport.fourStarCount}
                  </div>
                </div>
                <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Google Reviews Opened</span>
                  <div className="text-xl sm:text-2xl font-black text-blue-600 mt-1">{fourHourReport.googleReviewOpenedCount}</div>
                </div>
              </div>

              {/* Breakdown */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-2">
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Experience Breakdown (4h)</h4>
                  <div className="space-y-1.5 text-xs">
                    <div className="flex justify-between py-1 border-b border-slate-100">
                      <span className="text-slate-600">New Vehicle Purchase</span>
                      <span className="font-semibold text-slate-900">{fourHourReport.newVehiclePurchaseCount}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-100">
                      <span className="text-slate-600">Vehicle Service</span>
                      <span className="font-semibold text-slate-900">{fourHourReport.vehicleServiceCount}</span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span className="text-slate-600">Vehicle Delivery</span>
                      <span className="font-semibold text-slate-900">{fourHourReport.vehicleDeliveryCount}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-2">
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Star Rating Breakdown (4h)</h4>
                  <div className="space-y-1.5 text-xs">
                    <div className="flex justify-between py-1 border-b border-slate-100">
                      <span className="text-slate-600">5-Star (Excellent)</span>
                      <span className="font-semibold text-amber-600">{fourHourReport.fiveStarCount}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-100">
                      <span className="text-slate-600">4-Star (Very Good)</span>
                      <span className="font-semibold text-amber-600">{fourHourReport.fourStarCount}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-100">
                      <span className="text-slate-600">3-Star (Good)</span>
                      <span className="font-semibold text-slate-700">{fourHourReport.threeStarCount}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-100">
                      <span className="text-slate-600">2-Star (Average)</span>
                      <span className="font-semibold text-slate-700">{fourHourReport.twoStarCount}</span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span className="text-slate-600">1-Star (Needs Improvement)</span>
                      <span className="font-semibold text-red-600">{fourHourReport.oneStarCount}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: DAILY REPORT */}
          {activeTab === 'daily' && dailyReport && (
            <div className="space-y-4">
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Tab 3: Daily Performance Report (6:00 PM IST)
                  </h3>
                  <p className="text-xs text-slate-500">
                    Date: {dailyReport.date} • Sent Daily at 6:00 PM IST to hondabubhandari@gmail.com
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleTriggerEmail('daily')}
                  disabled={sendingEmail}
                  className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-black text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{sendingEmail ? 'Dispatching...' : 'Send Daily Report'}</span>
                </button>
              </div>

              {/* Key Indicators */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Total Reviews</span>
                  <div className="text-xl sm:text-2xl font-black text-slate-900 mt-1">{dailyReport.totalReviews}</div>
                </div>
                <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Average Rating</span>
                  <div className="text-xl sm:text-2xl font-black text-red-600 mt-1">⭐ {dailyReport.averageRating}</div>
                </div>
                <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">5-Star Count</span>
                  <div className="text-xl sm:text-2xl font-black text-amber-500 mt-1">{dailyReport.fiveStarCount}</div>
                </div>
                <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Sync Status</span>
                  <div className="text-xs font-bold text-emerald-600 mt-2">{dailyReport.googleSheetSyncStatus}</div>
                </div>
              </div>

              {/* Employee Performance List */}
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
                  Sales Employee Performance Summary (Daily)
                </h4>
                {dailyReport.employeePerformance.length === 0 ? (
                  <p className="text-xs text-slate-500">No employee mentions today.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="border-b border-slate-200 text-slate-500">
                          <th className="py-2">Employee Name</th>
                          <th className="py-2">Reviews</th>
                          <th className="py-2">Avg Rating</th>
                          <th className="py-2">5-Stars</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {dailyReport.employeePerformance.map((emp) => (
                          <tr key={emp.employeeName}>
                            <td className="py-2 font-medium text-slate-900">{emp.employeeName}</td>
                            <td className="py-2 font-bold text-slate-700">{emp.totalReviews}</td>
                            <td className="py-2 font-semibold text-red-600">⭐ {emp.avgRating}</td>
                            <td className="py-2 text-amber-600 font-semibold">{emp.fiveStars}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 4: EMPLOYEE SUMMARY */}
          {activeTab === 'employee' && (
            <div className="space-y-4">
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
                <h3 className="text-sm font-bold text-slate-900">
                  Tab 4: Sales Employee Summary
                </h3>
                <p className="text-xs text-slate-500">
                  Columns: Sales Employee Name | Total Reviews | Average Rating | 5-Star | 4-Star | 3-Star | 2-Star | 1-Star | Latest Review Date
                </p>
              </div>

              {employeeSummaries.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-xl border border-slate-200 p-6">
                  <Users className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                  <p className="text-sm font-semibold text-slate-700">No employee summaries available</p>
                  <p className="text-xs text-slate-500 mt-1">
                    When customers enter employee names in the review assistant, their ratings will aggregate here automatically.
                  </p>
                </div>
              ) : (
                <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead className="bg-red-600 text-white font-bold">
                        <tr>
                          <th className="p-3">Sales Employee Name</th>
                          <th className="p-3">Total Reviews</th>
                          <th className="p-3">Average Rating</th>
                          <th className="p-3">5-Star</th>
                          <th className="p-3">4-Star</th>
                          <th className="p-3">3-Star</th>
                          <th className="p-3">2-Star</th>
                          <th className="p-3">1-Star</th>
                          <th className="p-3">Latest Review Date</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        {employeeSummaries.map((emp) => (
                          <tr key={emp.employeeName} className="hover:bg-slate-50">
                            <td className="p-3 font-bold text-slate-900">{emp.employeeName}</td>
                            <td className="p-3 font-semibold text-slate-800">{emp.totalReviews}</td>
                            <td className="p-3 font-bold text-red-600">⭐ {emp.averageRating}</td>
                            <td className="p-3 font-semibold text-emerald-600">{emp.fiveStarReviews}</td>
                            <td className="p-3 text-slate-700">{emp.fourStarReviews}</td>
                            <td className="p-3 text-slate-700">{emp.threeStarReviews}</td>
                            <td className="p-3 text-slate-700">{emp.twoStarReviews}</td>
                            <td className="p-3 text-red-600 font-semibold">{emp.oneStarReviews}</td>
                            <td className="p-3 text-slate-500">{emp.latestReviewDate}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 5: GOOGLE SHEET SETUP */}
          {activeTab === 'sheets' && (
            <div className="space-y-4">
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-3">
                <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
                  <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                  <span>Google Apps Script Deployment (4 Tabs + Auto Triggers)</span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  This script creates and manages all 4 tabs in your Google Sheet (<strong>Review Activity</strong>, <strong>4 Hour Report</strong>, <strong>Daily Report</strong>, and <strong>Employee Summary</strong>) and sets up automated hourly/daily reporting to <strong>hondabubhandari@gmail.com</strong>.
                </p>

                {/* Webhook URL Input */}
                <div className="pt-2">
                  <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1">
                    Google Apps Script Web App URL
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="url"
                      value={webhookUrl}
                      onChange={(e) => setWebhookUrl(e.target.value)}
                      placeholder="https://script.google.com/macros/s/.../exec"
                      className="flex-1 text-xs px-3.5 py-2.5 rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-red-600 font-mono"
                    />
                    <button
                      type="button"
                      onClick={handleSaveWebhook}
                      disabled={testingWebhook || !webhookUrl}
                      className="px-4 py-2.5 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
                    >
                      <LinkIcon className="w-3.5 h-3.5" />
                      <span>{testingWebhook ? 'Testing...' : 'Save & Test'}</span>
                    </button>
                  </div>
                </div>

                {testResult && (
                  <div
                    className={`p-3 rounded-lg text-xs font-medium flex items-center gap-2 ${
                      testResult.success
                        ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                        : 'bg-red-50 text-red-800 border border-red-200'
                    }`}
                  >
                    {testResult.success ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                    )}
                    <span>{testResult.message}</span>
                  </div>
                )}
              </div>

              {/* Step-by-Step Instructions */}
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-3">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  How to setup your Google Sheet in 3 minutes:
                </h4>
                <ol className="list-decimal list-inside space-y-2 text-xs text-slate-600">
                  <li>Open <a href="https://sheets.new" target="_blank" rel="noreferrer" className="text-red-600 underline font-medium">sheets.new</a> and name it <strong>B.U. Bhandari Honda – Review Reports</strong>.</li>
                  <li>Click <strong>Extensions &gt; Apps Script</strong> in the top menu.</li>
                  <li>Delete any placeholder code in the editor, and paste the complete script below.</li>
                  <li>Click <strong>Deploy &gt; New deployment</strong>. Select type <strong>Web app</strong>.</li>
                  <li>Set <em>Execute as:</em> <strong>Me</strong> and <em>Who has access:</em> <strong>Anyone</strong>.</li>
                  <li>Click <strong>Deploy</strong>, copy the Web App URL, and paste it into the field above!</li>
                  <li>Run the <code>installTriggers()</code> function once to enable automated 4-hour and 6:00 PM IST daily emails!</li>
                </ol>

                <div className="pt-2">
                  <div className="flex items-center justify-between pb-2">
                    <span className="text-xs font-bold text-slate-700">Google Apps Script Code</span>
                    <button
                      type="button"
                      onClick={handleCopyCode}
                      className="px-3 py-1.5 rounded-md bg-slate-900 hover:bg-black text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                    >
                      {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Code className="w-3.5 h-3.5" />}
                      <span>{copiedCode ? 'Copied Code!' : 'Copy Script Code'}</span>
                    </button>
                  </div>
                  <pre className="p-3 bg-slate-950 text-slate-200 rounded-lg text-[11px] font-mono max-h-60 overflow-y-auto leading-relaxed border border-slate-800">
                    {gasCode}
                  </pre>
                </div>
              </div>
            </div>
          )}

          {/* TAB 6: EMAIL REPORTS */}
          {activeTab === 'email' && (
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-4">
              <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
                <Mail className="w-4 h-4 text-blue-600" />
                <span>Automated Email Reporting Schedule</span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                All customer review activity summaries are emailed to <strong>hondabubhandari@gmail.com</strong> according to the automated schedule below.
              </p>

              <div className="space-y-3 pt-2">
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">4-Hour Snapshot Report</h4>
                    <p className="text-[11px] text-slate-500">Every 4 hours • Includes reviews count, rating breakdown, employee mentions</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleTriggerEmail('4hour')}
                    disabled={sendingEmail}
                    className="px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-semibold flex items-center gap-1 cursor-pointer disabled:opacity-50"
                  >
                    <Send className="w-3 h-3" />
                    <span>Test 4-Hour Email</span>
                  </button>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">Daily Operations Summary (6:00 PM IST)</h4>
                    <p className="text-[11px] text-slate-500">Daily at 18:00 IST • Full day performance, top employee, quality summary</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleTriggerEmail('daily')}
                    disabled={sendingEmail}
                    className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-black text-white text-xs font-semibold flex items-center gap-1 cursor-pointer disabled:opacity-50"
                  >
                    <Send className="w-3 h-3" />
                    <span>Test Daily Email</span>
                  </button>
                </div>
              </div>

              {emailStatus && (
                <div className="p-3 rounded-lg bg-blue-50 text-blue-800 text-xs font-medium border border-blue-200">
                  {emailStatus}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
