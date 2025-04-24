import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';
import { MongoError } from 'mongodb';

// Định nghĩa interface mở rộng cho MongoError
interface MongoErrorExtended extends MongoError {
  keyPattern?: { [key: string]: number };
  keyValue?: { [key: string]: any };
}

@Catch(MongoError)
export class MongoExceptionFilter implements ExceptionFilter {
  catch(exception: MongoError, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    // Xử lý các lỗi MongoDB cụ thể
    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';

    // Ép kiểu exception thành MongoErrorExtended
    const mongoError = exception as MongoErrorExtended;

    switch (mongoError.code) {
      case 11000: // Duplicate key error (E11000)
        status = HttpStatus.CONFLICT;
        message = 'Duplicate key error';
        if (mongoError.keyPattern && mongoError.keyValue) {
          message = `Duplicate value '${Object.values(mongoError.keyValue)[0]}' for field '${Object.keys(mongoError.keyPattern)[0]}'`;
        }
        break;

      case 121: // Validation error
        status = HttpStatus.BAD_REQUEST;
        message = 'Document validation failed';
        break;

      case 13: // Unauthorized (thường liên quan đến quyền truy cập database)
        status = HttpStatus.FORBIDDEN;
        message = 'Unauthorized database access';
        break;

      case 112: // Write conflict
        status = HttpStatus.CONFLICT;
        message = 'Write conflict error';
        break;

      default:
        // Các lỗi MongoDB khác
        message = mongoError.message || 'MongoDB error';
        break;
    }

    response.status(status).json({
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method,
      message,
      error: 'MongoError',
    });
  }
}
