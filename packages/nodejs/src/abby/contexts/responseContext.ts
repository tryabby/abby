// hacky way to get response object in storage service without passing it
import { Response } from "express";
import { FastifyReply } from "fastify";

type ResponseType = Response | FastifyReply;

let res: ResponseType;

export function setResponse(response: ResponseType) {
  res = response;
}

export function getResponse() {
  return res;
}
