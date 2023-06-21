// hacky way to get request object in storage service without passing it
import { Request } from "express";
let req: Request | null = null;

export function setRequest(request: Request) {
  req = request;
}

export function getRequest(): Request | null {
  return req;
}
