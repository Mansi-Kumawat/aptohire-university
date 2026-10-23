import { env } from './env';
export function rootUrl(path: string): string { return new URL(path.replace(/^\//, ''), `${env.rootUrl.replace(/\/$/, '')}/`).toString(); }
export function portalUrl(portal: 'student' | 'organization', path: string): string {
  const explicit = portal === 'student' ? env.studentUrl : env.organizationUrl;
  const base = explicit || `https://${portal}.${env.rootDomain}`;
  return new URL(path.replace(/^\//, ''), `${base.replace(/\/$/, '')}/`).toString();
}
