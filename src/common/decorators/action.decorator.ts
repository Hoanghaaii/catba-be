import { SetMetadata } from '@nestjs/common';

export const REQUEST_ACTION_KEY = 'action';
export const Action = (action: string) =>
  SetMetadata(REQUEST_ACTION_KEY, action);
