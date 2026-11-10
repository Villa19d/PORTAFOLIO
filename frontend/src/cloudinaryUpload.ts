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

export async function getCloudinaryDocumentSignature() {
  return adminFetch<CloudinarySignature>('/api/admin/uploads/sign-document', {
    method: 'POST',
  });
}

function buildCloudinaryFormData(file: File, signature: CloudinarySignature) {
  const formData = new FormData();
  formData.append('api_key', signature.apiKey);
  formData.append('timestamp', String(signature.timestamp));
  formData.append('folder', signature.folder);
  formData.append('upload_preset', signature.uploadPreset);
  formData.append('signature', signature.signature);
  formData.append('file', file);
  return formData;
}

async function uploadToCloudinary(
  resourceType: 'image' | 'raw',
  file: File,
  signature: CloudinarySignature,
  failureDetail: string,
  missingUrlDetail: string,
) {
  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${encodeURIComponent(signature.cloudName)}/${resourceType}/upload`,
    {
      body: buildCloudinaryFormData(file, signature),
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
        detail: failureDetail,
      };
    }
    throw new ApiError(problem, response.status, response.headers);
  }

  const result = (await response.json()) as CloudinaryUploadResponse;
  if (!result.secure_url) {
    throw new ApiError(
      {
        title: 'Respuesta inválida de Cloudinary',
        detail: missingUrlDetail,
      },
      502,
      response.headers,
    );
  }

  return result.secure_url;
}

export function uploadImageToCloudinary(file: File, signature: CloudinarySignature) {
  return uploadToCloudinary(
    'image',
    file,
    signature,
    'No se pudo subir la imagen a Cloudinary.',
    'Cloudinary no devolvió una URL segura para la imagen.',
  );
}

export function uploadPdfToCloudinary(file: File, signature: CloudinarySignature) {
  return uploadToCloudinary(
    'raw',
    file,
    signature,
    'No se pudo subir el PDF a Cloudinary.',
    'Cloudinary no devolvió una URL segura para el PDF.',
  );
}

export async function uploadAdminProjectImage(file: File) {
  const signature = await getCloudinarySignature();
  return uploadImageToCloudinary(file, signature);
}

export async function uploadAdminCv(file: File) {
  const signature = await getCloudinaryDocumentSignature();
  return uploadPdfToCloudinary(file, signature);
}
