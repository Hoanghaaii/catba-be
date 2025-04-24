// src/common/rbac/rbac.module.ts
import { Module, Global } from '@nestjs/common';
import { AccessControlFactory } from './access-control.factory';
import { RolesGuard } from './guards/roles.guard';

@Global()
@Module({
  providers: [AccessControlFactory, RolesGuard],
  exports: [AccessControlFactory, RolesGuard],
})
export class RBACModule {}
