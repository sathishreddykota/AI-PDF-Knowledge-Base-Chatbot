/**
 * Documents Controller
 * Handles PDF upload, listing, deletion, and reprocessing.
 * All routes require JWT authentication (admin only).
 */
import {
  Controller,
  Post,
  Get,
  Delete,
  Param,
  Query,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';

import { DocumentsService } from './documents.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('documents')
@UseGuards(JwtAuthGuard)
export class DocumentsController {
  constructor(private readonly documentsService: DocumentsService) {}

  /**
   * POST /documents/upload — Upload a PDF file.
   */
  @Post('upload')
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: 10 * 1024 * 1024 }, // 10MB max
      fileFilter: (_req, file, callback) => {
        if (file.mimetype !== 'application/pdf') {
          return callback(
            new BadRequestException('Only PDF files are allowed'),
            false,
          );
        }
        callback(null, true);
      },
    }),
  )
  async upload(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    const document = await this.documentsService.upload(file);
    return { success: true, data: document };
  }

  /**
   * GET /documents — List all documents with optional search.
   */
  @Get()
  async findAll(@Query('search') search?: string) {
    const documents = await this.documentsService.findAll(search);
    return { success: true, data: documents };
  }

  /**
   * DELETE /documents/:id — Delete a document and its vectors.
   */
  @Delete(':id')
  async delete(@Param('id') id: string) {
    const result = await this.documentsService.delete(id);
    return { success: true, data: result };
  }

  /**
   * POST /documents/:id/reprocess — Reprocess a document.
   */
  @Post(':id/reprocess')
  async reprocess(@Param('id') id: string) {
    const document = await this.documentsService.reprocess(id);
    return { success: true, data: document };
  }
}
