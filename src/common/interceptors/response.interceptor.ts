import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface Response<T> {
  data: T;
  statusCode: number;
  message: string;
  timestamp: string;
}

// src/common/interceptors/response.interceptor.ts
@Injectable()
export class ResponseInterceptor<T> implements NestInterceptor<T, any> {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const now = Date.now();
    const httpContext = context.switchToHttp();
    const response = httpContext.getResponse();

    return next.handle().pipe(
      map((data) => {
        // Nếu data là Buffer, trả về nguyên vẹn
        if (Buffer.isBuffer(data)) {
          return data;
        }

        // Nếu không phải Buffer, áp dụng format JSON thông thường
        return {
          data,
          statusCode: response.statusCode,
          message: data?.message || 'Success',
          timestamp: new Date().toISOString(),
          executionTime: `${Date.now() - now}ms`,
        };
      }),
    );
  }
}
