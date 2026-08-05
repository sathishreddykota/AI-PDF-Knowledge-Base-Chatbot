/**
 * Dashboard Module
 */
import { Module } from '@nestjs/common';

import { DashboardController } from './dashboard.controller';
import { DocumentsModule } from '../documents/documents.module';
import { ChatModule } from '../chat/chat.module';

@Module({
  imports: [DocumentsModule, ChatModule],
  controllers: [DashboardController],
})
export class DashboardModule {}
