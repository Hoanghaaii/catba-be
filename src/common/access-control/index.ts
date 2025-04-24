import { AccessControl } from 'accesscontrol';
import { ROLES, RESOURCES } from '../constants';

// Define grants using the AccessControl library
const grants = {
  [ROLES.USER]: {
    [RESOURCES.USER]: {
      'read:own': ['*'],
      'update:own': ['*'],
    },
  },
  [ROLES.ADMIN]: {
    [RESOURCES.USER]: {
      'create:any': ['*'],
      'read:any': ['*'],
      'update:any': ['*'],
      'delete:any': ['*'],
    },
  },
};

// Create and build AccessControl instance
export const accessControl = new AccessControl(grants);
