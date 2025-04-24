import {
  ConflictException,
  HttpException,
  HttpStatus,
  Injectable,
} from '@nestjs/common';
import { CreateApiKeyDto } from './dto/apiKey.dto';
import { ApiKey, ApiKeyLiMitType } from './schemas/apiKey.schema';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { User } from 'src/user/schemas/user.schema';
import { ROLES } from 'src/common/constants';

@Injectable()
export class ApiKeyService {
  constructor(
    @InjectModel(ApiKey.name) private readonly apiKeyModel: Model<ApiKey>,
  ) {}
  /**
   * Tạo API key mới.
   * @param dto      Dữ liệu client gửi lên.
   * @param user     Người đang đăng nhập.
   */
  async create(dto: CreateApiKeyDto, user: User) {
    try {
      const isAdmin = user.role === ROLES.ADMIN;
      const isAdminOverride = isAdmin && dto.userId;

      const ownerId = (isAdminOverride ? dto.userId : user._id)?.toString();

      const payload: Partial<ApiKey> = {
        key: dto.key,
        userId: ownerId,
        limitType: dto.limitType ?? ApiKeyLiMitType.ACTIVE,
        totalToken: dto.totalToken ?? 0,
        isAdminOwner: isAdmin ? true : false,
        rentAt: isAdmin ? new Date() : undefined,
        status: true,
        totalUsed: 0,
        usedDay: 0,
        isUsed: false,
      };

      const doc = new this.apiKeyModel(payload);
      return await doc.save();
    } catch (error) {
      // Log lỗi để debug
      console.log('MongoDB error:', error.message);
      // Ném HttpException để HttpExceptionFilter xử lý
      if (error.code === 11000) {
        throw new ConflictException(
          `Duplicate value '${dto.key}' for field 'key'`,
        );
      }
      // Ném lỗi chung nếu không phải lỗi trùng lặp
      throw new HttpException(
        'Internal server error',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Tạo nhiều API key cùng lúc.
   * @param dtos     Danh sách dữ liệu API key từ client.
   * @param user     Người đang đăng nhập.
   */
  async bulkCreate(dtos: CreateApiKeyDto[], user: User) {
    try {
      const isAdmin = user.role === ROLES.ADMIN;

      // Tạo payload cho từng API key
      const payloads: Partial<ApiKey>[] = dtos.map((dto) => {
        const isAdminOverride = isAdmin && dto.userId;
        const ownerId = (isAdminOverride ? dto.userId : user._id)?.toString();

        return {
          key: dto.key,
          userId: ownerId,
          limitType: dto.limitType ?? ApiKeyLiMitType.ACTIVE,
          totalToken: dto.totalToken ?? 0,
          isAdminOwner: isAdmin ? true : false,
          rentAt: isAdmin ? new Date() : undefined,
          status: true,
          totalUsed: 0,
          usedDay: 0,
          isUsed: false,
        };
      });

      // Tạo từng API key riêng lẻ bằng Promise.allSettled
      const results = await Promise.allSettled(
        payloads.map(async (payload) => {
          const doc = new this.apiKeyModel(payload);
          return await doc.save();
        }),
      );

      // Phân loại kết quả
      const successful: ApiKey[] = [];
      const failed: { key: string; error: string }[] = [];

      results.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          successful.push(result.value);
        } else {
          const error = result.reason;
          const key = payloads[index].key ?? 'unknown';
          if (error.code === 11000) {
            failed.push({
              key,
              error: `Duplicate value '${key}' for field 'key'`,
            });
          } else {
            failed.push({
              key,
              error: error.message ?? 'Internal server error',
            });
          }
        }
      });

      // Nếu tất cả đều thất bại, ném lỗi
      if (successful.length === 0 && failed.length > 0) {
        throw new ConflictException({
          message: 'Failed to create API keys: All keys are duplicated',
          failed,
        });
      }

      // Trả về kết quả
      return {
        successful,
        failed,
      };
    } catch (error) {
      console.log('MongoDB error:', error.message);
      if (error instanceof ConflictException) {
        throw error;
      }
      throw new HttpException(
        'Internal server error',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
