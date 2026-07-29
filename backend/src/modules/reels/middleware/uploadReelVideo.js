import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import ApiError from '../../../utils/ApiError.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const TMP_DIR = path.resolve(__dirname, '../../../../uploads/tmp');
fs.mkdirSync(TMP_DIR, { recursive: true });

const MAX_VIDEO_SIZE_MB = parseInt(process.env.REEL_MAX_VIDEO_MB || '200', 10);
const ALLOWED_MIME_TYPES = ['video/mp4', 'video/quicktime', 'video/x-msvideo', 'video/webm'];

const storage = multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, TMP_DIR),
    filename: (_req, file, cb) => {
        const ext = path.extname(file.originalname || '.mp4').toLowerCase();
        cb(null, `reel-${Date.now()}${ext}`);
    },
});

const fileFilter = (_req, file, cb) => {
    if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new ApiError(400, 'Invalid video format. Only MP4, MOV, AVI, and WebM are accepted.'), false);
    }
};

export const uploadReelVideo = multer({
    storage,
    fileFilter,
    limits: { fileSize: MAX_VIDEO_SIZE_MB * 1024 * 1024 },
}).single('video');
