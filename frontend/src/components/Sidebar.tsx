'use client';

import React from 'react';
import {
  FolderOpen,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Building,
  HardDrive,
  FileText,
  FileSpreadsheet,
  Presentation,
  Shield,
} from 'lucide-react';
import { DocumentStatus } from '@/types/document';

interface SidebarProps {
  selectedStatus: DocumentStatus | 'all';
  onSelectStatus: (status: DocumentStatus | 'all') => void;
  selectedDepartment: string;
  onSelectDepartment: (dept: string) => void;
  statusCounts: {
    all: number;
    ready: number;
    processing: number;
    failed: number;
  };
  departments: string[];
  totalStorageMb: string;
}

export function Sidebar({
  selectedStatus,
  onSelectStatus,
  selectedDepartment,
  onSelectDepartment,
  statusCounts,
  departments,
  totalStorageMb,
}: SidebarProps) {
  const defaultDepartments = ['Engineering', 'HR', 'Finance', 'Legal', 'Product'];
  const allDepartments = Array.from(new Set([...departments, ...defaultDepartments]));

  return (
    <aside className="w-64 shrink-0 space-y-4 hidden lg:block">
      {/* 1. Status Filter Card */}
      <div className="p-3.5 rounded-xl bg-slate-800/80 border border-slate-700/80 hover:border-slate-600 shadow-sm transition-all space-y-2">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 px-2">
          Status
        </h3>

        <div className="space-y-1">
          <button
            onClick={() => onSelectStatus('all')}
            className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition-colors ${
              selectedStatus === 'all'
                ? 'sidebar-pill-active'
                : 'sidebar-pill-inactive'
            }`}
          >
            <div className="flex items-center gap-2">
              <FolderOpen className="w-3.5 h-3.5" />
              <span>All Files</span>
            </div>
            <span className="text-[11px] font-mono">
              {statusCounts.all}
            </span>
          </button>

          <button
            onClick={() => onSelectStatus('ready')}
            className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition-colors ${
              selectedStatus === 'ready'
                ? 'sidebar-pill-active sidebar-status-ready'
                : 'sidebar-pill-inactive'
            }`}
          >
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
              <span>Ready</span>
            </div>
            <span className="text-[11px] font-mono text-emerald-500">
              {statusCounts.ready}
            </span>
          </button>

          <button
            onClick={() => onSelectStatus('processing')}
            className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition-colors ${
              selectedStatus === 'processing'
                ? 'sidebar-pill-active sidebar-status-processing'
                : 'sidebar-pill-inactive'
            }`}
          >
            <div className="flex items-center gap-2">
              <Clock className="w-3.5 h-3.5 text-amber-500" />
              <span>Processing</span>
            </div>
            <span className="text-[11px] font-mono text-amber-500">
              {statusCounts.processing}
            </span>
          </button>

          <button
            onClick={() => onSelectStatus('failed')}
            className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition-colors ${
              selectedStatus === 'failed'
                ? 'sidebar-pill-active sidebar-status-failed'
                : 'sidebar-pill-inactive'
            }`}
          >
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />
              <span>Failed</span>
            </div>
            <span className="text-[11px] font-mono text-rose-500">
              {statusCounts.failed}
            </span>
          </button>
        </div>
      </div>

      {/* 2. Departments Card */}
      <div className="p-3.5 rounded-xl bg-slate-800/80 border border-slate-700/80 hover:border-slate-600 shadow-sm transition-all space-y-2">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 px-2 flex items-center justify-between">
          <span>Departments</span>
          <Building className="w-3.5 h-3.5 text-slate-400" />
        </h3>

        <div className="space-y-1">
          <button
            onClick={() => onSelectDepartment('all')}
            className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs transition-colors ${
              selectedDepartment === 'all'
                ? 'sidebar-pill-active'
                : 'sidebar-pill-inactive'
            }`}
          >
            All Departments
          </button>
          {allDepartments.map((dept) => (
            <button
              key={dept}
              onClick={() => onSelectDepartment(dept)}
              className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs transition-colors ${
                selectedDepartment === dept
                  ? 'sidebar-pill-active'
                  : 'sidebar-pill-inactive'
              }`}
            >
              {dept}
            </button>
          ))}
        </div>
      </div>

      {/* 3. Storage & Formats Info Card */}
      <div className="p-3.5 rounded-xl bg-slate-800/80 border border-slate-700/80 hover:border-slate-600 shadow-sm transition-all space-y-3 text-xs">
        <div className="flex items-center justify-between text-slate-300 font-medium">
          <div className="flex items-center gap-2">
            <HardDrive className="w-3.5 h-3.5 text-slate-400" />
            <span>Storage Usage</span>
          </div>
          <span className="text-[11px] text-slate-400 font-mono">{totalStorageMb} MB</span>
        </div>

        {/* Progress bar */}
        <div className="w-full h-1.5 bg-slate-900 rounded-full overflow-hidden border border-slate-700/50">
          <div
            className="h-full bg-slate-400 rounded-full transition-all"
            style={{
              width: `${Math.min(100, Math.max(2, (parseFloat(totalStorageMb) / 1024) * 100))}%`,
            }}
          />
        </div>

        <div className="pt-2 border-t border-slate-700/60 space-y-1.5 text-[11px] text-slate-400">
          <span className="font-semibold text-slate-300 block mb-1">Supported Formats:</span>
          <div className="flex items-center gap-1.5 text-slate-300">
            <FileText className="w-3.5 h-3.5 text-rose-400" />
            <span>PDF Documents (.pdf)</span>
          </div>
          <div className="flex items-center gap-1.5 text-slate-300">
            <FileText className="w-3.5 h-3.5 text-blue-400" />
            <span>Word Files (.docx, .doc)</span>
          </div>
          <div className="flex items-center gap-1.5 text-slate-300">
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
            <span>Excel Spreadsheets (.xlsx, .csv)</span>
          </div>
          <div className="flex items-center gap-1.5 text-slate-300">
            <Presentation className="w-3.5 h-3.5 text-amber-400" />
            <span>PowerPoint Decks (.pptx, .ppt)</span>
          </div>
        </div>
      </div>

      {/* 4. Quick Help Card */}
      <div className="p-3.5 rounded-xl bg-slate-800/50 border border-slate-700/80 hover:border-slate-600 shadow-sm transition-all text-xs text-slate-400 space-y-1.5">
        <div className="flex items-center gap-1.5 text-slate-300 font-medium">
          <Shield className="w-3.5 h-3.5 text-slate-400" />
          <span>Access Control</span>
        </div>
        <p className="text-[11px] text-slate-400 leading-relaxed">
          Files inherit department visibility. Set private permissions in the Share menu.
        </p>
      </div>
    </aside>
  );
}
