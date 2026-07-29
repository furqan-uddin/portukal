import cloudinary from '../../../config/cloudinary.js';
import ApiError from '../../../utils/ApiError.js';
import fs from 'fs/promises';

const MAX_VIDEO_SIZE_MB = parseInt(process.env.REEL_MAX_VIDEO_MB || '200', 10);
const MAX_VIDEO_DURATION_S = parseInt(process.env.REEL_MAX_DURATION_S || '180', 10); // 3 minutes

/**
 * Upload a video file to Cloudinary under `reels/` folder.
 * Generates an automatic thumbnail via eager transformation.
 * Returns full metadata for storing in MongoDB.
 *
 * @param {string} localFilePath - Temp file path from multer disk storage
 * @param {string} vendorId - Used to namespace public_id
 * @returns {Promise<{video: object, thumbnail: object}>}
 */
export const uploadReelToCloudinary = async (localFilePath, vendorId) => {
    let result;
    try {
        result = await cloudinary.uploader.upload(localFilePath, {
            resource_type: 'video',
            folder: `reels/vendors/${vendorId}`,
            eager: [
                // Generate a thumbnail at 0 seconds, JPEG, 540x960
                { format: 'jpg', transformation: [{ width: 540, height: 960, crop: 'fill', gravity: 'center', start_offset: '0' }] },
            ],
            eager_async: false,
            overwrite: false,
            quality: 'auto',
        });
    } catch (err) {
        // Cleanup temp file even if Cloudinary fails
        await fs.unlink(localFilePath).catch(() => {});
        throw new ApiError(500, `Cloudinary video upload failed: ${err.message}`);
    }

    // Cleanup local temp file
    await fs.unlink(localFilePath).catch(() => {});

    const thumbnailResult = result.eager?.[0];

    return {
        video: {
            publicId:    result.public_id,
            secureUrl:   result.secure_url,
            deliveryType: 'direct',
            duration:    result.duration,       // seconds
            width:       result.width,
            height:      result.height,
            format:      result.format,
            fileSize:    result.bytes,
        },
        thumbnail: thumbnailResult
            ? { publicId: thumbnailResult.public_id, secureUrl: thumbnailResult.secure_url }
            : { publicId: result.public_id, secureUrl: result.secure_url },
    };
};

/**
 * Delete a reel and its thumbnail from Cloudinary.
 */
export const deleteReelFromCloudinary = async (videoPublicId, thumbnailPublicId) => {
    const results = await Promise.allSettled([
        videoPublicId
            ? cloudinary.uploader.destroy(videoPublicId, { resource_type: 'video' })
            : Promise.resolve(),
        thumbnailPublicId && thumbnailPublicId !== videoPublicId
            ? cloudinary.uploader.destroy(thumbnailPublicId, { resource_type: 'image' })
            : Promise.resolve(),
    ]);
    return results;
};

/**
 * Validate video file before upload (MIME type, size).
 */
export const validateVideoFile = (file) => {
    if (!file) throw new ApiError(400, 'Video file is required.');

    const allowedMimes = ['video/mp4', 'video/quicktime', 'video/x-msvideo', 'video/webm'];
    if (!allowedMimes.includes(file.mimetype)) {
        throw new ApiError(400, 'Invalid video format. Only MP4, MOV, AVI, and WebM are accepted.');
    }

    const fileSizeMB = file.size / (1024 * 1024);
    if (fileSizeMB > MAX_VIDEO_SIZE_MB) {
        throw new ApiError(400, `Video file too large. Maximum size is ${MAX_VIDEO_SIZE_MB}MB.`);
    }
};
