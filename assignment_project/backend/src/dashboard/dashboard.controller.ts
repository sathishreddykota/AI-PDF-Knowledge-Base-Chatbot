/**
 * Dashboard Controller
 * GET /dashboard/stats — Returns aggregated stats for the admin dashboard.
 * Requires JWT authentication.
 */
import { Controller, Get, UseGuards } from '@nestjs/common';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { DocumentsService } from '../documents/documents.service';
import { ChatService } from '../chat/chat.service';

@Controller('dashboard')
@UseGuards(JwtAuthGuard)
export class DashboardController {
  constructor(
    private readonly documentsService: DocumentsService,
    private readonly chatService: ChatService,
  ) {}

  @Get('stats')
  async getStats() {
    const [totalPdfs, totalSessions, totalQuestions, recentDocuments] =
      await Promise.all([
        this.documentsService.getCount(),
        this.chatService.getTotalSessions(),
        this.chatService.getTotalQuestions(),
        this.documentsService.getRecent(5),
      ]);

    return {
      success: true,
      data: {
        totalPdfs,
        totalSessions,
        totalQuestions,
        recentDocuments,
      },
    };
  }
}
