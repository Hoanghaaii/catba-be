// src/common/rbac/rbac.decorator.ts
import { SetMetadata } from '@nestjs/common';

export const RBAC_METADATA_KEY = 'rbac_metadata';

export interface RBACMetadata {
  action: string;
  resource: string;
  possession?: 'own' | 'any';
}

/**
 * RBAC decorator for controlling access to resources
 * @param action Action to perform (create, read, update, delete)
 * @param resource Resource to access (user, profile, etc.)
 * @param possession Whether the resource belongs to the user ('own' or 'any')
 */
export const RBAC = (
  action: string,
  resource: string,
  possession: 'own' | 'any' = 'any',
) =>
  SetMetadata(RBAC_METADATA_KEY, {
    action,
    resource,
    possession,
  } as RBACMetadata);
