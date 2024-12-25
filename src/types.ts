import { Request } from 'express';
import { Options } from 'multer';

export interface FieldConfig {
  name: string;
  maxCount?: number;
  fileSizeLimit?: number;
  fileTypes?: string[];
}

export interface MultermateOptions extends Partial<Options> {
  destination?: string;
  filename?: string;
  fileTypes?: string[];
  customMimeTypes?: string[];
  fileSizeLimit?: number;
  preservePath?: boolean;
  fields?: FieldConfig[];
}

export interface MultermateRequest extends Request {
  progress?: number;
}