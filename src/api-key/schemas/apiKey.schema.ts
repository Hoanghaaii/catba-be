import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type ApiKeyDocument = ApiKey & Document;

export enum ApiKeyLiMitType {
  NEXT_DAY = 'next-day',
  ACTIVE = 'active',
}

@Schema({ timestamps: true })
export class ApiKey extends Document {
  @Prop({ required: true, type: String, unique: true })
  key: string;

  @Prop({ required: true })
  userId: string;

  @Prop({ required: true, type: Boolean, default: true })
  status: boolean;

  @Prop({ required: true, type: Number, default: 0 })
  totalUsed: number;

  @Prop({
    required: true,
    type: String,
    enum: ApiKeyLiMitType,
    default: ApiKeyLiMitType.ACTIVE,
  })
  limitType: string;

  @Prop({ required: true, type: Boolean, default: false })
  isUsed: boolean;

  @Prop({ required: true, type: Number, default: 0 })
  totalToken: number;

  @Prop({ required: true, type: Number, default: 0 })
  usedDay: number;

  @Prop({ required: true, type: Boolean, default: true })
  isAdminOwner: boolean;

  @Prop({ type: Date })
  rentAt?: Date;

  //note: them truong aiMode nuaw
}

export const ApiKeySchema = SchemaFactory.createForClass(ApiKey);
