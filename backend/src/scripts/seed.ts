import 'reflect-metadata';
import { config } from 'dotenv';
import { DataSource } from 'typeorm';
import { markdownToSafeHtml } from '../common/utils/markdown';
import { buildTypeOrmOptions } from '../database/typeorm-options';
import { POLICY_SLUGS, POLICY_TITLES } from '../modules/settings/domain/policy-slugs';
import { PolicyPageEntity } from '../modules/settings/infrastructure/persistence/policy-page.entity';
import { StoreSettingsEntity } from '../modules/settings/infrastructure/persistence/store-settings.entity';
import { hashPassword, PASSWORD_MIN_LENGTH } from '../modules/users/domain/password';
import { Role } from '../modules/users/domain/role';
import { UserEntity } from '../modules/users/infrastructure/persistence/user.entity';
import { POLICY_CONTENT } from './demo/policy-content';

config({ quiet: true });

/**
 * Seed base (idempotente):
 * 1. Crea el primer administrador con SEED_ADMIN_EMAIL / SEED_ADMIN_PASSWORD (si no existe).
 *    Con SEED_ADMIN_RESET=true restablece la contraseña de ese usuario.
 * 2. Completa la configuración de la tienda (solo campos vacíos).
 * 3. Escribe el contenido inicial de las páginas de políticas (solo si están vacías).
 * Nunca imprime la contraseña.
 */
async function main(): Promise<void> {
  const email = process.env.SEED_ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.SEED_ADMIN_PASSWORD ?? '';
  const name = process.env.SEED_ADMIN_NAME?.trim() || 'Administrador';
  if (!email || password.length < PASSWORD_MIN_LENGTH) {
    throw new Error(`Define SEED_ADMIN_EMAIL y SEED_ADMIN_PASSWORD (mínimo ${PASSWORD_MIN_LENGTH} caracteres).`);
  }

  const ds = await new DataSource(buildTypeOrmOptions()).initialize();
  try {
    const users = ds.getRepository(UserEntity);
    const existing = await users.findOne({ where: { email } });
    if (!existing) {
      await users.save(users.create({ email, name, role: Role.Admin, active: true, passwordHash: await hashPassword(password) }));
      console.log(`✔ Administrador creado: ${email}`);
    } else if (process.env.SEED_ADMIN_RESET === 'true') {
      await users.update(existing.id, { passwordHash: await hashPassword(password), active: true, role: Role.Admin });
      console.log(`✔ Contraseña del administrador restablecida: ${email}`);
    } else {
      console.log(`• El administrador ${email} ya existe (sin cambios).`);
    }

    const settingsRepo = ds.getRepository(StoreSettingsEntity);
    const s = (await settingsRepo.findOne({ where: { id: 1 } })) ?? settingsRepo.create({ id: 1 });
    const defaults: Partial<StoreSettingsEntity> = {
      storeName: 'TecnoBray',
      tagline: 'Tecnología con garantía y envíos a toda Colombia',
      whatsapp: '573001234567',
      phone: '+57 300 123 4567',
      email: 'hola@tecnobray.co',
      address: 'Medellín, Antioquia, Colombia',
      seoTitle: 'TecnoBray | Celulares, computadores y accesorios en Colombia',
      seoDescription: 'Tienda de tecnología en Colombia: celulares, portátiles, audio, smartwatches y accesorios con garantía y envíos a todo el país.',
      announcement: 'Envíos a toda Colombia · Garantía en todos los productos · Escríbenos por WhatsApp',
      shippingInfo: 'Envíos a todo Colombia en 1 a 6 días hábiles. El costo del envío se confirma por WhatsApp según tu ciudad.',
    };
    for (const [k, v] of Object.entries(defaults)) {
      const key = k as keyof StoreSettingsEntity;
      if (!s[key]) (s as unknown as Record<string, unknown>)[key] = v;
    }
    if (!s.social || Object.keys(s.social).length === 0) {
      s.social = { instagram: 'https://instagram.com/tecnobray', facebook: 'https://facebook.com/tecnobray' };
    }
    await settingsRepo.save(s);
    console.log('✔ Configuración de la tienda verificada');

    const pages = ds.getRepository(PolicyPageEntity);
    for (const slug of POLICY_SLUGS) {
      const p = (await pages.findOne({ where: { slug } })) ?? pages.create({ slug, title: POLICY_TITLES[slug] });
      if (!p.content) {
        p.content = POLICY_CONTENT[slug];
        p.contentHtml = markdownToSafeHtml(p.content);
        await pages.save(p);
      }
    }
    console.log('✔ Páginas de políticas verificadas');
  } finally {
    await ds.destroy();
  }
}

main().catch((err: Error) => {
  console.error(`✖ Seed falló: ${err.message}`);
  process.exit(1);
});
