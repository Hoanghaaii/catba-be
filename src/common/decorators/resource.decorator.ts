import { SetMetadata } from '@nestjs/common';

export const REQUEST_RESOURCE_KEY = 'resource';
export const Resource = (resource: string) =>
  SetMetadata(REQUEST_RESOURCE_KEY, resource);
