// src/common/rbac/access-control.factory.ts
import { Injectable } from '@nestjs/common';
import { AccessControl } from 'accesscontrol';
import { ROLES } from '../constants';

@Injectable()
export class AccessControlFactory {
  private ac: AccessControl;

  constructor() {
    this.ac = this.initializeRoles();
  }

  private initializeRoles(): AccessControl {
    const ac = new AccessControl();

    // Admin can do everything
    ac.grant(ROLES.ADMIN)
      .createAny('user')
      .readAny('user')
      .updateAny('user')
      .deleteAny('user')
      .createAny('profile')
      .readAny('profile')
      .updateAny('profile')
      .deleteAny('profile')
      .createAny('apiKey')
      .updateAny('apiKey')
      .readAny('apiKey')
      .deleteAny('apiKey');

    // Regular user - can manage own profile and see own user data
    ac.grant(ROLES.USER)
      .readAny('user')
      .updateOwn('user')
      .deleteOwn('user')
      .readOwn('profile')
      .updateOwn('profile')
      .readOwn('apiKey')
      .createOwn('apiKey')
      .updateOwn('apiKey')
      .deleteOwn('apiKey');

    return ac;
  }

  /**
   * Get AccessControl instance
   */
  getAccessControl(): AccessControl {
    return this.ac;
  }

  /**
   * Check if a user can perform an action on a resource
   * @param roles User role(s)
   * @param action Action to perform (create, read, update, delete)
   * @param resource Resource to access (user, profile, etc.)
   * @param isOwn Whether the resource belongs to the user
   */
  can(
    roles: string | string[],
    action: string,
    resource: string,
    isOwn: boolean = false,
  ): boolean {
    // Convert string role to array
    const roleArray = Array.isArray(roles) ? roles : [roles];

    // No roles means no access
    if (!roleArray || roleArray.length === 0) {
      return false;
    }

    // Admin always has access to everything
    if (roleArray.includes(ROLES.ADMIN)) {
      return true;
    }

    // Format the permission query
    const possession = isOwn ? 'Own' : 'Any';
    const permissionQuery = `${action}${possession}`;

    // Check each role for permission
    for (const role of roleArray) {
      try {
        // Get the permission object for this role, action, and resource
        const permission = this.ac.can(role)[permissionQuery](resource);

        // If any role has permission, return true
        if (permission.granted) {
          console.log(
            `Permission ${role} ${action}:${possession} ${resource} = true`,
          );
          return true;
        }
      } catch (error) {
        console.error(`Error checking permission for role ${role}:`, error);
        // Continue checking other roles
      }
    }

    // No role has permission
    console.log(
      `Permission denied for ${roleArray.join(', ')} ${action}:${possession} ${resource}`,
    );
    return false;
  }
}
