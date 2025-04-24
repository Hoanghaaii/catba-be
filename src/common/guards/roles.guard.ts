import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AccessControl } from 'accesscontrol';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { REQUEST_ACTION_KEY } from '../decorators/action.decorator';
import { REQUEST_RESOURCE_KEY } from '../decorators/resource.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private accessControl: AccessControl,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredRoles) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('User not found in request');
    }

    const action = this.reflector.getAllAndOverride<string>(
      REQUEST_ACTION_KEY,
      [context.getHandler(), context.getClass()],
    );

    const resource = this.reflector.getAllAndOverride<string>(
      REQUEST_RESOURCE_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!action || !resource) {
      throw new ForbiddenException('Missing action or resource decorator');
    }

    const userRole = user.role;

    if (!requiredRoles.includes(userRole)) {
      throw new ForbiddenException(
        `User role ${userRole} is not allowed to access this resource`,
      );
    }

    const permission = this.accessControl.can(userRole)[action](resource);

    if (!permission.granted) {
      throw new ForbiddenException(
        `User role ${userRole} is not allowed to ${action} ${resource}`,
      );
    }

    return true;
  }
}
