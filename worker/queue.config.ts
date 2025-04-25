// worker/queue.config.ts
import { ConfigService } from '@nestjs/config';

export enum Queues {
  SCRIPT = 'script-queue',
  EMAIL = 'email-queue',
}

export const getRedisConnectionConfig = (configService: ConfigService) => ({
  host: configService.get('REDIS_HOST', 'localhost'),
  port: configService.get<number>('REDIS_PORT', 6379),
  password: configService.get('REDIS_PASSWORD') || undefined,
});
