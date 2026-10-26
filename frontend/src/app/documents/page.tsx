'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useSession } from 'next-auth/react';
import {
  FolderOpen,
  Search,
  Plus,
  LayoutGrid,
  List,
  Upload,
  RefreshCw,
  Shield,
} from 'lucide-react';
import { Navbar } from '@/components/Navbar';
import { Sidebar } from '@/components/Sidebar';
import { DocumentCard } from '@/components/documents/DocumentCard';
import { DocumentTable } from '@/components/documents/DocumentTable';
import { DocumentUploadModal } from '@/components/upload/DocumentUploadModal';
import { DocumentDetailsModal } from '@/components/documents/DocumentDetailsModal';
import { ShareModal } from '@/components/documents/ShareModal';
import { VersionHistoryModal } from '@/components/documents/VersionHistoryModal';
import { PermissionsMatrixModal } from '@/components/permissions/PermissionsMatrixModal';
import { fetchDocuments, deleteDocument } from '@/lib/api';
import { KnowledgeDocument, DocumentStatus, FileFormat } from '@/types/document';

export default function DocumentsPage() {
  const { data: session } = useSession();
  const [documents, setDocuments] = useState<KnowledgeDocument[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter & Search states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<DocumentStatus | 'all'>('all');
  const [selectedDepartment, setSelectedDepartment] = useState('all');
  const [selectedFormat, setSelectedFormat] = useState<FileFormat | 'all'>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  // Modal active states
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isPermissionsMatrixOpen, setIsPermissionsMatrixOpen] = useState(false);
  const [selectedDocForDetails, setSelectedDocForDetails] = useState<KnowledgeDocument | null>(null);
  const [selectedDocForShare, setSelectedDocForShare] = useState<KnowledgeDocument | null>(null);
  const [selectedDocForVersions, setSelectedDocForVersions] = useState<KnowledgeDocument | null>(null);

  // Load documents
  const loadDocs = async () => {
    setLoading(true);
    const data = await fetchDocuments();
    setDocuments(data);
    setLoading(false);
  };

  useEffect(() => {
    loadDocs();
  }, []);

  // Compute status counts & distinct filters
  const statusCounts = useMemo(() => {
    return {
      all: documents.length,
      ready: documents.filter((d) => d.status === 'ready').length,
      processing: documents.filter((d) => d.status === 'processing').length,
      failed: documents.filter((d) => d.status === 'failed').length,
    };
  }, [documents]);

  const departments = useMemo(() => {
    const set = new Set<string>();
    documents.forEach((d) => {
      if (d.department) set.add(d.department);
    });
    return Array.from(set);
  }, [documents]);

  const totalStorageMb = useMemo(() => {
    const bytes = documents.reduce((acc, doc) => acc + (doc.fileSize || 0), 0);
    return (bytes / (1024 * 1024)).toFixed(1);
  }, [documents]);

  // Filtered documents list
  const filteredDocuments = useMemo(() => {
    return documents.filter((doc) => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = (doc.title || '').toLowerCase().includes(q);
        const matchFile = (doc.originalFileName || '').toLowerCase().includes(q);
        const matchDept = (doc.department || '').toLowerCase().includes(q);
        const matchTag = (doc.tags || []).some((t) => t.toLowerCase().includes(q));
        if (!matchTitle && !matchFile && !matchDept && !matchTag) return false;
      }

      if (selectedStatus !== 'all' && doc.status !== selectedStatus) return false;
      if (selectedDepartment !== 'all' && doc.department !== selectedDepartment) return false;
      if (selectedFormat !== 'all' && doc.fileFormat !== selectedFormat) return false;

      return true;
    });
  }, [documents, searchQuery, selectedStatus, selectedDepartment, selectedFormat]);

  const handleDelete = async (docId: string) => {
    if (confirm('Are you sure you want to delete this document?')) {
      await deleteDocument(docId);
      setDocuments((prev) => prev.filter((d) => d.id !== docId && (d as any)._id !== docId));
    }
  };

  const handleUploadSuccess = (newDoc: KnowledgeDocument) => {
    setDocuments((prev) => [newDoc, ...prev]);
  };

  const handleDocumentUpdated = (updatedDoc: KnowledgeDocument) => {
    setDocuments((prev) =>
      prev.map((d) =>
        d.id === updatedDoc.id || (d as any)._id === (updatedDoc as any)._id
          ? updatedDoc
          : d
      )
    );
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-900 text-slate-100">
      <Navbar onOpenUpload={() => setIsUploadOpen(true)} />

      <main className="flex-1 w-full px-6 lg:px-8 py-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Documents</h1>
            <p className="text-sm text-slate-400 mt-0.5">
              Upload, organize, and manage your team&apos;s knowledge base.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={() => setIsPermissionsMatrixOpen(true)}
              className="px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-medium flex items-center gap-1.5 transition-colors"
            >
              <Shield className="w-3.5 h-3.5 text-slate-400" />
              <span>Permissions</span>
            </button>

            <button
              onClick={loadDocs}
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 transition-colors"
              title="Refresh document list"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>

            <button
              onClick={() => setIsUploadOpen(true)}
              className="btn-primary flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-lg"
            >
              <Plus className="w-4 h-4" />
              <span>Upload Document</span>
            </button>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
          <div className="p-4 rounded-xl bg-slate-800/80 border border-slate-700/80 hover:border-slate-600 shadow-sm hover:shadow transition-all">
            <span className="text-xs text-slate-400 font-medium">Total Documents</span>
            <div className="text-2xl font-bold text-white mt-1">{documents.length}</div>
          </div>
          <div className="p-4 rounded-xl bg-slate-800/80 border border-slate-700/80 hover:border-slate-600 shadow-sm hover:shadow transition-all">
            <span className="text-xs text-slate-400 font-medium">Ready</span>
            <div className="text-2xl font-bold text-emerald-400 mt-1">{statusCounts.ready}</div>
          </div>
          <div className="p-4 rounded-xl bg-slate-800/80 border border-slate-700/80 hover:border-slate-600 shadow-sm hover:shadow transition-all">
            <span className="text-xs text-slate-400 font-medium">Processing</span>
            <div className="text-2xl font-bold text-amber-400 mt-1">{statusCounts.processing}</div>
          </div>
          <div className="p-4 rounded-xl bg-slate-800/80 border border-slate-700/80 hover:border-slate-600 shadow-sm hover:shadow transition-all">
            <span className="text-xs text-slate-400 font-medium">Failed</span>
            <div className="text-2xl font-bold text-rose-400 mt-1">{statusCounts.failed}</div>
          </div>
        </div>

        {/* Two Column Layout: Left Sidebar + Right Main Workspace */}
        <div className="flex items-start gap-6 pt-2">
          {/* Left Side Info & Filter Cards */}
          <Sidebar
            selectedStatus={selectedStatus}
            onSelectStatus={setSelectedStatus}
            selectedDepartment={selectedDepartment}
            onSelectDepartment={setSelectedDepartment}
            statusCounts={statusCounts}
            departments={departments}
            totalStorageMb={totalStorageMb}
          />

          {/* Right Main Content */}
          <div className="flex-1 min-w-0 space-y-4">
            {/* Search & Filter Bar */}
            <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700/80 flex flex-col md:flex-row md:items-center justify-between gap-3">
              {/* Search box */}
              <div className="flex-1 relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search documents by title, department, or tags..."
                  className="w-full pl-9 pr-4 py-2 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-slate-500"
                />
              </div>

              {/* Filters */}
              <div className="flex flex-wrap items-center gap-2 text-xs">
                {/* Format Filter */}
                <select
                  value={selectedFormat}
                  onChange={(e) => setSelectedFormat(e.target.value as any)}
                  className="px-2.5 py-2 rounded-lg bg-slate-900 border border-slate-700 text-slate-200 focus:outline-none"
                >
                  <option value="all">All Formats</option>
                  <option value="pdf">PDF</option>
                  <option value="docx">Word (DOCX)</option>
                  <option value="pptx">PowerPoint (PPTX)</option>
                  <option value="xlsx">Excel (XLSX)</option>
                </select>

                {/* View Mode Toggle */}
                <div className="flex items-center rounded-lg bg-slate-900 border border-slate-700 p-0.5">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`p-1.5 rounded-md transition-colors ${
                      viewMode === 'grid'
                        ? 'sidebar-pill-active'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                    title="Grid View"
                  >
                    <LayoutGrid className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setViewMode('table')}
                    className={`p-1.5 rounded-md transition-colors ${
                      viewMode === 'table'
                        ? 'sidebar-pill-active'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                    title="Table View"
                  >
                    <List className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Documents Grid / Table / Empty State */}
            {filteredDocuments.length === 0 ? (
              <div className="p-12 text-center rounded-xl bg-slate-800/40 border border-slate-700/80 space-y-4">
                <div className="w-12 h-12 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-400 mx-auto">
                  <FolderOpen className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-sm font-semibold text-white">No documents found</h3>
                  <p className="text-xs text-slate-400 max-w-sm mx-auto">
                    {searchQuery || selectedStatus !== 'all' || selectedDepartment !== 'all'
                      ? 'No documents matched your filter criteria.'
                      : 'Your document library is empty. Upload your first PDF, Word, Excel, or PowerPoint file to get started.'}
                  </p>
                </div>
                <button
                  onClick={() => setIsUploadOpen(true)}
                  className="btn-primary inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Upload a Document</span>
                </button>
              </div>
            ) : viewMode === 'grid' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredDocuments.map((doc) => (
                  <DocumentCard
                    key={doc.id || (doc as any)._id}
                    document={doc}
                    onViewDetails={(d) => setSelectedDocForDetails(d)}
                    onShare={(d) => setSelectedDocForShare(d)}
                    onViewVersions={(d) => setSelectedDocForVersions(d)}
                    onDelete={handleDelete}
                  />
                ))}
              </div>
            ) : (
              <DocumentTable
                documents={filteredDocuments}
                onViewDetails={(d) => setSelectedDocForDetails(d)}
                onShare={(d) => setSelectedDocForShare(d)}
                onViewVersions={(d) => setSelectedDocForVersions(d)}
                onDelete={handleDelete}
              />
            )}
          </div>
        </div>
      </main>

      {/* Modals */}
      <DocumentUploadModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        onUploadSuccess={handleUploadSuccess}
      />

      <DocumentDetailsModal
        document={selectedDocForDetails}
        onClose={() => setSelectedDocForDetails(null)}
        onOpenShare={(d) => {
          setSelectedDocForDetails(null);
          setSelectedDocForShare(d);
        }}
        onOpenVersions={(d) => {
          setSelectedDocForDetails(null);
          setSelectedDocForVersions(d);
        }}
      />

      <ShareModal
        document={selectedDocForShare}
        onClose={() => setSelectedDocForShare(null)}
        onUpdated={handleDocumentUpdated}
      />

      <VersionHistoryModal
        document={selectedDocForVersions}
        onClose={() => setSelectedDocForVersions(null)}
        onVersionUpdated={handleDocumentUpdated}
      />

      <PermissionsMatrixModal
        isOpen={isPermissionsMatrixOpen}
        onClose={() => setIsPermissionsMatrixOpen(false)}
      />
    </div>
  );
}
