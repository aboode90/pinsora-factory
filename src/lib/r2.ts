import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

export const r2Client = new S3Client({
  region: "auto",
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID ?? "",
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY ?? "",
  },
});

export const BUCKET_NAME = process.env.R2_BUCKET_NAME ?? "Pinsora";
export const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL ?? "";

/**
 * Generate a presigned URL for direct client-side upload to R2
 */
export async function getUploadPresignedUrl(
  key: string,
  contentType: string,
  expiresIn = 3600
): Promise<string> {
  const command = new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
    ContentType: contentType,
  });

  return getSignedUrl(r2Client, command, { expiresIn });
}

/**
 * Delete an object from R2
 */
export async function deleteFromR2(key: string): Promise<void> {
  const command = new DeleteObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
  });
  await r2Client.send(command);
}

/**
 * Build the public URL for a stored object
 */
export function getPublicUrl(key: string): string {
  return `${R2_PUBLIC_URL}/${key}`;
}

/**
 * Generate a unique storage key for an image
 */
export function generateImageKey(userId: string, filename: string): string {
  const timestamp = Date.now();
  const ext = filename.split(".").pop();
  return `images/${userId}/${timestamp}.${ext}`;
}
