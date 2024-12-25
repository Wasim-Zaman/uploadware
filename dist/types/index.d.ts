import { RequestHandler } from 'express';
import type { FieldConfig, MultermateOptions, MultermateRequest } from './types';
/**
 * Handle single file upload
 */
export declare const uploadSingle: (options?: MultermateOptions) => RequestHandler;
/**
 * Handle multiple file uploads
 */
export declare const uploadMultiple: (options?: MultermateOptions) => RequestHandler;
/**
 * Delete a file from the filesystem
 */
export declare const deleteFile: (filePath: string) => Promise<boolean>;
/**
 * Add progress monitoring to the request
 */
export declare const addProgressMonitoring: (req: MultermateRequest) => void;
/**
 * Export allowed file types and types
 */
export declare const ALLOWED_FILE_TYPES: string[];
export type { FieldConfig, MultermateOptions, MultermateRequest };
