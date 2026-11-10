export const TOPICS = ['Energy supply', 'Grid & storage', 'Energy efficiency', 'Transportation', 'Housing & buildings', 'Community & equity', 'Policy, strategy, personnel', 'Other'];

export function publicWebUrl(value: string): string {
  const url = new URL(value.trim());
  const host = url.hostname.toLowerCase();
  if (!['https:', 'http:'].includes(url.protocol) || url.username || url.password || (url.port && !['80', '443'].includes(url.port))
    || !host.includes('.') || host.includes(':') || host.startsWith('[') || /^[\d.]+$/.test(host)
    || /(^|\.)(localhost|local|internal|test|invalid)$/.test(host)) throw new Error('Use a public HTTP or HTTPS webpage or shared chat URL.');
  return url.href;
}