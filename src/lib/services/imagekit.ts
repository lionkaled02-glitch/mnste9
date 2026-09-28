import ImageKit from 'imagekit';

export interface UploadResult {
  url: string;
  fileId: string;
  name: string;
  size: number;
  fileType: string;
}

let imagekitClient: ImageKit | null = null;

function getImageKitClient() {
  const publicKey = process.env.NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY;
  const privateKey = process.env.IMAGEKIT_PRIVATE_KEY;
  const urlEndpoint = process.env.NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT;

  if (!publicKey || !privateKey || !urlEndpoint) {
    throw new Error('ImageKit env vars are not configured');
  }

  imagekitClient ??= new ImageKit({
    publicKey,
    privateKey,
    urlEndpoint,
  });

  return imagekitClient;
}

export async function uploadToImageKit(
  file: Buffer,
  fileName: string,
  folder: string = '/uploads',
): Promise<UploadResult> {
  const result = await getImageKitClient().upload({
    file,
    fileName,
    folder,
    useUniqueFileName: true,
  });

  return {
    url: result.url,
    fileId: result.fileId,
    name: result.name,
    size: result.size,
    fileType: result.fileType || 'unknown',
  };
}

export async function deleteFromImageKit(fileId: string): Promise<void> {
  try {
    await getImageKitClient().deleteFile(fileId);
  } catch (error) {
    console.error('ImageKit delete failed:', error);
  }
}
