'use client';

import React from 'react';
import {
  FileText,
  FileSpreadsheet,
  Presentation,
  Share2,
  History,
  Trash2,
  Eye,
  AlertCircle,
  Clock,
} from 'lucide-react';
import { KnowledgeDocument, FileFormat, DocumentStatus } from '@/types/document';

interface DocumentTableProps {
  documents: KnowledgeDocument[];
  onViewDetails: (doc: KnowledgeDocument) => void;
  onShare: (doc: KnowledgeDocument) => void;
  onViewVersions: (doc: KnowledgeDocument) => void;
  onDelete: (docId: string) => void;
}

export function DocumentTable({
  documents,
  onViewDetails,
  onShare,
  onViewVersions,
  onDelete,
}: DocumentTableProps) {
  const getFormatIcon = (format: FileFormat) => {
    switch (format) {
      case 'pdf':
        return <FileText className="w-4 h-4 text-rose-400" />;
      case 'docx':
        return <FileText className="w-4 h-4 text-blue-400" />;
      case 'pptx':
        return <Presentation className="w-4 h-4 text-amber-400" />;
      case 'xlsx':
      case 'csv':
        return <FileSpreadsheet className="w-4 h-4 text-emerald-400" />;
      default:
        return <FileText className="w-4 h-4 text-slate-400" />;
    }
  };

  const getStatusBadge = (status: DocumentStatus) => {
    switch (status) {
      case 'ready':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            Ready
          </span>
        );
      case 'processing':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <Clock className="w-3 h-3 text-amber-400 animate-spin" />
            Processing
          </span>
        );
      case 'failed':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-rose-500/10 text-rose-400 border border-rose-500/20">
            <AlertCircle className="w-3 h-3" />
            Failed
          </span>
        );
    }
  };

  return (
    <div className="rounded-xl bg-slate-800/80 border border-slate-700 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="border-b border-slate-700 bg-slate-900/60 text-slate-400 uppercase font-medium text-[10px] tracking-wider">
            <tr>
              <th className="px-4 py-3">Document</th>
              <th className="px-3 py-3">Department</th>
              <th className="px-3 py-3">Status</th>
              <th className="px-3 py-3">Version</th>
              <th className="px-3 py-3">Size</th>
              <th className="px-3 py-3">Date</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-700/60 text-slate-300">
            {documents.map((doc) => (
              <tr
                key={doc.id || (doc as any)._id}
                className="hover:bg-slate-700/30 transition-colors group cursor-pointer"
                onClick={() => onViewDetails(doc)}
              >
                {/* Title & icon */}
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-md bg-slate-900 border border-slate-700 flex items-center justify-center shrink-0">
                      {getFormatIcon(doc.fileFormat)}
                    </div>
                    <div className="max-w-xs md:max-w-md">
                      <p className="font-medium text-white group-hover:text-blue-400 transition-colors truncate">
                        {doc.title}
                      </p>
                      <p className="text-[11px] text-slate-400 truncate">
                        {doc.originalFileName}
                      </p>
                    </div>
                  </div>
                </td>

                {/* Department */}
                <td className="px-3 py-3">
                  <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-slate-700 text-slate-300">
                    {doc.department || 'General'}
                  </span>
                </td>

                {/* Status */}
                <td className="px-3 py-3">{getStatusBadge(doc.status)}</td>

                {/* Version */}
                <td className="px-3 py-3 text-slate-400">
                  v{doc.currentVersion || 1}.0
                </td>

                {/* File size */}
                <td className="px-3 py-3 text-slate-400">
                  {(doc.fileSize / (1024 * 1024)).toFixed(1)} MB
                </td>

                {/* Date */}
                <td className="px-3 py-3 text-slate-400 text-[11px]">
                  {(() => {
                    const raw = doc.uploadedAt || (doc as any).createdAt || new Date();
                    const d = new Date(raw);
                    return !isNaN(d.getTime())
                      ? d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                      : 'Recently';
                  })()}
                </td>

                {/* Actions */}
                <td
                  className="px-4 py-3 text-right"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="flex items-center justify-end gap-1">
                    <button
                      onClick={() => onViewDetails(doc)}
                      title="View Details"
                      className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => onShare(doc)}
                      title="Permissions"
                      className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
                    >
                      <Share2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => onViewVersions(doc)}
                      title="Version History"
                      className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
                    >
                      <History className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => onDelete(doc.id || (doc as any)._id)}
                      title="Delete"
                      className="p-1 rounded text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
