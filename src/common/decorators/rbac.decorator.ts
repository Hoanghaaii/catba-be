// src/common/decorators/rbac.decorator.ts
import { SetMetadata } from '@nestjs/common';

export const RBAC_KEY = 'rbac_permission';

export interface RBACPermission {
  action: string;
  resource: string;
  possession: 'own' | 'any';
}

export const RBAC = (
  action: string,
  resource: string,
  possession: 'own' | 'any' = 'any',
) => SetMetadata(RBAC_KEY, { action, resource, possession } as RBACPermission);
