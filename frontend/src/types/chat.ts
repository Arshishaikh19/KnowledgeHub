import { FileFormat } from './document';

export interface Citation {
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

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  isStreaming?: boolean;
  citations?: Citation[];
  modelUsed?: string;
  tokensUsed?: number;
  latencyMs?: number;
}

export interface ChatSession {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  messages: ChatMessage[];
  documentScope?: string[]; // IDs of specific docs to filter against, or empty for all allowed
}

export interface SendChatPayload {
  message: string;
  sessionId?: string;
  documentScope?: string[];
  departmentFilter?: string;
}
