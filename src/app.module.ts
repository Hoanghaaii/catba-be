// src/app.module.ts
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { ResponseInterceptor } from './common/interceptors/response.interceptor';
import { RBACModule } from './common/rbac/rbac.module';

import appConfig from './config/app.config';
import { DatabaseModule } from './database/database.module';
import { RedisCacheModule } from './common/cache/redis-cache.module';
import { UserModule } from './user/user.module';
import { AuthModule } from './auth/auth.module';
import { ApiKeyModule } from './api-key/api-key.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig],
    }),
    DatabaseModule,
    RedisCacheModule,
    RBACModule,
    UserModule,
    AuthModule,
    ApiKeyModule,
  ],
  providers: [
    {
      provide: APP_INTERCEPTOR,
      useClass: ResponseInterceptor,
    },
    {
      provide: APP_FILTER,
      useClass: HttpExceptionFilter,
    },
  ],
})
export class AppModule {}
