import { z } from "zod";

export const UTM_COOKIE_NAME = "abby_utm";

// keep the UTM parameters around long enough for people who come back later to sign up
const UTM_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 30;

// Prisma maps `String` to VARCHAR(191) on MySQL
const MAX_UTM_VALUE_LENGTH = 191;

// browsers ignore cookies with more than 4096 bytes, this leaves some room
const MAX_UTM_COOKIE_LENGTH = 4000;

const UTM_PARAMS = {
  utm_source: "utmSource",
  utm_medium: "utmMedium",
  utm_campaign: "utmCampaign",
  utm_term: "utmTerm",
  utm_content: "utmContent",
} as const;

type UtmField = (typeof UTM_PARAMS)[keyof typeof UTM_PARAMS];

export type UtmParams = Partial<Record<UtmField, string>>;

const utmValueSchema = z.string().min(1).max(MAX_UTM_VALUE_LENGTH).optional();

const utmParamsSchema = z.object({
  utmSource: utmValueSchema,
  utmMedium: utmValueSchema,
  utmCampaign: utmValueSchema,
  utmTerm: utmValueSchema,
  utmContent: utmValueSchema,
});

export function getUtmParams(searchParams: URLSearchParams): UtmParams | null {
  const params: UtmParams = {};

  for (const [param, field] of Object.entries(UTM_PARAMS) as Array<
    [string, UtmField]
  >) {
    const value = searchParams.get(param)?.trim();
    if (value) {
      params[field] = value.slice(0, MAX_UTM_VALUE_LENGTH);
    }
  }

  return Object.keys(params).length > 0 ? params : null;
}

/**
 * Stores the UTM parameters of the current URL in a cookie, so they survive
 * the trip through the login page and the OAuth / email sign in flow.
 * Visits without UTM parameters keep the previously stored ones.
 */
export function rememberUtmParams(search: string) {
  const params = getUtmParams(new URLSearchParams(search));
  if (!params) return;

  // non-ASCII values grow a lot when encoded, so the cookie can get too big
  const value = encodeURIComponent(JSON.stringify(params));
  if (UTM_COOKIE_NAME.length + 1 + value.length > MAX_UTM_COOKIE_LENGTH) {
    // the browser would drop it, so remove the old one instead of
    // attributing the signup to an older campaign
    document.cookie = `${UTM_COOKIE_NAME}=; path=/; max-age=0`;
    return;
  }

  const secure = window.location.protocol === "https:" ? "; secure" : "";
  // `lax` is needed so the cookie is sent when the OAuth provider redirects back
  document.cookie = `${UTM_COOKIE_NAME}=${value}; path=/; max-age=${UTM_COOKIE_MAX_AGE_SECONDS}; samesite=lax${secure}`;
}

/**
 * Parses the (already URI decoded) UTM cookie value.
 * The cookie is user controlled, so anything unexpected is ignored.
 */
export function parseUtmCookie(value: string | undefined): UtmParams | null {
  if (!value) return null;

  try {
    const result = utmParamsSchema.safeParse(JSON.parse(value));
    if (!result.success) return null;

    const params = Object.fromEntries(
      Object.entries(result.data).filter(([, v]) => v !== undefined)
    ) as UtmParams;

    return Object.keys(params).length > 0 ? params : null;
  } catch {
    return null;
  }
}
