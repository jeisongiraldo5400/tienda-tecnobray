import bcrypt from 'bcryptjs';

export const BCRYPT_COST = 12;
export const PASSWORD_MIN_LENGTH = 10;

export const hashPassword = (plain: string): Promise<string> => bcrypt.hash(plain, BCRYPT_COST);
export const verifyPassword = (plain: string, hash: string): Promise<boolean> => bcrypt.compare(plain, hash);

let dummyHash: Promise<string> | null = null;

/** Compara contra un hash ficticio para igualar tiempos cuando el usuario no existe. */
export async function verifyAgainstDummy(plain: string): Promise<false> {
  dummyHash ??= bcrypt.hash('tecnobray-dummy-password', BCRYPT_COST);
  await bcrypt.compare(plain, await dummyHash);
  return false;
}
