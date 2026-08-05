/**
 * Documents Module
 */
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { MulterModule } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';

import { DocumentsController } from './documents.controller';
import { DocumentsService } from './documents.service';
import { PdfDocument, PdfDocumentSchema } from './schemas/document.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: PdfDocument.name, schema: PdfDocumentSchema },
    ]),
    MulterModule.register({
      storage: memoryStorage(), // Store in memory buffer for base64 conversion
    }),
  ],
  controllers: [DocumentsController],
  providers: [DocumentsService],
  exports: [DocumentsService],
})
export class DocumentsModule {}
