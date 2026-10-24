export interface RemotePatternLike {
  protocol: 'http' | 'https';
  hostname: string;
  port?: string;
  pathname?: string;
}

/**
 * Convierte "https://*.s3.amazonaws.com,https://d1abc.cloudfront.net,http://127.0.0.1:9010"
 * en remotePatterns de next/image. Sin protocolo se asume https.
 */
export function parseImageHosts(value: string | undefined): RemotePatternLike[] {
  if (!value) return [];
  return value
    .split(/[,\s]+/)
    .map((entry) => entry.trim())
    .filter(Boolean)
    .flatMap((entry): RemotePatternLike[] => {
      const withProtocol = /^https?:\/\//.test(entry) ? entry : `https://${entry}`;
      const match = /^(https?):\/\/([^/:]+)(?::(\d+))?(\/.*)?$/.exec(withProtocol);
      if (!match) return [];
      const [, protocol, hostname, port, path] = match;
      const pattern: RemotePatternLike = { protocol: protocol as 'http' | 'https', hostname: hostname! };
      if (port) pattern.port = port;
      pattern.pathname = path && path !== '/' ? `${path.replace(/\/+$/, '')}/**` : '/**';
      return [pattern];
    });
}

export function isLocalHost(hostname: string): boolean {
  return hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1' || hostname.endsWith('.local');
}
