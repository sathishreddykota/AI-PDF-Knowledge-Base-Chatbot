/**
 * Chat Service
 * Handles question asking via Redis Pub/Sub and chat history retrieval.
 * All AI processing goes through Redis — no direct calls to Python service.
 */
import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { randomUUID } from 'crypto';
const uuidv4 = randomUUID;

import { Chat } from './schemas/chat.schema';
import { RedisService } from '../redis/redis.service';

interface AiSource {
  filename: string;
  page_number?: number;
  pageNumber?: number;
}

interface AiChatResponse {
  success: boolean;
  answer?: string;
  sources?: AiSource[];
  suggested_questions?: string[];
  suggestedQuestions?: string[];
  error?: string;
}

@Injectable()
export class ChatService {
  private readonly logger = new Logger(ChatService.name);

  constructor(
    @InjectModel(Chat.name) private readonly chatModel: Model<Chat>,
    private readonly redisService: RedisService,
  ) {}

  /**
   * Ask a question — publishes to Redis, waits for AI response, saves to DB.
   */
  async ask(sessionId: string, question: string) {
    this.logger.log(
      `New question in session ${sessionId}: ${question.substring(0, 50)}...`,
    );

    // Fetch recent chat history for context
    const history = await this.chatModel
      .find({ sessionId })
      .sort({ timestamp: -1 })
      .limit(6)
      .exec();

    const chatHistory = history.reverse().flatMap((chat) => [
      { role: 'user', content: chat.question },
      { role: 'assistant', content: chat.answer },
    ]);

    // Publish question to Redis for Python AI Service
    // IMPORTANT: Use snake_case field names to match Python Pydantic models
    const requestId = uuidv4();
    const request = JSON.stringify({
      request_id: requestId,
      type: 'chat',
      session_id: sessionId,
      question,
      chat_history: chatHistory,
    });

    await this.redisService.publish('ai_request', request);

    // Wait for AI response via Redis
    try {
      const responseStr = await this.redisService.waitForMessage(
        `ai_response:${requestId}`,
        60000, // 60 second timeout
      );

      const response = JSON.parse(responseStr) as AiChatResponse;

      if (!response.success) {
        throw new Error(response.error || 'AI processing failed');
      }

      const sources = (response.sources || []).map((source) => ({
        filename: source.filename,
        pageNumber: source.pageNumber ?? source.page_number,
      }));

      // Save chat to database
      const chat = await this.chatModel.create({
        sessionId,
        question,
        answer: response.answer || '',
        sources,
        suggestedQuestions:
          response.suggested_questions || response.suggestedQuestions || [],
        timestamp: new Date(),
      });

      return {
        id: chat._id.toString(),
        sessionId: chat.sessionId,
        question: chat.question,
        answer: chat.answer,
        sources: chat.sources,
        suggestedQuestions: chat.suggestedQuestions,
        timestamp: chat.timestamp,
      };
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(`Chat processing failed: ${message}`);

      // Save failed attempt for history
      const fallbackAnswer =
        'Sorry, I was unable to process your question. Please try again.';
      const chat = await this.chatModel.create({
        sessionId,
        question,
        answer: fallbackAnswer,
        sources: [],
        suggestedQuestions: [],
        timestamp: new Date(),
      });

      return {
        id: chat._id.toString(),
        sessionId: chat.sessionId,
        question: chat.question,
        answer: fallbackAnswer,
        sources: [],
        suggestedQuestions: [],
        timestamp: chat.timestamp,
      };
    }
  }

  /**
   * Get chat history for a session.
   */
  async getHistory(sessionId: string) {
    return this.chatModel.find({ sessionId }).sort({ timestamp: 1 }).exec();
  }

  /**
   * Get total question count for dashboard.
   */
  async getTotalQuestions(): Promise<number> {
    return this.chatModel.countDocuments().exec();
  }

  /**
   * Get unique session count for dashboard.
   */
  async getTotalSessions(): Promise<number> {
    const sessions = await this.chatModel.distinct('sessionId').exec();
    return sessions.length;
  }
}
