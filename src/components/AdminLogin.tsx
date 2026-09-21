import React, { useState } from 'react';
import { ShieldAlert, Lock, ArrowLeft, KeyRound, Mail, AlertTriangle } from 'lucide-react';
import { loginAdmin, AUTHORIZED_ADMIN_EMAIL } from '../utils/adminReviewStore';

interface AdminLoginProps {
  onSuccess: () => void;
  onRedirectToPublic: () => void;
}

export const AdminLogin: React.FC<AdminLoginProps> = ({
  onSuccess,
  onRedirectToPublic,
}) => {
  const [email, setEmail] = useState('hondabubhandari@gmail.com');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail) {
      setError('Please enter your administrator email address.');
      return;
    }

    if (cleanEmail !== AUTHORIZED_ADMIN_EMAIL.toLowerCase()) {
      setError(
        `Access Denied: The email "${email}" does not have administrative privileges. Only ${AUTHORIZED_ADMIN_EMAIL} is authorized. All other accounts are treated as public users.`
      );
      return;
    }

    if (!password.trim()) {
      setError('Please enter the administrator password.');
      return;
    }

    setIsSubmitting(true);
    // Instant verification against exact email & credentials
    setTimeout(() => {
      const res = loginAdmin(cleanEmail, password);
      setIsSubmitting(false);

      if (res.success) {
        onSuccess();
      } else {
        setError(res.message || 'Access denied. Incorrect credentials.');
      }
    }, 200);
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
        {/* Access Warning Header */}
        <div className="bg-slate-900 text-white p-6 text-center relative">
          <div className="w-12 h-12 bg-red-600 rounded-xl mx-auto flex items-center justify-center text-white mb-3 shadow-md">
            <Lock className="w-6 h-6 stroke-[2.2]" />
          </div>
          <h2 className="text-lg font-bold tracking-tight">Review Analytics Portal</h2>
          <p className="text-xs text-slate-400 mt-1">
            B.U. Bhandari Honda • Authorized Administration
          </p>
        </div>

        {/* Access Restriction Notice */}
        <div className="bg-amber-50 border-b border-amber-200 px-5 py-3.5 flex items-start gap-2.5 text-xs text-amber-900">
          <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <span className="font-bold block">Strict Access Control Notice:</span>
            <p className="text-[11px] leading-relaxed text-amber-800">
              Only <strong className="font-semibold text-slate-900">{AUTHORIZED_ADMIN_EMAIL}</strong> is authorized to access Review Analytics, Review History, Reports, Sheets, and Spam Tracking. All other email addresses are treated as public users.
            </p>
          </div>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-medium flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 shrink-0 text-red-600 mt-0.5" />
              <span className="leading-relaxed">{error}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5 text-slate-400" />
              <span>Authorized Admin Email</span>
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (error) setError('');
              }}
              placeholder="hondabubhandari@gmail.com"
              required
              className="w-full text-xs text-slate-900 px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-slate-900 transition-all font-medium"
            />
            <p className="text-[10px] text-slate-400 mt-1">
              Must exactly match: {AUTHORIZED_ADMIN_EMAIL}
            </p>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <KeyRound className="w-3.5 h-3.5 text-slate-400" />
                <span>Admin Password</span>
              </span>
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="text-[11px] text-slate-400 hover:text-slate-600 font-normal cursor-pointer"
              >
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </label>
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (error) setError('');
              }}
              placeholder="••••••••••••"
              required
              autoFocus
              className="w-full text-xs text-slate-900 px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-slate-900 transition-all font-mono"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-black text-white text-xs font-bold tracking-wide transition-all shadow-xs cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50 mt-2"
          >
            {isSubmitting ? (
              <span>Authenticating admin email...</span>
            ) : (
              <>
                <Lock className="w-3.5 h-3.5" />
                <span>Verify Admin Email & Sign In</span>
              </>
            )}
          </button>

          {/* Return to Public Customer App Redirect Button */}
          <div className="pt-2 text-center border-t border-slate-100">
            <button
              type="button"
              onClick={onRedirectToPublic}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 py-1.5 px-3 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Return to Public Customer App</span>
            </button>
          </div>
        </form>

        <div className="bg-slate-50 px-6 py-3 border-t border-slate-100 text-center">
          <p className="text-[11px] text-slate-400">
            Strict email enforcement: Only hondabubhandari@gmail.com
          </p>
        </div>
      </div>
    </div>
  );
};
