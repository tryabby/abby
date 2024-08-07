import Cookies from "js-cookie";
import type { NextApiRequest, NextApiResponse } from "next";
import type {
  RequestCookie,
  RequestCookies,
} from "next/dist/server/web/spec-extension/cookies";
import type { NextRequest, NextResponse } from "next/server";

export function getIsomorphicCookies<
  RequestType extends NextRequest | NextApiRequest | undefined = undefined,
>(req: RequestType) {
  if (!req && typeof window === "undefined") {
    throw new Error(
      "You must pass a request object to getABTestValue on the server"
    );
  }

  let cookies: {
    get: (key: string) => string | RequestCookie | undefined;
    set: (key: string, value: string) => void;
    delete: (key: string) => void;
  };

  if (req) {
    if (req.cookies && "get" in req.cookies) {
      cookies = req.cookies as RequestCookies;
    } else {
      cookies = new Map(Object.entries(req.cookies));
    }
  } else {
    cookies = {
      get: Cookies.get,
      set: Cookies.set,
      delete: Cookies.remove,
    };
  }
  return cookies;
}

export function isEdgeFunction(
  res: NextResponse | NextApiResponse
): res is NextResponse {
  return "cookies" in res;
}

export function isBrowser(
  res?: NextResponse | NextApiResponse
): res is undefined {
  return typeof window !== "undefined";
}
