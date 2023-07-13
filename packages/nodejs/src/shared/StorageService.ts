import { IStorageService, getABStorageKey } from "@tryabby/core";
import { parseCookies } from "./helpers";
import { Request, Response } from "express";
import { FastifyReply, FastifyRequest } from "fastify";

export class ABStorageService implements IStorageService {
  get(
    projectId: string,
    key: string,
    args?: {
      req: Request | FastifyRequest;
    }
  ): string | null {
    const req = args?.req;
    if (!req) return null;
    const cookieMap = this.parseCookies(req);
    const cookieKey = getABStorageKey(projectId, key);
    const cookieValue = cookieMap.get(cookieKey);
    return cookieValue ?? null;
  }
  set(
    projectId: string,
    key: string,
    value: string,
    args?: {
      res: Response | FastifyReply;
    }
  ): void {
    const response = args?.res;
    if (!response) return;
    const cookieKey = getABStorageKey(projectId, key);

    if (this.isFastifyReply(response)) {
      //fastify
      response.setCookie(cookieKey, value);
    } else if (this.isExpressResponse(response)) {
      //express
      response.cookie(cookieKey, value);
    }
  }
  remove(projectId: string, key: string): void {
    throw new Error("Method not implemented.");
  }

  parseCookies(req: Request | FastifyRequest) {
    if (this.isExpressRequest(req)) {
      return parseCookies(req);
    } else if (this.isFastifyRequest(req)) {
      return parseCookies(req);
    } else {
      throw new Error("req must be an instance of either Request or Fastify Request");
    }
  }

  isFastifyRequest(req: unknown): req is FastifyRequest {
    const possibleRequest = req as FastifyRequest;
    return possibleRequest.cookies !== undefined;
  }

  isExpressRequest(args: unknown): args is Request {
    const possibleRequest = args as Request;
    return possibleRequest.app !== undefined;
  }

  isFastifyReply(res: unknown): res is FastifyReply {
    const possibleReply = res as FastifyReply;
    return possibleReply.setCookie !== undefined;
  }

  isExpressResponse(res: unknown): res is Response {
    const possibleRequest = res as Response;
    return possibleRequest.cookie !== null;
  }
}

class FFStorageService implements IStorageService {
  get(projectId: string, key: string): string | null {
    throw new Error("Method not implemented.");
  }
  set(projectId: string, key: string, value: string): void {
    throw new Error("Method not implemented.");
  }
  remove(projectId: string, key: string): void {
    throw new Error("Method not implemented.");
  }
}

export const TestStorageService = new ABStorageService();
export const FlagStorageService = new FFStorageService();
