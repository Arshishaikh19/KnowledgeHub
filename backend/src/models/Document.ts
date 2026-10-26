import mongoose, { Schema, Document as MongoDocument } from 'mongoose';

export type DocumentStatus = 'processing' | 'ready' | 'failed';
export type FileFormat = 'pdf' | 'docx' | 'pptx' | 'xlsx' | 'txt' | 'csv';
export type PermissionRole = 'viewer' | 'editor' | 'admin';
export type VisibilityScope = 'company' | 'team' | 'private';

export interface IDocumentPermission {
  userId: string;
  userEmail: string;
  userName: string;
  role: PermissionRole;
  team?: string;
}

export interface IDocumentVersion {
  versionId: string;
  versionNumber: number;
  uploadedAt: Date;
  uploadedBy: string;
  fileSize: number;
  fileName: string;
  storageKey: string;
  summary?: string;
  chunkCount: number;
  isCurrent: boolean;
}

export interface IDocumentChunk {
  chunkId: string;
  pageNumber?: number;
  sectionTitle?: string;
  content: string;
  score?: number;
}

export interface IDocument extends MongoDocument {
  title: string;
  originalFileName: string;
  fileFormat: FileFormat;
  fileSize: number;
  storageKey: string;
  status: DocumentStatus;
  statusMessage?: string;
  department: 'Engineering' | 'Legal' | 'HR' | 'Finance' | 'Product' | 'Operations' | 'General';
  tags: string[];
  currentVersion: number;
  versions: IDocumentVersion[];
  permissions: IDocumentPermission[];
  visibility: VisibilityScope;
  uploadedBy: {
    id: string;
    name: string;
    email: string;
    avatar?: string;
  };
  totalChunks: number;
  ocrProcessed: boolean;
  sampleChunks?: IDocumentChunk[];
  createdAt: Date;
  updatedAt: Date;
}

const PermissionSchema = new Schema<IDocumentPermission>(
  {
    userId: { type: String, required: true },
    userEmail: { type: String, required: true },
    userName: { type: String, required: true },
    role: { type: String, enum: ['viewer', 'editor', 'admin'], default: 'viewer' },
    team: { type: String },
  },
  { _id: false }
);

const VersionSchema = new Schema<IDocumentVersion>(
  {
    versionId: { type: String, required: true },
    versionNumber: { type: Number, required: true },
    uploadedAt: { type: Date, default: Date.now },
    uploadedBy: { type: String, required: true },
    fileSize: { type: Number, required: true },
    fileName: { type: String, required: true },
    storageKey: { type: String, required: true },
    summary: { type: String },
    chunkCount: { type: Number, default: 0 },
    isCurrent: { type: Boolean, default: true },
  },
  { _id: false }
);

const ChunkSchema = new Schema<IDocumentChunk>(
  {
    chunkId: { type: String, required: true },
    pageNumber: { type: Number },
    sectionTitle: { type: String },
    content: { type: String, required: true },
    score: { type: Number },
  },
  { _id: false }
);

const DocumentSchema = new Schema<IDocument>(
  {
    title: { type: String, required: true, index: true },
    originalFileName: { type: String, required: true },
    fileFormat: {
      type: String,
      enum: ['pdf', 'docx', 'pptx', 'xlsx', 'txt', 'csv'],
      required: true,
      index: true,
    },
    fileSize: { type: Number, required: true },
    storageKey: { type: String, required: true },
    status: {
      type: String,
      enum: ['processing', 'ready', 'failed'],
      default: 'processing',
      index: true,
    },
    statusMessage: { type: String },
    department: {
      type: String,
      enum: ['Engineering', 'Legal', 'HR', 'Finance', 'Product', 'Operations', 'General'],
      required: true,
      index: true,
    },
    tags: [{ type: String, index: true }],
    currentVersion: { type: Number, default: 1 },
    versions: [VersionSchema],
    permissions: [PermissionSchema],
    visibility: {
      type: String,
      enum: ['company', 'team', 'private'],
      default: 'company',
      index: true,
    },
    uploadedBy: {
      id: { type: String, required: true },
      name: { type: String, required: true },
      email: { type: String, required: true },
      avatar: { type: String },
    },
    totalChunks: { type: Number, default: 0 },
    ocrProcessed: { type: Boolean, default: false },
    sampleChunks: [ChunkSchema],
  },
  {
    timestamps: true,
  }
);

// Compound indexes for high-speed permission filtering directly inside queries
DocumentSchema.index({ 'permissions.userEmail': 1, visibility: 1, department: 1, status: 1 });
DocumentSchema.index({ visibility: 1, department: 1, status: 1 });
DocumentSchema.index({ 'uploadedBy.email': 1, status: 1, updatedAt: -1 });
DocumentSchema.index({ department: 1, status: 1, updatedAt: -1 });
DocumentSchema.index({ tags: 1, status: 1 });

export const DocumentModel = mongoose.model<IDocument>('Document', DocumentSchema);
