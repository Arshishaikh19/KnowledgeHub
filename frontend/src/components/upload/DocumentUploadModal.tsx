'use client';

import React, { useState, useRef, DragEvent, ChangeEvent } from 'react';
import {
  X,
  UploadCloud,
  FileText,
  FileSpreadsheet,
  Presentation,
  CheckCircle2,
  AlertCircle,
  Shield,
  Tag,
  Building,
  Loader2,
  Sparkles,
  Lock,
  Globe,
  Users,
} from 'lucide-react';
import { uploadDocument } from '@/lib/api';
import { KnowledgeDocument } from '@/types/document';

interface DocumentUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUploadSuccess: (newDoc: KnowledgeDocument) => void;
}

const ALLOWED_EXTENSIONS = ['pdf', 'docx', 'doc', 'pptx', 'ppt', 'xlsx', 'xls', 'csv'];
const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

export function DocumentUploadModal({
  isOpen,
  onClose,
  onUploadSuccess,
}: DocumentUploadModalProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Metadata Form State
  const [title, setTitle] = useState('');
  const [department, setDepartment] = useState('Engineering');
  const [tags, setTags] = useState<string[]>(['Internal', '2026']);
  const [currentTagInput, setCurrentTagInput] = useState('');
  const [visibility, setVisibility] = useState<'company' | 'team' | 'private'>('company');

  // Upload progress state
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [progressStatusText, setProgressStatusText] = useState('');
  const [uploadSuccess, setUploadSuccess] = useState(false);

  if (!isOpen) return null;

  const validateAndSetFile = (file: File) => {
    setValidationError(null);
    const extension = file.name.split('.').pop()?.toLowerCase() || '';

    if (!ALLOWED_EXTENSIONS.includes(extension)) {
      setValidationError(
        `Invalid file type ".${extension}". Only PDF, DOCX, PPTX, and XLSX/CSV documents are supported.`
      );
      return false;
    }

    if (file.size > MAX_FILE_SIZE) {
      setValidationError('File size exceeds the 50MB enterprise limit.');
      return false;
    }

    setSelectedFile(file);
    if (!title) {
      const cleanName = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
      setTitle(cleanName);
    }
    return true;
  };

  const handleDrag = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndSetFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      validateAndSetFile(e.target.files[0]);
    }
  };

  const handleAddTag = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && currentTagInput.trim()) {
      e.preventDefault();
      const cleaned = currentTagInput.trim().replace(/^#/, '');
      if (!tags.includes(cleaned)) {
        setTags([...tags, cleaned]);
      }
      setCurrentTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((t) => t !== tagToRemove));
  };

  const getFormatIcon = (fileName: string) => {
    const ext = fileName.split('.').pop()?.toLowerCase();
    if (ext === 'pdf') return <FileText className="w-6 h-6 text-rose-400" />;
    if (ext === 'docx' || ext === 'doc') return <FileText className="w-6 h-6 text-blue-400" />;
    if (ext === 'xlsx' || ext === 'xls' || ext === 'csv')
      return <FileSpreadsheet className="w-6 h-6 text-emerald-400" />;
    if (ext === 'pptx' || ext === 'ppt')
      return <Presentation className="w-6 h-6 text-amber-400" />;
    return <FileText className="w-6 h-6 text-indigo-400" />;
  };

  const handleSubmitUpload = async () => {
    if (!selectedFile) {
      setValidationError('Please select or drop a valid document to upload.');
      return;
    }

    setIsUploading(true);
    setUploadProgress(10);
    setProgressStatusText('Initializing ingestion pipeline...');

    try {
      const createdDoc = await uploadDocument(
        selectedFile,
        {
          title: title.trim() || selectedFile.name,
          department,
          tags,
          visibility,
        },
        (percentage, statusText) => {
          setUploadProgress(percentage);
          setProgressStatusText(statusText);
        }
      );

      setUploadSuccess(true);
      setTimeout(() => {
        onUploadSuccess(createdDoc);
        handleClose();
      }, 1200);
    } catch (err: unknown) {
      setValidationError(err instanceof Error ? err.message : 'Upload failed. Please try again.');
      setIsUploading(false);
    }
  };

  const handleClose = () => {
    if (isUploading && !uploadSuccess) {
      if (!confirm('Upload in progress. Are you sure you want to cancel?')) return;
    }
    setSelectedFile(null);
    setValidationError(null);
    setIsUploading(false);
    setUploadSuccess(false);
    setUploadProgress(0);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl rounded-2xl glass-panel-elevated overflow-hidden border border-white/15 shadow-2xl">
        {/* Header */}
        <div className="px-6 py-5 border-b border-white/10 flex items-center justify-between bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center">
              <UploadCloud className="w-5 h-5 text-indigo-400" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
                Upload Knowledge Document
              </h2>
              <p className="text-xs text-slate-400">
                AI extraction for PDF, DOCX, PPT, and Excel with automated OCR & vector chunking.
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5 max-h-[78vh] overflow-y-auto">
          {/* Validation Error Banner */}
          {validationError && (
            <div className="p-3.5 rounded-xl bg-rose-500/15 border border-rose-500/30 flex items-start gap-3 text-xs text-rose-300 animate-in fade-in">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <div className="flex-1">{validationError}</div>
              <button onClick={() => setValidationError(null)}>
                <X className="w-3.5 h-3.5 text-rose-400" />
              </button>
            </div>
          )}

          {/* Drag and Drop Zone */}
          {!selectedFile ? (
            <div
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`relative cursor-pointer rounded-2xl border-2 border-dashed p-8 text-center transition-all ${
                dragActive
                  ? 'border-indigo-400 bg-indigo-500/15 scale-[1.01]'
                  : 'border-white/15 hover:border-indigo-500/50 hover:bg-slate-900/60 bg-slate-900/40'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                accept=".pdf,.docx,.doc,.pptx,.ppt,.xlsx,.xls,.csv"
                onChange={handleFileChange}
              />

              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-tr from-indigo-500/20 to-cyan-500/20 border border-indigo-500/30 flex items-center justify-center">
                <UploadCloud className="w-8 h-8 text-indigo-400 animate-bounce" />
              </div>

              <h3 className="text-sm font-semibold text-white mb-1">
                Drag and drop your file here, or{' '}
                <span className="text-indigo-400 underline underline-offset-2">browse files</span>
              </h3>
              <p className="text-xs text-slate-400 mb-4">
                Supports PDF, DOCX, PPT, XLSX up to 50MB
              </p>

              {/* Supported Format Pills */}
              <div className="flex items-center justify-center gap-2">
                <span className="px-2.5 py-1 rounded-md bg-rose-500/10 text-rose-400 border border-rose-500/20 text-[11px] font-medium flex items-center gap-1">
                  <FileText className="w-3 h-3" /> PDF
                </span>
                <span className="px-2.5 py-1 rounded-md bg-blue-500/10 text-blue-400 border border-blue-500/20 text-[11px] font-medium flex items-center gap-1">
                  <FileText className="w-3 h-3" /> DOCX
                </span>
                <span className="px-2.5 py-1 rounded-md bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[11px] font-medium flex items-center gap-1">
                  <Presentation className="w-3 h-3" /> PPTX
                </span>
                <span className="px-2.5 py-1 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[11px] font-medium flex items-center gap-1">
                  <FileSpreadsheet className="w-3 h-3" /> XLSX
                </span>
              </div>
            </div>
          ) : (
            /* Selected File Preview Box */
            <div className="p-4 rounded-xl glass-card flex items-center justify-between border border-indigo-500/30 bg-indigo-950/20">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-xl bg-slate-800 flex items-center justify-center border border-white/10">
                  {getFormatIcon(selectedFile.name)}
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-white">{selectedFile.name}</h4>
                  <p className="text-xs text-slate-400">
                    {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB • Ready for ingestion
                  </p>
                </div>
              </div>
              {!isUploading && (
                <button
                  onClick={() => setSelectedFile(null)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors text-xs font-medium"
                >
                  Change
                </button>
              )}
            </div>
          )}

          {/* Upload Progress Bar (Live) */}
          {isUploading && (
            <div className="space-y-2 p-4 rounded-xl bg-slate-900/80 border border-indigo-500/30 animate-in fade-in">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-300 font-medium flex items-center gap-2">
                  {uploadSuccess ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  ) : (
                    <Loader2 className="w-4 h-4 text-indigo-400 animate-spin" />
                  )}
                  {progressStatusText}
                </span>
                <span className="font-mono text-indigo-300 font-bold">{uploadProgress}%</span>
              </div>

              <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-emerald-400 transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          )}

          {/* Metadata Fields Form */}
          <div className="space-y-4 pt-1">
            {/* Title */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Knowledge Document Title
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Annual Leave Policy 2026"
                disabled={isUploading}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900/80 border border-white/10 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
              />
            </div>

            {/* Department & Visibility Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Department */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                  <Building className="w-3.5 h-3.5 text-indigo-400" />
                  Department
                </label>
                <select
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  disabled={isUploading}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900/80 border border-white/10 text-sm text-white focus:outline-none focus:border-indigo-500 transition-colors"
                >
                  <option value="Engineering">Engineering</option>
                  <option value="Legal">Legal</option>
                  <option value="HR">HR & People</option>
                  <option value="Finance">Finance</option>
                  <option value="Product">Product</option>
                  <option value="Operations">Operations</option>
                  <option value="General">General</option>
                </select>
              </div>

              {/* Visibility Permission */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5 text-indigo-400" />
                  Access Permission Level
                </label>
                <div className="grid grid-cols-3 gap-1.5">
                  <button
                    type="button"
                    onClick={() => setVisibility('company')}
                    disabled={isUploading}
                    className={`px-2 py-2 rounded-lg text-xs font-medium border flex flex-col items-center gap-1 transition-all ${
                      visibility === 'company'
                        ? 'bg-indigo-600/20 border-indigo-500 text-white font-semibold'
                        : 'bg-slate-900/60 border-white/10 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <Globe className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Company</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setVisibility('team')}
                    disabled={isUploading}
                    className={`px-2 py-2 rounded-lg text-xs font-medium border flex flex-col items-center gap-1 transition-all ${
                      visibility === 'team'
                        ? 'bg-indigo-600/20 border-indigo-500 text-white font-semibold'
                        : 'bg-slate-900/60 border-white/10 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <Users className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Team</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setVisibility('private')}
                    disabled={isUploading}
                    className={`px-2 py-2 rounded-lg text-xs font-medium border flex flex-col items-center gap-1 transition-all ${
                      visibility === 'private'
                        ? 'bg-indigo-600/20 border-indigo-500 text-white font-semibold'
                        : 'bg-slate-900/60 border-white/10 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <Lock className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Private</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Tags Input */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5 text-indigo-400" />
                Knowledge Tags (Press Enter to add)
              </label>

              <div className="p-2 rounded-xl bg-slate-900/80 border border-white/10 flex flex-wrap items-center gap-1.5 min-h-[44px]">
                {tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-indigo-500/15 border border-indigo-500/30 text-indigo-300 text-xs font-medium"
                  >
                    #{tag}
                    {!isUploading && (
                      <button
                        type="button"
                        onClick={() => handleRemoveTag(tag)}
                        className="hover:text-white"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </span>
                ))}

                <input
                  type="text"
                  value={currentTagInput}
                  onChange={(e) => setCurrentTagInput(e.target.value)}
                  onKeyDown={handleAddTag}
                  placeholder={tags.length === 0 ? 'Type tag and press Enter...' : ''}
                  disabled={isUploading}
                  className="flex-1 min-w-[120px] bg-transparent text-xs text-white placeholder-slate-500 focus:outline-none px-1"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-white/10 bg-slate-950/80 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            <span>Automatic vector embedding on upload</span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleClose}
              disabled={isUploading && !uploadSuccess}
              className="px-4 py-2 text-xs font-medium text-slate-300 hover:text-white transition-colors"
            >
              Cancel
            </button>

            <button
              onClick={handleSubmitUpload}
              disabled={!selectedFile || isUploading}
              className="glow-btn px-5 py-2 text-xs font-semibold rounded-xl flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isUploading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <UploadCloud className="w-3.5 h-3.5" />
                  <span>Start Ingestion</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
