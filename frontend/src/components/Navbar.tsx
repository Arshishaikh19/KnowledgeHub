'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import {
  BookOpen,
  FolderOpen,
  MessageSquare,
  Search,
  Upload,
  User,
  LogOut,
  Shield,
  ChevronDown,
  Sun,
  Moon,
} from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';

interface NavbarProps {
  onOpenUpload?: () => void;
}

export function Navbar({ onOpenUpload }: NavbarProps) {
  const pathname = usePathname();
  const { data: session, status } = useSession();
  const { theme, toggleTheme } = useTheme();
  const [profileOpen, setProfileOpen] = useState(false);

  const navLinks = [
    { href: '/documents', label: 'Documents', icon: FolderOpen },
    { href: '/chat', label: 'Chat Assistant', icon: MessageSquare },
    { href: '/search', label: 'Search', icon: Search },
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800 bg-slate-900/95 backdrop-blur-md">
      <div className="w-full px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center gap-8">
          <Link href="/documents" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg brand-icon-box flex items-center justify-center shadow-sm">
              <BookOpen className="w-4 h-4" />
            </div>
            <div>
              <span className="brand-title text-base tracking-tight">
                Knowledge<span className="brand-title-suffix">Hub</span>
              </span>
            </div>
          </Link>

          {/* Navigation Items */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'sidebar-pill-active font-semibold'
                      : 'sidebar-pill-inactive'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Right Action Controls */}
        <div className="flex items-center gap-2.5">
          {/* Theme Toggle Button (Light / Dark) */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white transition-colors"
            title={theme === 'dark' ? 'Switch to Light theme' : 'Switch to Dark theme'}
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? (
              <Sun className="w-4 h-4 text-amber-400" />
            ) : (
              <Moon className="w-4 h-4 text-slate-700" />
            )}
          </button>

          {onOpenUpload && (
            <button
              onClick={onOpenUpload}
              className="btn-primary flex items-center gap-2 px-3.5 py-2 text-sm font-medium rounded-lg"
            >
              <Upload className="w-4 h-4" />
              <span>Upload Document</span>
            </button>
          )}

          {/* Session / User dropdown */}
          {status === 'authenticated' && session?.user ? (
            <div className="relative">
              <button
                onClick={() => setProfileOpen(!profileOpen)}
                className="flex items-center gap-2.5 p-1.5 pr-2.5 rounded-lg bg-slate-800 border border-slate-700 hover:border-slate-600 transition-colors"
              >
                <div className="w-7 h-7 rounded-md bg-slate-700 text-slate-200 flex items-center justify-center font-semibold text-xs overflow-hidden">
                  {session.user.avatar ? (
                    <img src={session.user.avatar} alt="User" className="w-full h-full object-cover" />
                  ) : (
                    session.user.name?.charAt(0) || 'U'
                  )}
                </div>
                <div className="text-left hidden lg:block">
                  <p className="text-xs font-medium text-slate-200 leading-tight">
                    {session.user.name}
                  </p>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {profileOpen && (
                <div
                  className="absolute right-0 mt-2 w-60 rounded-lg bg-slate-800 border border-slate-700 p-2 shadow-xl z-50 animate-in fade-in slide-in-from-top-1 duration-100"
                  onClick={() => setProfileOpen(false)}
                >
                  <div className="px-3 py-2 border-b border-slate-700">
                    <p className="text-xs font-medium text-white">{session.user.name}</p>
                    <p className="text-xs text-slate-400 truncate">{session.user.email}</p>
                    <div className="mt-1.5 flex items-center gap-1 text-[11px] text-slate-300">
                      <Shield className="w-3 h-3 text-slate-400" />
                      <span>{session.user.role || 'Member'} • {session.user.department || 'General'}</span>
                    </div>
                  </div>

                  <div className="py-1">
                    <Link
                      href="/documents"
                      className="flex items-center gap-2 px-3 py-1.5 text-xs text-slate-300 hover:bg-slate-700/60 rounded-md transition-colors"
                    >
                      <FolderOpen className="w-3.5 h-3.5 text-slate-400" />
                      Document Library
                    </Link>
                    <Link
                      href="/chat"
                      className="flex items-center gap-2 px-3 py-1.5 text-xs text-slate-300 hover:bg-slate-700/60 rounded-md transition-colors"
                    >
                      <MessageSquare className="w-3.5 h-3.5 text-slate-400" />
                      Chat Assistant
                    </Link>
                  </div>

                  <div className="pt-1 border-t border-slate-700">
                    <button
                      onClick={() => {
                        if (typeof window !== 'undefined') {
                          localStorage.removeItem('kh_user');
                        }
                        signOut({ callbackUrl: '/login' });
                      }}
                      className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-rose-400 hover:bg-rose-500/10 rounded-md transition-colors"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      Sign Out
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <Link
              href="/login"
              className="flex items-center gap-2 px-3.5 py-1.5 text-xs font-medium rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 transition-colors"
            >
              <User className="w-3.5 h-3.5" />
              <span>Sign In</span>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
