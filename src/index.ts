import type { Request } from 'express';
import { RequestHandler } from 'express';
import { promises as fs } from 'fs';
import multer, { FileFilterCallback } from 'multer';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import type { FieldConfig, MultermateOptions, MultermateRequest } from './types';

/**
 * Predefined MIME types organized by category
 */
const ALLOWED_MIME_TYPES = {
  images: ["image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp"],
  videos: [
    "video/mp4",
    "video/mpeg",
    "video/ogg",
    "video/webm",
    "video/quicktime",
    "video/x-msvideo",
    "video/x-ms-wmv",
  ],
  pdfs: ["application/pdf"],
  documents: [
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "application/vnd.ms-powerpoint",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    "text/plain",
  ],
  all: [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/gif",
    "image/webp",
    "video/mp4",
    "video/mpeg",
    "video/ogg",
    "video/webm",
    "video/quicktime",
    "video/x-msvideo",
    "video/x-ms-wmv",
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "application/vnd.ms-powerpoint",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    "text/plain",
  ],
};

/**
 * Configure storage for Multer
 */
const configureStorage = (destination?: string) => {
  return multer.diskStorage({
    destination: async (req: Request, file: Express.Multer.File, cb: (error: Error | null, destination: string) => void) => {
      try {
        const uploadPath = destination || 'uploads';
        await fs.mkdir(uploadPath, { recursive: true });
        cb(null, uploadPath);
      } catch (error) {
        cb(error as Error, '');
      }
    },
    filename: (req: Request, file: Express.Multer.File, cb: (error: Error | null, filename: string) => void) => {
      const sanitizedFilename = file.originalname.replace(/\\/g, '/');
      const extension = path.extname(sanitizedFilename);
      const fieldName = file.fieldname || 'file';
      const uniqueName = uuidv4();
      const fileName = `${uniqueName}-${fieldName}${extension}`.replace(/\\/g, '/');
      cb(null, fileName);
    },
  });
};

/**
 * Configure file filter for Multer
 */
const configureFileFilter = (allowedMimeTypes: string[]) => {
  return (req: Request, file: Express.Multer.File, cb: FileFilterCallback) => {
    if (allowedMimeTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(
        `Invalid file type. Allowed types: ${allowedMimeTypes.join(", ")}`
      ));
    }
  };
};

/**
 * Configure Multer with provided options
 */
const configureMulter = ({
  destination,
  filename,
  fileTypes = [],
  customMimeTypes = [],
  fileSizeLimit = 50 * 1024 * 1024, // Default 50MB
  preservePath = false,
}: MultermateOptions) => {
  const storage = configureStorage(destination);
  let allowedMimeTypes: string[] = [];

  if (customMimeTypes.length > 0) {
    allowedMimeTypes = customMimeTypes;
  } else if (fileTypes.length > 0) {
    fileTypes.forEach((type) => {
      if (type in ALLOWED_MIME_TYPES) {
        allowedMimeTypes = allowedMimeTypes.concat(
          ALLOWED_MIME_TYPES[type as keyof typeof ALLOWED_MIME_TYPES]
        );
      }
    });
  } else {
    allowedMimeTypes = ALLOWED_MIME_TYPES.all;
  }

  const fileFilter = configureFileFilter(allowedMimeTypes);

  return multer({
    storage,
    fileFilter,
    limits: {
      fileSize: fileSizeLimit,
    },
    preservePath,
  });
};

/**
 * Handle single file upload
 */
export const uploadSingle = (options: MultermateOptions = {}): RequestHandler => {
  const multerInstance = configureMulter(options);
  return multerInstance.single(options.filename || 'file');
};

/**
 * Handle multiple file uploads
 */
export const uploadMultiple = (options: MultermateOptions = {}): RequestHandler => {
  // Extract fields configuration
  const fields = options.fields || [];
  
  // Get the maximum file size from field configurations or global limit
  const maxFileSize = Math.max(
    ...[
      options.fileSizeLimit || 0,
      ...fields.map((field) => field.fileSizeLimit || 0),
    ]
  ) || 50 * 1024 * 1024; // Default to 50MB if no limits specified

  // Collect all file types from fields
  const allFileTypes = new Set<string>();
  fields.forEach((field) => {
    if (field.fileTypes) {
      field.fileTypes.forEach((type) => allFileTypes.add(type));
    }
  });

  // Configure multer with combined options
  const multerInstance = configureMulter({
    ...options,
    fileTypes: [...allFileTypes],
    fileSizeLimit: maxFileSize,
  });

  // Map fields to multer field config format
  const fieldConfigs = fields.map((field) => ({
    name: field.name,
    maxCount: field.maxCount || 1,
  }));

  return multerInstance.fields(fieldConfigs);
};

/**
 * Delete a file from the filesystem
 */
export const deleteFile = async (filePath: string): Promise<boolean> => {
  try {
    await fs.access(filePath);
    await fs.unlink(filePath);
    return true;
  } catch (error) {
    console.error(`Error deleting file: ${error}`);
    return false;
  }
};

/**
 * Add progress monitoring to the request
 */
export const addProgressMonitoring = (req: MultermateRequest) => {
  let progress = 0;
  const contentLength = parseInt(req.headers['content-length'] || '0', 10);

  if (contentLength > 0) {
    req.on('data', (chunk: Buffer) => {
      progress += chunk.length;
      const percentage = Math.round((progress * 100) / contentLength);
      req.progress = percentage;
    });
  }
};

/**
 * Export allowed file types and types
 */
export const ALLOWED_FILE_TYPES = Object.keys(ALLOWED_MIME_TYPES);

export type { FieldConfig, MultermateOptions, MultermateRequest };

