import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsBoolean,
  IsString,
  Min,
  Max,
} from 'class-validator';
import { AIModelType } from '../schemas/ai.schema';

export class CreateAIModelDto {
  @IsNotEmpty()
  @IsEnum(AIModelType, { message: 'Loại AI model không hợp lệ' })
  aiModel: string;

  @IsString()
  nameModel: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(2)
  temperature?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  top_p?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  top_k?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(2)
  frequency_penalty?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(2)
  presence_penalty?: number;

  @IsOptional()
  @IsNumber()
  @Min(100)
  max_tokens?: number;

  @IsOptional()
  @IsBoolean()
  status?: boolean;
}

export class UpdateAIModelDto {
  @IsOptional()
  @IsEnum(AIModelType, { message: 'Loại AI model không hợp lệ' })
  aiModel?: string;

  @IsOptional()
  @IsString()
  nameModel?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(2)
  temperature?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  top_p?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  top_k?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(2)
  frequency_penalty?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(2)
  presence_penalty?: number;

  @IsOptional()
  @IsNumber()
  @Min(100)
  max_tokens?: number;

  @IsOptional()
  @IsBoolean()
  status?: boolean;
}
