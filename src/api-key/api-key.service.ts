import {
  BadRequestException,
  ConflictException,
  HttpException,
  HttpStatus,
  Injectable,
} from '@nestjs/common';
import { BulkCreateApiKeyDto, CreateApiKeyDto } from './dto/apiKey.dto';
import {
  ApiKey,
  ApiKeyDocument,
  ApiKeyLiMitType,
} from './schemas/apiKey.schema';
import { Model, Types } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { User } from 'src/user/schemas/user.schema';
import { ROLES } from 'src/common/constants';

@Injectable()
export class ApiKeyService {
  constructor(
    @InjectModel(ApiKey.name) private readonly apiKeyModel: Model<ApiKey>,
    @InjectModel(User.name) private readonly userModel: Model<User>,
  ) {}
  async create(dto: CreateApiKeyDto, user: User) {
    try {
      console.log(
        '🔍 ~ create ~ tytb2-backend/src/api-key/api-key.service.ts:25 ~ dto:',
        dto,
      );
      const isAdmin = user.role === ROLES.ADMIN;
      const isAdminOverride = isAdmin && dto.userId;

      // Kiểm tra và chuyển đổi ownerId
      let ownerId: Types.ObjectId;
      if (isAdminOverride) {
        if (!dto.userId) {
          throw new BadRequestException(
            'userId is required for admin override',
          );
        }
        if (!Types.ObjectId.isValid(dto.userId)) {
          throw new BadRequestException('Invalid userId format');
        }
        // Kiểm tra sự tồn tại của userId
        const existingUser = await this.userModel.findById(dto.userId).exec();

        if (!existingUser) {
          throw new BadRequestException(
            `User with ID '${dto.userId}' does not exist`,
          );
        }
        ownerId = new Types.ObjectId(dto.userId);
      } else {
        // Giả sử user._id đã là Types.ObjectId
        if (!user._id) {
          throw new BadRequestException('User _id is missing');
        }
        ownerId = user._id;
      }

      // Kiểm tra aiModelId
      if (!dto.aiModelId || !Types.ObjectId.isValid(dto.aiModelId)) {
        throw new BadRequestException('Invalid aiModelId format');
      }

      const payload: Partial<ApiKey> = {
        key: dto.key,
        userId: ownerId,
        limitType: dto.limitType ?? ApiKeyLiMitType.ACTIVE,
        totalToken: dto.totalToken ?? 0,
        isAdminOwner: isAdmin,
        rentAt: isAdmin ? new Date() : undefined,
        status: true,
        totalUsed: 0,
        usedDay: 0,
        isUsed: false,
        aiModelId: new Types.ObjectId(dto.aiModelId),
      };

      const doc = new this.apiKeyModel(payload);
      return await doc.save();
    } catch (error) {
      console.log('MongoDB error:', error.message);
      if (error.code === 11000) {
        throw new ConflictException(
          `Duplicate value '${dto.key}' for field 'key'`,
        );
      }
      throw error;
    }
  }

  /**
   * Tạo nhiều API key cùng một lúc từ danh sách mà không phụ thuộc vào hàm create.
   * @param dto    DTO chứa mảng các API key cần tạo.
   * @param user   Thông tin người dùng đang thực hiện request.
   * @returns      Kết quả tạo API key với danh sách thành công và lỗi.
   */
  async bulkCreate(dto: BulkCreateApiKeyDto, user: User) {
    try {
      console.log(
        '🔍 ~ bulkCreate ~ tytb2-backend/src/api-key/api-key.service.ts ~ dto:',
        dto,
      );

      const isAdmin = user.role === ROLES.ADMIN;
      const createdKeys: ApiKeyDocument[] = [];
      const errors: { key: string; error: string }[] = [];

      // Bước 1: Thu thập tất cả keys để kiểm tra trùng lặp
      const allKeys = dto.apiKeys.map((apiKey) => apiKey.key);

      // Bước 2: Kiểm tra keys trùng lặp trong database
      const existingKeys = await this.apiKeyModel
        .find({
          key: { $in: allKeys },
        })
        .exec();

      const existingKeyMap = new Map();
      existingKeys.forEach((key) => {
        existingKeyMap.set(key.key, true);
      });

      // Bước 3: Tạo danh sách userIds cần kiểm tra (nếu admin gửi userId)
      const userIds = dto.apiKeys
        .filter((item) => isAdmin && item.userId)
        .map((item) => item.userId as string); // Type assertion ở đây

      const uniqueUserIds = [...new Set(userIds)];
      let userMap = new Map();

      // Bước 4: Kiểm tra tồn tại của userIds (nếu có)
      if (uniqueUserIds.length > 0) {
        // Lọc chỉ những userId hợp lệ
        const validUserIds = uniqueUserIds.filter(
          (id) => id !== undefined && Types.ObjectId.isValid(id),
        );

        if (validUserIds.length > 0) {
          const existingUsers = await this.userModel
            .find({
              _id: { $in: validUserIds.map((id) => new Types.ObjectId(id)) },
            })
            .exec();

          existingUsers.forEach((user) => {
            userMap.set(user._id.toString(), user);
          });
        }
      }

      // Bước 5: Xử lý từng apiKey trong mảng
      for (const apiKeyDto of dto.apiKeys) {
        try {
          // Kiểm tra key đã tồn tại
          if (existingKeyMap.has(apiKeyDto.key)) {
            errors.push({
              key: apiKeyDto.key,
              error: `Duplicate API key '${apiKeyDto.key}' already exists`,
            });
            continue;
          }

          // Xác định userId
          let ownerId: Types.ObjectId;
          if (isAdmin && apiKeyDto.userId) {
            // Trường hợp admin tạo key cho user khác
            if (!Types.ObjectId.isValid(apiKeyDto.userId)) {
              errors.push({
                key: apiKeyDto.key,
                error: `Invalid userId format: '${apiKeyDto.userId}'`,
              });
              continue;
            }

            // Kiểm tra user tồn tại
            if (!userMap.has(apiKeyDto.userId)) {
              errors.push({
                key: apiKeyDto.key,
                error: `User with ID '${apiKeyDto.userId}' does not exist`,
              });
              continue;
            }

            // Ở đây chúng ta đã kiểm tra apiKeyDto.userId không phải undefined
            ownerId = new Types.ObjectId(apiKeyDto.userId as string);
          } else {
            // User thông thường tạo key cho chính họ
            if (!user._id) {
              errors.push({
                key: apiKeyDto.key,
                error: 'User _id is missing',
              });
              continue;
            }
            ownerId = user._id;
          }

          // Kiểm tra aiModelId
          if (
            !apiKeyDto.aiModelId ||
            !Types.ObjectId.isValid(apiKeyDto.aiModelId)
          ) {
            errors.push({
              key: apiKeyDto.key,
              error: 'Invalid aiModelId format',
            });
            continue;
          }

          // Tạo document API key mới
          const newApiKey: Partial<ApiKey> = {
            key: apiKeyDto.key,
            userId: ownerId,
            limitType: apiKeyDto.limitType ?? ApiKeyLiMitType.ACTIVE,
            totalToken: apiKeyDto.totalToken ?? 0,
            isAdminOwner: isAdmin,
            rentAt: isAdmin ? new Date() : undefined,
            status: true,
            totalUsed: 0,
            usedDay: 0,
            isUsed: false,
            aiModelId: new Types.ObjectId(apiKeyDto.aiModelId),
          };

          const apiKeyDoc = new this.apiKeyModel(newApiKey);
          const savedApiKey = await apiKeyDoc.save();
          createdKeys.push(savedApiKey);

          // Thêm key mới vào map để kiểm tra trùng lặp cho các key tiếp theo
          existingKeyMap.set(apiKeyDto.key, true);
        } catch (error) {
          errors.push({
            key: apiKeyDto.key,
            error: error.message || String(error),
          });
        }
      }

      // Trả về kết quả
      return {
        success: createdKeys.length,
        total: dto.apiKeys.length,
        createdKeys,
        errors: errors.length > 0 ? errors : [],
      };
    } catch (error) {
      console.log('MongoDB error:', error.message);
      throw error;
    }
  }

  /**
   * Lấy danh sách API key khả dụng theo userId.
   * @param userId    ID của người dùng cần lấy API key.
   * @returns         Danh sách các API key khả dụng.
   */
  async getAvailableApiKey(userId: string): Promise<ApiKey[]> {
    try {
      const availableKeys = await this.apiKeyModel
        .find({
          userId: userId,
          status: true,
          isUsed: false,
          limitType: ApiKeyLiMitType.ACTIVE,
        })
        .exec();

      return availableKeys;
    } catch (error) {
      console.log('MongoDB error:', error.message);
      throw new HttpException(
        'Failed to fetch available API keys',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
