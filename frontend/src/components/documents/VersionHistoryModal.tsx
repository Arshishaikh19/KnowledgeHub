'use client';

import React, { useState, useRef } from 'react';
import {
  X,
  History,
  UploadCloud,
  FileText,
  CheckCircle2,
  Calendar,
  Layers,
  ArrowRight,
  HardDrive,
  Sparkles,
  Loader2,
  RotateCcw,
  Check,
  TrendingUp,
  TrendingDown,
} from 'lucide-react';
import { KnowledgeDocument, DocumentVersion } from '@/types/document';
import { reuploadDocumentVersion, restoreDocumentVersion } from '@/lib/api';

interface VersionHistoryModalProps {
  document: KnowledgeDocument | null;
  onClose: () => void;
  onVersionUpdated: (updatedDoc: KnowledgeDocument) => void;
}

export function VersionHistoryModal({
  document,
  onClose,
  onVersionUpdated,
}: VersionHistoryModalProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showUploadNew, setShowUploadNew] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [summaryNotes, setSummaryNotes] = useState('');
  const [isReuploading, setIsReuploading] = useState(false);
  const [restoringVersion, setRestoringVersion] = useState<number | null>(null);
  const [restoreSuccessMsg, setRestoreSuccessMsg] = useState<string | null>(null);

  if (!document) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleReupload = async () => {
    if (!selectedFile) return;

    setIsReuploading(true);
    try {
      const updated = await reuploadDocumentVersion(
        document.id,
        selectedFile,
        summaryNotes
      );
      setIsReuploading(false);
      if (updated) {
        onVersionUpdated(updated);
        setShowUploadNew(false);
        setSelectedFile(null);
        setSummaryNotes('');
      }
    } catch {
      setIsReuploading(false);
    }
  };

  const handleRestoreVersion = async (verNumber: number) => {
    if (
      !confirm(
        `Roll back to Version ${verNumber}.0? This will make v${verNumber}.0 active and re-synchronize active search chunks.`
      )
    ) {
      return;
    }

    setRestoringVersion(verNumber);
    const updated = await restoreDocumentVersion(document.id, verNumber);
    setRestoringVersion(null);

    if (updated) {
      onVersionUpdated(updated);
      setRestoreSuccessMsg(`Successfully restored Version ${verNumber}.0 as active.`);
      setTimeout(() => setRestoreSuccessMsg(null), 3000);
    }
  };

  const sortedVersions = [...(document.versions || [])].sort(
    (a, b) => b.versionNumber - a.versionNumber
  );

  const activeVersionObj = document.versions?.find((v) => v.isCurrent) || sortedVersions[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl rounded-2xl glass-panel-elevated overflow-hidden border border-white/15 shadow-2xl">
        {/* Header */}
        <div className="px-6 py-5 border-b border-white/10 flex items-center justify-between bg-slate-900/90">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center">
              <History className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white tracking-tight">
                  Document Version History
                </h2>
                <span className="text-[10px] font-mono px-2 py-0.2 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-semibold">
                  Active: v{document.currentVersion}.0
                </span>
              </div>
              <p className="text-xs text-slate-400 truncate max-w-sm">{document.title}</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          {/* Restore Alert Banner */}
          {restoreSuccessMsg && (
            <div className="p-3.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center gap-2 text-xs text-emerald-300 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{restoreSuccessMsg}</span>
            </div>
          )}

          {/* Actions Bar: Trigger New Version Upload */}
          <div className="flex items-center justify-between p-4 rounded-xl glass-card bg-indigo-950/20 border border-indigo-500/30">
            <div>
              <h3 className="text-xs font-bold text-white">Need to upload an updated revision?</h3>
              <p className="text-[11px] text-slate-400">
                New versions cleanly replace old vector chunks without duplicate search matches.
              </p>
            </div>
            <button
              onClick={() => setShowUploadNew(!showUploadNew)}
              className="glow-btn px-4 py-2 text-xs font-semibold rounded-xl shrink-0"
            >
              {showUploadNew ? 'Hide Form' : 'Upload New Version'}
            </button>
          </div>

          {/* New Version Upload Box */}
          {showUploadNew && (
            <div className="p-4 rounded-xl bg-slate-900/90 border border-white/10 space-y-4 animate-in fade-in">
              <h4 className="text-xs font-bold text-indigo-300 uppercase tracking-wider">
                Upload Revision (v{document.currentVersion + 1}.0)
              </h4>

              <div>
                <input
                  ref={fileInputRef}
                  type="file"
                  className="hidden"
                  accept=".pdf,.docx,.doc,.pptx,.ppt,.xlsx,.xls,.csv"
                  onChange={handleFileChange}
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full p-4 rounded-xl border border-dashed border-white/20 hover:border-indigo-400 text-center transition-all bg-slate-950/50"
                >
                  <UploadCloud className="w-6 h-6 text-indigo-400 mx-auto mb-1" />
                  <p className="text-xs font-medium text-white">
                    {selectedFile ? selectedFile.name : 'Select updated file to supersede current version'}
                  </p>
                  <p className="text-[10px] text-slate-400">PDF, DOCX, PPT, XLSX up to 50MB</p>
                </button>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Revision Change Summary / Release Notes
                </label>
                <input
                  type="text"
                  value={summaryNotes}
                  onChange={(e) => setSummaryNotes(e.target.value)}
                  placeholder="e.g. Updated Section 4.2 for Q3 compliance regulations"
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-white/10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-1">
                <button
                  onClick={() => setShowUploadNew(false)}
                  className="px-3 py-1.5 text-xs text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  onClick={handleReupload}
                  disabled={!selectedFile || isReuploading}
                  className="glow-btn px-4 py-1.5 text-xs font-semibold rounded-lg flex items-center gap-1.5 disabled:opacity-50"
                >
                  {isReuploading ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Re-indexing Chunks...</span>
                    </>
                  ) : (
                    <span>Publish Version</span>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Timeline of Revisions */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Revision Timeline ({sortedVersions.length})
            </h4>

            <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-[2px] before:bg-slate-800">
              {sortedVersions.map((ver) => {
                const isCurrent = ver.isCurrent || ver.versionNumber === document.currentVersion;
                const sizeDiffKb = Math.round(
                  (ver.fileSize - (activeVersionObj?.fileSize || ver.fileSize)) / 1024
                );
                const chunkDiff = ver.chunkCount - (activeVersionObj?.chunkCount || ver.chunkCount);

                return (
                  <div key={ver.versionId} className="relative">
                    {/* Timeline bullet */}
                    <div
                      className={`absolute -left-6 top-1 w-5 h-5 rounded-full border flex items-center justify-center ${
                        isCurrent
                          ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300'
                          : 'bg-slate-800 border-white/20 text-slate-400'
                      }`}
                    >
                      <div
                        className={`w-2 h-2 rounded-full ${
                          isCurrent ? 'bg-emerald-400' : 'bg-slate-500'
                        }`}
                      />
                    </div>

                    {/* Version details card */}
                    <div
                      className={`p-4 rounded-xl border transition-all ${
                        isCurrent
                          ? 'bg-slate-900/90 border-emerald-500/30 shadow-lg shadow-emerald-500/5'
                          : 'bg-slate-950/40 border-white/5 hover:border-white/15'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold text-white">
                            v{ver.versionNumber}.0
                          </span>
                          {isCurrent ? (
                            <span className="badge-ready px-2 py-0.2 rounded text-[10px] font-semibold">
                              Active in Vector Search
                            </span>
                          ) : (
                            <span className="text-[10px] text-slate-400 px-2 py-0.2 rounded bg-white/5 border border-white/10 font-mono">
                              Archived
                            </span>
                          )}
                        </div>

                        <span className="text-[11px] text-slate-400 font-mono">
                          {new Date(ver.uploadedAt).toLocaleDateString()}
                        </span>
                      </div>

                      <p className="text-xs text-slate-300 mb-2 font-mono truncate">{ver.fileName}</p>

                      {ver.summary && (
                        <p className="text-xs text-slate-400 bg-black/30 p-2.5 rounded-lg border border-white/5 mb-3">
                          &quot;{ver.summary}&quot;
                        </p>
                      )}

                      <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-white/5 text-[11px] text-slate-400">
                        <div className="flex items-center gap-3">
                          <span className="flex items-center gap-1">
                            <HardDrive className="w-3 h-3 text-cyan-400" />
                            {(ver.fileSize / (1024 * 1024)).toFixed(2)} MB
                          </span>
                          <span className="flex items-center gap-1">
                            <Layers className="w-3 h-3 text-indigo-400" />
                            {ver.chunkCount} Chunks
                          </span>
                          <span>By {ver.uploadedBy}</span>
                        </div>

                        {/* Restore Button (if not current active version) */}
                        {!isCurrent && (
                          <button
                            onClick={() => handleRestoreVersion(ver.versionNumber)}
                            disabled={restoringVersion === ver.versionNumber}
                            className="px-2.5 py-1 rounded-lg bg-indigo-500/15 hover:bg-indigo-500/30 border border-indigo-500/30 text-indigo-300 hover:text-white font-medium transition-all flex items-center gap-1"
                            title="Make this previous version active"
                          >
                            {restoringVersion === ver.versionNumber ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : (
                              <RotateCcw className="w-3 h-3 text-indigo-400" />
                            )}
                            <span>Restore as Active</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-white/10 bg-slate-950/90 flex justify-end">
          <button
            onClick={onClose}
            className="glow-btn px-5 py-2 text-xs font-semibold rounded-xl"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
