'use client';

import React from 'react';
import {
  X,
  FileText,
  Layers,
  Sparkles,
  Shield,
  Clock,
  Calendar,
  User,
  HardDrive,
  Cpu,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { KnowledgeDocument } from '@/types/document';

interface DocumentDetailsModalProps {
  document: KnowledgeDocument | null;
  onClose: () => void;
  onOpenShare: (doc: KnowledgeDocument) => void;
  onOpenVersions: (doc: KnowledgeDocument) => void;
}

export function DocumentDetailsModal({
  document,
  onClose,
  onOpenShare,
  onOpenVersions,
}: DocumentDetailsModalProps) {
  if (!document) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl rounded-2xl glass-panel-elevated overflow-hidden border border-white/15 shadow-2xl">
        {/* Header */}
        <div className="px-6 py-5 border-b border-white/10 flex items-start justify-between bg-slate-900/90">
          <div className="space-y-1 pr-6">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                {document.fileFormat.toUpperCase()}
              </span>
              <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-white/5 border border-white/10 text-slate-300">
                Version {document.currentVersion}.0
              </span>
              {document.ocrProcessed && (
                <span className="text-[10px] px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                  OCR Extracted
                </span>
              )}
            </div>
            <h2 className="text-lg font-bold text-white tracking-tight">{document.title}</h2>
            <p className="text-xs text-slate-400 font-mono">{document.originalFileName}</p>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          {/* Status Alert Banner */}
          <div className="p-4 rounded-xl glass-card flex items-start gap-3 bg-slate-900/60">
            {document.status === 'ready' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            ) : document.status === 'processing' ? (
              <Clock className="w-5 h-5 text-amber-400 animate-spin shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
            )}
            <div className="space-y-0.5">
              <p className="text-xs font-semibold text-white">
                Pipeline Status: <span className="capitalize">{document.status}</span>
              </p>
              <p className="text-xs text-slate-300">
                {document.statusMessage || 'Vector embedding and metadata indexing completed.'}
              </p>
            </div>
          </div>

          {/* Quick Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 rounded-xl bg-slate-900/60 border border-white/5">
              <span className="text-[11px] text-slate-400 block mb-1">Vector Chunks</span>
              <div className="flex items-center gap-1.5 text-sm font-bold text-white">
                <Layers className="w-4 h-4 text-indigo-400" />
                <span>{document.totalChunks} Chunks</span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-900/60 border border-white/5">
              <span className="text-[11px] text-slate-400 block mb-1">File Size</span>
              <div className="flex items-center gap-1.5 text-sm font-bold text-white">
                <HardDrive className="w-4 h-4 text-cyan-400" />
                <span>{(document.fileSize / (1024 * 1024)).toFixed(2)} MB</span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-900/60 border border-white/5">
              <span className="text-[11px] text-slate-400 block mb-1">Department</span>
              <div className="flex items-center gap-1.5 text-sm font-bold text-white">
                <Shield className="w-4 h-4 text-purple-400" />
                <span>{document.department}</span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-900/60 border border-white/5">
              <span className="text-[11px] text-slate-400 block mb-1">Uploaded Date</span>
              <div className="flex items-center gap-1.5 text-sm font-bold text-white">
                <Calendar className="w-4 h-4 text-emerald-400" />
                <span>{new Date(document.uploadedAt).toLocaleDateString()}</span>
              </div>
            </div>
          </div>

          {/* Sample Vector Chunks Preview */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-indigo-400" />
                <span>Parsed Semantic Chunks Preview</span>
              </h3>
              <span className="text-[11px] text-slate-400">
                Chunk Size: ~500 tokens • 50 token overlap
              </span>
            </div>

            {document.sampleChunks && document.sampleChunks.length > 0 ? (
              <div className="space-y-3">
                {document.sampleChunks.map((chunk, idx) => (
                  <div
                    key={chunk.chunkId || idx}
                    className="p-4 rounded-xl bg-slate-950/80 border border-indigo-500/20 space-y-2"
                  >
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-semibold text-indigo-300">
                        {chunk.sectionTitle || `Section Chunk #${idx + 1}`}
                      </span>
                      {chunk.pageNumber && (
                        <span className="px-2 py-0.5 rounded bg-white/5 border border-white/10 text-slate-400 font-mono">
                          Page {chunk.pageNumber}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed font-mono bg-slate-900/90 p-3 rounded-lg border border-white/5">
                      &quot;{chunk.content}&quot;
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-6 text-center rounded-xl bg-slate-900/40 border border-white/5 text-xs text-slate-400">
                Chunks are currently being indexed by the BullMQ background worker.
              </div>
            )}
          </div>

          {/* Tags */}
          <div className="space-y-2">
            <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Categorized Knowledge Tags
            </h4>
            <div className="flex flex-wrap gap-1.5">
              {document.tags.map((tag) => (
                <span
                  key={tag}
                  className="px-2.5 py-1 rounded-md text-xs font-medium bg-indigo-500/15 border border-indigo-500/30 text-indigo-300"
                >
                  #{tag}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-white/10 bg-slate-950/90 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                onClose();
                onOpenShare(document);
              }}
              className="px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-medium text-slate-200 transition-colors"
            >
              Manage Sharing & Permissions
            </button>
            <button
              onClick={() => {
                onClose();
                onOpenVersions(document);
              }}
              className="px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-medium text-slate-200 transition-colors"
            >
              Version Timeline ({document.versions?.length || 1})
            </button>
          </div>

          <button
            onClick={onClose}
            className="glow-btn px-5 py-2 text-xs font-semibold rounded-xl"
          >
            Close Details
          </button>
        </div>
      </div>
    </div>
  );
}
