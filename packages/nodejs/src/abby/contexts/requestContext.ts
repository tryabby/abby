// hacky way to get request object in storage service without passing it
import { Request } from "express";
import { FastifyRequest } from "fastify";

// type RequestType<T> = T extends Request ? Request : FastifyRequest;
type RequestType = Request | FastifyRequest | null;
let req: RequestType = null;

export function setRequest(request: RequestType) {
  req = request;
}

export function getRequest(): RequestType | null {
  return req;
}
