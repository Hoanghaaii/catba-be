import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
} from '@nestjs/common';
import { Response } from 'express';

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const status = exception.getStatus();

    // Lấy response từ exception
    const exceptionResponse = exception.getResponse();

    // Nếu exceptionResponse là object (như từ ValidationPipe), lấy message và errors
    const message =
      typeof exceptionResponse === 'object' && exceptionResponse['message']
        ? exceptionResponse['message']
        : exception.message || 'An error occurred';

    const errors =
      typeof exceptionResponse === 'object' && exceptionResponse['errors']
        ? exceptionResponse['errors']
        : undefined;

    response.status(status).json({
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method,
      message,
      errors, // Thêm errors nếu có
      error: exception.name,
    });
  }
}
