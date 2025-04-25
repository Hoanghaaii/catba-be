// src/expense/schemas/expense.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type ExpenseDocument = Expense & Document;

export enum MemberType {
  HONG = 'hong',
  BINH = 'binh',
  MINH = 'minh',
  THANG = 'thang',
  TUAN = 'tuan',
  QUAN = 'quan',
  HAI = 'hai',
  OTHER = 'other',
}

@Schema({ timestamps: true })
export class Expense extends Document {
  @Prop({ required: true, type: Number })
  amount: number;

  @Prop({ required: true, type: String })
  description: string;

  @Prop({ required: true, enum: MemberType })
  paidBy: string;

  @Prop({ required: true, type: [String], enum: MemberType })
  participants: string[];

  @Prop({ type: Boolean, default: true })
  isActive: boolean;
}

export const ExpenseSchema = SchemaFactory.createForClass(Expense);
