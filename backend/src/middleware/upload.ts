import multer, { FileFilterCallback } from 'multer';
import path from 'path';
import fs from 'fs';
import { Request } from 'express';
import { UPLOAD_DIRECTORY } from '../config/storage';

// Ensure storage dir exists
if (!fs.existsSync(UPLOAD_DIRECTORY)) {
  fs.mkdirSync(UPLOAD_DIRECTORY, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, UPLOAD_DIRECTORY);
  },
  filename: (_req, file, cb) => {
    const timestamp = Date.now();
    const cleanOriginalName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
    cb(null, `${timestamp}-${cleanOriginalName}`);
  },
});

const ALLOWED_EXTENSIONS = ['.pdf', '.docx', '.doc', '.pptx', '.ppt', '.xlsx', '.xls', '.csv'];

const fileFilter = (_req: Request, file: Express.Multer.File, cb: FileFilterCallback) => {
  const ext = path.extname(file.originalname).toLowerCase();
  if (ALLOWED_EXTENSIONS.includes(ext)) {
    cb(null, true);
  } else {
    cb(
      new Error(
        `Invalid file type "${ext}". Supported types are PDF, DOCX, PPT, and XLSX spreadsheets.`
      )
    );
  }
};

export const documentUpload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB max limit
  },
});
