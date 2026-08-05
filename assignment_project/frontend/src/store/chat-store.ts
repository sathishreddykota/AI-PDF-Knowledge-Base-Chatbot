import { create } from 'zustand';
import { generateSessionId } from '@/lib/utils';

export interface SourceDocument {
  filename: string;
  pageNumber?: number;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  sources?: SourceDocument[];
  suggestedQuestions?: string[];
  timestamp: string;
}

interface ChatState {
  sessionId: string;
  messages: ChatMessage[];
  suggestedQuestions: string[];
  isLoading: boolean;
  setSessionId: (id: string) => void;
  setMessages: (messages: ChatMessage[]) => void;
  addMessage: (message: ChatMessage) => void;
  setSuggestedQuestions: (questions: string[]) => void;
  setIsLoading: (loading: boolean) => void;
  resetChat: () => void;
}

export const useChatStore = create<ChatState>((set) => ({
  sessionId: typeof window !== 'undefined' ? (localStorage.getItem('chatSessionId') || generateSessionId()) : generateSessionId(),
  messages: [],
  suggestedQuestions: [],
  isLoading: false,

  setSessionId: (sessionId) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('chatSessionId', sessionId);
    }
    set({ sessionId });
  },

  setMessages: (messages) => set({ messages }),

  addMessage: (message) => set((state) => ({ messages: [...state.messages, message] })),

  setSuggestedQuestions: (suggestedQuestions) => set({ suggestedQuestions }),

  setIsLoading: (isLoading) => set({ isLoading }),

  resetChat: () => {
    const newSessionId = generateSessionId();
    if (typeof window !== 'undefined') {
      localStorage.setItem('chatSessionId', newSessionId);
    }
    set({
      sessionId: newSessionId,
      messages: [],
      suggestedQuestions: [],
      isLoading: false,
    });
  },
}));
