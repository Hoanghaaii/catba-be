import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from './schemas/user.schema';
import { CreateUserDto, UpdateUserDto, UserQueryDto } from './dto/user.dto';
import {
  hashPassword,
  formatMongooseDoc,
  formatMongooseDocs,
} from '../common/utils';
import { CACHE_TTL, CACHE_KEYS } from '../common/constants';
import { Inject } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';

@Injectable()
export class UserService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  /**
   * Create a new user
   * @param createUserDto User data
   * @returns Created user
   */
  async create(createUserDto: CreateUserDto): Promise<User> {
    // Check if email already exists
    const existingUser = await this.userModel
      .findOne({ email: createUserDto.email })
      .exec();
    if (existingUser) {
      throw new ConflictException('Email already exists');
    }

    try {
      // Hash password
      const hashedPassword = await hashPassword(createUserDto.password);

      // Create new user
      const newUser = new this.userModel({
        ...createUserDto,
        password: hashedPassword,
      });

      // Save user
      const savedUser = await newUser.save();

      // Clear cache for user list
      await this.cacheManager.del(CACHE_KEYS.USER_LIST);

      return savedUser;
    } catch (error) {
      throw new BadRequestException('Could not create user');
    }
  }

  /**
   * Find all users
   * @param query Query parameters
   * @returns List of users
   */
  async findAll(query: UserQueryDto = {}): Promise<any[]> {
    // Try to get from cache first
    const cacheKey = `${CACHE_KEYS.USER_LIST}_${JSON.stringify(query)}`;
    const cachedUsers = await this.cacheManager.get<any[]>(cacheKey);

    if (cachedUsers) {
      return cachedUsers;
    }

    // Build query
    const queryConditions: any = {};

    if (query.role) {
      queryConditions.role = query.role;
    }

    if (query.isActive !== undefined) {
      queryConditions.isActive = query.isActive;
    }

    if (query.search) {
      queryConditions.$or = [
        { firstName: { $regex: query.search, $options: 'i' } },
        { lastName: { $regex: query.search, $options: 'i' } },
        { email: { $regex: query.search, $options: 'i' } },
      ];
    }

    // Execute query
    const users = await this.userModel
      .find(queryConditions)
      .sort({ createdAt: -1 })
      .exec();

    // Format and cache results
    const formattedUsers = formatMongooseDocs(users);
    await this.cacheManager.set(cacheKey, formattedUsers, CACHE_TTL.MEDIUM);

    return formattedUsers;
  }
  /**
   * Find user by id
   * @param id User id
   * @returns User
   */
  async findById(id: string): Promise<User> {
    // Try to get from cache first
    const cacheKey = `${CACHE_KEYS.USER_PROFILE}_${id}`;
    const cachedUser = await this.cacheManager.get<User>(cacheKey);

    if (cachedUser) {
      return cachedUser;
    }

    // Get from DB
    const user = await this.userModel.findById(id).exec();

    if (!user) {
      throw new NotFoundException(`User with id ${id} not found`);
    }

    await this.cacheManager.set(cacheKey, user, CACHE_TTL.MEDIUM);

    return user;
  }

  /**
   * Find user by email
   * @param email User email
   * @returns User
   */
  async findByEmail(email: string): Promise<UserDocument> {
    const user = await this.userModel.findOne({ email }).exec();

    if (!user) {
      throw new NotFoundException(`User with email ${email} not found`);
    }

    return user;
  }

  /**
   * Update user
   * @param id User id
   * @param updateUserDto Update data
   * @returns Updated user
   */
  async update(id: string, updateUserDto: UpdateUserDto): Promise<User> {
    // Check if user exists
    const user = await this.userModel.findById(id).orFail().exec();

    if (!user) {
      throw new NotFoundException(`User with id ${id} not found`);
    }

    // Check if email exists and it's not the current user's email
    if (updateUserDto.email && updateUserDto.email !== user.email) {
      const existingUser = await this.userModel
        .findOne({ email: updateUserDto.email })
        .exec();
      if (existingUser) {
        throw new ConflictException('Email already exists');
      }
    }

    try {
      // Hash password if it's being updated
      if (updateUserDto.password) {
        updateUserDto.password = await hashPassword(updateUserDto.password);
      }

      // Update user
      const updatedUser = await this.userModel
        .findByIdAndUpdate(id, updateUserDto, { new: true })
        .exec();
      if (!updatedUser) {
        throw new NotFoundException(`User with id ${id} not found`);
      }

      // Clear cache
      await this.cacheManager.del(`${CACHE_KEYS.USER_PROFILE}_${id}`);
      await this.cacheManager.del(CACHE_KEYS.USER_LIST);

      return updatedUser;
    } catch (error) {
      throw new BadRequestException('Could not update user');
    }
  }

  //   /**
  //    * Delete user
  //    * @param id User id
  //    * @returns Deleted user
  //    */
  //   async remove(id: string): Promise<User> {
  //     // Check if user exists
  //     const user = await this.userModel.findById(id).exec();

  //     if (!user) {
  //       throw new NotFoundException(`User with id ${id} not found`);
  //     }

  //     try {
  //       // Delete user
  //       const deletedUser = await this.userModel.findByIdAndDelete(id).exec();

  //       // Clear cache
  //       await this.cacheManager.del(`${CACHE_KEYS.USER_PROFILE}_${id}`);
  //       await this.cacheManager.del(CACHE_KEYS.USER_LIST);

  //       return deletedUser;
  //     } catch (error) {
  //       throw new BadRequestException('Could not delete user');
  //     }
  //   }

  /**
   * Update user's refresh token
   * @param userId User id
   * @param refreshToken Refresh token or null to clear
   */
  async updateRefreshToken(
    userId: string,
    refreshToken: string | null,
  ): Promise<void> {
    await this.userModel.findByIdAndUpdate(userId, { refreshToken }).exec();
    await this.cacheManager.del(`${CACHE_KEYS.USER_PROFILE}_${userId}`);
  }

  /**
   * Update user's last login time
   * @param userId User id
   */
  async updateLastLogin(userId: string): Promise<void> {
    await this.userModel
      .findByIdAndUpdate(userId, { lastLogin: new Date() })
      .exec();
    await this.cacheManager.del(`${CACHE_KEYS.USER_PROFILE}_${userId}`);
  }
}
