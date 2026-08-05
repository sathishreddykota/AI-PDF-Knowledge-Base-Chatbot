/**
 * Documents Service
 * Business logic for PDF upload, listing, deletion, and reprocessing.
 * Communicates with Python AI Service through Redis Pub/Sub.
 */
import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { randomUUID } from 'crypto';
const uuidv4 = randomUUID;

import { PdfDocument } from './schemas/document.schema';
import { RedisService } from '../redis/redis.service';

interface AiProcessResponse {
  success: boolean;
  answer?: string;
  error?: string;
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function extractChunkCount(answer?: string): number {
  const match = answer?.match(/(\d+) chunks/);
  return match?.[1] ? parseInt(match[1], 10) : 0;
}

@Injectable()
export class DocumentsService {
  private readonly logger = new Logger(DocumentsService.name);

  constructor(
    @InjectModel(PdfDocument.name)
    private readonly documentModel: Model<PdfDocument>,
    private readonly redisService: RedisService,
  ) {}

  /**
   * Upload a PDF and trigger processing via Redis.
   */
  async upload(file: Express.Multer.File) {
    const base64Data = file.buffer.toString('base64');
    const isLargeFile = file.size > 10 * 1024 * 1024;

    // Save document metadata to MongoDB (omit large fileData if > 10MB to prevent BSON limits)
    const document = await this.documentModel.create({
      filename: file.originalname,
      size: file.size,
      status: 'processing',
      uploadDate: new Date(),
      fileData: isLargeFile ? '' : base64Data,
    });

    this.logger.log(
      `PDF uploaded: ${file.originalname} (${document._id.toString()})`,
    );

    // Publish processing request to Python AI Service via Redis
    // IMPORTANT: Use snake_case field names to match Python Pydantic models
    const requestId = uuidv4();
    const request = JSON.stringify({
      request_id: requestId,
      type: 'process',
      document_id: document._id.toString(),
      filename: file.originalname,
      file_data: base64Data,
    });

    await this.redisService.publish('ai_request', request);

    // Wait for processing response (with timeout)
    try {
      const responseStr = await this.redisService.waitForMessage(
        `ai_response:${requestId}`,
        120000, // 2 minute timeout for PDF processing
      );

      const response = JSON.parse(responseStr) as AiProcessResponse;

      if (response.success) {
        await this.documentModel.findByIdAndUpdate(document._id, {
          status: 'completed',
          totalChunks: extractChunkCount(response.answer),
        });
        this.logger.log(`PDF processed successfully: ${file.originalname}`);
      } else {
        await this.documentModel.findByIdAndUpdate(document._id, {
          status: 'failed',
        });
        this.logger.error(`PDF processing failed: ${response.error}`);
      }
    } catch (error: unknown) {
      await this.documentModel.findByIdAndUpdate(document._id, {
        status: 'failed',
      });
      this.logger.error(
        `PDF processing timeout/error: ${getErrorMessage(error)}`,
      );
    }

    // Return the document without fileData (too large for response)
    const result = await this.documentModel
      .findById(document._id)
      .select('-fileData')
      .exec();

    return result;
  }

  /**
   * List all documents with optional search filter.
   */
  async findAll(search?: string) {
    const filter = search
      ? { filename: { $regex: search, $options: 'i' } }
      : {};

    return this.documentModel
      .find(filter)
      .select('-fileData')
      .sort({ uploadDate: -1 })
      .exec();
  }

  /**
   * Delete a document and its vectors from ChromaDB.
   */
  async delete(id: string) {
    const document = await this.documentModel.findById(id);
    if (!document) {
      throw new NotFoundException('Document not found');
    }

    // Request vector deletion from Python AI Service (snake_case fields)
    const requestId = uuidv4();
    const request = JSON.stringify({
      request_id: requestId,
      type: 'delete',
      document_id: id,
    });

    await this.redisService.publish('ai_request', request);

    // Wait for deletion confirmation (shorter timeout)
    try {
      await this.redisService.waitForMessage(`ai_response:${requestId}`, 15000);
    } catch (error: unknown) {
      this.logger.warn(
        `Vector deletion may have failed: ${getErrorMessage(error)}`,
      );
    }

    // Delete from MongoDB
    await this.documentModel.findByIdAndDelete(id);
    this.logger.log(`Document deleted: ${document.filename} (${id})`);

    return { message: 'Document deleted successfully' };
  }

  /**
   * Reprocess a document (re-extract, re-chunk, re-embed).
   */
  async reprocess(id: string) {
    const document = await this.documentModel.findById(id);
    if (!document) {
      throw new NotFoundException('Document not found');
    }

    // Update status to processing
    await this.documentModel.findByIdAndUpdate(id, { status: 'processing' });

    // First delete existing vectors (snake_case fields)
    const deleteRequestId = uuidv4();
    await this.redisService.publish(
      'ai_request',
      JSON.stringify({
        request_id: deleteRequestId,
        type: 'delete',
        document_id: id,
      }),
    );

    try {
      await this.redisService.waitForMessage(
        `ai_response:${deleteRequestId}`,
        15000,
      );
    } catch {
      this.logger.warn('Old vector deletion may have failed during reprocess');
    }

    // Then reprocess (snake_case fields)
    const requestId = uuidv4();
    const request = JSON.stringify({
      request_id: requestId,
      type: 'process',
      document_id: id,
      filename: document.filename,
      file_data: document.fileData,
    });

    await this.redisService.publish('ai_request', request);

    try {
      const responseStr = await this.redisService.waitForMessage(
        `ai_response:${requestId}`,
        120000,
      );

      const response = JSON.parse(responseStr) as AiProcessResponse;

      if (response.success) {
        await this.documentModel.findByIdAndUpdate(id, {
          status: 'completed',
          totalChunks: extractChunkCount(response.answer),
        });
      } else {
        await this.documentModel.findByIdAndUpdate(id, { status: 'failed' });
      }
    } catch {
      await this.documentModel.findByIdAndUpdate(id, { status: 'failed' });
    }

    return this.documentModel.findById(id).select('-fileData').exec();
  }

  /**
   * Get document count for dashboard stats.
   */
  async getCount(): Promise<number> {
    return this.documentModel.countDocuments().exec();
  }

  /**
   * Get recent documents for dashboard.
   */
  async getRecent(limit = 5) {
    return this.documentModel
      .find()
      .select('-fileData')
      .sort({ uploadDate: -1 })
      .limit(limit)
      .exec();
  }
}
