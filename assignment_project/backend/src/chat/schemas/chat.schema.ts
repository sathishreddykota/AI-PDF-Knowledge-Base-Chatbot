/**
 * Chat Schema — MongoDB/Mongoose
 * Stores individual chat messages within sessions.
 */
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class Chat extends Document {
  @Prop({ required: true, index: true })
  sessionId: string;

  @Prop({ required: true })
  question: string;

  @Prop({ required: true })
  answer: string;

  @Prop({ type: [{ filename: String, pageNumber: Number }], default: [] })
  sources: { filename: string; pageNumber?: number }[];

  @Prop({ type: [String], default: [] })
  suggestedQuestions: string[];

  @Prop({ default: Date.now })
  timestamp: Date;
}

export const ChatSchema = SchemaFactory.createForClass(Chat);
