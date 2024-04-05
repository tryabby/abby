import { IncomingMessage } from 'http';

/**
 * Reliably get a request's origin, even when deployed on serverless functions
 *
 * @example
 * ```ts
 * const route = (req, res) => {
 *   const origin = getRequestOrigin(req)
 * }
 * ```
 */
export const getRequestOrigin = (req: IncomingMessage): string =>
  // The x-forwarded-proto header is the only reliable way to determine HTTP vs HTTPS
  // with Vercel serverless functions and Netlify functions.
  `${req.headers['x-forwarded-proto'] === `https` ? `https` : `http`}://${req.headers.host}`;
