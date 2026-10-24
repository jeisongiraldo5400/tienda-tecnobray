import 'reflect-metadata';
import {
  CreateBucketCommand,
  GetBucketPolicyCommand,
  GetPublicAccessBlockCommand,
  HeadBucketCommand,
  PutBucketPolicyCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { config } from 'dotenv';
import { readS3Settings, type S3Settings } from '../modules/storage/infrastructure/s3-config';
import { createS3Client } from '../modules/storage/infrastructure/s3-storage.adapter';

config({ quiet: true });

/**
 * - Con S3_ENDPOINT (MinIO local/tests): crea el bucket si no existe y aplica lectura pública
 *   solo al prefijo `<S3_PREFIX>public/`, para que dev/test usen el mismo código que producción.
 * - Sin S3_ENDPOINT (AWS): SOLO LECTURA. Reporta Block Public Access y política; nunca modifica nada.
 */
export async function initStorage(settings: S3Settings = readS3Settings(), client: S3Client = createS3Client(settings)): Promise<void> {
  const bucket = settings.bucket;
  if (settings.endpoint) {
    try {
      await client.send(new HeadBucketCommand({ Bucket: bucket }));
      console.log(`• Bucket ${bucket} ya existe en ${settings.endpoint}`);
    } catch {
      await client.send(new CreateBucketCommand({ Bucket: bucket }));
      console.log(`✔ Bucket ${bucket} creado en ${settings.endpoint}`);
    }
    const policy = {
      Version: '2012-10-17',
      Statement: [
        {
          Sid: 'PublicReadPublicPrefix',
          Effect: 'Allow',
          Principal: { AWS: ['*'] },
          Action: ['s3:GetObject'],
          Resource: [`arn:aws:s3:::${bucket}/${settings.prefix}public/*`],
        },
      ],
    };
    await client.send(new PutBucketPolicyCommand({ Bucket: bucket, Policy: JSON.stringify(policy) }));
    console.log(`✔ Lectura pública aplicada a ${settings.prefix}public/*`);
    return;
  }

  console.log(`Revisión de solo lectura del bucket AWS "${bucket}" (${settings.region}):`);
  await client.send(new HeadBucketCommand({ Bucket: bucket }));
  console.log('  ✔ El bucket existe y las credenciales tienen acceso');
  try {
    const pab = await client.send(new GetPublicAccessBlockCommand({ Bucket: bucket }));
    console.log(`  • Block Public Access: ${JSON.stringify(pab.PublicAccessBlockConfiguration)}`);
  } catch (err) {
    console.log(`  • Block Public Access: sin configuración a nivel de bucket (${(err as Error).name})`);
  }
  try {
    await client.send(new GetBucketPolicyCommand({ Bucket: bucket }));
    console.log('  • El bucket tiene una política (revísala en la consola de AWS)');
  } catch {
    console.log('  • El bucket no tiene política');
  }
  console.log(
    `  → Modo de entrega de imágenes actual: MEDIA_DELIVERY=${settings.delivery}. ` +
      (settings.delivery === 'public'
        ? 'Las URLs usan S3_PUBLIC_BASE_URL.'
        : 'El backend sirve las imágenes desde /api/media (bucket privado). Para CloudFront ver README.'),
  );
}

if (require.main === module) {
  initStorage().catch((err: Error) => {
    console.error(`✖ storage:init falló: ${err.message}`);
    process.exit(1);
  });
}
