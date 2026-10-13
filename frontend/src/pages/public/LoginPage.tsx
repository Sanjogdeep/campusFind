import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { Compass, Mail, Lock, ArrowRight, KeyRound, ArrowLeft, CheckCircle2, GraduationCap, ShieldCheck, Crown } from 'lucide-react';
import { api } from '../../services/api';

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  // Forgot / Reset Password state
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [resetSuccessMessage, setResetSuccessMessage] = useState('');

  const { login } = useAuth();
  const { error, success } = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;

    setLoading(true);
    try {
      await login(email.trim(), password);
      success('Logged in successfully!');
      navigate('/dashboard');
    } catch (err: any) {
      error(err.response?.data?.detail || 'Invalid email or password.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetEmail || !newPassword || !confirmPassword) {
      error('Please complete all fields.');
      return;
    }
    if (newPassword.length < 6) {
      error('Password must be at least 6 characters long.');
      return;
    }
    if (newPassword !== confirmPassword) {
      error('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      const res = await api.post('/auth/reset-password', {
        email: resetEmail.trim(),
        new_password: newPassword,
      });
      const msg = res.data?.message || 'Password reset successfully! You can now log in.';
      success(msg);
      setResetSuccessMessage(msg);
      setEmail(resetEmail.trim());
      setPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => {
        setIsForgotPassword(false);
        setResetSuccessMessage('');
      }, 1800);
    } catch (err: any) {
      error(err.response?.data?.detail || 'Failed to reset password. Please check your college email.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full space-y-8 bg-white p-8 sm:p-10 rounded-3xl border border-slate-200 shadow-xl">
        {isForgotPassword ? (
          /* Forgot Password / Reset Flow */
          <>
            <div className="text-center">
              <div className="w-12 h-12 bg-amber-500 text-white rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-amber-500/20">
                <KeyRound className="w-7 h-7" />
              </div>
              <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                Reset Password
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Enter your registered college email and choose a new password
              </p>
            </div>

            {resetSuccessMessage ? (
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-center space-y-2">
                <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
                <p className="text-sm font-bold text-emerald-900">{resetSuccessMessage}</p>
                <p className="text-xs text-emerald-700">Redirecting to login...</p>
              </div>
            ) : (
              <form onSubmit={handleResetPassword} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    LPU College Email
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                    <input
                      type="email"
                      required
                      value={resetEmail}
                      onChange={(e) => setResetEmail(e.target.value)}
                      placeholder="registration_no@lpu.in"
                      className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:border-amber-500 focus:bg-white outline-none transition"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    New Password (min 6 characters)
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                    <input
                      type="password"
                      required
                      minLength={6}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:border-amber-500 focus:bg-white outline-none transition"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Confirm New Password
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                    <input
                      type="password"
                      required
                      minLength={6}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:border-amber-500 focus:bg-white outline-none transition"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white font-bold text-sm rounded-xl shadow-lg shadow-amber-600/25 transition flex items-center justify-center gap-2"
                >
                  {loading ? 'Updating Password...' : 'Set New Password'}
                  <ArrowRight className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  onClick={() => setIsForgotPassword(false)}
                  className="w-full py-2.5 text-slate-600 hover:text-slate-900 text-xs font-semibold flex items-center justify-center gap-1.5 transition"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back to Sign In
                </button>
              </form>
            )}
          </>
        ) : (
          /* Normal Login Flow */
          <>
            {/* Header */}
            <div className="text-center">
              <div className="w-12 h-12 bg-sky-600 text-white rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-sky-600/20">
                <Compass className="w-7 h-7" />
              </div>
              <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                Log in to CampusFind
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Access your lost reports, active matches, and safe handovers
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  LPU College Email
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="registration_no@lpu.in"
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:border-sky-500 focus:bg-white outline-none transition"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-slate-700">
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setResetEmail(email);
                      setIsForgotPassword(true);
                    }}
                    className="text-xs font-semibold text-sky-600 hover:text-sky-700 hover:underline"
                  >
                    Forgot Password?
                  </button>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:border-sky-500 focus:bg-white outline-none transition"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 bg-sky-600 hover:bg-sky-700 disabled:opacity-50 text-white font-bold text-sm rounded-xl shadow-lg shadow-sky-600/25 transition flex items-center justify-center gap-2"
              >
                {loading ? 'Authenticating...' : 'Sign In'}
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>

            {/* Quick 1-Click Demo Accounts for Recruiter & Testing */}
            <div className="pt-4 border-t border-slate-100">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  Quick Demo Logins (1-Click)
                </span>
                <span className="text-[10px] text-slate-400">Auto-fills credentials</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setEmail('alice@lpu.in');
                    setPassword('StudentPass123!');
                  }}
                  className="p-2.5 bg-slate-50 hover:bg-sky-50 hover:border-sky-300 border border-slate-200 rounded-xl text-left transition group"
                >
                  <div className="flex items-center gap-1 text-slate-700 group-hover:text-sky-700 font-bold text-xs mb-0.5">
                    <GraduationCap className="w-3.5 h-3.5 text-sky-600" />
                    <span>Student</span>
                  </div>
                  <div className="text-[10px] text-slate-400 truncate">alice@lpu.in</div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setEmail('admin@lpu.in');
                    setPassword('AdminPass123!');
                  }}
                  className="p-2.5 bg-slate-50 hover:bg-purple-50 hover:border-purple-300 border border-slate-200 rounded-xl text-left transition group"
                >
                  <div className="flex items-center gap-1 text-slate-700 group-hover:text-purple-700 font-bold text-xs mb-0.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-purple-600" />
                    <span>Admin</span>
                  </div>
                  <div className="text-[10px] text-slate-400 truncate">admin@lpu.in</div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setEmail('superadmin@lpu.in');
                    setPassword('AdminPass123!');
                  }}
                  className="p-2.5 bg-slate-50 hover:bg-amber-50 hover:border-amber-300 border border-slate-200 rounded-xl text-left transition group"
                >
                  <div className="flex items-center gap-1 text-slate-700 group-hover:text-amber-700 font-bold text-xs mb-0.5">
                    <Crown className="w-3.5 h-3.5 text-amber-600" />
                    <span>Super</span>
                  </div>
                  <div className="text-[10px] text-slate-400 truncate">superadmin@...</div>
                </button>
              </div>
            </div>

            <div className="text-center text-xs text-slate-500 pt-2 border-t border-slate-100">
              Don’t have an account yet?{' '}
              <Link to="/register" className="font-bold text-sky-600 hover:text-sky-700">
                Register with College Email
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
