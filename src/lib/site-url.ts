import type { NextApiRequest } from 'next';

export function getSiteUrl(
  req?: Pick<NextApiRequest, 'headers'>,
  fallback = 'http://localhost:3000',
): string {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL || process.env.SITE_URL;
  if (explicit) return explicit.replace(/\/$/, '');

  const host = req?.headers?.host;
  if (!host) return fallback.replace(/\/$/, '');

  const forwardedProto = req?.headers?.['x-forwarded-proto'];
  const protoHeader = Array.isArray(forwardedProto)
    ? forwardedProto[0]
    : forwardedProto;
  const proto = (protoHeader || 'http').split(',')[0].trim();

  return `${proto}://${host}`.replace(/\/$/, '');
}
