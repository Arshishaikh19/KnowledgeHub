'use client';

import React, { useState, useEffect } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import {
  BookOpen,
  Shield,
  Lock,
  Mail,
  User,
  Building,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Loader2,
  UserPlus,
  LogIn,
  X,
} from 'lucide-react';
import { API_BASE_URL } from '@/lib/api';

interface ToastState {
  show: boolean;
  type: 'error' | 'success' | 'warning';
  title: string;
  message: string;
  actionText?: string;
  onAction?: () => void;
}

export default function LoginPage() {
  const router = useRouter();
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');

  // Sign In fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Sign Up / Create Account fields
  const [signupName, setSignupName] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupDepartment, setSignupDepartment] = useState('Engineering');
  const [signupRole, setSignupRole] = useState<'member' | 'manager' | 'admin'>('member');

  // UI States
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [toast, setToast] = useState<ToastState>({
    show: false,
    type: 'error',
    title: '',
    message: '',
  });

  // Auto-dismiss toast after 6 seconds
  useEffect(() => {
    if (toast.show) {
      const timer = setTimeout(() => {
        setToast((prev) => ({ ...prev, show: false }));
      }, 6000);
      return () => clearTimeout(timer);
    }
  }, [toast.show]);

  const showToast = (
    type: 'error' | 'success' | 'warning',
    title: string,
    message: string,
    actionText?: string,
    onAction?: () => void
  ) => {
    setToast({
      show: true,
      type,
      title,
      message,
      actionText,
      onAction,
    });
  };

  // Validate Email Helper
  const isValidEmail = (val: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val.trim());
  };

  // Handle Login
  const handleLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    if (!email.trim()) {
      showToast('error', 'Email Required', 'Please enter your corporate email address.');
      setErrorMessage('Please enter your corporate email.');
      return;
    }

    if (!password) {
      showToast('error', 'Password Required', 'Please enter your password.');
      setErrorMessage('Please enter your password.');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const res = await signIn('credentials', {
        email: email.trim(),
        password,
        redirect: false,
      });

      if (res?.error) {
        showToast(
          'error',
          'Account Not Found or Invalid Password',
          'No matching account was found in the database. Please verify your credentials or create a new account.',
          'Create Account',
          () => {
            setAuthMode('signup');
            setSignupEmail(email.trim());
            setToast((prev) => ({ ...prev, show: false }));
          }
        );
        setErrorMessage('No matching account found in database. Please create an account.');
        setIsLoading(false);
      } else {
        if (typeof window !== 'undefined') {
          localStorage.setItem(
            'kh_user',
            JSON.stringify({
              email: email.trim(),
            })
          );
        }
        showToast('success', 'Welcome Back', 'Signing into your workspace...');
        router.push('/documents');
        router.refresh();
      }
    } catch {
      showToast('error', 'Connection Error', 'An error occurred during authentication.');
      setErrorMessage('An error occurred during authentication.');
      setIsLoading(false);
    }
  };

  // Handle Create Account (Registration)
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = signupName.trim();
    const trimmedEmail = signupEmail.trim();

    // Client-side Validations
    if (!trimmedName || trimmedName.length < 2) {
      showToast('error', 'Name Required', 'Full Name must be at least 2 characters long.');
      setErrorMessage('Full Name must be at least 2 characters.');
      return;
    }

    if (!trimmedEmail || !isValidEmail(trimmedEmail)) {
      showToast('error', 'Invalid Email', 'Please enter a valid work email (e.g. name@company.com).');
      setErrorMessage('Please enter a valid work email.');
      return;
    }

    if (!signupPassword || signupPassword.length < 6) {
      showToast('error', 'Weak Password', 'Password must be at least 6 characters long.');
      setErrorMessage('Password must be at least 6 characters long.');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      // 1. Create User in MongoDB backend
      const res = await fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: trimmedName,
          email: trimmedEmail,
          password: signupPassword,
          department: signupDepartment,
          role: signupRole,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (res.status === 409 || data.code === 'USER_EXISTS') {
          // Toast for duplicate email
          showToast(
            'warning',
            'Account Already Exists',
            `An account with "${trimmedEmail}" is already registered.`,
            'Switch to Sign In',
            () => {
              setEmail(trimmedEmail);
              setAuthMode('signin');
              setToast((prev) => ({ ...prev, show: false }));
            }
          );
          setErrorMessage(`An account with "${trimmedEmail}" already exists. Please sign in instead.`);
        } else {
          showToast('error', 'Registration Failed', data.error || 'Unable to create account.');
          setErrorMessage(data.error || 'Failed to create account.');
        }
        setIsLoading(false);
        return;
      }

      // Persist active user profile in localStorage for API calls
      if (typeof window !== 'undefined') {
        localStorage.setItem(
          'kh_user',
          JSON.stringify({
            id: data.user?.id,
            name: trimmedName,
            email: trimmedEmail,
            department: signupDepartment,
            role: signupRole,
          })
        );
      }

      showToast('success', 'Account Created!', `Welcome ${trimmedName}! Logging into workspace...`);
      setSuccessMessage('Account created successfully! Signing in...');

      // 2. Automatically sign in with the new account
      const signInRes = await signIn('credentials', {
        email: trimmedEmail,
        password: signupPassword,
        redirect: false,
      });

      if (signInRes?.error) {
        setEmail(trimmedEmail);
        setPassword(signupPassword);
        setAuthMode('signin');
        setIsLoading(false);
      } else {
        router.push('/documents');
        router.refresh();
      }
    } catch {
      showToast('error', 'Connection Error', 'Unable to connect to the authentication server.');
      setErrorMessage('Unable to connect to authentication service.');
      setIsLoading(false);
    }
  };

  const handleSelectDemoPersona = (demoEmail: string, role: string, name?: string, dept?: string) => {
    setEmail(demoEmail);
    setPassword('password123');
    setAuthMode('signin');
    if (typeof window !== 'undefined') {
      localStorage.setItem(
        'kh_user',
        JSON.stringify({
          name: name || demoEmail.split('@')[0],
          email: demoEmail,
          department: dept || 'Engineering',
          role: role,
        })
      );
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative bg-slate-950 text-slate-100">
      {/* Floating Animated Toast Banner */}
      {toast.show && (
        <div className="fixed top-5 right-5 z-50 max-w-md w-full animate-in slide-in-from-top-4 fade-in duration-200">
          <div
            className={`p-4 rounded-xl border shadow-2xl backdrop-blur-md flex items-start gap-3 ${
              toast.type === 'error'
                ? 'bg-rose-950/90 border-rose-600/60 text-rose-100'
                : toast.type === 'warning'
                ? 'bg-amber-950/90 border-amber-500/60 text-amber-100'
                : 'bg-emerald-950/90 border-emerald-500/60 text-emerald-100'
            }`}
          >
            {toast.type === 'error' && <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />}
            {toast.type === 'warning' && <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />}
            {toast.type === 'success' && <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />}

            <div className="flex-1 text-xs">
              <p className="font-bold text-sm tracking-tight">{toast.title}</p>
              <p className="mt-0.5 opacity-90 leading-relaxed">{toast.message}</p>

              {toast.actionText && toast.onAction && (
                <button
                  type="button"
                  onClick={toast.onAction}
                  className="mt-2.5 px-3 py-1 rounded-lg bg-white/10 hover:bg-white/20 border border-white/20 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                >
                  <span>{toast.actionText}</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              )}
            </div>

            <button
              type="button"
              onClick={() => setToast((prev) => ({ ...prev, show: false }))}
              className="p-1 rounded-md hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
              aria-label="Close Toast"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-12 gap-8 items-center z-10 py-6">
        {/* Left Side: Platform Highlights */}
        <div className="lg:col-span-6 space-y-6 hidden lg:block pr-6">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-700/80 flex items-center justify-center text-white shadow-md">
              <BookOpen className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="brand-title text-2xl tracking-tight">
                Knowledge<span className="brand-title-suffix">Hub</span>
              </span>
            </div>
          </div>

          <h1 className="text-3xl font-extrabold text-white tracking-tight leading-snug">
            Enterprise Knowledge Management &amp; AI Document Intelligence.
          </h1>

          <p className="text-sm text-slate-400 leading-relaxed">
            Ingest PDFs, Word documents, PowerPoint presentations, and Excel spreadsheets with
            deep OCR, semantic chunking, and permission-aware RAG vector search.
          </p>

          <div className="space-y-3 pt-2">
            <div className="flex items-center gap-3 text-xs text-slate-300">
              <div className="w-6 h-6 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              </div>
              <span>Multi-format parsing: PDF, Word (DOCX), Excel (XLSX), and PowerPoint</span>
            </div>

            <div className="flex items-center gap-3 text-xs text-slate-300">
              <div className="w-6 h-6 rounded-lg bg-blue-500/15 border border-blue-500/30 flex items-center justify-center shrink-0">
                <Shield className="w-3.5 h-3.5 text-blue-400" />
              </div>
              <span>Granular multi-tenant permissions enforced at database query runtime</span>
            </div>

            <div className="flex items-center gap-3 text-xs text-slate-300">
              <div className="w-6 h-6 rounded-lg bg-amber-500/15 border border-amber-500/30 flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-3.5 h-3.5 text-amber-400" />
              </div>
              <span>Asynchronous BullMQ worker pipeline with Tesseract.js OCR fallback</span>
            </div>
          </div>
        </div>

        {/* Right Side: Auth Card (Sign In & Create Account) */}
        <div className="lg:col-span-6 w-full max-w-md mx-auto">
          <div className="p-7 rounded-2xl bg-slate-900 border border-slate-700/80 shadow-2xl space-y-5">
            {/* Header & Mode Switcher */}
            <div>
              <div className="flex items-center justify-between pb-3">
                <h2 className="text-lg font-bold text-white tracking-tight">
                  {authMode === 'signin' ? 'Sign In to Workspace' : 'Create New Account'}
                </h2>
              </div>

              {/* Tab Selector */}
              <div className="grid grid-cols-2 p-1 rounded-xl bg-slate-950 border border-slate-800 text-xs">
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode('signin');
                    setErrorMessage(null);
                  }}
                  className={`py-2 rounded-lg font-medium flex items-center justify-center gap-1.5 transition-all ${
                    authMode === 'signin'
                      ? 'bg-slate-800 text-white font-semibold shadow-sm border border-slate-700'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>Sign In</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setAuthMode('signup');
                    setErrorMessage(null);
                  }}
                  className={`py-2 rounded-lg font-medium flex items-center justify-center gap-1.5 transition-all ${
                    authMode === 'signup'
                      ? 'bg-slate-800 text-white font-semibold shadow-sm border border-slate-700'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>Create Account</span>
                </button>
              </div>
            </div>

            {/* Error Message */}
            {errorMessage && (
              <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 flex items-center gap-2.5 text-xs text-rose-300 animate-in fade-in">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Success Message */}
            {successMessage && (
              <div className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center gap-2.5 text-xs text-emerald-300 animate-in fade-in">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{successMessage}</span>
              </div>
            )}

            {/* Mode 1: Sign In Form */}
            {authMode === 'signin' ? (
              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Corporate Email
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      placeholder="alex@company.com"
                      className="w-full pl-9 pr-3.5 py-2 rounded-lg bg-slate-950 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-slate-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      placeholder="••••••••"
                      className="w-full pl-9 pr-3.5 py-2 rounded-lg bg-slate-950 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-slate-500"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full btn-primary py-2.5 text-xs font-semibold rounded-lg flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Signing In...</span>
                    </>
                  ) : (
                    <>
                      <span>Sign In to Workspace</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>

                <div className="text-center pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setAuthMode('signup');
                      setErrorMessage(null);
                    }}
                    className="text-xs text-slate-400 hover:text-white transition-colors"
                  >
                    Don't have an account? <span className="font-semibold text-white underline underline-offset-4">Create one here</span>
                  </button>
                </div>
              </form>
            ) : (
              /* Mode 2: Create Account Form (New User Registration) */
              <form onSubmit={handleRegister} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Full Name
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={signupName}
                      onChange={(e) => setSignupName(e.target.value)}
                      required
                      placeholder="e.g. Alex Morgan"
                      className="w-full pl-9 pr-3.5 py-2 rounded-lg bg-slate-950 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-slate-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Work Email
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      value={signupEmail}
                      onChange={(e) => setSignupEmail(e.target.value)}
                      required
                      placeholder="alex@company.com"
                      className="w-full pl-9 pr-3.5 py-2 rounded-lg bg-slate-950 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-slate-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="password"
                      value={signupPassword}
                      onChange={(e) => setSignupPassword(e.target.value)}
                      required
                      placeholder="Create password"
                      className="w-full pl-9 pr-3.5 py-2 rounded-lg bg-slate-950 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-slate-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Department
                    </label>
                    <select
                      value={signupDepartment}
                      onChange={(e) => setSignupDepartment(e.target.value)}
                      className="w-full px-2.5 py-2 rounded-lg bg-slate-950 border border-slate-700 text-xs text-slate-200 focus:outline-none"
                    >
                      <option value="Engineering">Engineering</option>
                      <option value="HR">HR</option>
                      <option value="Finance">Finance</option>
                      <option value="Legal">Legal</option>
                      <option value="Product">Product</option>
                      <option value="Operations">Operations</option>
                      <option value="General">General</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Role
                    </label>
                    <select
                      value={signupRole}
                      onChange={(e) => setSignupRole(e.target.value as any)}
                      className="w-full px-2.5 py-2 rounded-lg bg-slate-950 border border-slate-700 text-xs text-slate-200 focus:outline-none"
                    >
                      <option value="member">Member</option>
                      <option value="manager">Manager</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full btn-primary py-2.5 text-xs font-semibold rounded-lg flex items-center justify-center gap-2 disabled:opacity-50 mt-2"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Creating Account...</span>
                    </>
                  ) : (
                    <>
                      <span>Create Account &amp; Sign In</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>

                <div className="text-center pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setAuthMode('signin');
                      setErrorMessage(null);
                    }}
                    className="text-xs text-slate-400 hover:text-white transition-colors"
                  >
                    Already have an account? <span className="font-semibold text-white underline underline-offset-4">Sign in</span>
                  </button>
                </div>
              </form>
            )}

            {/* Quick Demo Switcher */}
            <div className="pt-4 border-t border-slate-800 space-y-2">
              <span className="text-[11px] font-semibold text-slate-400 block">
                Quick 1-Click Demo Profiles:
              </span>

              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => handleSelectDemoPersona('admin@knowledgehub.ai', 'admin')}
                  className={`p-2 rounded-lg border text-left transition-all ${
                    email === 'admin@knowledgehub.ai' && authMode === 'signin'
                      ? 'bg-slate-800 border-slate-600 text-white'
                      : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  <p className="text-[11px] font-bold text-white leading-tight">Admin</p>
                  <p className="text-[9px] text-slate-400 truncate">Sarah (Legal)</p>
                </button>

                <button
                  type="button"
                  onClick={() => handleSelectDemoPersona('eng@knowledgehub.ai', 'manager')}
                  className={`p-2 rounded-lg border text-left transition-all ${
                    email === 'eng@knowledgehub.ai' && authMode === 'signin'
                      ? 'bg-slate-800 border-slate-600 text-white'
                      : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  <p className="text-[11px] font-bold text-white leading-tight">Manager</p>
                  <p className="text-[9px] text-slate-400 truncate">David (Eng)</p>
                </button>

                <button
                  type="button"
                  onClick={() => handleSelectDemoPersona('hr@knowledgehub.ai', 'member')}
                  className={`p-2 rounded-lg border text-left transition-all ${
                    email === 'hr@knowledgehub.ai' && authMode === 'signin'
                      ? 'bg-slate-800 border-slate-600 text-white'
                      : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  <p className="text-[11px] font-bold text-white leading-tight">Member</p>
                  <p className="text-[9px] text-slate-400 truncate">Elena (HR)</p>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
