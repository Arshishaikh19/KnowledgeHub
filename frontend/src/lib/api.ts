import { KnowledgeDocument, DocumentStatus, FileFormat, PermissionRole } from '@/types/document';

// Strictly empty initial store; data originates solely from DB/API
let clientDocumentStore: KnowledgeDocument[] = [];

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

/**
 * Get active user headers from stored session for backend identity propagation
 */
export function getAuthHeaders(): Record<string, string> {
  if (typeof window === 'undefined') {
    return { 'Content-Type': 'application/json' };
  }

  try {
    const stored = localStorage.getItem('kh_user');
    if (stored) {
      const user = JSON.parse(stored);
      return {
        'x-user-email': user.email || '',
        'x-user-name': user.name || '',
        'x-user-role': user.role || 'member',
        'x-user-department': user.department || 'General',
      };
    }
  } catch {
    // Ignore storage parse issues
  }

  return {};
}

/**
 * Fetch all registered users directly from MongoDB
 */
export async function fetchWorkspaceUsers(): Promise<Array<{
  id: string;
  _id?: string;
  name: string;
  email: string;
  role: 'admin' | 'manager' | 'member';
  department: string;
  avatar?: string;
}>> {
  try {
    const res = await fetch(`${API_BASE_URL}/auth/users`, {
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
      cache: 'no-store',
    });
    if (res.ok) {
      const data = await res.json();
      return data.users || [];
    }
  } catch (err) {
    console.error('[API] Failed to fetch workspace users:', err);
  }
  return [];
}

export async function fetchDocuments(): Promise<KnowledgeDocument[]> {
  try {
    const res = await fetch(`${API_BASE_URL}/documents`, {
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
      cache: 'no-store',
    });
    if (res.ok) {
      const data = await res.json();
      const docs = data.documents || data || [];
      clientDocumentStore = docs;
      return docs;
    }
  } catch (err) {
    console.error('[API] Failed to fetch documents from server:', err);
  }
  return [...clientDocumentStore];
}

export interface UploadProgressCallback {
  (percentage: number, statusText: string): void;
}

export async function uploadDocument(
  file: File,
  metadata: {
    title?: string;
    department: string;
    tags: string[];
    visibility: 'company' | 'team' | 'private';
  },
  onProgress?: UploadProgressCallback
): Promise<KnowledgeDocument> {
  const extension = file.name.split('.').pop()?.toLowerCase() || 'pdf';
  const format = (['pdf', 'docx', 'pptx', 'xlsx', 'csv'].includes(extension)
    ? extension
    : 'pdf') as FileFormat;

  try {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('title', metadata.title || file.name.replace(/\.[^/.]+$/, ''));
    formData.append('department', metadata.department);
    formData.append('visibility', metadata.visibility);
    formData.append('tags', JSON.stringify(metadata.tags));

    onProgress?.(25, 'Uploading binary payload to Storage...');

    const authHeaders = getAuthHeaders();
    
    const res = await fetch(`${API_BASE_URL}/documents/upload`, {
      method: 'POST',
      headers: {
        ...authHeaders,
      },
      body: formData,
    });

    if (res.ok) {
      const data = await res.json();
      onProgress?.(100, 'Uploaded successfully. Parsing & embedding in background.');
      if (data.document) {
        clientDocumentStore = [data.document, ...clientDocumentStore];
        return data.document;
      }
    } else {
      const err = await res.json();
      throw new Error(err.error || 'Upload failed');
    }
  } catch (err) {
    console.error('[Upload] Error uploading document:', err);
    throw err;
  }

  throw new Error('Upload could not be completed.');
}

export async function deleteDocument(docId: string): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE_URL}/documents/${docId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
    });
    if (res.ok) {
      clientDocumentStore = clientDocumentStore.filter((d) => d.id !== docId && (d as any)._id !== docId);
      return true;
    }
  } catch (err) {
    console.error('[API] Error deleting document:', err);
  }
  return false;
}

export async function updateDocumentPermissions(
  docId: string,
  permissions: KnowledgeDocument['permissions'],
  visibility: KnowledgeDocument['visibility']
): Promise<KnowledgeDocument | null> {
  try {
    const res = await fetch(`${API_BASE_URL}/documents/${docId}/share`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
      body: JSON.stringify({ permissions, visibility }),
    });
    if (res.ok) {
      const data = await res.json();
      return data.document;
    }
  } catch (err) {
    console.error('[API] Error updating permissions:', err);
  }
  return null;
}

export async function reuploadDocumentVersion(
  docId: string,
  file: File,
  summaryNotes: string
): Promise<KnowledgeDocument | null> {
  try {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('summary', summaryNotes);

    const res = await fetch(`${API_BASE_URL}/documents/${docId}/reupload`, {
      method: 'POST',
      headers: {
        ...getAuthHeaders(),
      },
      body: formData,
    });
    if (res.ok) {
      const data = await res.json();
      return data.document;
    }
  } catch (err) {
    console.error('[API] Error re-uploading version:', err);
  }
  return null;
}

export async function restoreDocumentVersion(
  docId: string,
  versionNumber: number
): Promise<KnowledgeDocument | null> {
  try {
    const res = await fetch(`${API_BASE_URL}/documents/${docId}/restore`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
      body: JSON.stringify({ versionNumber }),
    });
    if (res.ok) {
      const data = await res.json();
      return data.document;
    }
  } catch (err) {
    console.error('[API] Error restoring version:', err);
  }
  return null;
}

export async function retryDocumentIngestion(
  docId: string
): Promise<KnowledgeDocument | null> {
  try {
    const res = await fetch(`${API_BASE_URL}/documents/${docId}/retry`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
    });
    if (res.ok) {
      const data = await res.json();
      return data.document;
    }
  } catch (err) {
    console.error('[API] Error retrying document ingestion:', err);
  }
  return null;
}

