import { ApiError, type ProblemDetail } from './lib/api';
import { adminFetch } from './adminApi';

export interface CloudinarySignature {
  cloudName: string;
  apiKey: string;
  timestamp: number;
  folder: string;
  uploadPreset: string;
  signature: string;
}

interface CloudinaryUploadResponse {
  secure_url: string;
}

export async function getCloudinarySignature() {
  return adminFetch<CloudinarySignature>('/api/admin/uploads/sign', {
    method: 'POST',
  });
}

export async function uploadImageToCloudinary(
  file: File,
  signature: CloudinarySignature,
) {
  const formData = new FormData();
  formData.append('api_key', signature.apiKey);
  formData.append('timestamp', String(signature.timestamp));
  formData.append('folder', signature.folder);
  formData.append('upload_preset', signature.uploadPreset);
  formData.append('signature', signature.signature);
  formData.append('file', file);

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${encodeURIComponent(signature.cloudName)}/image/upload`,
    {
      body: formData,
      method: 'POST',
    },
  );

  if (!response.ok) {
    let problem: ProblemDetail;
    try {
      problem = (await response.json()) as ProblemDetail;
    } catch {
      problem = {
        title: response.statusText,
        status: response.status,
        detail: 'No se pudo subir la imagen a Cloudinary.',
      };
    }
    throw new ApiError(problem, response.status, response.headers);
  }

  const result = (await response.json()) as CloudinaryUploadResponse;
  if (!result.secure_url) {
    throw new ApiError(
      {
        title: 'Respuesta inválida de Cloudinary',
        detail: 'Cloudinary no devolvió una URL segura para la imagen.',
      },
      502,
      response.headers,
    );
  }

  return result.secure_url;
}

export async function uploadAdminProjectImage(file: File) {
  const signature = await getCloudinarySignature();
  return uploadImageToCloudinary(file, signature);
}
