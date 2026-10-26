'use client';

import React, { useState } from 'react';
import {
  FileText,
  FileSpreadsheet,
  Presentation,
  MoreVertical,
  Share2,
  History,
  Trash2,
  Eye,
  AlertCircle,
  Clock,
} from 'lucide-react';
import { KnowledgeDocument, FileFormat, DocumentStatus } from '@/types/document';

interface DocumentCardProps {
  document: KnowledgeDocument;
  onViewDetails: (doc: KnowledgeDocument) => void;
  onShare: (doc: KnowledgeDocument) => void;
  onViewVersions: (doc: KnowledgeDocument) => void;
  onDelete: (docId: string) => void;
}

export function DocumentCard({
  document,
  onViewDetails,
  onShare,
  onViewVersions,
  onDelete,
}: DocumentCardProps) {
  const [menuOpen, setMenuOpen] = useState(false);

  const getFormatBadge = (format: FileFormat) => {
    switch (format) {
      case 'pdf':
        return { icon: FileText, color: 'text-rose-400', bg: 'bg-rose-500/10 text-rose-300', label: 'PDF' };
      case 'docx':
        return { icon: FileText, color: 'text-blue-400', bg: 'bg-blue-500/10 text-blue-300', label: 'DOCX' };
      case 'pptx':
        return { icon: Presentation, color: 'text-amber-400', bg: 'bg-amber-500/10 text-amber-300', label: 'PPTX' };
      case 'xlsx':
      case 'csv':
        return { icon: FileSpreadsheet, color: 'text-emerald-400', bg: 'bg-emerald-500/10 text-emerald-300', label: 'EXCEL' };
      default:
        return { icon: FileText, color: 'text-slate-400', bg: 'bg-slate-500/10 text-slate-300', label: 'DOC' };
    }
  };

  const getStatusBadge = (status: DocumentStatus) => {
    switch (status) {
      case 'ready':
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            Ready
          </span>
        );
      case 'processing':
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <Clock className="w-3 h-3 text-amber-400 animate-spin" />
            Processing
          </span>
        );
      case 'failed':
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium bg-rose-500/10 text-rose-400 border border-rose-500/20">
            <AlertCircle className="w-3 h-3" />
            Failed
          </span>
        );
    }
  };

  const formatMeta = getFormatBadge(document.fileFormat);
  const FormatIcon = formatMeta.icon;

  const rawDate = document.uploadedAt || (document as any).createdAt || new Date();
  const dateObj = new Date(rawDate);
  const formattedDate = !isNaN(dateObj.getTime())
    ? dateObj.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : 'Recently';

  const fileSizeMb = (document.fileSize / (1024 * 1024)).toFixed(1);

  return (
    <div className="p-4 rounded-xl bg-slate-800/80 border border-slate-700/80 hover:border-slate-500 shadow-sm hover:shadow-md transition-all flex flex-col justify-between h-full group">
      <div>
        {/* Header */}
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-slate-900 border border-slate-700 flex items-center justify-center">
              <FormatIcon className={`w-4 h-4 ${formatMeta.color}`} />
            </div>
            <div>
              <span className="text-[11px] font-semibold text-slate-300">
                {formatMeta.label}
              </span>
              <span className="text-[11px] text-slate-500 ml-1.5">
                v{document.currentVersion || 1}.0
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1">
            {getStatusBadge(document.status)}

            {/* Menu */}
            <div className="relative">
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
              >
                <MoreVertical className="w-4 h-4" />
              </button>

              {menuOpen && (
                <div
                  className="absolute right-0 mt-1 w-40 rounded-lg bg-slate-800 border border-slate-700 p-1 shadow-xl z-20"
                  onClick={() => setMenuOpen(false)}
                >
                  <button
                    onClick={() => onViewDetails(document)}
                    className="w-full flex items-center gap-2 px-2.5 py-1.5 text-xs text-slate-200 hover:bg-slate-700 rounded-md transition-colors"
                  >
                    <Eye className="w-3.5 h-3.5 text-blue-400" />
                    Details
                  </button>
                  <button
                    onClick={() => onShare(document)}
                    className="w-full flex items-center gap-2 px-2.5 py-1.5 text-xs text-slate-200 hover:bg-slate-700 rounded-md transition-colors"
                  >
                    <Share2 className="w-3.5 h-3.5 text-slate-400" />
                    Permissions
                  </button>
                  <button
                    onClick={() => onViewVersions(document)}
                    className="w-full flex items-center gap-2 px-2.5 py-1.5 text-xs text-slate-200 hover:bg-slate-700 rounded-md transition-colors"
                  >
                    <History className="w-3.5 h-3.5 text-slate-400" />
                    Version History
                  </button>
                  <div className="my-1 border-t border-slate-700" />
                  <button
                    onClick={() => onDelete(document.id || (document as any)._id)}
                    className="w-full flex items-center gap-2 px-2.5 py-1.5 text-xs text-rose-400 hover:bg-rose-500/10 rounded-md transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Delete
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Title */}
        <h3
          onClick={() => onViewDetails(document)}
          className="text-sm font-semibold text-white group-hover:text-blue-400 cursor-pointer transition-colors line-clamp-2 mb-1"
        >
          {document.title}
        </h3>

        <p className="text-xs text-slate-400 truncate mb-3">
          {document.originalFileName}
        </p>

        {/* Tags */}
        <div className="flex flex-wrap gap-1.5 mb-3">
          {document.department && (
            <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-slate-700/60 text-slate-300">
              {document.department}
            </span>
          )}
          {(document.tags || []).slice(0, 2).map((tag) => (
            <span
              key={tag}
              className="px-2 py-0.5 rounded text-[11px] bg-slate-900/60 text-slate-400 border border-slate-700"
            >
              #{tag}
            </span>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="pt-2.5 border-t border-slate-700/60 flex items-center justify-between text-xs text-slate-400">
        <span>{fileSizeMb} MB</span>
        <span>{formattedDate}</span>
      </div>
    </div>
  );
}
