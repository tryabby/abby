// hacky way to get request object in storage service without passing it
import { Request, Response } from "express";
let req: Request | null = null;

export function setRequest(request: Request) {
    req = request;
}

export function getRequest(): Request {
    if (!req) throw new Error("request object not set")
    return req;
}

