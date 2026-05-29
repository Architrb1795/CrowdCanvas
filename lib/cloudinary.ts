import { v2 as cloudinary } from 'cloudinary';

// Configure the Cloudinary Node.js SDK for Server Actions
// Note: next-cloudinary handles client-side rendering independently
cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export default cloudinary;

/**
 * Validates a signature from the Cloudinary Webhook to ensure authenticity
 * Used when processing background updates (e.g. video processing completed)
 */
export const verifyCloudinarySignature = (body: string, signature: string, timestamp: string) => {
  const expectedSignature = cloudinary.utils.api_sign_request(
    { timestamp },
    process.env.CLOUDINARY_API_SECRET!
  );
  return expectedSignature === signature;
};
