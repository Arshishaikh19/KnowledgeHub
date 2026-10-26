'use client';

import React, { useState } from 'react';
import {
  BookOpen,
  User,
  Copy,
  Check,
  FileText,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { ChatMessage, Citation } from '@/types/chat';
import { CitationChip } from './CitationChip';

interface ChatMessageItemProps {
  message: ChatMessage;
  onCitationClick: (citation: Citation) => void;
}

export function ChatMessageItem({ message, onCitationClick }: ChatMessageItemProps) {
  const [copied, setCopied] = useState(false);
  const [showSourcesList, setShowSourcesList] = useState(false);

  const isAssistant = message.role === 'assistant';

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const renderFormattedContent = (content: string, citations?: Citation[]) => {
    if (!citations || citations.length === 0) {
      return (
        <div className="whitespace-pre-wrap leading-relaxed text-sm text-slate-200">
          {content}
        </div>
      );
    }

    const regex = /\[(\d+)\]/g;
    const elements: React.ReactNode[] = [];
    let lastIndex = 0;
    let match: RegExpExecArray | null;

    while ((match = regex.exec(content)) !== null) {
      const matchIndex = match.index;
      const citationNumber = parseInt(match[1], 10);

      if (matchIndex > lastIndex) {
        elements.push(
          <span key={`text-${lastIndex}`}>
            {content.substring(lastIndex, matchIndex)}
          </span>
        );
      }

      const matchedCitation = citations.find((c) => c.citationIndex === citationNumber);

      if (matchedCitation) {
        elements.push(
          <CitationChip
            key={`cite-${matchIndex}-${citationNumber}`}
            citation={matchedCitation}
            onClick={onCitationClick}
          />
        );
      } else {
        elements.push(<span key={`raw-${matchIndex}`}>[{citationNumber}]</span>);
      }

      lastIndex = regex.lastIndex;
    }

    if (lastIndex < content.length) {
      elements.push(<span key={`text-tail`}>{content.substring(lastIndex)}</span>);
    }

    return (
      <div className="whitespace-pre-wrap leading-relaxed text-sm text-slate-200 space-y-2">
        {elements}
      </div>
    );
  };

  return (
    <div className={`py-4 px-4 sm:px-6 ${isAssistant ? 'bg-slate-800/40 rounded-xl' : ''}`}>
      <div className="max-w-3xl mx-auto flex gap-3.5">
        {/* Avatar */}
        <div className="shrink-0 pt-0.5">
          {isAssistant ? (
            <div className="w-8 h-8 rounded-lg bg-blue-600/20 text-blue-400 border border-blue-500/30 flex items-center justify-center">
              <BookOpen className="w-4 h-4" />
            </div>
          ) : (
            <div className="w-8 h-8 rounded-lg bg-slate-700 text-slate-300 flex items-center justify-center">
              <User className="w-4 h-4" />
            </div>
          )}
        </div>

        {/* Body */}
        <div className="flex-1 min-w-0 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-300">
              {isAssistant ? 'Knowledge Assistant' : 'You'}
            </span>
            <span className="text-[11px] text-slate-500">
              {new Date(message.timestamp).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </span>
          </div>

          <div className="text-sm text-slate-200">
            {renderFormattedContent(message.content, message.citations)}

            {message.isStreaming && (
              <span className="inline-block w-1.5 h-3.5 ml-1 bg-blue-400 animate-pulse align-middle" />
            )}
          </div>

          {/* Sources and actions */}
          {isAssistant && !message.isStreaming && (
            <div className="pt-2 flex flex-wrap items-center justify-between gap-2 border-t border-slate-700/60">
              {message.citations && message.citations.length > 0 ? (
                <button
                  onClick={() => setShowSourcesList(!showSourcesList)}
                  className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 font-medium transition-colors"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>{message.citations.length} Sources</span>
                  {showSourcesList ? (
                    <ChevronUp className="w-3.5 h-3.5" />
                  ) : (
                    <ChevronDown className="w-3.5 h-3.5" />
                  )}
                </button>
              ) : <div />}

              <button
                onClick={handleCopy}
                className="p-1 rounded text-slate-400 hover:text-white transition-colors flex items-center gap-1 text-xs"
                title="Copy response"
              >
                {copied ? (
                  <>
                    <Check className="w-3 h-3 text-emerald-400" />
                    <span className="text-emerald-400">Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3" />
                    <span>Copy</span>
                  </>
                )}
              </button>
            </div>
          )}

          {/* Collapsible Source List */}
          {showSourcesList && message.citations && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2">
              {message.citations.map((c) => (
                <div
                  key={c.id}
                  onClick={() => onCitationClick(c)}
                  className="p-2.5 rounded-lg bg-slate-800 border border-slate-700 hover:border-slate-600 cursor-pointer transition-colors space-y-1"
                >
                  <div className="flex items-center gap-1.5 text-xs font-medium text-white truncate">
                    <span className="text-blue-400 font-semibold">[{c.citationIndex}]</span>
                    <span className="truncate">{c.documentTitle}</span>
                  </div>
                  <p className="text-[11px] text-slate-400 truncate">{c.sectionTitle || 'General'}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
