'use client';

import React, { useState } from 'react';
import { FileText, FileSpreadsheet, Presentation, ExternalLink, Sparkles } from 'lucide-react';
import { Citation } from '@/types/chat';

interface CitationChipProps {
  citation: Citation;
  onClick: (citation: Citation) => void;
}

export function CitationChip({ citation, onClick }: CitationChipProps) {
  const [showTooltip, setShowTooltip] = useState(false);

  const getFormatIcon = (format: string) => {
    switch (format) {
      case 'pdf':
        return <FileText className="w-3 h-3 text-rose-400" />;
      case 'docx':
      case 'doc':
        return <FileText className="w-3 h-3 text-blue-400" />;
      case 'pptx':
      case 'ppt':
        return <Presentation className="w-3 h-3 text-amber-400" />;
      case 'xlsx':
      case 'xls':
      case 'csv':
        return <FileSpreadsheet className="w-3 h-3 text-emerald-400" />;
      default:
        return <FileText className="w-3 h-3 text-indigo-400" />;
    }
  };

  return (
    <span className="relative inline-block mx-1 align-baseline">
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onClick(citation);
        }}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-indigo-500/20 hover:bg-indigo-500/35 border border-indigo-500/40 hover:border-indigo-400 text-indigo-300 hover:text-white font-mono text-[11px] font-bold transition-all shadow-sm cursor-pointer group"
      >
        <span>[{citation.citationIndex}]</span>
        <span className="max-w-[120px] truncate text-[10px] text-slate-300 group-hover:text-white font-sans hidden sm:inline">
          {citation.documentTitle}
        </span>
        {citation.pageNumber && (
          <span className="text-[10px] text-indigo-400 font-sans hidden sm:inline">
            (p.{citation.pageNumber})
          </span>
        )}
      </button>

      {/* Hover Preview Popover */}
      {showTooltip && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-72 p-3 rounded-xl glass-panel-elevated text-left shadow-2xl z-50 animate-in fade-in zoom-in-95 pointer-events-none">
          <div className="flex items-center justify-between gap-2 mb-1.5 pb-1 border-b border-white/10">
            <div className="flex items-center gap-1.5 truncate">
              {getFormatIcon(citation.fileFormat)}
              <span className="text-xs font-bold text-white truncate">
                {citation.documentTitle}
              </span>
            </div>
            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 shrink-0 font-semibold">
              {Math.round(citation.similarityScore * 100)}% match
            </span>
          </div>

          <p className="text-[11px] text-slate-300 line-clamp-3 leading-relaxed font-mono bg-black/40 p-2 rounded-lg border border-white/5">
            &quot;{citation.excerpt}&quot;
          </p>

          <div className="mt-2 flex items-center justify-between text-[10px] text-indigo-300">
            <span>
              {citation.pageNumber ? `Page ${citation.pageNumber}` : 'Section Header'}
            </span>
            <span className="flex items-center gap-1 text-slate-400">
              Click to view source page
            </span>
          </div>
        </div>
      )}
    </span>
  );
}
