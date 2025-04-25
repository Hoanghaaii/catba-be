import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { ROLES } from 'src/common/constants';

export type UserDocument = User & Document;

@Schema({
  timestamps: true,
})
export class User extends Document {
  @Prop({ required: true })
  firstName: string;

  @Prop({ required: true })
  lastName: string;

  @Prop({ required: true, unique: true })
  email: string;

  @Prop({ required: true })
  password: string;

  @Prop({ default: ROLES.USER })
  role: string;

  @Prop({ default: true })
  isActive: boolean;

  @Prop({ default: null })
  refreshToken: string;

  @Prop({ default: null })
  lastLogin: Date;

  declare _id: Types.ObjectId;
}

export const UserSchema = SchemaFactory.createForClass(User);
