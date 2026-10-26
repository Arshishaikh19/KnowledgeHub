import mongoose, { Schema, Document as MongoDocument } from 'mongoose';
import { FileFormat } from './Document';

export interface IChatCitation {
  id: string;
  citationIndex: number;
  documentId: string;
  documentTitle: string;
  originalFileName: string;
  fileFormat: FileFormat;
  pageNumber?: number;
  sectionTitle?: string;
  excerpt: string;
  similarityScore: number;
  department: string;
}

export interface IChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  citations?: IChatCitation[];
  modelUsed?: string;
  latencyMs?: number;
}

export interface IChatSession extends MongoDocument {
  userId: string;
  userEmail: string;
  title: string;
  messages: IChatMessage[];
  createdAt: Date;
  updatedAt: Date;
}

const CitationSchema = new Schema<IChatCitation>(
  {
    id: { type: String, required: true },
    citationIndex: { type: Number, required: true },
    documentId: { type: String, required: true },
    documentTitle: { type: String, required: true },
    originalFileName: { type: String, required: true },
    fileFormat: { type: String, required: true },
    pageNumber: { type: Number },
    sectionTitle: { type: String },
    excerpt: { type: String, required: true },
    similarityScore: { type: Number, required: true },
    department: { type: String, required: true },
  },
  { _id: false }
);

const MessageSchema = new Schema<IChatMessage>(
  {
    id: { type: String, required: true },
    role: { type: String, enum: ['user', 'assistant', 'system'], required: true },
    content: { type: String, required: true },
    timestamp: { type: Date, default: Date.now },
    citations: [CitationSchema],
    modelUsed: { type: String },
    latencyMs: { type: Number },
  },
  { _id: false }
);

const ChatSessionSchema = new Schema<IChatSession>(
  {
    userId: { type: String, required: true, index: true },
    userEmail: { type: String, required: true, index: true },
    title: { type: String, required: true },
    messages: [MessageSchema],
  },
  {
    timestamps: true,
  }
);

// Compound indexes for user-isolated fast retrieval
ChatSessionSchema.index({ userEmail: 1, updatedAt: -1 });
ChatSessionSchema.index({ userId: 1, updatedAt: -1 });

export const ChatSessionModel = mongoose.model<IChatSession>('ChatSession', ChatSessionSchema);
