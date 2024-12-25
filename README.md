# Uploadware

A powerful and flexible file upload middleware for Express.js that extends Multer with additional features and type safety.

## Features

- 🚀 TypeScript support out of the box
- 📁 Single and multiple file uploads
- 🔒 Built-in file type validation
- 📊 Upload progress monitoring
- 🗑️ File deletion utility
- 💪 Configurable file size limits
- 🎯 Predefined MIME type categories
- 🔄 Customizable file naming
- 📂 Automatic upload directory creation

## Installation

```bash
npm install uploadware
# or
yarn add uploadware
# or
pnpm add uploadware
```

## Quick Start

```typescript
import express from "express";
import { uploadSingle, uploadMultiple } from "uploadware";

const app = express();

// Single file upload
app.post(
  "/upload",
  uploadSingle({
    destination: "uploads",
    fileTypes: ["images"],
    fileSizeLimit: 5 * 1024 * 1024, // 5MB
  }),
  (req, res) => {
    res.json({ file: req.file });
  }
);

// Multiple files upload
app.post(
  "/upload-multiple",
  uploadMultiple({
    destination: "uploads",
    fields: [
      {
        name: "avatar",
        maxCount: 1,
        fileTypes: ["images"],
      },
      {
        name: "documents",
        maxCount: 3,
        fileTypes: ["pdfs", "documents"],
      },
    ],
  }),
  (req, res) => {
    res.json({ files: req.files });
  }
);
```

## API Reference

### `uploadSingle(options?: MultermateOptions)`

Handle single file uploads with configurable options.

```typescript
interface MultermateOptions {
  destination?: string; // Upload directory (default: 'uploads')
  filename?: string; // Field name (default: 'file')
  fileTypes?: string[]; // Allowed file types
  customMimeTypes?: string[]; // Custom MIME types
  fileSizeLimit?: number; // Max file size in bytes
  preservePath?: boolean; // Preserve full path of files
}
```

### `uploadMultiple(options?: MultermateOptions)`

Handle multiple file uploads with field-specific configurations.

```typescript
interface FieldConfig {
  name: string; // Field name
  maxCount?: number; // Max number of files
  fileTypes?: string[]; // Allowed file types per field
  fileSizeLimit?: number; // Max file size per field
}

// Add fields array to MultermateOptions
interface MultermateOptions {
  fields?: FieldConfig[];
  // ... other options
}
```

### Predefined File Types

- `images`: jpeg, jpg, png, gif, webp
- `videos`: mp4, mpeg, ogg, webm, quicktime
- `pdfs`: pdf
- `documents`: pdf, doc, docx, xls, xlsx, ppt, pptx, txt

### Utility Functions

#### `deleteFile(filePath: string): Promise<boolean>`

Delete a file from the filesystem.

```typescript
const deleted = await deleteFile("uploads/file.jpg");
```

#### `addProgressMonitoring(req: MultermateRequest)`

Add upload progress monitoring to a request.

```typescript
app.post("/upload", (req, res) => {
  addProgressMonitoring(req);
  req.on("data", () => {
    console.log(`Upload progress: ${req.progress}%`);
  });
});
```

## Error Handling

The middleware throws descriptive errors for:

- Invalid file types
- File size limits
- Missing directories
- Upload failures

```typescript
app.post("/upload", uploadSingle(), (req, res, next) => {
  try {
    // Handle successful upload
  } catch (error) {
    next(error); // Pass to error handler
  }
});
```

## License

MIT

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
