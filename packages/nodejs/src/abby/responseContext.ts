// hacky way to get response object in storage service without passing it
import { Response, } from "express";
let res: Response | null = null;

export function setResponse(response: Response) {
    res = response;
}

export function getResponse() {
    return res;
}

