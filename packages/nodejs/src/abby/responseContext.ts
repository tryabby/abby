// hacky way to get response object in storage service without passing it
import { Request as Response, } from "express";
let response: Response | null = null;

export function setResponse(response: Response) {
    response = response;
}

export function getResponse() {
    return response;
}

