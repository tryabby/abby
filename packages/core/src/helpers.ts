// taken from https://stackoverflow.com/questions/3393854/get-and-set-a-single-cookie-with-node-js-http-server
export function parseCookies(cookieHeader: string) {
  const cookieRegexp = /([^;=\s]*)=([^;]*)/g;
  const cookies: Record<string, string> = {};
  // biome-ignore lint/suspicious/noAssignInExpressions:>
  // biome-ignore lint/suspicious/noImplicitAnyLet:>
  for (let m; (m = cookieRegexp.exec(cookieHeader)); ) {
    const [, cookieName, cookieValue] = m;
    cookies[decodeURIComponent(cookieName)] = decodeURIComponent(cookieValue);
  }

  return cookies;
}
