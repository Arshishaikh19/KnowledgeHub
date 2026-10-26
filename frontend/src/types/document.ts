export type DocumentStatus = 'processing' | 'ready' | 'failed';

export type FileFormat = 'pdf' | 'docx' | 'pptx' | 'xlsx' | 'txt' | 'csv';

export type PermissionRole = 'viewer' | 'editor' | 'admin';

export interface DocumentPermission {
  userId: string;
  userEmail: string;
  userName: string;
  role: PermissionRole;
  team?: string;
}

export interface DocumentVersion {
  versionId: string;
  versionNumber: number;
  uploadedAt: string;
  uploadedBy: string;
  fileSize: number;
  fileName: string;
  storageKey: string;
  summary?: string;
  chunkCount: number;
  isCurrent: boolean;
}

export interface DocumentChunk {
  chunkId: string;
  pageNumber?: number;
  sectionTitle?: string;
  content: string;
  score?: number;
}

export interface KnowledgeDocument {
  id: string;
  title: string;
  originalFileName: string;
  fileFormat: FileFormat;
  fileSize: number;
  status: DocumentStatus;
  statusMessage?: string;
  uploadedAt: string;
  updatedAt: string;
  uploadedBy: {
    id: string;
    name: string;
    email: string;
    avatar?: string;
  };
  department: 'Engineering' | 'Legal' | 'HR' | 'Finance' | 'Product' | 'Operations' | 'General';
  tags: string[];
  currentVersion: number;
  versions: DocumentVersion[];
  permissions: DocumentPermission[];
  visibility: 'company' | 'team' | 'private';
  totalChunks: number;
  ocrProcessed?: boolean;
  sampleChunks?: DocumentChunk[];
}

export interface UploadDocumentPayload {
  file: File;
  department: string;
  tags: string[];
  visibility: 'company' | 'team' | 'private';
}
