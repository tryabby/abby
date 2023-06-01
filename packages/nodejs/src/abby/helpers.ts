import { Request } from "express";

/**
 * helper function to parse express cookie
 * @param req express Request object
 */
export function parseCookies(req: Request) {
    const cookies = req.headers.cookie;
    const cookieMap = new Map<string, string>();
    cookies?.split(";").map((res, index) => {
        const parsedCookie = res.trim().split("=");
        cookieMap.set(parsedCookie[0], parsedCookie[1])
    })
    console.log(cookieMap)
    return cookieMap;
}