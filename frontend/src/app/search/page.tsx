'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Search,
  FileText,
  FileSpreadsheet,
  Presentation,
  ArrowRight,
  Loader2,
} from 'lucide-react';
import { Navbar } from '@/components/Navbar';
import { SourceCitationModal } from '@/components/chat/SourceCitationModal';
import { Citation } from '@/types/chat';
import { FileFormat } from '@/types/document';
import { API_BASE_URL } from '@/lib/api';

interface SearchResult {
  id: string;
  documentId: string;
  documentTitle: string;
  originalFileName: string;
  fileFormat: FileFormat;
  department: string;
  pageNumber?: number;
  sectionTitle: string;
  content: string;
  similarityScore: number;
}

export default function SearchPage() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [selectedDept, setSelectedDept] = useState('all');
  const [selectedFormat, setSelectedFormat] = useState<FileFormat | 'all'>('all');
  const [activeCitation, setActiveCitation] = useState<Citation | null>(null);

  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const executeSearch = async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setResults([]);
      setSearched(false);
      return;
    }

    setLoading(true);
    setSearched(true);
    try {
      const params = new URLSearchParams({
        q: searchQuery.trim(),
        department: selectedDept,
        format: selectedFormat,
      });

      const res = await fetch(`${API_BASE_URL}/search?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setResults(data.results || []);
      } else {
        setResults([]);
      }
    } catch (err) {
      console.error('[Search] Failed to search:', err);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (query.trim()) {
      const timer = setTimeout(() => {
        executeSearch(query);
      }, 300);
      return () => clearTimeout(timer);
    } else {
      setResults([]);
      setSearched(false);
    }
  }, [query, selectedDept, selectedFormat]);

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

  const handleOpenSourceViewer = (item: SearchResult) => {
    const cite: Citation = {
      id: item.id,
      citationIndex: 1,
      documentId: item.documentId,
      documentTitle: item.documentTitle,
      originalFileName: item.originalFileName,
      fileFormat: item.fileFormat,
      pageNumber: item.pageNumber,
      sectionTitle: item.sectionTitle,
      excerpt: item.content,
      similarityScore: item.similarityScore,
      department: item.department,
    };
    setActiveCitation(cite);
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-900 text-slate-100">
      <Navbar />

      <main className="flex-1 w-full px-6 lg:px-8 py-6 space-y-6">
        {/* Header */}
        <div className="pb-2">
          <h1 className="text-2xl font-bold text-white tracking-tight">Search</h1>
          <p className="text-sm text-slate-400 mt-0.5">
            Search for policies, specifications, meeting notes, and knowledge across your organization.
          </p>
        </div>

        {/* Search Box */}
        <div className="p-3 rounded-xl bg-slate-800 border border-slate-700 shadow-sm space-y-3">
          <div className="flex items-center gap-2.5">
            <Search className="w-4 h-4 text-slate-400 ml-1 shrink-0" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search across all uploaded documents..."
              className="w-full bg-transparent text-sm text-white placeholder-slate-500 focus:outline-none"
            />
            {loading && <Loader2 className="w-4 h-4 text-blue-400 animate-spin mr-1" />}
            {query && !loading && (
              <button
                onClick={() => setQuery('')}
                className="px-2 py-1 text-xs text-slate-400 hover:text-white"
              >
                Clear
              </button>
            )}
          </div>

          {/* Quick Filters */}
          <div className="flex flex-wrap items-center gap-3 pt-2.5 border-t border-slate-700/60 text-xs text-slate-300">
            <div className="flex items-center gap-1.5">
              <span className="text-slate-400">Department:</span>
              <select
                value={selectedDept}
                onChange={(e) => setSelectedDept(e.target.value)}
                className="px-2 py-1 rounded bg-slate-900 border border-slate-700 text-xs text-slate-200 focus:outline-none"
              >
                <option value="all">All</option>
                <option value="Engineering">Engineering</option>
                <option value="Legal">Legal</option>
                <option value="HR">HR</option>
                <option value="Finance">Finance</option>
                <option value="Product">Product</option>
              </select>
            </div>

            <div className="flex items-center gap-1.5">
              <span className="text-slate-400">Format:</span>
              <select
                value={selectedFormat}
                onChange={(e) => setSelectedFormat(e.target.value as FileFormat | 'all')}
                className="px-2 py-1 rounded bg-slate-900 border border-slate-700 text-xs text-slate-200 focus:outline-none"
              >
                <option value="all">All Formats</option>
                <option value="pdf">PDF</option>
                <option value="docx">Word</option>
                <option value="pptx">PowerPoint</option>
                <option value="xlsx">Excel</option>
              </select>
            </div>
          </div>
        </div>

        {/* Results Count */}
        {searched && (
          <div className="text-xs text-slate-400">
            Found <strong className="text-white">{results.length}</strong> matching passages
          </div>
        )}

        {/* Results List */}
        <div className="space-y-3">
          {!searched ? (
            <div className="p-12 text-center rounded-xl bg-slate-800/40 border border-slate-800 space-y-2">
              <Search className="w-8 h-8 text-slate-500 mx-auto" />
              <h3 className="text-sm font-semibold text-white">Type to search</h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Search concepts, guidelines, policies, or exact phrases across all indexed documents.
              </p>
            </div>
          ) : results.length === 0 ? (
            <div className="p-12 text-center rounded-xl bg-slate-800/40 border border-slate-800 space-y-2">
              <Search className="w-8 h-8 text-slate-500 mx-auto" />
              <h3 className="text-sm font-semibold text-white">No results found</h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                No matching passages found for &ldquo;{query}&rdquo;. Try different keywords or upload relevant documents.
              </p>
            </div>
          ) : (
            results.map((item) => (
              <div
                key={item.id}
                onClick={() => handleOpenSourceViewer(item)}
                className="p-4 rounded-xl bg-slate-800/80 border border-slate-700/80 hover:border-slate-500 shadow-sm hover:shadow-md cursor-pointer transition-all space-y-2.5 group"
              >
                {/* Result Top Row */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-md bg-slate-900 border border-slate-700 flex items-center justify-center shrink-0">
                      {getFormatIcon(item.fileFormat)}
                    </div>
                    <div>
                      <h3 className="text-xs font-semibold text-white group-hover:text-blue-400 transition-colors">
                        {item.documentTitle}
                      </h3>
                      <div className="flex items-center gap-2 text-[11px] text-slate-400">
                        <span>{item.originalFileName}</span>
                        {item.pageNumber && (
                          <>
                            <span>•</span>
                            <span>Page {item.pageNumber}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {item.department && (
                    <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-slate-700 text-slate-300">
                      {item.department}
                    </span>
                  )}
                </div>

                {/* Section title */}
                {item.sectionTitle && (
                  <div className="text-xs font-medium text-slate-300">
                    {item.sectionTitle}
                  </div>
                )}

                {/* Text excerpt */}
                <div className="p-3 rounded-lg bg-slate-900/80 border border-slate-800 text-xs text-slate-300 leading-relaxed font-sans">
                  &ldquo;{item.content}&rdquo;
                </div>

                {/* Footer action */}
                <div className="flex items-center justify-end text-[11px] text-blue-400 group-hover:underline">
                  <span className="flex items-center gap-1">
                    View in Source Viewer
                    <ArrowRight className="w-3 h-3" />
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </main>

      {/* Source Citation Modal */}
      <SourceCitationModal
        citation={activeCitation}
        onClose={() => setActiveCitation(null)}
        onOpenDocumentLibrary={(docId) => router.push(`/documents?focus=${docId}`)}
      />
    </div>
  );
}
