// ============================================
// Shared TypeScript Types
// Used by both frontend/ and backend/
// ============================================

// ---- Redis Pub/Sub Message Types ----

export type AIRequestType = 'chat' | 'process' | 'delete';

export interface RedisAIRequest {
  requestId: string;
  type: AIRequestType;
  sessionId?: string;
  question?: string;
  chatHistory?: ChatHistoryItem[];
  documentId?: string;
  filename?: string;
  fileData?: string; // base64 encoded PDF
}

export interface RedisAIResponse {
  requestId: string;
  success: boolean;
  answer?: string;
  sources?: SourceDocument[];
  suggestedQuestions?: string[];
  error?: string;
}

// ---- Chat Types ----

export interface ChatHistoryItem {
  role: 'user' | 'assistant';
  content: string;
}

export interface ChatMessage {
  id: string;
  sessionId: string;
  question: string;
  answer: string;
  sources: SourceDocument[];
  suggestedQuestions: string[];
  timestamp: string;
}

export interface SourceDocument {
  filename: string;
  pageNumber?: number;
}

// ---- Document Types ----

export type DocumentStatus = 'uploading' | 'processing' | 'completed' | 'failed';

export interface DocumentInfo {
  id: string;
  filename: string;
  size: number;
  status: DocumentStatus;
  uploadDate: string;
  totalChunks: number;
  createdAt: string;
}

// ---- Dashboard Types ----

export interface DashboardStats {
  totalPdfs: number;
  totalSessions: number;
  totalQuestions: number;
  recentDocuments: DocumentInfo[];
}

// ---- API Response Wrapper ----

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
}

// ---- Auth Types ----

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AdminUser {
  id: string;
  email: string;
}
