import {
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsEnum,
  IsMongoId,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';
import { Types } from 'mongoose';
import { ApiKeyLiMitType } from '../schemas/apiKey.schema';
import { Type } from 'class-transformer';

export class CreateApiKeyDto {
  /** Chuỗi API key Gemini */
  @IsString()
  key: string;

  /** _id người sở hữu (chỉ admin được phép gửi) */
  @IsMongoId()
  @IsOptional()
  userId?: string;

  /** Giới hạn key – ACTIVE, DAILY, MONTHLY…  */
  @IsEnum(ApiKeyLiMitType)
  @IsOptional() // sẽ dùng default = ACTIVE nếu không gửi
  limitType?: ApiKeyLiMitType;

  /** Số token tối đa cho phép (0 = không giới hạn) */
  @IsNumber()
  @Min(0)
  @IsOptional()
  totalToken?: number;

  /** Key do admin tạo cho hệ thống? */
  @IsBoolean()
  @IsOptional()
  isAdminOwner?: boolean;

  /** Ngày thuê key (nếu có) */
  @IsOptional()
  rentAt?: Date;

  @IsMongoId()
  aiModelId: string;
}

export class BulkCreateApiKeyDto {
  @IsArray()
  @ArrayMinSize(1, { message: 'Phải có ít nhất một API key' })
  @Type(() => CreateApiKeyDto)
  apiKeys: CreateApiKeyDto[];
}
