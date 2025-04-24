export const ROLES = {
  ADMIN: 'admin',
  USER: 'user',
};

export const CACHE_KEYS = {
  USER_PROFILE: 'user_profile_',
  USER_LIST: 'user_list',
};

export const CACHE_TTL = {
  SHORT: 60 * 5, // 5 minutes
  MEDIUM: 60 * 30, // 30 minutes
  LONG: 60 * 60 * 24, // 1 day
};

export const MONGO_CONNECTION = 'MONGO_CONNECTION';

export const JWT = {
  ACCESS_TOKEN_SECRET: process.env.ACCESS_TOKEN_SECRET || 'access_token_secret',
  REFRESH_TOKEN_SECRET:
    process.env.REFRESH_TOKEN_SECRET || 'refresh_token_secret',
  ACCESS_TOKEN_EXPIRATION: process.env.ACCESS_TOKEN_EXPIRATION || '15m',
  REFRESH_TOKEN_EXPIRATION: process.env.REFRESH_TOKEN_EXPIRATION || '7d',
};

export const RESOURCES = {
  USER: 'user',
  AUTH: 'auth',
};
