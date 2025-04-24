import { registerAs } from '@nestjs/config';

export default registerAs('app', () => ({
  environment: process.env.NODE_ENV || 'development',
  port: process.env.PORT,
  apiPrefix: process.env.API_PREFIX || 'api',
  mongo: {
    uri: process.env.MONGO_URI || 'mongodb://localhost:27017/nest-app',
    options: {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    },
  },
  jwt: {
    accessTokenSecret: process.env.ACCESS_TOKEN_SECRET || 'access_token_secret',
    refreshTokenSecret:
      process.env.REFRESH_TOKEN_SECRET || 'refresh_token_secret',
    accessTokenExpiration: process.env.ACCESS_TOKEN_EXPIRATION || '15m',
    refreshTokenExpiration: process.env.REFRESH_TOKEN_EXPIRATION || '7d',
  },
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: process.env.REDIS_PORT ? parseInt(process.env.REDIS_PORT, 10) : 6379,
    ttl: process.env.REDIS_TTL ? parseInt(process.env.REDIS_TTL, 10) : 300,
    password: process.env.REDIS_PASSWORD || null,
  },
}));
