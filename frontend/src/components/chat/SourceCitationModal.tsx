'use client';

import React from 'react';
import {
  X,
  FileText,
  FileSpreadsheet,
  Presentation,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Sparkles,
  BookOpen,
  Shield,
  Layers,
  CheckCircle2,
} from 'lucide-react';
import { Citation } from '@/types/chat';

interface SourceCitationModalProps {
  citation: Citation | null;
  allCitations?: Citation[];
  onClose: () => void;
  onSelectCitation?: (citation: Citation) => void;
  onOpenDocumentLibrary?: (docId: string) => void;
}

export function SourceCitationModal({
  citation,
  allCitations = [],
  onClose,
  onSelectCitation,
  onOpenDocumentLibrary,
}: SourceCitationModalProps) {
  if (!citation) return null;

  const currentIndex = allCitations.findIndex((c) => c.id === citation.id);
  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex !== -1 && currentIndex < allCitations.length - 1;

  const handlePrev = () => {
    if (hasPrev && onSelectCitation) {
      onSelectCitation(allCitations[currentIndex - 1]);
    }
  };

  const handleNext = () => {
    if (hasNext && onSelectCitation) {
      onSelectCitation(allCitations[currentIndex + 1]);
    }
  };

  const getFormatBadge = (format: string) => {
    switch (format) {
      case 'pdf':
        return { label: 'PDF Document', color: 'text-rose-400 bg-rose-500/15 border-rose-500/30' };
      case 'docx':
      case 'doc':
        return { label: 'Word Document', color: 'text-blue-400 bg-blue-500/15 border-blue-500/30' };
      case 'pptx':
      case 'ppt':
        return {
          label: 'PowerPoint Deck',
          color: 'text-amber-400 bg-amber-500/15 border-amber-500/30',
        };
      case 'xlsx':
      case 'xls':
      case 'csv':
        return {
          label: 'Excel Spreadsheet',
          color: 'text-emerald-400 bg-emerald-500/15 border-emerald-500/30',
        };
      default:
        return {
          label: 'Document',
          color: 'text-indigo-400 bg-indigo-500/15 border-indigo-500/30',
        };
    }
  };

  const badge = getFormatBadge(citation.fileFormat);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl rounded-2xl glass-panel-elevated overflow-hidden border border-white/15 shadow-2xl flex flex-col max-h-[85vh]">
        {/* Top Header */}
        <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between bg-slate-900/95">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center font-bold text-indigo-300 text-sm">
              [{citation.citationIndex}]
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-white tracking-tight">
                  Source Citation Reference
                </h2>
                <span
                  className={`text-[10px] font-semibold px-2 py-0.2 rounded-full border ${badge.color}`}
                >
                  {badge.label}
                </span>
              </div>
              <p className="text-xs text-slate-400 font-mono truncate max-w-md">
                {citation.originalFileName}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Source Document Context Viewer Canvas */}
        <div className="p-6 space-y-5 overflow-y-auto flex-1">
          {/* Metadata Banner */}
          <div className="p-4 rounded-xl glass-card flex flex-wrap items-center justify-between gap-3 bg-slate-900/60">
            <div className="flex items-center gap-4 text-xs">
              <div className="flex items-center gap-1.5 text-slate-300 font-medium">
                <BookOpen className="w-4 h-4 text-indigo-400" />
                <span>{citation.documentTitle}</span>
              </div>
              {citation.pageNumber && (
                <span className="px-2.5 py-0.5 rounded bg-indigo-500/15 border border-indigo-500/30 text-indigo-300 font-mono text-[11px] font-bold">
                  Page {citation.pageNumber}
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-emerald-400" />
                {Math.round(citation.similarityScore * 100)}% Semantic Match
              </span>
            </div>
          </div>

          {/* Section Heading */}
          {citation.sectionTitle && (
            <div className="px-1">
              <span className="text-[11px] uppercase tracking-wider font-semibold text-slate-400 block mb-1">
                Document Section
              </span>
              <h3 className="text-sm font-bold text-indigo-200">{citation.sectionTitle}</h3>
            </div>
          )}

          {/* Document Page Reader Viewport */}
          <div className="relative rounded-2xl bg-slate-950 border border-indigo-500/30 p-6 shadow-inner font-mono text-xs">
            {/* Document Header Page watermark */}
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-white/10 text-[11px] text-slate-400">
              <span>{citation.documentTitle}</span>
              <span>{citation.pageNumber ? `Page ${citation.pageNumber}` : 'Verified Excerpt'}</span>
            </div>

            {/* Verbatim Excerpt with Highlighting */}
            <div className="p-4 rounded-xl bg-indigo-500/15 border-l-4 border-indigo-400 text-slate-100 text-xs sm:text-sm leading-relaxed relative my-2">
              <div className="absolute -top-2.5 right-3 px-2 py-0.5 rounded bg-indigo-600 text-white text-[9px] font-sans font-bold uppercase tracking-wider">
                Verbatim LLM Citation Excerpt
              </div>
              &quot;{citation.excerpt}&quot;
            </div>

            {/* Context footnote */}
            <div className="pt-3 mt-3 border-t border-white/5 flex items-center justify-between text-[11px] text-slate-400">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Vector search retrieved top matching chunk (cosine distance)</span>
              </div>
              <span>Department: {citation.department}</span>
            </div>
          </div>
        </div>

        {/* Footer Navigation Controls */}
        <div className="px-6 py-4 border-t border-white/10 bg-slate-950/90 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {allCitations.length > 1 && (
              <>
                <button
                  onClick={handlePrev}
                  disabled={!hasPrev}
                  className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-medium text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  <span>Previous Citation</span>
                </button>
                <button
                  onClick={handleNext}
                  disabled={!hasNext}
                  className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-medium text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1"
                >
                  <span>Next Citation</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </>
            )}
          </div>

          <div className="flex items-center gap-3">
            {onOpenDocumentLibrary && (
              <button
                onClick={() => {
                  onClose();
                  onOpenDocumentLibrary(citation.documentId);
                }}
                className="px-3.5 py-1.5 text-xs text-indigo-300 hover:text-white flex items-center gap-1.5"
              >
                <span>Open in Library</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </button>
            )}

            <button
              onClick={onClose}
              className="glow-btn px-5 py-2 text-xs font-semibold rounded-xl"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
