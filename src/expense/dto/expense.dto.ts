// src/expense/dto/expense.dto.ts
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  MinLength,
} from 'class-validator';
import { MemberType } from '../schemas/expense.schema';
import { Transform } from 'class-transformer';

export class CreateExpenseDto {
  @IsNumber()
  @IsPositive()
  @IsNotEmpty()
  amount: number;

  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  description: string;

  @IsEnum(MemberType, { message: 'Người thanh toán không hợp lệ' })
  @IsNotEmpty()
  paidBy: string;

  @IsArray()
  @IsEnum(MemberType, {
    each: true,
    message: 'Thành viên tham gia không hợp lệ',
  })
  @IsNotEmpty()
  participants: string[];
}

export class UpdateExpenseDto {
  @IsOptional()
  @IsNumber()
  @IsPositive()
  amount?: number;

  @IsOptional()
  @IsString()
  @MinLength(3)
  description?: string;

  @IsOptional()
  @IsEnum(MemberType, { message: 'Người thanh toán không hợp lệ' })
  paidBy?: string;

  @IsOptional()
  @IsArray()
  @IsEnum(MemberType, {
    each: true,
    message: 'Thành viên tham gia không hợp lệ',
  })
  participants?: string[];

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class ExpenseQueryDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsEnum(MemberType, { message: 'Người thanh toán không hợp lệ' })
  paidBy?: string;

  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value;
  })
  isActive?: boolean;
}
