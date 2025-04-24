import * as bcrypt from 'bcryptjs';

/**
 * Hash a password string
 * @param password Plain text password
 * @returns Hashed password
 */
export const hashPassword = async (password: string): Promise<string> => {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
};

/**
 * Compare password with hashed password
 * @param password Plain text password
 * @param hashedPassword Hashed password
 * @returns Boolean indicating whether passwords match
 */
export const comparePassword = async (
  password: string,
  hashedPassword: string,
): Promise<boolean> => {
  return bcrypt.compare(password, hashedPassword);
};

/**
 * Generate a random string
 * @param length Length of the string
 * @returns Random string
 */
export const generateRandomString = (length: number): string => {
  const chars =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

/**
 * Remove sensitive fields from an object
 * @param obj Object to clean
 * @param fields Fields to remove
 * @returns Cleaned object
 */
export const removeSensitiveFields = <T extends Record<string, any>>(
  obj: T,
  fields: string[] = ['password', '__v'],
): Partial<T> => {
  if (!obj) return obj;

  const newObj = { ...obj };
  fields.forEach((field) => {
    if (field in newObj) {
      delete newObj[field];
    }
  });

  return newObj;
};

/**
 * Format mongoose document to plain object
 * @param doc Mongoose document
 * @returns Plain object
 */
export const formatMongooseDoc = <T extends Record<string, any>>(
  doc: T,
): Record<string, any> => {
  if (!doc) return doc;

  // Convert to plain object if it's a mongoose document
  const obj = doc.toObject ? doc.toObject() : doc;

  // Convert _id to id
  if (obj._id) {
    obj.id = obj._id.toString();
    delete obj._id;
  }

  // Remove sensitive fields
  return removeSensitiveFields(obj);
};

/**
 * Format array of mongoose documents to plain objects
 * @param docs Array of mongoose documents
 * @returns Array of plain objects
 */
export const formatMongooseDocs = <T extends Record<string, any>>(
  docs: T[],
): Record<string, any>[] => {
  if (!docs) return docs;
  return docs.map(formatMongooseDoc);
};
