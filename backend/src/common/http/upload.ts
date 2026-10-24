import { applyDecorators, UseInterceptors } from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { ApiBody, ApiConsumes } from '@nestjs/swagger';
import { MAX_IMAGE_BYTES } from '../../modules/storage/domain/image-types';

/** Subida de una imagen en memoria (campo multipart `file`, máx. 5 MB). */
export function SingleImageUpload() {
  return applyDecorators(
    UseInterceptors(FileInterceptor('file', { limits: { fileSize: MAX_IMAGE_BYTES, files: 1 } })),
    ApiConsumes('multipart/form-data'),
    ApiBody({
      schema: { type: 'object', required: ['file'], properties: { file: { type: 'string', format: 'binary' } } },
      description: 'Imagen JPEG, PNG o WebP (máx. 5 MB). Se valida por magic bytes.',
    }),
  );
}

/** Subida de varias imágenes (campo multipart `files`, máx. 10 por solicitud, 5 MB c/u). */
export function MultiImageUpload() {
  return applyDecorators(
    UseInterceptors(FilesInterceptor('files', 10, { limits: { fileSize: MAX_IMAGE_BYTES, files: 10 } })),
    ApiConsumes('multipart/form-data'),
    ApiBody({
      schema: {
        type: 'object',
        required: ['files'],
        properties: { files: { type: 'array', items: { type: 'string', format: 'binary' } } },
      },
      description: 'Hasta 10 imágenes JPEG, PNG o WebP (máx. 5 MB c/u).',
    }),
  );
}
