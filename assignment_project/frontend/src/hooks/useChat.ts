'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useChatStore, ChatMessage } from '@/store/chat-store';

export function useChat() {
  const { sessionId, setMessages, addMessage, setSuggestedQuestions, setIsLoading } = useChatStore();
  const queryClient = useQueryClient();

  // Load chat history for the session
  const historyQuery = useQuery({
    queryKey: ['chatHistory', sessionId],
    queryFn: async () => {
      if (!sessionId) return [];
      const res = await api.get(`/chat/history/${sessionId}`);
      if (res.data?.success && Array.isArray(res.data?.data)) {
        const formatted: ChatMessage[] = [];
        res.data.data.forEach((item: any) => {
          formatted.push({
            id: `${item._id}_user`,
            sender: 'user',
            text: item.question,
            timestamp: item.timestamp,
          });
          formatted.push({
            id: `${item._id}_ai`,
            sender: 'ai',
            text: item.answer,
            sources: item.sources || [],
            suggestedQuestions: item.suggestedQuestions || [],
            timestamp: item.timestamp,
          });
        });
        setMessages(formatted);
        if (formatted.length > 0) {
          const lastAiMsg = [...formatted].reverse().find((m) => m.sender === 'ai');
          if (lastAiMsg?.suggestedQuestions) {
            setSuggestedQuestions(lastAiMsg.suggestedQuestions);
          }
        }
        return formatted;
      }
      return [];
    },
    enabled: !!sessionId,
  });

  // Ask question mutation
  const askMutation = useMutation({
    mutationFn: async (question: string) => {
      setIsLoading(true);
      // Optimistically add user message
      const tempUserMsg: ChatMessage = {
        id: `temp_${Date.now()}`,
        sender: 'user',
        text: question,
        timestamp: new Date().toISOString(),
      };
      addMessage(tempUserMsg);

      const res = await api.post('/chat/ask', {
        sessionId,
        question,
      });

      return res.data;
    },
    onSuccess: (data) => {
      setIsLoading(false);
      if (data?.success && data?.data) {
        const chat = data.data;
        const aiMsg: ChatMessage = {
          id: chat.id || `ai_${Date.now()}`,
          sender: 'ai',
          text: chat.answer,
          sources: chat.sources || [],
          suggestedQuestions: chat.suggestedQuestions || [],
          timestamp: chat.timestamp || new Date().toISOString(),
        };
        addMessage(aiMsg);
        if (chat.suggestedQuestions) {
          setSuggestedQuestions(chat.suggestedQuestions);
        }
        queryClient.invalidateQueries({ queryKey: ['chatHistory', sessionId] });
      }
    },
    onError: (error: any) => {
      setIsLoading(false);
      const errorMsg: ChatMessage = {
        id: `err_${Date.now()}`,
        sender: 'ai',
        text: error.response?.data?.error?.message || 'Failed to get an answer. Please try again.',
        timestamp: new Date().toISOString(),
      };
      addMessage(errorMsg);
    },
  });

  return {
    historyQuery,
    askQuestion: askMutation.mutate,
    isAsking: askMutation.isPending,
  };
}
