import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { ResponseInterceptor } from './common/interceptors/response.interceptor';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { RolesGuard } from './common/guards/roles.guard';

import appConfig from './config/app.config';
import { DatabaseModule } from './database/database.module';
import { RedisCacheModule } from './common/cache/redis-cache.module';
import { UserModule } from './user/user.module';
import { AuthModule } from './auth/auth.module';
import { AccessControl } from 'accesscontrol';
import { accessControl } from './common/access-control';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig],
    }),
    DatabaseModule, // Đảm bảo module này được import trước các module khác
    RedisCacheModule,
    UserModule,
    AuthModule,
  ],
  providers: [
    {
      provide: APP_FILTER,
      useClass: HttpExceptionFilter,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: ResponseInterceptor,
    },
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
    {
      provide: AccessControl,
      useValue: accessControl,
    },
  ],
})
export class AppModule {}
