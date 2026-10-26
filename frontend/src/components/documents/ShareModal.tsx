'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  Share2,
  Shield,
  UserPlus,
  Globe,
  Users,
  Lock,
  Trash2,
  Check,
  Sparkles,
  UserCheck,
} from 'lucide-react';
import { KnowledgeDocument, DocumentPermission, PermissionRole } from '@/types/document';
import { updateDocumentPermissions, fetchWorkspaceUsers } from '@/lib/api';

interface ShareModalProps {
  document: KnowledgeDocument | null;
  onClose: () => void;
  onUpdated: (updatedDoc: KnowledgeDocument) => void;
}

export function ShareModal({ document, onClose, onUpdated }: ShareModalProps) {
  if (!document) return null;

  const [visibility, setVisibility] = useState<KnowledgeDocument['visibility']>(
    document.visibility || 'company'
  );
  const [permissions, setPermissions] = useState<DocumentPermission[]>(
    document.permissions || []
  );
  const [newEmail, setNewEmail] = useState('');
  const [newRole, setNewRole] = useState<PermissionRole>('viewer');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [dbUsers, setDbUsers] = useState<Array<{ id: string; name: string; email: string; role: string; department: string }>>([]);

  // Load real workspace users from MongoDB
  useEffect(() => {
    fetchWorkspaceUsers().then((users) => {
      setDbUsers(users);
    });
  }, []);

  const handleAddUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail.trim()) return;

    const email = newEmail.trim().toLowerCase();
    const existing = permissions.find((p) => p.userEmail.toLowerCase() === email);

    // Find if user exists in DB
    const matchedUser = dbUsers.find((u) => u.email.toLowerCase() === email);
    const resolvedName = matchedUser?.name || email.split('@')[0].replace('.', ' ');

    if (existing) {
      setPermissions(
        permissions.map((p) =>
          p.userEmail.toLowerCase() === email ? { ...p, role: newRole } : p
        )
      );
    } else {
      setPermissions([
        ...permissions,
        {
          userId: matchedUser?.id || `usr_${Date.now()}`,
          userEmail: email,
          userName: resolvedName.charAt(0).toUpperCase() + resolvedName.slice(1),
          role: newRole,
        },
      ]);
    }
    setNewEmail('');
  };

  const handleSelectDbUser = (user: { name: string; email: string }) => {
    setNewEmail(user.email);
  };

  const handleRemovePermission = (userEmail: string) => {
    setPermissions(permissions.filter((p) => p.userEmail !== userEmail));
  };

  const handleChangeRole = (userEmail: string, role: PermissionRole) => {
    setPermissions(
      permissions.map((p) => (p.userEmail === userEmail ? { ...p, role } : p))
    );
  };

  const handleSave = async () => {
    setIsSaving(true);
    const updated = await updateDocumentPermissions(document.id, permissions, visibility);
    setIsSaving(false);
    if (updated) {
      setSaveSuccess(true);
      setTimeout(() => {
        onUpdated(updated);
        onClose();
      }, 600);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl rounded-2xl glass-panel-elevated overflow-hidden border border-white/15 shadow-2xl">
        {/* Header */}
        <div className="px-6 py-5 border-b border-white/10 flex items-center justify-between bg-slate-900/90">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center">
              <Share2 className="w-5 h-5 text-cyan-400" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-tight">
                Document Permissions & Access
              </h2>
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
        <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
          {/* General Access Level */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
              General Access Scope
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setVisibility('company')}
                className={`p-3 rounded-xl border flex flex-col items-center gap-1.5 transition-all ${
                  visibility === 'company'
                    ? 'bg-indigo-600/20 border-indigo-500 text-white font-semibold'
                    : 'bg-slate-900/60 border-white/10 text-slate-400 hover:text-slate-200'
                }`}
              >
                <Globe className="w-4 h-4 text-indigo-400" />
                <span className="text-xs">Company-Wide</span>
              </button>

              <button
                type="button"
                onClick={() => setVisibility('team')}
                className={`p-3 rounded-xl border flex flex-col items-center gap-1.5 transition-all ${
                  visibility === 'team'
                    ? 'bg-indigo-600/20 border-indigo-500 text-white font-semibold'
                    : 'bg-slate-900/60 border-white/10 text-slate-400 hover:text-slate-200'
                }`}
              >
                <Users className="w-4 h-4 text-indigo-400" />
                <span className="text-xs">Team / Dept</span>
              </button>

              <button
                type="button"
                onClick={() => setVisibility('private')}
                className={`p-3 rounded-xl border flex flex-col items-center gap-1.5 transition-all ${
                  visibility === 'private'
                    ? 'bg-indigo-600/20 border-indigo-500 text-white font-semibold'
                    : 'bg-slate-900/60 border-white/10 text-slate-400 hover:text-slate-200'
                }`}
              >
                <Lock className="w-4 h-4 text-indigo-400" />
                <span className="text-xs">Restricted</span>
              </button>
            </div>
          </div>

          {/* Add People Form */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
              Grant Specific User / Team Access
            </label>
            <form onSubmit={handleAddUser} className="flex gap-2">
              <input
                type="email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                placeholder="Select from users below or enter email..."
                className="flex-1 px-3.5 py-2.5 rounded-xl bg-slate-950 border border-white/10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
              <select
                value={newRole}
                onChange={(e) => setNewRole(e.target.value as PermissionRole)}
                className="px-3 py-2.5 rounded-xl bg-slate-950 border border-white/10 text-xs text-white focus:outline-none focus:border-indigo-500"
              >
                <option value="viewer">Viewer</option>
                <option value="editor">Editor</option>
                <option value="admin">Admin</option>
              </select>
              <button
                type="submit"
                className="glow-btn px-4 py-2.5 text-xs font-semibold rounded-xl flex items-center gap-1.5"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Add</span>
              </button>
            </form>

            {/* Quick Select from Registered DB Users */}
            {dbUsers.length > 0 && (
              <div className="mt-2.5">
                <span className="text-[11px] text-slate-400 font-medium block mb-1.5">
                  Select Registered Database User:
                </span>
                <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
                  {dbUsers.map((u) => (
                    <button
                      key={u.email}
                      type="button"
                      onClick={() => handleSelectDbUser(u)}
                      className={`px-2.5 py-1 rounded-lg text-xs flex items-center gap-1.5 transition-colors border ${
                        newEmail.toLowerCase() === u.email.toLowerCase()
                          ? 'bg-indigo-600/30 border-indigo-500 text-white font-medium'
                          : 'bg-slate-950/60 border-white/10 text-slate-300 hover:text-white hover:bg-slate-800'
                      }`}
                    >
                      <UserCheck className="w-3 h-3 text-indigo-400" />
                      <span>{u.name}</span>
                      <span className="text-[10px] text-slate-400 font-mono">({u.department})</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* People with Access List */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400">
              Assigned Permissions ({permissions.length})
            </label>

            <div className="divide-y divide-white/5 rounded-xl bg-slate-900/60 border border-white/10 overflow-hidden max-h-48 overflow-y-auto">
              {permissions.map((p) => (
                <div
                  key={p.userEmail}
                  className="p-3 flex items-center justify-between gap-3 text-xs"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-indigo-600/30 border border-indigo-500/40 flex items-center justify-center font-bold text-indigo-300 text-[11px]">
                      {p.userName.charAt(0)}
                    </div>
                    <div>
                      <p className="font-semibold text-white leading-tight">{p.userName}</p>
                      <p className="text-[11px] text-slate-400 font-mono">{p.userEmail}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <select
                      value={p.role}
                      onChange={(e) =>
                        handleChangeRole(p.userEmail, e.target.value as PermissionRole)
                      }
                      className="px-2 py-1 rounded-lg bg-slate-800 border border-white/10 text-xs text-slate-200 focus:outline-none capitalize"
                    >
                      <option value="viewer">Viewer</option>
                      <option value="editor">Editor</option>
                      <option value="admin">Admin</option>
                    </select>

                    <button
                      onClick={() => handleRemovePermission(p.userEmail)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-white/10 bg-slate-950/90 flex items-center justify-between">
          <span className="text-[11px] text-slate-400">
            Permission filtering enforced during vector retrieval.
          </span>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-300 hover:text-white"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="glow-btn px-5 py-2 text-xs font-semibold rounded-xl flex items-center gap-1.5"
            >
              {saveSuccess ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Saved!</span>
                </>
              ) : (
                <span>Save Changes</span>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
