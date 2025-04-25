import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { UserService } from '../user/user.service';
import { RefreshToken, RefreshTokenDocument } from './schemas/auth.schema';
import { LoginDto, RegisterDto, RefreshTokenDto } from './dto/auth.dto';
import { comparePassword, generateRandomString } from '../common/utils';
import { User, UserDocument } from 'src/user/schemas/user.schema';

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    @InjectModel(RefreshToken.name)
    private refreshTokenModel: Model<RefreshTokenDocument>,
  ) {}

  /**
   * Validate user credentials
   * @param email User email
   * @param password User password
   * @returns User if valid
   */
  async validateUser(email: string, password: string) {
    try {
      const user = await this.userService.findByEmail(email);

      if (!user) {
        throw new UnauthorizedException(
          'Không tìm thấy email người dùng phù hợp!',
        );
      }
      const isPasswordValid = await comparePassword(password, user.password);

      if (!isPasswordValid) {
        throw new UnauthorizedException('Mật khẩu không đúng!');
      }

      if (!user.isActive) {
        throw new UnauthorizedException('Người dùng đã bị khoá!');
      }

      return user;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Login user
   * @param loginDto Login credentials
   * @returns Auth response with tokens and user data
   */
  async login(loginDto: LoginDto) {
    const { email, password } = loginDto;

    const user: any = await this.validateUser(email, password);

    const tokens = await this.generateTokens(user._id.toString());

    // Update last login time
    await this.userService.updateLastLogin(user._id.toString());

    return {
      ...tokens,
      user,
    };
  }

  /**
   * Register a new user
   * @param registerDto Registration data
   * @returns Auth response with tokens and user data
   */
  async register(registerDto: RegisterDto) {
    try {
      const newUser: any = await this.userService.create(registerDto);

      const tokens = await this.generateTokens(newUser._id);

      // Update last login time
      await this.userService.updateLastLogin(newUser._id);

      return {
        ...tokens,
        user: newUser,
      };
    } catch (error) {
      if (error instanceof ConflictException) {
        throw error;
      }
      throw new BadRequestException('Registration failed');
    }
  }

  /**
   * Generate new access and refresh tokens
   * @param userId User ID
   * @returns Access and refresh tokens
   */
  async generateTokens(userId: string) {
    const accessToken = this.generateAccessToken(userId);
    const refreshToken = await this.generateRefreshToken(userId);

    return {
      accessToken,
      refreshToken,
    };
  }

  /**
   * Generate access token
   * @param userId User ID
   * @returns Access token
   */
  generateAccessToken(userId: string) {
    const payload = { sub: userId };

    return this.jwtService.sign(payload, {
      secret: this.configService.getOrThrow<string>(
        'app.jwt.accessTokenSecret',
      ),
      expiresIn: this.configService.getOrThrow<string>(
        'app.jwt.accessTokenExpiration',
      ),
    });
  }

  /**
   * Generate refresh token
   * @param userId User ID
   * @returns Refresh token
   */
  async generateRefreshToken(userId: string) {
    // Create refresh token
    const token = generateRandomString(40);

    // Calculate expiration date
    const expiresIn = this.configService.getOrThrow<string>(
      'app.jwt.refreshTokenExpiration',
    );
    const expiresInMs = expiresIn.endsWith('d')
      ? parseInt(expiresIn.slice(0, -1)) * 24 * 60 * 60 * 1000
      : parseInt(expiresIn) * 1000;

    const expiresAt = new Date(Date.now() + expiresInMs);

    // Save token to database
    const refreshToken = new this.refreshTokenModel({
      token,
      userId,
      expiresAt,
    });

    await refreshToken.save();

    // Update user's refresh token
    await this.userService.updateRefreshToken(userId, token);

    return token;
  }

  /**
   * Refresh access token using refresh token
   * @param refreshTokenDto Refresh token
   * @returns New access and refresh tokens
   */
  async refreshToken(refreshTokenDto: RefreshTokenDto) {
    const { refreshToken } = refreshTokenDto;

    // Find token in database
    const storedToken = await this.refreshTokenModel
      .findOne({
        token: refreshToken,
        revoked: false,
        expiresAt: { $gt: new Date() },
      })
      .exec();

    if (!storedToken) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    // Mark token as revoked
    storedToken.revoked = true;
    storedToken.revokedAt = new Date();
    await storedToken.save();

    // Generate new tokens
    const userId = storedToken.userId.toString();
    const tokens = await this.generateTokens(userId);

    // Get user
    const user = await this.userService.findById(userId);

    return {
      ...tokens,
      user,
    };
  }

  /**
   * Logout user
   * @param userId User ID
   * @returns Success message
   */
  async logout(userId: string) {
    // Revoke all refresh tokens
    await this.refreshTokenModel
      .updateMany(
        { userId, revoked: false },
        { revoked: true, revokedAt: new Date() },
      )
      .exec();

    // Clear refresh token in user
    await this.userService.updateRefreshToken(userId, null);

    return {
      message: 'Logged out successfully',
    };
  }
}
