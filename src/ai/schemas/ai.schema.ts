import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type AIModelDocument = AIModel & Document;

// Enum cho các loại AI model
export enum AIModelType {
  GEMINI = 'gemini',
  CLAUDE = 'claude',
  GPT = 'gpt',
}

@Schema({ timestamps: true })
export class AIModel extends Document {
  @Prop({ required: true, enum: AIModelType })
  aiModel: string;

  @Prop({ required: true })
  nameModel: string;

  @Prop({ default: 1 })
  temperature: number;

  @Prop({ default: 1 })
  top_p: number;

  // Các tham số tùy chọn cho từng loại model
  @Prop({ type: Number, default: null })
  top_k?: number; // Chỉ dùng cho Gemini

  @Prop({ type: Number, default: null })
  frequency_penalty?: number; // Chỉ dùng cho GPT

  @Prop({ type: Number, default: null })
  presence_penalty?: number; // Chỉ dùng cho GPT

  @Prop({ default: 4000 })
  max_tokens: number;

  @Prop({ default: false })
  status: boolean;
}

export const AIModelSchema = SchemaFactory.createForClass(AIModel);
