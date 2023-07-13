import { Request } from "express";
import { type FastifyRequest } from "fastify";

const fastify = true;

/**
 * helper function to parse express cookie
 * @param req express Request | Fastify Request
 */

// export function parseCookies<T extends Request ? Request: FastifyRequest>(req: T) {

export function parseCookies(req: Request | FastifyRequest) {
  const cookies = req.headers.cookie;
  const cookieMap = new Map<string, string>();
  if (!cookies) {
    return cookieMap;
  }
  cookies?.split(";").map((res, index) => {
    const parsedCookie = res.trim().split("=");
    cookieMap.set(parsedCookie[0], parsedCookie[1]);
  });
  return cookieMap;
}
