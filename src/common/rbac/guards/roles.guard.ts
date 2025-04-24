// src/common/rbac/guards/roles.guard.ts
import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AccessControlFactory } from '../access-control.factory';
import { RBAC_METADATA_KEY } from '../rbac.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private accessControlFactory: AccessControlFactory,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Lấy metadata RBAC từ route handler
    const rbacMetadata =
      this.reflector.get(RBAC_METADATA_KEY, context.getHandler()) || {};

    // Kiểm tra xem có đủ thông tin cần thiết không
    if (!rbacMetadata.action || !rbacMetadata.resource) {
      // Nếu không có metadata, cho phép truy cập (hoặc bạn có thể chặn)
      console.log('No RBAC metadata, allowing access');
      return true;
    }

    const action = rbacMetadata.action;
    const resource = rbacMetadata.resource;
    const possession = rbacMetadata.possession || 'any';
    const isOwn = possession === 'own';

    // Lấy user từ request
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    // Không có user nghĩa là không được phép
    if (!user) {
      console.log('No user found in request');
      throw new ForbiddenException(
        'Bạn không có quyền truy cập vào tài nguyên này',
      );
    }

    // Kiểm tra xem user có quyền cần thiết không
    const hasPermission = this.accessControlFactory.can(
      user.role,
      action,
      resource,
      isOwn,
    );

    if (!hasPermission) {
      throw new ForbiddenException(
        `Bạn không có quyền ${action} ${resource} này`,
      );
    }

    // Thêm kiểm tra cho "own" possession nếu user không phải admin
    if (isOwn && resource === 'user' && user.role !== 'admin') {
      const resourceId = request.params.id;
      if (resourceId && resourceId !== user.id.toString()) {
        throw new ForbiddenException(
          'Bạn chỉ có thể truy cập tài nguyên của chính mình',
        );
      }
    }
    return true;
  }
}
