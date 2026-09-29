import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const s3 = new S3Client({
  region: process.env.B2_REGION!,
  endpoint: `https://${process.env.B2_ENDPOINT}`,
  credentials: {
    accessKeyId: process.env.B2_KEY_ID!,
    secretAccessKey: process.env.B2_APPLICATION_KEY!,
  },
});

const BUCKET = process.env.B2_BUCKET_NAME!;

export interface UploadResult {
  key: string;
  name: string;
  size: number;
  contentType: string;
}

export async function uploadToB2(
  file: Buffer,
  fileName: string,
  folder: string,
  contentType: string = 'application/octet-stream',
): Promise<UploadResult> {
  const timestamp = Date.now();
  const randomStr = Math.random().toString(36).slice(2, 8);
  const ext = fileName.split('.').pop() || 'bin';
  const key = `${folder}/${timestamp}-${randomStr}.${ext}`;

  await s3.send(
    new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      Body: file,
      ContentType: contentType,
    }),
  );

  return {
    key,
    name: fileName,
    size: file.length,
    contentType,
  };
}

export async function deleteFromB2(key: string): Promise<void> {
  try {
    await s3.send(
      new DeleteObjectCommand({
        Bucket: BUCKET,
        Key: key,
      }),
    );
  } catch (error) {
    console.error('B2 delete failed:', error);
  }
}

export async function getPresignedUrl(
  key: string,
  expiresIn: number = 3600,
  downloadName?: string,
): Promise<string> {
  const command = new GetObjectCommand({
    Bucket: BUCKET,
    Key: key,
    ResponseContentDisposition: downloadName
      ? `attachment; filename="${downloadName}"`
      : undefined,
  });

  return getSignedUrl(s3, command, { expiresIn });
}
