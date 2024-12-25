"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ALLOWED_FILE_TYPES = exports.addProgressMonitoring = exports.deleteFile = exports.uploadMultiple = exports.uploadSingle = void 0;
const fs_1 = require("fs");
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const uuid_1 = require("uuid");
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
const configureStorage = (destination) => {
    return multer_1.default.diskStorage({
        destination: async (req, file, cb) => {
            try {
                const uploadPath = destination || 'uploads';
                await fs_1.promises.mkdir(uploadPath, { recursive: true });
                cb(null, uploadPath);
            }
            catch (error) {
                cb(error, '');
            }
        },
        filename: (req, file, cb) => {
            const sanitizedFilename = file.originalname.replace(/\\/g, '/');
            const extension = path_1.default.extname(sanitizedFilename);
            const fieldName = file.fieldname || 'file';
            const uniqueName = (0, uuid_1.v4)();
            const fileName = `${uniqueName}-${fieldName}${extension}`.replace(/\\/g, '/');
            cb(null, fileName);
        },
    });
};
/**
 * Configure file filter for Multer
 */
const configureFileFilter = (allowedMimeTypes) => {
    return (req, file, cb) => {
        if (allowedMimeTypes.includes(file.mimetype)) {
            cb(null, true);
        }
        else {
            cb(new Error(`Invalid file type. Allowed types: ${allowedMimeTypes.join(", ")}`));
        }
    };
};
/**
 * Configure Multer with provided options
 */
const configureMulter = ({ destination, filename, fileTypes = [], customMimeTypes = [], fileSizeLimit = 50 * 1024 * 1024, // Default 50MB
preservePath = false, }) => {
    const storage = configureStorage(destination);
    let allowedMimeTypes = [];
    if (customMimeTypes.length > 0) {
        allowedMimeTypes = customMimeTypes;
    }
    else if (fileTypes.length > 0) {
        fileTypes.forEach((type) => {
            if (type in ALLOWED_MIME_TYPES) {
                allowedMimeTypes = allowedMimeTypes.concat(ALLOWED_MIME_TYPES[type]);
            }
        });
    }
    else {
        allowedMimeTypes = ALLOWED_MIME_TYPES.all;
    }
    const fileFilter = configureFileFilter(allowedMimeTypes);
    return (0, multer_1.default)({
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
const uploadSingle = (options = {}) => {
    const multerInstance = configureMulter(options);
    return multerInstance.single(options.filename || 'file');
};
exports.uploadSingle = uploadSingle;
/**
 * Handle multiple file uploads
 */
const uploadMultiple = (options = {}) => {
    // Extract fields configuration
    const fields = options.fields || [];
    // Get the maximum file size from field configurations or global limit
    const maxFileSize = Math.max(...[
        options.fileSizeLimit || 0,
        ...fields.map((field) => field.fileSizeLimit || 0),
    ]) || 50 * 1024 * 1024; // Default to 50MB if no limits specified
    // Collect all file types from fields
    const allFileTypes = new Set();
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
exports.uploadMultiple = uploadMultiple;
/**
 * Delete a file from the filesystem
 */
const deleteFile = async (filePath) => {
    try {
        await fs_1.promises.access(filePath);
        await fs_1.promises.unlink(filePath);
        return true;
    }
    catch (error) {
        console.error(`Error deleting file: ${error}`);
        return false;
    }
};
exports.deleteFile = deleteFile;
/**
 * Add progress monitoring to the request
 */
const addProgressMonitoring = (req) => {
    let progress = 0;
    const contentLength = parseInt(req.headers['content-length'] || '0', 10);
    if (contentLength > 0) {
        req.on('data', (chunk) => {
            progress += chunk.length;
            const percentage = Math.round((progress * 100) / contentLength);
            req.progress = percentage;
        });
    }
};
exports.addProgressMonitoring = addProgressMonitoring;
/**
 * Export allowed file types and types
 */
exports.ALLOWED_FILE_TYPES = Object.keys(ALLOWED_MIME_TYPES);
