/**
 * Documents Service
 * Business logic for PDF upload, listing, deletion, and reprocessing.
 * Communicates with Python AI Service through Redis Pub/Sub.
 */
import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';

import { PdfDocument } from './schemas/document.schema';
import { RedisService } from '../redis/redis.service';

@Injectable()
export class DocumentsService {
  private readonly logger = new Logger(DocumentsService.name);

  constructor(
    @InjectModel(PdfDocument.name) private readonly documentModel: Model<PdfDocument>,
    private readonly redisService: RedisService,
  ) {}

  /**
   * Upload a PDF and trigger processing via Redis.
   */
  async upload(file: Express.Multer.File) {
    // Save document metadata to MongoDB
    const document = await this.documentModel.create({
      filename: file.originalname,
      size: file.size,
      status: 'processing',
      uploadDate: new Date(),
      fileData: file.buffer.toString('base64'),
    });

    this.logger.log(`PDF uploaded: ${file.originalname} (${document._id})`);

    // Publish processing request to Python AI Service via Redis
    const requestId = uuidv4();
    const request = JSON.stringify({
      requestId,
      type: 'process',
      documentId: document._id.toString(),
      filename: file.originalname,
      fileData: file.buffer.toString('base64'),
    });

    await this.redisService.publish('ai_request', request);

    // Wait for processing response (with timeout)
    try {
      const responseStr = await this.redisService.waitForMessage(
        `ai_response:${requestId}`,
        120000, // 2 minute timeout for PDF processing
      );

      const response = JSON.parse(responseStr);

      if (response.success) {
        await this.documentModel.findByIdAndUpdate(document._id, {
          status: 'completed',
          totalChunks: parseInt(response.answer?.match(/(\d+) chunks/)?.[1] || '0'),
        });
        this.logger.log(`PDF processed successfully: ${file.originalname}`);
      } else {
        await this.documentModel.findByIdAndUpdate(document._id, {
          status: 'failed',
        });
        this.logger.error(`PDF processing failed: ${response.error}`);
      }
    } catch (error) {
      await this.documentModel.findByIdAndUpdate(document._id, {
        status: 'failed',
      });
      this.logger.error(`PDF processing timeout/error: ${error.message}`);
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

    // Request vector deletion from Python AI Service
    const requestId = uuidv4();
    const request = JSON.stringify({
      requestId,
      type: 'delete',
      documentId: id,
    });

    await this.redisService.publish('ai_request', request);

    // Wait for deletion confirmation (shorter timeout)
    try {
      await this.redisService.waitForMessage(`ai_response:${requestId}`, 15000);
    } catch (error) {
      this.logger.warn(`Vector deletion may have failed: ${error.message}`);
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

    // First delete existing vectors
    const deleteRequestId = uuidv4();
    await this.redisService.publish(
      'ai_request',
      JSON.stringify({ requestId: deleteRequestId, type: 'delete', documentId: id }),
    );

    try {
      await this.redisService.waitForMessage(`ai_response:${deleteRequestId}`, 15000);
    } catch {
      this.logger.warn('Old vector deletion may have failed during reprocess');
    }

    // Then reprocess
    const requestId = uuidv4();
    const request = JSON.stringify({
      requestId,
      type: 'process',
      documentId: id,
      filename: document.filename,
      fileData: document.fileData,
    });

    await this.redisService.publish('ai_request', request);

    try {
      const responseStr = await this.redisService.waitForMessage(
        `ai_response:${requestId}`,
        120000,
      );

      const response = JSON.parse(responseStr);

      if (response.success) {
        await this.documentModel.findByIdAndUpdate(id, {
          status: 'completed',
          totalChunks: parseInt(response.answer?.match(/(\d+) chunks/)?.[1] || '0'),
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
