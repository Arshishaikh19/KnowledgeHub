'use client';

import React, { useState, useMemo } from 'react';
import {
  MessageSquare,
  Plus,
  Search,
  Trash2,
  ChevronLeft,
  ChevronRight,
  MessageCircle,
} from 'lucide-react';
import { ChatSession } from '@/types/chat';

interface ChatHistorySidebarProps {
  sessions: ChatSession[];
  activeSessionId: string;
  onSelectSession: (sessionId: string) => void;
  onNewSession: () => void;
  onDeleteSession: (sessionId: string) => void;
  isOpen: boolean;
  onToggleOpen: () => void;
}

export function ChatHistorySidebar({
  sessions,
  activeSessionId,
  onSelectSession,
  onNewSession,
  onDeleteSession,
  isOpen,
  onToggleOpen,
}: ChatHistorySidebarProps) {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredSessions = useMemo(() => {
    if (!searchQuery.trim()) return sessions;
    const q = searchQuery.toLowerCase();
    return sessions.filter((s) => {
      const matchTitle = s.title.toLowerCase().includes(q);
      const matchMessages = s.messages.some((m) =>
        m.content.toLowerCase().includes(q)
      );
      return matchTitle || matchMessages;
    });
  }, [sessions, searchQuery]);

  if (!isOpen) {
    return (
      <div className="hidden md:flex flex-col items-center py-4 px-2 border-r border-slate-800 bg-slate-900 shrink-0">
        <button
          onClick={onToggleOpen}
          className="p-2 rounded-lg bg-slate-800 text-slate-400 hover:text-white transition-colors mb-3"
          title="Open chat history"
        >
          <ChevronRight className="w-4 h-4" />
        </button>

        <button
          onClick={onNewSession}
          className="p-2 rounded-lg bg-blue-600 text-white hover:bg-blue-500 transition-colors shadow-sm"
          title="New conversation"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>
    );
  }

  return (
    <aside className="w-64 border-r border-slate-800 bg-slate-900 flex flex-col shrink-0 h-full overflow-hidden">
      {/* Header */}
      <div className="p-3 border-b border-slate-800 space-y-2.5 shrink-0">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-300">
            Conversations
          </span>

          <div className="flex items-center gap-1">
            <button
              onClick={onNewSession}
              className="btn-primary px-2 py-1 rounded-md text-xs font-medium flex items-center gap-1 transition-colors"
              title="New Chat"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New</span>
            </button>

            <button
              onClick={onToggleOpen}
              className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              title="Collapse sidebar"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search conversations..."
            className="w-full pl-8 pr-3 py-1.5 rounded-md bg-slate-800 border border-slate-700/80 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-slate-500"
          />
        </div>
      </div>

      {/* Sessions List */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {filteredSessions.length === 0 ? (
          <div className="py-8 text-center text-slate-500 text-xs px-2">
            <MessageCircle className="w-5 h-5 mx-auto mb-1.5 opacity-40" />
            <p>No conversations yet</p>
          </div>
        ) : (
          filteredSessions.map((s) => {
            const isActive = s.id === activeSessionId;
            return (
              <div
                key={s.id}
                onClick={() => onSelectSession(s.id)}
                className={`group w-full flex items-center justify-between p-2 rounded-lg text-left text-xs transition-colors cursor-pointer ${
                  isActive
                    ? 'sidebar-pill-active shadow-sm'
                    : 'sidebar-pill-inactive'
                }`}
              >
                <div className="flex items-center gap-2 truncate min-w-0 pr-1">
                  <MessageSquare
                    className="w-3.5 h-3.5 shrink-0"
                  />
                  <span className="truncate">{s.title}</span>
                </div>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteSession(s.id);
                  }}
                  className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 transition-opacity shrink-0"
                  title="Delete"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            );
          })
        )}
      </div>

      {/* Footer */}
      <div className="p-2.5 border-t border-slate-800 text-[11px] text-slate-500">
        <span>{sessions.length} conversations</span>
      </div>
    </aside>
  );
}
