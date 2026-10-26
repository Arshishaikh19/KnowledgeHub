'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  BookOpen,
  ArrowUp,
  RefreshCw,
  FileText,
  PanelLeft,
} from 'lucide-react';
import { Navbar } from '@/components/Navbar';
import { ChatMessageItem } from '@/components/chat/ChatMessageItem';
import { SourceCitationModal } from '@/components/chat/SourceCitationModal';
import { ChatHistorySidebar } from '@/components/chat/ChatHistorySidebar';
import { ChatMessage, Citation, ChatSession } from '@/types/chat';
import { sendChatMessageStream, API_BASE_URL } from '@/lib/chat-api';

const SUGGESTED_QUESTIONS = [
  'What are the core employee leave policies?',
  'Summarize the security standards in our architecture docs.',
  'What are the financial metrics reported in recent updates?',
];

export default function ChatPage() {
  const router = useRouter();

  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string>('session_new');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const [inputQuery, setInputQuery] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [activeCitation, setActiveCitation] = useState<Citation | null>(null);
  const [currentSessionCitations, setCurrentSessionCitations] = useState<Citation[]>([]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    async function loadHistory() {
      try {
        const res = await fetch(`${API_BASE_URL}/chat/history`);
        if (res.ok) {
          const data = await res.json();
          if (data.sessions && data.sessions.length > 0) {
            const formattedSessions: ChatSession[] = data.sessions.map((s: any) => ({
              id: s._id || s.id,
              title: s.title || 'Conversation',
              createdAt: s.createdAt,
              updatedAt: s.updatedAt,
              messages: (s.messages || []).map((m: any) => ({
                id: m.id || `msg_${Date.now()}_${Math.random()}`,
                role: m.role,
                content: m.content,
                timestamp: m.timestamp,
                citations: m.citations || [],
              })),
            }));
            setSessions(formattedSessions);
            setActiveSessionId(formattedSessions[0].id);
            return;
          }
        }
      } catch (err) {
        console.warn('[Chat] Could not load chat history:', err);
      }

      const initialCleanSession: ChatSession = {
        id: 'session_new',
        title: 'New Conversation',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        messages: [
          {
            id: 'msg_welcome',
            role: 'assistant',
            content: `Hello! I can answer questions grounded directly in your company's uploaded documents.\n\nType a question below to search across your knowledge base.`,
            timestamp: new Date().toISOString(),
          },
        ],
      };
      setSessions([initialCleanSession]);
      setActiveSessionId('session_new');
    }

    loadHistory();
  }, []);

  const activeSession =
    sessions.find((s) => s.id === activeSessionId) || sessions[0];
  const messages = activeSession ? activeSession.messages : [];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleNewSession = () => {
    const newId = `session_${Date.now()}`;
    const newSession: ChatSession = {
      id: newId,
      title: 'New Conversation',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      messages: [
        {
          id: `msg_${Date.now()}`,
          role: 'assistant',
          content: `Hello! How can I help you find information in your documents today?`,
          timestamp: new Date().toISOString(),
        },
      ],
    };
    setSessions([newSession, ...sessions]);
    setActiveSessionId(newId);
    setCurrentSessionCitations([]);
  };

  const handleDeleteSession = async (sessionId: string) => {
    try {
      await fetch(`${API_BASE_URL}/chat/history/${sessionId}`, { method: 'DELETE' });
    } catch (err) {
      console.error('[Chat] Failed to delete session:', err);
    }

    if (sessions.length <= 1) {
      handleNewSession();
      setSessions((prev) => prev.filter((s) => s.id !== sessionId));
      return;
    }
    const remaining = sessions.filter((s) => s.id !== sessionId);
    setSessions(remaining);
    if (activeSessionId === sessionId) {
      setActiveSessionId(remaining[0].id);
    }
  };

  const handleSend = async (overridePrompt?: string) => {
    const textToSend = overridePrompt || inputQuery;
    if (!textToSend.trim() || isGenerating) return;

    setInputQuery('');

    const userMessage: ChatMessage = {
      id: `msg_${Date.now()}_user`,
      role: 'user',
      content: textToSend,
      timestamp: new Date().toISOString(),
    };

    const assistantPlaceholderId = `msg_${Date.now()}_assistant`;
    const assistantMessage: ChatMessage = {
      id: assistantPlaceholderId,
      role: 'assistant',
      content: '',
      timestamp: new Date().toISOString(),
      isStreaming: true,
      citations: [],
    };

    setSessions((prev) =>
      prev.map((s) => {
        if (s.id === activeSessionId) {
          const isInitialTitle = s.title === 'New Conversation';
          const newTitle = isInitialTitle ? textToSend.slice(0, 32) + '...' : s.title;
          return {
            ...s,
            title: newTitle,
            updatedAt: new Date().toISOString(),
            messages: [...s.messages, userMessage, assistantMessage],
          };
        }
        return s;
      })
    );

    setIsGenerating(true);

    try {
      await sendChatMessageStream(
        textToSend,
        {
          onCitations: (citations) => {
            setCurrentSessionCitations(citations);
            setSessions((prev) =>
              prev.map((s) =>
                s.id === activeSessionId
                  ? {
                      ...s,
                      messages: s.messages.map((m) =>
                        m.id === assistantPlaceholderId ? { ...m, citations } : m
                      ),
                    }
                  : s
              )
            );
          },
          onToken: (token, fullText) => {
            setSessions((prev) =>
              prev.map((s) =>
                s.id === activeSessionId
                  ? {
                      ...s,
                      messages: s.messages.map((m) =>
                        m.id === assistantPlaceholderId ? { ...m, content: fullText } : m
                      ),
                    }
                  : s
              )
            );
          },
          onComplete: (finalMsg) => {
            setSessions((prev) =>
              prev.map((s) =>
                s.id === activeSessionId
                  ? {
                      ...s,
                      messages: s.messages.map((m) =>
                        m.id === assistantPlaceholderId
                          ? { ...finalMsg, id: assistantPlaceholderId, isStreaming: false }
                          : m
                      ),
                    }
                  : s
              )
            );
            setIsGenerating(false);
          },
          onError: (err) => {
            setSessions((prev) =>
              prev.map((s) =>
                s.id === activeSessionId
                  ? {
                      ...s,
                      messages: s.messages.map((m) =>
                        m.id === assistantPlaceholderId
                          ? {
                              ...m,
                              content: `Error: ${err.message}`,
                              isStreaming: false,
                            }
                          : m
                      ),
                    }
                  : s
              )
            );
            setIsGenerating(false);
          },
        },
        activeSessionId.startsWith('session_') ? undefined : activeSessionId
      );
    } catch {
      setIsGenerating(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-900 text-slate-100">
      <Navbar />

      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <ChatHistorySidebar
          sessions={sessions}
          activeSessionId={activeSessionId}
          onSelectSession={(id) => setActiveSessionId(id)}
          onNewSession={handleNewSession}
          onDeleteSession={handleDeleteSession}
          isOpen={isSidebarOpen}
          onToggleOpen={() => setIsSidebarOpen(!isSidebarOpen)}
        />

        {/* Chat Main Area */}
        <main className="flex-1 flex flex-col max-w-5xl w-full mx-auto px-6 py-4 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-800 shrink-0">
            <div className="flex items-center gap-2.5">
              {!isSidebarOpen && (
                <button
                  onClick={() => setIsSidebarOpen(true)}
                  className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white transition-colors"
                  title="Open History"
                >
                  <PanelLeft className="w-4 h-4" />
                </button>
              )}
              <h1 className="text-sm font-semibold text-white truncate">
                {activeSession?.title || 'Chat Assistant'}
              </h1>
            </div>

            <button
              onClick={handleNewSession}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs flex items-center gap-1.5 transition-colors"
              title="Start a new chat"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">New Chat</span>
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto py-4 space-y-3">
            {messages.map((message) => (
              <ChatMessageItem
                key={message.id}
                message={message}
                onCitationClick={(cite) => setActiveCitation(cite)}
              />
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Suggested Prompts on clean chat */}
          {messages.length <= 1 && (
            <div className="py-2 shrink-0 space-y-1.5">
              <span className="text-xs text-slate-500 font-medium block">
                Suggested questions
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {SUGGESTED_QUESTIONS.map((q, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSend(q)}
                    className="p-2.5 rounded-lg bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 hover:border-slate-600 text-left text-xs text-slate-300 hover:text-white transition-all flex items-start gap-2 shadow-sm"
                  >
                    <FileText className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                    <span className="line-clamp-2">{q}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Input Box */}
          <div className="pt-2 shrink-0">
            <div className="p-2 rounded-xl bg-slate-800 border border-slate-700/80 focus-within:border-slate-500 transition-colors shadow-sm">
              <div className="flex items-end gap-2">
                <textarea
                  ref={textareaRef}
                  value={inputQuery}
                  onChange={(e) => setInputQuery(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask a question about your documents..."
                  disabled={isGenerating}
                  rows={2}
                  className="w-full bg-transparent text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none resize-none p-1.5 leading-relaxed"
                />

                <button
                  onClick={() => handleSend()}
                  disabled={!inputQuery.trim() || isGenerating}
                  className="btn-primary p-2.5 rounded-lg flex items-center justify-center shrink-0 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  title="Send"
                >
                  <ArrowUp className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Citation Modal */}
      <SourceCitationModal
        citation={activeCitation}
        allCitations={currentSessionCitations}
        onClose={() => setActiveCitation(null)}
        onSelectCitation={(newCite) => setActiveCitation(newCite)}
        onOpenDocumentLibrary={(docId) => router.push(`/documents?focus=${docId}`)}
      />
    </div>
  );
}
