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
import { UserService } from 'src/user/user.service';

@Injectable()
export class ApiKeyService {
  constructor(
    @InjectModel(ApiKey.name) private readonly apiKeyModel: Model<ApiKey>,
    private readonly userService: UserService,
  ) {}

  async create(dto: CreateApiKeyDto, user: User) {
    try {
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

        // Kiểm tra sự tồn tại của userId bằng UserService
        try {
          const existingUser = await this.userService.findById(dto.userId);
          if (!existingUser) {
            throw new BadRequestException(
              `User with ID '${dto.userId}' does not exist`,
            );
          }
          ownerId = new Types.ObjectId(dto.userId);
        } catch (error) {
          throw new BadRequestException(
            `User with ID '${dto.userId}' does not exist`,
          );
        }
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
   * Tạo nhiều API key cùng một lúc từ danh sách.
   * @param dto    DTO chứa mảng các API key cần tạo.
   * @param user   Thông tin người dùng đang thực hiện request.
   * @returns      Danh sách các API key đã được tạo thành công.
   */
  async bulkCreate(dto: BulkCreateApiKeyDto, user: User) {
    try {
      // Khai báo rõ ràng kiểu dữ liệu
      const createdKeys: any[] = [];
      const errors: { key: string; error: string }[] = [];

      // Xử lý từng API key trong mảng
      for (let i = 0; i < dto.apiKeys.length; i++) {
        try {
          const keyDto = dto.apiKeys[i];
          const createdKey = await this.create(keyDto, user);

          // Thêm vào mảng kết quả bằng spread operator để tránh lỗi kiểu
          createdKeys.push(
            createdKey.toObject ? createdKey.toObject() : createdKey,
          );
        } catch (error) {
          // Ghi lại lỗi cùng với key để báo cáo
          errors.push({
            key: dto.apiKeys[i].key,
            error: error.message || String(error),
          });
        }
      }

      // Trả về kết quả với số lượng key đã tạo và danh sách lỗi nếu có
      return {
        success: createdKeys.length,
        total: dto.apiKeys.length,
        createdKeys,
        errors: errors.length > 0 ? errors : [],
      };
    } catch (error) {
      console.log('MongoDB error:', error.message);
      throw new HttpException(
        'Failed to bulk create API keys',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
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
