/**
 * Document Schema — MongoDB/Mongoose
 * Stores uploaded PDF metadata and processing status.
 */
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type DocumentStatus =
  'uploading' | 'processing' | 'completed' | 'failed';

@Schema({ timestamps: true })
export class PdfDocument extends Document {
  @Prop({ required: true })
  filename: string;

  @Prop({ default: 0 })
  size: number;

  @Prop({
    type: String,
    enum: ['uploading', 'processing', 'completed', 'failed'],
    default: 'uploading',
  })
  status: DocumentStatus;

  @Prop({ default: Date.now })
  uploadDate: Date;

  @Prop({ default: 0 })
  totalChunks: number;

  @Prop({ type: Object, default: {} })
  metadata: Record<string, unknown>;

  @Prop()
  fileData: string; // base64 encoded PDF

  @Prop()
  createdAt: Date;
}

export const PdfDocumentSchema = SchemaFactory.createForClass(PdfDocument);
