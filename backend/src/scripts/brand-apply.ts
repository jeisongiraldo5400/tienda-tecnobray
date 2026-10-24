import 'reflect-metadata';
import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { config } from 'dotenv';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import type { Readable } from 'node:stream';
import { DataSource, Like } from 'typeorm';
import { AppModule } from '../app.module';
import { ContentService } from '../modules/content/application/content.service';
import { BannerEntity } from '../modules/content/infrastructure/persistence/banner.entity';
import { SettingsService } from '../modules/settings/application/settings.service';
import { BRAND_COLORS } from '../modules/settings/domain/brand';
import { ImageProcessingService } from '../modules/storage/application/image-processing.service';
import { IMAGE_PRESETS, type ImagePresetName } from '../modules/storage/domain/image-types';
import { STORAGE, type StoragePort } from '../modules/storage/domain/storage.port';
import { DEMO_BANNERS } from './demo/demo-catalog';
import { bannerImage } from './demo/demo-images';

config({ quiet: true });

/** Recursos de marca (copias de frontend/public/brand, generados desde el logo original). */
const ASSETS_DIR = join(__dirname, 'brand');
/** PNG del logo que se subía antes; solo para reconocerlo y quitarlo. */
const OLD_LOGO_FILE = join(ASSETS_DIR, 'tecnobray-logo.png');
const ICON_FILE = join(ASSETS_DIR, 'tecnobray-icon-512.png');

async function streamToBuffer(stream: Readable): Promise<Buffer> {
  const chunks: Buffer[] = [];
  for await (const chunk of stream) chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk as Uint8Array));
  return Buffer.concat(chunks);
}

/**
 * Aplica la identidad de TecnoBray a la tienda (idempotente):
 * 1. Colores primary/secondary/accent de la paleta del logo (vía SettingsService.update).
 * 2. Favicon subido a S3 por el mismo camino que el panel; quita el PNG anterior del logo (el logo es vectorial).
 *    Si el objeto guardado ya es idéntico al que se generaría, no se vuelve a subir.
 * 3. Con --demo-banners: vuelve a generar el arte de los banners DEMO (public/demo/...) con la paleta de la marca.
 *    Nunca toca banners subidos por el administrador.
 * Con --force vuelve a subir las imágenes aunque no hayan cambiado. Con --dry-run solo informa.
 *
 * Uso: pnpm brand:apply [--force] [--dry-run] [--demo-banners]
 */
async function main(): Promise<void> {
  const args = new Set(process.argv.slice(2));
  const force = args.has('--force');
  const dryRun = args.has('--dry-run');
  const log = new Logger('BrandApply');
  const app = await NestFactory.createApplicationContext(AppModule, { logger: ['error', 'warn', 'log'] });
  try {
    const settings = app.get(SettingsService);
    const processing = app.get(ImageProcessingService);
    const storage = app.get<StoragePort>(STORAGE);

    /** ¿El objeto guardado coincide byte a byte con la variante grande que produciría este archivo? */
    async function sameImage(key: string | null, file: Buffer, preset: ImagePresetName): Promise<boolean> {
      if (!key) return false;
      const stored = await storage.getObject(key).catch(() => null);
      if (!stored) return false;
      const [large] = await processing.process(file, [IMAGE_PRESETS[preset].variants[0]]);
      return (await streamToBuffer(stored.body)).equals(large.buffer);
    }

    // 1. Colores
    const s = await settings.entity();
    const colorChanges = {
      ...(s.primaryColor.toUpperCase() !== BRAND_COLORS.primary ? { primaryColor: BRAND_COLORS.primary } : {}),
      ...(s.secondaryColor.toUpperCase() !== BRAND_COLORS.secondary ? { secondaryColor: BRAND_COLORS.secondary } : {}),
      ...(s.accentColor.toUpperCase() !== BRAND_COLORS.accent ? { accentColor: BRAND_COLORS.accent } : {}),
    };
    if (Object.keys(colorChanges).length === 0) {
      log.log('• Colores: ya usan la paleta de la marca (sin cambios).');
    } else if (dryRun) {
      log.log(`• Colores: se actualizarían ${JSON.stringify(colorChanges)}`);
    } else {
      await settings.update(colorChanges);
      log.log(`✔ Colores actualizados: ${JSON.stringify(colorChanges)}`);
    }

    // 2. Logo y favicon (por el mismo servicio que usa el panel → S3 + revalidación del frontend).
    // El logo ya no se sube: el frontend lo dibuja en SVG. Si quedó cargado el PNG anterior de la marca, se quita.
    const oldLogo = await readFile(OLD_LOGO_FILE);
    const icon = await readFile(ICON_FILE);
    const current = await settings.entity();
    if (!current.logoKey) {
      log.log('• Logo: se usa el logo vectorial de la marca (sin cambios).');
    } else if (!(await sameImage(current.logoKey, oldLogo, 'logo'))) {
      log.log('• Logo: hay un logo personalizado cargado; no se toca.');
    } else if (dryRun) {
      log.log('• Logo: se quitaría el PNG anterior para usar el logo vectorial.');
    } else {
      await settings.removeLogo();
      log.log('✔ PNG anterior del logo quitado: se usa el logo vectorial.');
    }
    if (!force && (await sameImage(current.faviconKey, icon, 'favicon'))) {
      log.log('• Favicon: ya es el de la marca (sin cambios).');
    } else if (dryRun) {
      log.log('• Favicon: se subiría el ícono de la marca.');
    } else {
      await settings.setFavicon(icon);
      log.log('✔ Favicon de la marca subido.');
    }

    // 3. Banners de demostración (opcional)
    if (args.has('--demo-banners')) {
      const content = app.get(ContentService);
      const demo = await app.get(DataSource).getRepository(BannerEntity).find({ where: { imageKey: Like('public/demo/%') } });
      for (const b of demo) {
        const spec = DEMO_BANNERS.find((d) => d.title === b.title);
        if (!spec) continue;
        const img = await bannerImage(spec.title, spec.text, spec.icon, spec.colors);
        if (!force && (await sameImage(b.imageKey, img, 'banner'))) {
          log.log(`• Banner demo “${b.title}”: ya usa la paleta (sin cambios).`);
        } else if (dryRun) {
          log.log(`• Banner demo “${b.title}”: se regeneraría.`);
        } else {
          await content.setBannerImage(b.id, img, true);
          log.log(`✔ Banner demo “${b.title}” regenerado con la paleta de la marca.`);
        }
      }
    }
  } finally {
    await app.close();
  }
}

if (require.main === module) {
  main().catch((err: Error) => {
    console.error(`✖ brand:apply falló: ${err.message}`);
    process.exit(1);
  });
}
