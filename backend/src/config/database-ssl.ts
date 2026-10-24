import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { checkServerIdentity, type PeerCertificate } from 'node:tls';

/**
 * Configuración SSL de PostgreSQL.
 * - DB_SSL=true activa TLS con verificación estricta (rejectUnauthorized siempre true).
 * - DB_SSL_CA_FILE: ruta (relativa al backend) del certificado de la CA.
 * - DB_SSL_SERVERNAME: nombre contra el que se verifica la identidad del servidor
 *   (proxies como Railway presentan un certificado emitido para otro nombre).
 */
export function databaseSsl(env: NodeJS.ProcessEnv = process.env) {
  if (env.DB_SSL !== 'true') return false;
  const servername = env.DB_SSL_SERVERNAME;
  return {
    rejectUnauthorized: true,
    ...(env.DB_SSL_CA_FILE ? { ca: readFileSync(resolve(process.cwd(), env.DB_SSL_CA_FILE), 'utf8') } : {}),
    ...(servername
      ? {
          servername,
          checkServerIdentity: (_host: string, cert: PeerCertificate) => checkServerIdentity(servername, cert),
        }
      : {}),
  };
}
