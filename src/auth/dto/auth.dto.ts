import { IsEmail, IsString, IsNotEmpty, Length } from 'class-validator';

// Login DTO
export class LoginDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  @Length(6, 50)
  password: string;
}

// Register DTO
export class RegisterDto {
  @IsString()
  @IsNotEmpty()
  @Length(2, 50)
  firstName: string;

  @IsString()
  @IsNotEmpty()
  @Length(2, 50)
  lastName: string;

  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  @Length(6, 50)
  password: string;
}

// Refresh Token DTO
export class RefreshTokenDto {
  @IsString()
  @IsNotEmpty()
  refreshToken: string;
}

// Auth Response DTO
export class AuthResponseDto {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    role: string;
  };
}

// Password Reset Request DTO
export class PasswordResetRequestDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;
}

// Password Reset DTO
export class PasswordResetDto {
  @IsString()
  @IsNotEmpty()
  token: string;

  @IsString()
  @IsNotEmpty()
  @Length(6, 50)
  password: string;
}
