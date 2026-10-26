import mongoose, { Schema, Document as MongoDocument } from 'mongoose';

export interface IChunk extends MongoDocument {
  documentId: string;
  versionNumber: number;
  pageNumber?: number;
  sectionTitle?: string;
  content: string;
  embedding?: number[];
  department: string;
  visibility: 'company' | 'team' | 'private';
  allowedUserEmails: string[];
  createdAt: Date;
  updatedAt: Date;
}

const ChunkSchema = new Schema<IChunk>(
  {
    documentId: { type: String, required: true, index: true },
    versionNumber: { type: Number, required: true, default: 1 },
    pageNumber: { type: Number, default: 1 },
    sectionTitle: { type: String, default: '' },
    content: { type: String, required: true },
    embedding: { type: [Number], required: true },
    department: { type: String, required: true, index: true },
    visibility: {
      type: String,
      enum: ['company', 'team', 'private'],
      default: 'company',
      index: true,
    },
    allowedUserEmails: [{ type: String, lowercase: true, index: true }],
  },
  {
    timestamps: true,
  }
);

// Compound indexes for high-speed permission-scoped query filtering directly in MongoDB
ChunkSchema.index({ visibility: 1, department: 1, allowedUserEmails: 1 });
ChunkSchema.index({ documentId: 1, versionNumber: 1 });
ChunkSchema.index({ department: 1, visibility: 1 });
ChunkSchema.index({ allowedUserEmails: 1, visibility: 1 });

export const ChunkModel = mongoose.model<IChunk>('Chunk', ChunkSchema);

