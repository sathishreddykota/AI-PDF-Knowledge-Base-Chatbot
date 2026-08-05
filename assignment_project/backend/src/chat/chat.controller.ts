/**
 * Chat Controller
 * POST /chat/ask — Ask a question (public, no auth)
 * GET /chat/history/:sessionId — Get chat history (public)
 */
import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  BadRequestException,
} from '@nestjs/common';

import { ChatService } from './chat.service';

@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post('ask')
  async ask(@Body() body: { sessionId: string; question: string }) {
    if (!body.question?.trim()) {
      throw new BadRequestException('Question is required');
    }

    if (!body.sessionId?.trim()) {
      throw new BadRequestException('Session ID is required');
    }

    const result = await this.chatService.ask(body.sessionId, body.question);
    return { success: true, data: result };
  }

  @Get('history/:sessionId')
  async getHistory(@Param('sessionId') sessionId: string) {
    const history = await this.chatService.getHistory(sessionId);
    return { success: true, data: history };
  }
}
