import { apiClient } from '../core/api.js';

export const ALLOWED_IMAGE_TYPES = ['image/webp', 'image/png', 'image/jpeg'];
export const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;

export function validateUploadImage(file) {
  if (!file) {
    return 'Selecione uma imagem.';
  }

  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    return 'Formato inválido. Use WEBP, PNG, JPG ou JPEG.';
  }

  if (file.size > MAX_IMAGE_SIZE_BYTES) {
    return 'Imagem muito grande. Envie um arquivo de até 5 MB.';
  }

  return null;
}

export class StorageService {
  uploadImage(file, { folder = 'general' } = {}) {
    const error = validateUploadImage(file);
    if (error) return Promise.reject(new Error(error));

    const data = new FormData();
    data.set('file', file);
    data.set('folder', folder);

    return apiClient.post('/storage/images', data);
  }

  listFiles() {
    return apiClient.get('/storage/files');
  }

  deleteFiles(paths) {
    return apiClient.request('/storage/files', {
      method: 'DELETE',
      body: { paths }
    });
  }
}

export const storageService = new StorageService();
export const uploadImage = (file, options) => storageService.uploadImage(file, options);
export const listStorageFiles = () => storageService.listFiles();
export const deleteStorageFiles = (paths) => storageService.deleteFiles(paths);
